import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { eventsApi } from '@/lib/api/events';
import { useToast } from '@/components/shared/toast';
import { useAppTheme } from '@/hooks/use-app-theme';
import { FeedMediaPlayer } from '@/components/feed/feed-media-player';
import { PurchaseTicketSheet } from '@/components/tickets/purchase-ticket-sheet';
import { PurchaseTableSheet } from '@/components/tables/purchase-table-sheet';
import { useTrackEventView } from '@/hooks/use-track-event-view';
import { useEventTables, EVENT_TABLES_KEY } from '@/hooks/use-venue-tables';
import { useQueryClient } from '@tanstack/react-query';
import { EventTabBar, OverviewTab, LineupTab, TablesTab, MapTab } from '@/components/event';
import {
  MOCK_EVENT_ARTISTS,
  MOCK_FLOORS,
  MOCK_TABLE_INVENTORY,
  MOCK_PUBLIC_TABLES,
  MOCK_BOTTLE_CATEGORIES,
  MOCK_DEALS,
} from '@/lib/mock/event-detail-mocks';
import type { Event } from '@/lib/types/events.types';
import type { EventTableItem } from '@/lib/types/tables.types';
import type { TabType, EventDetailExtended } from '@/lib/types/event-detail.types';

const useNativeGlass = isGlassEffectAPIAvailable();
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = SCREEN_WIDTH - (CARD_MARGIN * 2);
const CARD_BORDER_RADIUS = 20;

function formatEventDate(dateString: string, venueName?: string): string {
  try {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNum = date.getDate();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    let result = `${dayName}, ${monthName} ${dayNum} at ${hours}:${minutesStr}${ampm}`;
    if (venueName) result += ` at ${venueName}`;
    return result;
  } catch {
    return dateString;
  }
}

export default function EventPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showSuccess, showError } = useToast();
  const { colors, isDark } = useAppTheme();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    id: string;
    title?: string;
    date?: string;
    imageUrl?: string;
    videoUrl?: string;
    mediaType?: string;
    thumbnail?: string;
    venueName?: string;
    username?: string;
    userAvatar?: string;
    userId?: string;
    isPaid?: string;
    price?: string;
    isUserRegistered?: string;
  }>();

  // State
  const [isRsvpd, setIsRsvpd] = React.useState(params.isUserRegistered === 'true');
  const [isPurchased, setIsPurchased] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPurchaseSheet, setShowPurchaseSheet] = React.useState(false);
  const [eventData, setEventData] = React.useState<Event | null>(null);
  const [isFetchingEvent, setIsFetchingEvent] = React.useState(true);
  const [selectedTable, setSelectedTable] = React.useState<EventTableItem | null>(null);
  const [showTableSheet, setShowTableSheet] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<TabType>('overview');
  const buttonScale = useSharedValue(1);

  // Derived values
  const eventId = params.id;
  const eventTitle = eventData?.name || params.title || 'Event';
  const eventDate = params.date || eventData?.startDate;
  const flyerImage = params.imageUrl || eventData?.flyer?.url || eventData?.imageUrl;
  const venueName = params.venueName || eventData?.venue?.name;
  const username = params.username;
  const userAvatar = params.userAvatar;
  const userId = params.userId;
  const [isPaid, setIsPaid] = React.useState(params.isPaid === 'true');
  const eventPrice = params.price ? parseFloat(params.price) : undefined;
  const numericEventId = eventId ? parseInt(eventId, 10) : undefined;

  // Media detection
  const VIDEO_EXT = /\.(mp4|mov|webm|m4v)(\?|$)/i;
  const flyerUrl = eventData?.flyer?.url;
  const flyerIsVideo =
    params.mediaType === 'video' ||
    eventData?.flyer?.mimeType?.startsWith('video/') ||
    VIDEO_EXT.test(flyerUrl || '') ||
    VIDEO_EXT.test(params.videoUrl || '');
  const mediaType: 'video' | 'image' = flyerIsVideo ? 'video' : 'image';
  const videoUrl = flyerIsVideo ? (params.videoUrl || flyerUrl || undefined) : undefined;
  const thumbnail = params.thumbnail || (flyerIsVideo ? (params.imageUrl || eventData?.imageUrl || '') : '') || flyerImage || '';

  // Hooks
  const { data: eventTables } = useEventTables(
    numericEventId && !isNaN(numericEventId) ? numericEventId : undefined,
  );

  const { trackView } = useTrackEventView(
    numericEventId && !isNaN(numericEventId) ? numericEventId : undefined,
  );

  // Fetch event details
  React.useEffect(() => {
    async function fetchEventDetails() {
      if (!eventId) return;
      try {
        const numId = parseInt(eventId, 10);
        if (isNaN(numId)) return;
        const fetched = await eventsApi.getEvent(numId);
        setEventData(fetched);
        if (fetched.isUserRegistered) setIsRsvpd(true);
        if (fetched.isPaid) setIsPaid(true);
      } catch {} finally {
        setIsFetchingEvent(false);
      }
    }
    fetchEventDetails();
  }, [eventId]);

  React.useEffect(() => {
    if (numericEventId && !isNaN(numericEventId)) trackView();
  }, [numericEventId, trackView]);

  // Coordinates
  const coordinates = React.useMemo(() => {
    if (eventData?.locationDetails?.coordinates) {
      return { lat: eventData.locationDetails.coordinates.lat, lng: eventData.locationDetails.coordinates.lng };
    }
    if (eventData?.venue?.latitude && eventData?.venue?.longitude) {
      return { lat: Number(eventData.venue.latitude), lng: Number(eventData.venue.longitude) };
    }
    return null;
  }, [eventData]);

  const displayAddress = eventData?.locationDetails?.formattedAddress
    || eventData?.venue?.address
    || eventData?.location
    || null;

  // Extend event with mock detail fields
  const extendedEvent: EventDetailExtended = React.useMemo(() => ({
    ...(eventData || {} as Event),
    dressCode: 'Smart Casual',
    doorTime: eventData?.startDate ? formatEventDate(eventData.startDate).split(' at ')[1]?.split(' at')[0] : undefined,
  }), [eventData]);

  // Handlers
  const handleBack = () => router.back();

  const handleUserPress = () => {
    if (userId) {
      router.push({ pathname: '/user/[username]', params: { username: username || userId, userId } });
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${eventTitle}${venueName ? ` at ${venueName}` : ''}`,
      });
    } catch {}
  };

  const handleRsvp = async () => {
    if (isLoading || !eventId) return;
    if (isPaid && !isRsvpd) { setShowPurchaseSheet(true); return; }

    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 15, stiffness: 400 })
    );

    setIsLoading(true);
    try {
      const numId = parseInt(eventId, 10);
      if (isNaN(numId)) throw new Error('Invalid event ID');
      if (isRsvpd) {
        const response = await eventsApi.cancelRegistration(numId);
        if (response.success) { setIsRsvpd(false); showSuccess(response.message || 'RSVP cancelled'); }
        else showError(response.message || 'Could not cancel RSVP');
      } else {
        const response = await eventsApi.registerForEvent(numId);
        if (response.success) { setIsRsvpd(true); showSuccess(response.message || "You have successfully RSVP'd to this event!"); }
        else showError(response.message || 'Could not complete RSVP');
      }
    } catch (error: any) {
      showError(error?.message || 'Failed to process RSVP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchaseSuccess = (ticketCount: number) => {
    setIsPurchased(true);
    setIsRsvpd(true);
    showSuccess(`${ticketCount} ticket${ticketCount > 1 ? 's' : ''} purchased!`);
  };

  const handleSelectApiTable = (table: EventTableItem) => {
    setSelectedTable(table);
    setShowTableSheet(true);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Theme
  const gradientColors = isDark
    ? ['rgba(15, 9, 12, 0.35)', 'rgba(15, 9, 12, 0.35)', 'rgba(15, 9, 12, 0.6)', 'rgba(15, 9, 12, 0.9)', colors.background, colors.background] as const
    : ['rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.9)', colors.background, colors.background] as const;

  const isDone = !isPaid && isRsvpd;
  let rsvpLabel = 'RSVP';
  if (isLoading) rsvpLabel = 'Processing...';
  else if (isPaid && !isRsvpd) rsvpLabel = eventPrice != null ? `From $${eventPrice.toFixed(2)}` : 'Tickets';
  else if (isRsvpd) rsvpLabel = "RSVP'd";

  // Tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            event={extendedEvent}
            deals={MOCK_DEALS}
            attendeeCount={eventData?.attendeeCount}
            organizerName={username}
            organizerAvatar={userAvatar}
            organizerId={userId}
          />
        );
      case 'lineup':
        return <LineupTab artists={MOCK_EVENT_ARTISTS} />;
      case 'tables':
        return (
          <TablesTab
            floors={MOCK_FLOORS}
            mapTables={MOCK_TABLE_INVENTORY}
            publicTables={MOCK_PUBLIC_TABLES}
            bottleCategories={MOCK_BOTTLE_CATEGORIES}
            apiTables={eventTables}
            onSelectApiTable={handleSelectApiTable}
          />
        );
      case 'map':
        return (
          <MapTab
            event={eventData || ({} as Event)}
            coordinates={coordinates}
            address={displayAddress}
            venueName={venueName}
          />
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Blurred background */}
      <View style={styles.backgroundWrapper}>
        {flyerImage && (
          <Image source={{ uri: flyerImage }} style={styles.absoluteFill} resizeMode="cover" />
        )}
        <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.absoluteFill} />
        <LinearGradient colors={gradientColors} locations={[0, 0.7, 0.8, 0.88, 0.93, 1]} style={styles.absoluteFill} />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={styles.headerButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="share-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Event Card */}
        <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.cardContainer}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <BlurView intensity={25} tint={isDark ? 'dark' : 'light'} style={styles.absoluteFill} />

            {username && (
              <View style={styles.cardHeader}>
                <TouchableOpacity onPress={handleUserPress} activeOpacity={0.7} style={styles.organizerSection}>
                  {userAvatar && (
                    <Image source={{ uri: userAvatar }} style={[styles.organizerAvatar, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]} />
                  )}
                  <View style={styles.organizerNameRow}>
                    <Text style={[styles.organizerName, { color: colors.text }]} numberOfLines={1}>{username}</Text>
                    <MaterialCommunityIcons name="check-decagram" size={16} color={colors.verified} />
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {(flyerImage || videoUrl) ? (
              <View style={styles.flyerContainer}>
                <FeedMediaPlayer
                  mediaType={mediaType}
                  videoUrl={videoUrl}
                  imageUrl={flyerImage}
                  poster={thumbnail}
                  isActive={true}
                  containerWidth={CARD_WIDTH - 2}
                  maxHeight={CARD_WIDTH * 1.25}
                />
              </View>
            ) : isFetchingEvent ? (
              <View style={[styles.flyerContainer, styles.mediaLoading, { width: CARD_WIDTH - 2, backgroundColor: colors.backgroundSecondary }]}>
                <ActivityIndicator size="small" color={colors.textTertiary} />
              </View>
            ) : null}

            <View style={styles.cardFooter}>
              <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>{eventTitle}</Text>
              {eventDate && (
                <Text style={[styles.eventDate, { color: colors.textSecondary }]}>
                  {formatEventDate(eventDate, venueName)}
                </Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Tab Bar */}
        <EventTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {renderTabContent()}
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* RSVP Button */}
      <View style={[styles.rsvpWrapper, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity onPress={handleRsvp} activeOpacity={0.85} disabled={isLoading}>
          <Animated.View style={[styles.rsvpButton, buttonAnimatedStyle]}>
            {useNativeGlass ? (
              <GlassView
                glassEffectStyle="regular"
                isInteractive
                tintColor={isDone ? undefined : 'rgba(255, 255, 255, 0.45)'}
                colorScheme={isDark ? 'dark' : 'light'}
                style={styles.absoluteFill}
              />
            ) : (
              <>
                {!isDone && (
                  <>
                    <BlurView intensity={30} tint="light" style={styles.absoluteFill} />
                    <View style={styles.rsvpFill} />
                  </>
                )}
                <View style={[styles.rsvpBorder, isDone && styles.rsvpBorderDone]} />
              </>
            )}
            <Text style={[
              styles.rsvpButtonText,
              isDone && styles.rsvpButtonTextDone,
              useNativeGlass && { color: isDark ? '#fff' : '#000' },
            ]}>{rsvpLabel}</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      <PurchaseTicketSheet
        visible={showPurchaseSheet}
        onClose={() => setShowPurchaseSheet(false)}
        onSuccess={handlePurchaseSuccess}
        eventId={eventId ? parseInt(eventId, 10) : 0}
        eventTitle={eventTitle}
        eventDate={eventDate}
        eventImage={flyerImage}
      />

      <PurchaseTableSheet
        visible={showTableSheet}
        onClose={() => { setShowTableSheet(false); setSelectedTable(null); }}
        onSuccess={() => { queryClient.invalidateQueries({ queryKey: [EVENT_TABLES_KEY, numericEventId] }); }}
        eventId={numericEventId || 0}
        eventTitle={eventTitle}
        table={selectedTable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: CARD_MARGIN,
    paddingBottom: 120,
  },
  cardContainer: {
    alignItems: 'center',
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: CARD_BORDER_RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  organizerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  organizerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  organizerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  organizerName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    flexShrink: 1,
  },
  flyerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  mediaLoading: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooter: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
  },
  eventTitle: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    lineHeight: 26,
  },
  eventDate: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  tabContent: {
    marginTop: 8,
  },
  rsvpWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  rsvpButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  rsvpFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  rsvpBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  rsvpBorderDone: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rsvpButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 0.5,
    color: '#000',
  },
  rsvpButtonTextDone: {
    color: '#fff',
  },
});
