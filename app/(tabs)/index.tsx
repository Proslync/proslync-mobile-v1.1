import * as React from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  RefreshControl,
  ActionSheetIOS,
  Share,
  ViewToken,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PEEK = 103;
const PAGE_HEIGHT = SCREEN_HEIGHT - PEEK;
import { useRouter } from 'expo-router';
import { FeedLoadingSkeleton } from '@/components/feed';
import { FeedNavBar } from '@/components/feed/feed-nav-bar';
import { VenueWeekCard, type VenueWeekCardData } from '@/components/feed/venue-week-card';
import { EventLineupCard, type EventLineupCardData } from '@/components/feed/event-lineup-card';
import { useQueryClient } from '@tanstack/react-query';
import { useFeed } from '@/hooks/use-feed';
import { useAuth } from '@/lib/providers/auth-provider';
import { eventsApi } from '@/lib/api/events';
import { venuesApi } from '@/lib/api/venues';
import { useToast } from '@/components/shared/toast';
import { PurchaseTicketSheet } from '@/components/tickets/purchase-ticket-sheet';
import { track, trackScreen } from '@/lib/analytics';
import type { FeedItem, FeedTab } from '@/lib/types/feed.types';

// ── Card type discriminated union ──
type CardItem =
  | { type: 'venue-week'; id: string; data: VenueWeekCardData }
  | { type: 'lineup'; id: string; data: EventLineupCardData };

// Helper: format event CTA label
function eventCtaLabel(item: FeedItem): string {
  if (item.isPaid && item.price != null && item.price > 0) {
    return `Tickets from $${Math.round(item.price)}`;
  }
  return 'RSVP';
}

// Helper: get day abbreviation from event date
function eventDay(item: FeedItem): string {
  if (item.eventDate) {
    return new Date(item.eventDate).toLocaleDateString('en-US', { weekday: 'short' });
  }
  return '';
}

// Helper: get flyer/image URL
function eventImage(item: FeedItem): string {
  return item.imageUrl || item.thumbnail || '';
}

// ── Transform FeedItems into card data ──
function buildCards(items: FeedItem[], venueBackgrounds: Record<number, string> = {}): CardItem[] {
  if (items.length === 0) return [];

  // Group events by venue (2+ events = venue-week card)
  const venueGroups = new Map<string, FeedItem[]>();
  const remaining: FeedItem[] = [];

  for (const item of items) {
    if (item.venueId && item.venueName) {
      const key = String(item.venueId);
      const group = venueGroups.get(key) || [];
      group.push(item);
      venueGroups.set(key, group);
    } else {
      remaining.push(item);
    }
  }

  // Venues with 2+ events become VenueWeekCards; single-event venues go to remaining
  const venueCards: CardItem[] = [];
  for (const [venueId, venueItems] of venueGroups) {
    if (venueItems.length >= 2) {
      const first = venueItems[0];
      const videoItem = venueItems.find((it) => it.mediaType === 'video' && it.videoUrl);
      const bgUrl = first.venueId ? venueBackgrounds[first.venueId] : undefined;
      venueCards.push({
        type: 'venue-week',
        id: `vw-${venueId}`,
        data: {
          id: venueId,
          venueName: first.venueName || 'Venue',
          venueLogoUrl: first.userAvatar || '',
          venueVerified: first.verified,
          backgroundImageUrl: bgUrl,
          videoUrl: videoItem?.videoUrl,
          events: venueItems.map((it) => ({
            id: String(it.eventId ?? it.id),
            flyerUrl: eventImage(it),
            day: eventDay(it),
            ctaLabel: eventCtaLabel(it),
            isSaved: false,
          })),
        },
      });
    } else {
      remaining.push(...venueItems);
    }
  }

  // Group remaining items by organizer (userId) for lineup cards
  const organizerGroups = new Map<string, FeedItem[]>();
  for (const item of remaining) {
    const key = item.userId || item.username || item.id;
    const group = organizerGroups.get(key) || [];
    group.push(item);
    organizerGroups.set(key, group);
  }

  const lineupCards: CardItem[] = [];
  for (const [, orgItems] of organizerGroups) {
    const first = orgItems[0];
    const bgUrl = first.venueId ? venueBackgrounds[first.venueId] : undefined;
    const videoItem = orgItems.find((it) => it.mediaType === 'video' && it.videoUrl);
    lineupCards.push({
      type: 'lineup',
      id: `el-${first.id}`,
      data: {
        id: first.id,
        organizerName: first.username || first.venueName || 'Organizer',
        organizerLogoUrl: first.userAvatar || '',
        organizerVerified: first.verified,
        backgroundImageUrl: bgUrl || eventImage(first),
        videoUrl: videoItem?.videoUrl,
        events: orgItems.map((it) => ({
          id: String(it.eventId ?? it.id),
          flyerUrl: eventImage(it),
          price: it.isPaid && it.price != null && it.price > 0 ? `$${Math.round(it.price)}` : 'Free',
          isSaved: false,
        })),
      },
    });
  }

  // Interleave: venue-week cards first, then lineup cards
  const cards: CardItem[] = [];
  const maxLen = Math.max(venueCards.length, lineupCards.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < venueCards.length) cards.push(venueCards[i]);
    if (i < lineupCards.length) cards.push(lineupCards[i]);
  }

  return cards;
}

export default function FeedScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activeFilter, setActiveFilter] = useState('For You');
  const activeTab: FeedTab = activeFilter === 'Following' ? 'following' : 'foryou';
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [purchaseItem, setPurchaseItem] = useState<FeedItem | null>(null);
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => { trackScreen('feed', 'index'); }, []);

  const {
    items: feedItems,
    isLoading,
    isError,
    refetch,
    loadMore,
    isFetchingNextPage,
  } = useFeed({ feedType: activeTab, enabled: isAuthenticated });

  const visibleItems = feedItems.filter((item) => !blockedUserIds.has(String(item.userId)));

  // Enrich feed items with flyer images from event details
  const [enrichedImages, setEnrichedImages] = useState<Record<number, string>>({});
  useEffect(() => {
    const needsEnrich = visibleItems.filter(
      (it) => it.eventId && !enrichedImages[it.eventId]
    );
    if (needsEnrich.length === 0) return;
    const ids = [...new Set(needsEnrich.map((it) => it.eventId!))];
    eventsApi.getEventsByIds(ids).then((events) => {
      const VIDEO_EXT = /\.(mp4|mov|webm|m4v)(\?|$)/i;
      const map: Record<number, string> = {};
      for (const ev of events) {
        // Prefer imageUrl (always a static image) over flyer URL (might be a video)
        const flyerUrl = ev.flyer?.url || '';
        const isVideoFlyer = VIDEO_EXT.test(flyerUrl) || ev.flyer?.mimeType?.startsWith('video/');
        const url = ev.imageUrl || (!isVideoFlyer ? flyerUrl : '') || '';
        if (url) map[ev.id] = url;
      }
      if (Object.keys(map).length > 0) {
        setEnrichedImages((prev) => ({ ...prev, ...map }));
      }
    }).catch(() => {});
  }, [visibleItems]);

  const enrichedItems = React.useMemo(() =>
    visibleItems.map((item) => {
      const enrichedUrl = item.eventId ? enrichedImages[item.eventId] : undefined;
      const bestImage = enrichedUrl || item.imageUrl || item.thumbnail || '';
      if (bestImage !== item.imageUrl) {
        return { ...item, imageUrl: bestImage };
      }
      return item;
    }),
    [visibleItems, enrichedImages],
  );

  // Fetch venue feed backgrounds
  const [venueBackgrounds, setVenueBackgrounds] = useState<Record<number, string>>({});
  useEffect(() => {
    const venueIds = [...new Set(enrichedItems.filter((it) => it.venueId && !venueBackgrounds[it.venueId]).map((it) => it.venueId!))];
    if (venueIds.length === 0) return;
    Promise.all(venueIds.map((id) => venuesApi.getVenue(id).catch(() => null))).then((venues) => {
      const map: Record<number, string> = {};
      for (const v of venues) {
        if (v?.feedBackground?.url) map[v.id] = v.feedBackground.url;
      }
      if (Object.keys(map).length > 0) {
        setVenueBackgrounds((prev) => ({ ...prev, ...map }));
      }
    });
  }, [enrichedItems]);

  const baseCards = React.useMemo(() => buildCards(enrichedItems, venueBackgrounds), [enrichedItems, venueBackgrounds]);

  // Infinite loop: pre-populate enough copies so the feed never ends
  const LOOP_COUNT = 50;
  const cards = React.useMemo(() => {
    if (baseCards.length === 0) return [];
    const result: CardItem[] = [];
    for (let i = 0; i < LOOP_COUNT; i++) {
      for (const c of baseCards) {
        result.push({ ...c, id: `${c.id}-${i}` });
      }
    }
    return result;
  }, [baseCards]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Video autoplay — track visible cards
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const ids = new Set(viewableItems.map((v) => v.item?.id).filter(Boolean));
    setVisibleIds(ids);
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;

  const toggleSave = useCallback((itemId: string) => {
    setSavedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  const handleMore = useCallback(() => {
    ActionSheetIOS.showActionSheetWithOptions(
      { options: ['Save', 'Share', 'Not Interested', 'Report', 'Cancel'], cancelButtonIndex: 4, destructiveButtonIndex: 3 },
      (index) => {
        if (index === 1) Share.share({ message: 'Check this out on Status!' });
      },
    );
  }, []);

  const handleVenuePress = useCallback((venueId: string) => {
    router.push({ pathname: '/venue-profile/[venueId]', params: { venueId } });
  }, [router]);

  const handleEventPress = useCallback((item: FeedItem) => {
    track('event_view', { event_id: item.eventId ?? Number(item.id), source: 'feed' });
    router.push({
      pathname: '/event/[id]',
      params: {
        id: item.eventId?.toString() || item.id,
        title: item.eventTitle || item.description,
        date: item.eventDate || '',
        imageUrl: item.imageUrl || item.thumbnail,
        videoUrl: item.videoUrl || '',
        mediaType: item.mediaType || 'image',
        thumbnail: item.thumbnail || '',
        venueName: item.venueName || '',
        username: item.username || '',
        userAvatar: item.userAvatar || '',
        userId: item.userId || '',
        isPaid: item.isPaid ? 'true' : 'false',
        price: item.price != null ? item.price.toString() : '',
        isOrganizerVerified: item.verified ? 'true' : 'false',
        isUserRegistered: item.isUserRegistered ? 'true' : 'false',
      },
    });
  }, [router]);

  const handleCardEventPress = useCallback((eventId: string) => {
    track('event_view', { event_id: Number(eventId), source: 'feed' });
    router.push({
      pathname: '/event/[id]',
      params: { id: eventId },
    });
  }, [router]);

  const handlePurchaseSuccess = useCallback((ticketCount: number) => {
    if (purchaseItem) {
      showSuccess(`${ticketCount} ticket${ticketCount > 1 ? 's' : ''} purchased!`);
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
    }
  }, [purchaseItem, showSuccess, queryClient]);

  const renderCard = useCallback(({ item, index }: { item: CardItem; index: number }) => {
    const isVisible = visibleIds.has(item.id);

    let card: React.ReactNode;
    switch (item.type) {
      case 'venue-week':
        card = (
          <VenueWeekCard
            data={item.data}
            isVisible={isVisible}
            onSaveToggle={toggleSave}
            onEventPress={handleCardEventPress}
            onVenuePress={handleVenuePress}
            onShopAll={() => {}}
            onMore={handleMore}
          />
        );
        break;
      case 'lineup':
        card = (
          <EventLineupCard
            data={item.data}
            isVisible={isVisible}
            onSaveToggle={toggleSave}
            onEventPress={handleCardEventPress}
            onShopAll={() => {}}
            onMore={handleMore}
          />
        );
        break;
    }

    const opacity = scrollY.interpolate({
      inputRange: [
        (index - 1) * PAGE_HEIGHT,
        index * PAGE_HEIGHT,
        index * PAGE_HEIGHT + PAGE_HEIGHT * 0.5,
      ],
      outputRange: [1, 1, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.page, { opacity }]}>
        {card}
      </Animated.View>
    );
  }, [visibleIds, toggleSave, handleMore, handleCardEventPress, handleVenuePress]);

  if (isLoading && cards.length === 0) {
    return <FeedLoadingSkeleton />;
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptySubtitle}>Unable to load feed. Please try again.</Text>
        </View>
      </View>
    );
  }

  const avatarInitial = user?.firstName?.[0] || user?.userName?.[0]?.toUpperCase() || 'A';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Animated.FlatList
        data={cards}
        renderItem={renderCard}
        keyExtractor={(item: CardItem) => item.id}
        showsVerticalScrollIndicator={false}
        snapToInterval={PAGE_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: PAGE_HEIGHT, offset: PAGE_HEIGHT * index, index })}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#888" />
        }
        scrollEventThrottle={16}
      />

      <LinearGradient
        colors={['transparent', 'rgba(242,242,242,0.3)', 'rgba(242,242,242,0.5)']}
        style={styles.bottomFade}
        pointerEvents="none"
      />

      <FeedNavBar
        activeFilter={activeFilter}
        onFilterChange={(f) => setActiveFilter(f)}
        onAvatarPress={() => router.navigate('/(tabs)/profile')}
        onNotificationPress={() => router.push('/notifications')}
        onSearchPress={() => router.push('/search-screen')}
        avatarInitial={avatarInitial}
      />

      <PurchaseTicketSheet
        visible={!!purchaseItem}
        onClose={() => setPurchaseItem(null)}
        onSuccess={handlePurchaseSuccess}
        eventId={purchaseItem?.eventId ?? 0}
        eventTitle={purchaseItem?.eventTitle || purchaseItem?.description || 'Event'}
        eventDate={purchaseItem?.eventDate}
        eventImage={purchaseItem?.imageUrl || purchaseItem?.thumbnail}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 10,
  },
  page: {
    height: PAGE_HEIGHT,
    paddingTop: 140,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
});
