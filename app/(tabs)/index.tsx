import * as React from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ViewToken,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PAGE_HEIGHT = SCREEN_HEIGHT;
import { useRouter } from 'expo-router';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
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
import { SearchSheet } from '@/components/shared/search-sheet';
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

  const now = new Date();
  const nowMs = now.getTime();

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
        venueId: first.venueId ? String(first.venueId) : undefined,
        userId: first.userId,
        organizerName: first.username || first.venueName || 'Organizer',
        organizerLogoUrl: first.userAvatar || '',
        organizerVerified: first.verified,
        backgroundImageUrl: bgUrl || eventImage(first),
        videoUrl: videoItem?.videoUrl,
        events: orgItems.map((it) => {
          // Smart date label: day of week if this week, otherwise "Mon DD"
          const eventDate = it.eventDate ? new Date(it.eventDate) : null;
          const diffDays = eventDate ? Math.round((eventDate.getTime() - nowMs) / (1000 * 60 * 60 * 24)) : 99;
          const dayLabel = eventDate
            ? (diffDays >= 0 && diffDays < 7
              ? eventDate.toLocaleDateString('en-US', { weekday: 'short' })
              : eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
            : '';
          const ctaLabel = it.isPaid && it.price != null && it.price > 0
            ? `$${Math.round(it.price)}`
            : 'RSVP';
          return {
            id: String(it.eventId ?? it.id),
            flyerUrl: eventImage(it),
            price: ctaLabel,
            day: dayLabel,
            ctaLabel,
          };
        }),
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
  const [purchaseItem, setPurchaseItem] = useState<FeedItem | null>(null);

  useEffect(() => { trackScreen('feed', 'index'); }, []);

  const {
    items: feedItems,
    isLoading,
    isError,
    refetch,
    loadMore,
    isFetchingNextPage,
  } = useFeed({ feedType: activeTab, enabled: isAuthenticated });

  // Enrich feed items with flyer images from event details
  const [enrichedImages, setEnrichedImages] = useState<Record<number, string>>({});
  useEffect(() => {
    const needsEnrich = feedItems.filter(
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
  }, [feedItems]);

  const enrichedItems = React.useMemo(() =>
    feedItems.map((item) => {
      const enrichedUrl = item.eventId ? enrichedImages[item.eventId] : undefined;
      const bestImage = enrichedUrl || item.imageUrl || item.thumbnail || '';
      if (bestImage !== item.imageUrl) {
        return { ...item, imageUrl: bestImage };
      }
      return item;
    }),
    [feedItems, enrichedImages],
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
    }).catch(() => {});
  }, [enrichedItems]);

  const cards = React.useMemo(() => buildCards(enrichedItems, venueBackgrounds), [enrichedItems, venueBackgrounds]);

  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Video autoplay — track visible cards
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const ids = new Set(viewableItems.map((v) => v.item?.id).filter(Boolean));
    setVisibleIds((prev) => {
      if (prev.size === ids.size) {
        let same = true;
        for (const id of ids) if (!prev.has(id)) { same = false; break; }
        if (same) return prev;
      }
      return ids;
    });
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;

  // Force-snap to nearest card if the user releases without momentum
  const flatListRef = useRef<FlatList<CardItem>>(null);
  const onScrollSettle = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const offset = e.nativeEvent.contentOffset.y;
    const snappedIndex = Math.round(offset / PAGE_HEIGHT);
    const target = snappedIndex * PAGE_HEIGHT;
    if (Math.abs(offset - target) > 1) {
      flatListRef.current?.scrollToOffset({ offset: target, animated: true });
    }
  }, []);

  const handleVenuePress = useCallback((venueId: string) => {
    router.push({ pathname: '/venue-profile/[venueId]', params: { venueId } });
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
            onEventPress={handleCardEventPress}
            onVenuePress={handleVenuePress}
            onShopAll={() => handleVenuePress(item.data.id)}
          />
        );
        break;
      case 'lineup':
        card = (
          <EventLineupCard
            data={item.data}
            isVisible={isVisible}
            onEventPress={handleCardEventPress}
            onShopAll={() => {
              if (item.data.venueId) handleVenuePress(item.data.venueId);
              else if (item.data.userId) router.push({ pathname: '/user/[username]', params: { username: item.data.organizerName, userId: item.data.userId } });
            }}
            onOrganizerPress={() => {
              if (item.data.venueId) handleVenuePress(item.data.venueId);
              else if (item.data.userId) router.push({ pathname: '/user/[username]', params: { username: item.data.organizerName, userId: item.data.userId } });
            }}
          />
        );
        break;
    }

    return (
      <View style={styles.page}>
        {card}
      </View>
    );
  }, [visibleIds, handleCardEventPress, handleVenuePress, router]);

  if (isLoading && cards.length === 0) {
    return <FeedLoadingSkeleton />;
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptySubtitle}>Unable to load feed. Please try again.</Text>
          <TouchableOpacity
            style={{ marginTop: 16, backgroundColor: '#000', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
            onPress={() => refetch()}
            activeOpacity={0.8}
            accessibilityLabel="Retry loading feed"
            accessibilityRole="button"
          >
            <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'Lato_700Bold' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const avatarInitial = user?.firstName?.[0] || user?.userName?.[0]?.toUpperCase() || '?';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <DarkGradientBg />
      <FlatList
        ref={flatListRef}
        data={cards}
        renderItem={renderCard}
        keyExtractor={(item: CardItem) => item.id}
        showsVerticalScrollIndicator={false}
        snapToInterval={cards.length > 0 ? PAGE_HEIGHT : undefined}
        snapToAlignment="start"
        decelerationRate="normal"
        onMomentumScrollEnd={onScrollSettle}
        getItemLayout={cards.length > 0 ? (_, index) => ({ length: PAGE_HEIGHT, offset: PAGE_HEIGHT * index, index }) : undefined}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#888" />
        }
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { height: PAGE_HEIGHT }]}>
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptySubtitle}>Pull down to refresh, or check back later for events in your area.</Text>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <ActivityIndicator color="rgba(0,0,0,0.4)" />
            </View>
          ) : null
        }
        scrollEventThrottle={16}
        windowSize={5}
        maxToRenderPerBatch={3}
        removeClippedSubviews
        updateCellsBatchingPeriod={50}
      />

      <LinearGradient
        colors={['transparent', 'rgba(242,242,242,0.3)', 'rgba(242,242,242,0.5)']}
        style={styles.bottomFade}
        pointerEvents="none"
      />

      <FeedNavBar
        activeFilter={activeFilter}
        onFilterChange={(f) => setActiveFilter(f)}
        onSearchPress={() => setSearchVisible(true)}
        avatarInitial={avatarInitial}
        isSearchActive={isSearchActive}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchCancel={() => { setIsSearchActive(false); setSearchQuery(""); }}
      />

      <SearchSheet visible={searchVisible} onClose={() => setSearchVisible(false)} />

      {purchaseItem?.eventId != null && (
        <PurchaseTicketSheet
          visible
          onClose={() => setPurchaseItem(null)}
          onSuccess={handlePurchaseSuccess}
          eventId={purchaseItem.eventId}
          eventTitle={purchaseItem.eventTitle || purchaseItem.description || 'Event'}
          eventDate={purchaseItem.eventDate}
          eventImage={purchaseItem.imageUrl || purchaseItem.thumbnail}
        />
      )}
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
    paddingBottom: 100,
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
    color: 'rgba(0,0,0,0.8)',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'center',
  },
});
