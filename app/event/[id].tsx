import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  Linking,
  ActivityIndicator,
  InteractionManager,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
import Constants from 'expo-constants';
import Mapbox, { MapView, Camera, MarkerView } from '@rnmapbox/maps';
import { eventsApi } from '@/lib/api/events';
import { useToast } from '@/components/shared/toast';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useEvent } from '@/hooks';
import { FeedMediaPlayer } from '@/components/feed/feed-media-player';
import { PurchaseTicketSheet } from '@/components/tickets/purchase-ticket-sheet';
import { PurchaseTableSheet } from '@/components/tables/purchase-table-sheet';
import { useTrackEventView } from '@/hooks/use-track-event-view';
import { useEventTables, EVENT_TABLES_KEY } from '@/hooks/use-venue-tables';
import { useQueryClient } from '@tanstack/react-query';
import type { EventTableItem } from '@/lib/types/tables.types';
import { formatEventDate } from '@/lib/utils/date';
import { SCREEN_WIDTH } from '@/lib/utils/layout';

const isExpoGo = Constants.appOwnership === 'expo';
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
if (MAPBOX_TOKEN && !isExpoGo) {
  Mapbox.setAccessToken(MAPBOX_TOKEN);
}
const DARK_STYLE_URL = 'mapbox://styles/mapbox/dark-v11';

const CARD_MARGIN = 16;
const CARD_WIDTH = SCREEN_WIDTH - (CARD_MARGIN * 2);
const CARD_BORDER_RADIUS = 20;

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export default function EventPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showSuccess, showError } = useToast();
  const { colors, isDark } = useAppTheme();
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
    isOrganizerVerified?: string;
    isPaid?: string;
    price?: string;
    isUserRegistered?: string;
  }>();

  const [isRsvpd, setIsRsvpd] = React.useState(params.isUserRegistered === 'true');
  const [isPurchased, setIsPurchased] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPurchaseSheet, setShowPurchaseSheet] = React.useState(false);
  const [selectedTable, setSelectedTable] = React.useState<EventTableItem | null>(null);
  const [showTableSheet, setShowTableSheet] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();
  const buttonScale = useSharedValue(1);

  const eventId = params.id;
  const numericEventId = eventId ? parseInt(eventId, 10) : undefined;
  const { data: eventData, isLoading: isFetchingEvent } = useEvent(numericEventId);

  const eventTitle = eventData?.name || params.title || 'Event';
  const eventDate = params.date || eventData?.startDate;
  const flyerImage = params.imageUrl || eventData?.flyer?.url || eventData?.imageUrl;
  const venueName = params.venueName || eventData?.venue?.name;

  // Detect video from route params, fetched flyer mimeType, or URL extension
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
  const username = params.username;
  const userAvatar = params.userAvatar;
  const userId = params.userId;
  const [isPaid, setIsPaid] = React.useState(params.isPaid === 'true');
  const eventPrice = params.price ? parseFloat(params.price) : undefined;

  // Sync RSVP/paid state from fetched event data
  React.useEffect(() => {
    if (eventData?.isUserRegistered) setIsRsvpd(true);
    if (eventData?.isPaid) setIsPaid(true);
  }, [eventData]);

  // Fetch event tables
  const { data: eventTables } = useEventTables(
    numericEventId && !isNaN(numericEventId) ? numericEventId : undefined,
  );
  const hasTables = eventTables && eventTables.length > 0;

  const tablesBySection = React.useMemo(() => {
    if (!eventTables) return {};
    const groups: Record<string, EventTableItem[]> = {};
    for (const t of eventTables) {
      const key = t.sectionName;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    }
    return groups;
  }, [eventTables]);

  // Track event page view — deferred
  const { trackView } = useTrackEventView(
    numericEventId && !isNaN(numericEventId) ? numericEventId : undefined,
  );

  React.useEffect(() => {
    if (!numericEventId || isNaN(numericEventId)) return;
    const task = InteractionManager.runAfterInteractions(() => trackView());
    return () => task.cancel();
  }, [numericEventId, trackView]);

  const handleBack = () => router.back();

  const handleUserPress = () => {
    if (userId) {
      router.push({
        pathname: '/user/[username]',
        params: { username: username || userId, userId },
      });
    }
  };

  const handleRsvp = async () => {
    if (isLoading || !eventId) return;

    if (isPaid && !isRsvpd) {
      setShowPurchaseSheet(true);
      return;
    }

    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 15, stiffness: 400 })
    );

    setIsLoading(true);
    try {
      const numId = parseInt(eventId, 10);
      if (isNaN(numId)) throw new Error('Invalid event ID');

      if (isRsvpd) {
        // Cancel RSVP
        const response = await eventsApi.cancelRegistration(numId);
        if (response.success) {
          setIsRsvpd(false);
          showSuccess(response.message || 'RSVP cancelled');
        } else {
          showError(response.message || 'Could not cancel RSVP');
        }
      } else {
        // Register RSVP
        const response = await eventsApi.registerForEvent(numId);
        if (response.success) {
          setIsRsvpd(true);
          showSuccess(response.message || 'You have successfully RSVP\'d to this event!');
        } else {
          showError(response.message || 'Could not complete RSVP');
        }
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
    queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
    queryClient.invalidateQueries({ queryKey: ['eventAttendees', numericEventId] });
    queryClient.invalidateQueries({ queryKey: ['allAttendees'] });
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Map coordinates
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

  const gradientColors = isDark
    ? ['rgba(15, 9, 12, 0.35)', 'rgba(15, 9, 12, 0.35)', 'rgba(15, 9, 12, 0.6)', 'rgba(15, 9, 12, 0.9)', colors.background, colors.background] as const
    : ['rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.9)', colors.background, colors.background] as const;

  // RSVP button label
  const isDone = !isPaid && isRsvpd;
  let rsvpLabel = 'RSVP';
  if (isLoading) rsvpLabel = 'Processing...';
  else if (isPaid && !isRsvpd) rsvpLabel = eventPrice != null ? `From $${eventPrice.toFixed(2)}` : 'Tickets';
  else if (isRsvpd) rsvpLabel = "RSVP'd";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Blurred background */}
      <View style={styles.backgroundWrapper}>
        {flyerImage && (
          <Image
            source={{ uri: flyerImage }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        )}
        <BlurView
          intensity={60}
          tint={isDark ? 'dark' : 'light'}
          style={styles.blurOverlay}
        />
        <LinearGradient
          colors={gradientColors}
          locations={[0, 0.7, 0.8, 0.88, 0.93, 1]}
          style={styles.gradientOverlay}
        />
      </View>

      {/* Header with back button */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Event Card — same layout as feed */}
        <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.cardContainer}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <BlurView
              intensity={25}
              tint={isDark ? 'dark' : 'light'}
              style={styles.cardBlurBackground}
            />

            {/* Card Header — organizer */}
            {username && (
              <View style={styles.cardHeader}>
                <TouchableOpacity
                  onPress={handleUserPress}
                  activeOpacity={0.7}
                  style={styles.organizerSection}
                >
                  {userAvatar && (
                    <Image
                      source={{ uri: userAvatar }}
                      style={[styles.organizerAvatar, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
                    />
                  )}
                  <View style={styles.organizerNameRow}>
                    <Text style={[styles.organizerName, { color: colors.text }]} numberOfLines={1}>
                      {username}
                    </Text>
                    {params.isOrganizerVerified === 'true' && (
                      <MaterialCommunityIcons name="check-decagram" size={16} color={colors.verified} />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Media — video or image via FeedMediaPlayer */}
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

            {/* Card Footer — event title + date */}
            <View style={styles.cardFooter}>
              <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
                {eventTitle}
              </Text>
              {eventDate && (
                <Text style={[styles.eventDate, { color: colors.textSecondary }]}>
                  {formatEventDate(eventDate, venueName)}
                </Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Description */}
        {eventData?.description && (
          <View style={styles.descriptionSection}>
            <Text style={[styles.descriptionText, { color: colors.text }]}>
              {eventData.description}
            </Text>
          </View>
        )}

        {/* Tables Section */}
        {hasTables ? (
          <Animated.View entering={FadeInDown.delay(150).duration(300)} style={styles.tablesSection}>
            <Text style={[styles.tablesSectionTitle, { color: colors.text }]}>Tables</Text>
            {Object.entries(tablesBySection).map(([sectionName, tables]) => {
              const isExpanded = expandedSections[sectionName] ?? false;
              const availableCount = tables.filter((t) => t.status === 'available').length;
              return (
                <View key={sectionName} style={styles.tableSectionGroup}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      setExpandedSections((prev) => ({
                        ...prev,
                        [sectionName]: !prev[sectionName],
                      }))
                    }
                    style={styles.sectionDropdownHeader}
                  >
                    <View style={styles.sectionDropdownLeft}>
                      <Text style={[styles.tableSectionName, { color: colors.text }]}>
                        {sectionName}
                      </Text>
                      <Text style={[styles.sectionAvailability, { color: colors.textTertiary }]}>
                        {availableCount} of {tables.length} available
                      </Text>
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>

                  {isExpanded &&
                    tables.map((table) => {
                      const isSold = table.status === 'sold';
                      const isReserved = table.status === 'reserved';
                      const unavailable = isSold || isReserved;
                      return (
                        <TouchableOpacity
                          key={table.id}
                          onPress={() => {
                            if (!unavailable) {
                              setSelectedTable(table);
                              setShowTableSheet(true);
                            }
                          }}
                          disabled={unavailable}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.tableCard, unavailable && { opacity: 0.5 }]}>
                            {table.imageUrl ? (
                              <Image source={{ uri: table.imageUrl }} style={styles.tableImage} />
                            ) : null}
                            <View style={styles.tableCardBody}>
                              <View style={styles.tableCardLeft}>
                                <Text style={[styles.tableLabel, { color: colors.text }]}>
                                  {table.label}
                                </Text>
                                <Text style={[styles.tableSeatCount, { color: colors.textTertiary }]}>
                                  {table.seatCount} seats
                                </Text>
                              </View>
                              <View style={styles.tableCardRight}>
                                {isSold ? (
                                  <Text style={[styles.tableSoldText, { color: colors.textTertiary }]}>Sold</Text>
                                ) : isReserved ? (
                                  <Text style={[styles.tableSoldText, { color: colors.textTertiary }]}>Reserved</Text>
                                ) : (
                                  <Text style={[styles.tablePrice, { color: colors.text }]}>
                                    ${Number(table.price).toLocaleString()}
                                  </Text>
                                )}
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                </View>
              );
            })}
          </Animated.View>
        ) : null}

        {/* Location Map */}
        {coordinates && !isExpoGo && MAPBOX_TOKEN ? (
          <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.mapSection}>
            <Text style={[styles.mapSectionTitle, { color: colors.text }]}>Location</Text>
            {displayAddress ? (
              <Text style={[styles.mapAddress, { color: colors.textSecondary }]}>{displayAddress}</Text>
            ) : null}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                const coords = `${coordinates.lat},${coordinates.lng}`;
                const label = encodeURIComponent(venueName || eventTitle || 'Event');
                const url = Platform.select({
                  ios: `maps:0,0?q=${label}@${coords}`,
                  default: `geo:${coords}?q=${coords}(${label})`,
                });
                if (url) Linking.openURL(url);
              }}
            >
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  styleURL={DARK_STYLE_URL}
                  logoEnabled={false}
                  attributionEnabled={false}
                  compassEnabled={false}
                  scaleBarEnabled={false}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  <Camera
                    defaultSettings={{
                      centerCoordinate: [coordinates.lng, coordinates.lat],
                      zoomLevel: 14,
                    }}
                  />
                  <MarkerView coordinate={[coordinates.lng, coordinates.lat]}>
                    <View style={styles.marker}>
                      <Ionicons name="location" size={28} color="#fff" />
                    </View>
                  </MarkerView>
                </MapView>
              </View>
            </TouchableOpacity>
            <Text style={[styles.mapHint, { color: colors.textTertiary }]}>Tap to open in Maps</Text>
          </Animated.View>
        ) : null}

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* RSVP Button */}
      <View style={[styles.rsvpWrapper, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          onPress={handleRsvp}
          activeOpacity={0.85}
          disabled={isLoading}
        >
          <Animated.View style={[styles.rsvpButton, buttonAnimatedStyle]}>
            {!isDone && (
              <>
                <BlurView intensity={30} tint="light" style={styles.rsvpBlur} />
                <View style={styles.rsvpFill} />
              </>
            )}
            <View style={[styles.rsvpBorder, isDone && styles.rsvpBorderDone]} />
            <Text style={[styles.rsvpButtonText, isDone && styles.rsvpButtonTextDone]}>
              {rsvpLabel}
            </Text>
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
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: [EVENT_TABLES_KEY, numericEventId] });
        }}
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
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientOverlay: {
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
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backButton: {
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
  cardBlurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    borderRadius: 0,
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
  descriptionSection: {
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  descriptionText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    lineHeight: 22,
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
  rsvpBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  tablesSection: {
    paddingHorizontal: 8,
    marginTop: 16,
  },
  tablesSectionTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    marginBottom: 12,
  },
  tableSectionGroup: {
    marginBottom: 10,
  },
  sectionDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  sectionDropdownLeft: {
    flex: 1,
  },
  tableSectionName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  sectionAvailability: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
  tableCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginTop: 8,
    overflow: 'hidden',
  },
  tableImage: {
    width: '100%',
    height: 140,
  },
  tableCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  tableCardLeft: {
    flex: 1,
  },
  tableCardRight: {
    marginLeft: 12,
  },
  tableLabel: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  tableSeatCount: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
  tablePrice: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
  },
  tableSoldText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  mapSection: {
    paddingHorizontal: 8,
    marginTop: 8,
  },
  mapSectionTitle: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    marginBottom: 4,
  },
  mapAddress: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginBottom: 12,
  },
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  map: {
    height: 200,
    borderRadius: 12,
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapHint: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    marginTop: 8,
  },
});
