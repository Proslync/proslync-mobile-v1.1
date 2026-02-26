import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ImageBackground,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInUp,
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
import { PurchaseTicketSheet } from '@/components/tickets/purchase-ticket-sheet';
import { PurchaseTableSheet } from '@/components/tables/purchase-table-sheet';
import { useTrackEventView } from '@/hooks/use-track-event-view';
import { useEventTables, EVENT_TABLES_KEY } from '@/hooks/use-venue-tables';
import { useQueryClient } from '@tanstack/react-query';
import type { Event } from '@/lib/types/events.types';
import type { EventTableItem } from '@/lib/types/tables.types';

const isExpoGo = Constants.appOwnership === 'expo';
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
if (MAPBOX_TOKEN && !isExpoGo) {
  Mapbox.setAccessToken(MAPBOX_TOKEN);
}
const DARK_STYLE_URL = 'mapbox://styles/mapbox/dark-v11';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function formatEventDate(dateString: string, venueName?: string): string {
  try {
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNum = date.getDate();
    const ordinal = getOrdinalSuffix(dayNum);

    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;

    let result = `${dayName}, ${monthName} ${dayNum}${ordinal} at ${hours}:${minutesStr}${ampm}`;
    if (venueName) {
      result += ` at ${venueName}`;
    }
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
  const params = useLocalSearchParams<{
    id: string;
    title?: string;
    date?: string;
    imageUrl?: string;
    venueName?: string;
    username?: string;
    userAvatar?: string;
    isPaid?: string;
    price?: string;
    isUserRegistered?: string;
  }>();

  const [isRsvpd, setIsRsvpd] = React.useState(params.isUserRegistered === 'true');
  const [isPurchased, setIsPurchased] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPurchaseSheet, setShowPurchaseSheet] = React.useState(false);
  const [eventData, setEventData] = React.useState<Event | null>(null);
  const [selectedTable, setSelectedTable] = React.useState<EventTableItem | null>(null);
  const [showTableSheet, setShowTableSheet] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();
  const buttonScale = useSharedValue(1);

  const eventId = params.id;
  const eventTitle = params.title || 'Event';
  const eventDate = params.date;
  const flyerImage = params.imageUrl;
  const venueName = params.venueName;
  const username = params.username;
  const userAvatar = params.userAvatar;
  const [isPaid, setIsPaid] = React.useState(params.isPaid === 'true');
  const eventPrice = params.price ? parseFloat(params.price) : undefined;
  const numericEventId = eventId ? parseInt(eventId, 10) : undefined;

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

  // Fetch event details to get current registration status and isPaid
  React.useEffect(() => {
    async function fetchEventDetails() {
      if (!eventId) return;
      try {
        const numericEventId = parseInt(eventId, 10);
        if (isNaN(numericEventId)) return;

        const fetchedEvent = await eventsApi.getEvent(numericEventId);
        setEventData(fetchedEvent);
        if (fetchedEvent.isUserRegistered) {
          setIsRsvpd(true);
        }
        if (fetchedEvent.isPaid) {
          setIsPaid(true);
        }
      } catch (error) {
        console.log('[Event] Could not fetch event details:', error);
      }
    }
    fetchEventDetails();
  }, [eventId]);

  // Track event page view
  const { trackView } = useTrackEventView(
    numericEventId && !isNaN(numericEventId) ? numericEventId : undefined,
  );

  React.useEffect(() => {
    if (numericEventId && !isNaN(numericEventId)) {
      trackView();
    }
  }, [numericEventId, trackView]);

  const handleBack = () => {
    router.back();
  };

  const handleRsvp = async () => {
    if (isLoading || !eventId) return;

    // For paid events, open the purchase sheet instead
    if (isPaid) {
      setShowPurchaseSheet(true);
      return;
    }

    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 15, stiffness: 400 })
    );

    setIsLoading(true);
    try {
      const numericEventId = parseInt(eventId, 10);
      if (isNaN(numericEventId)) {
        throw new Error('Invalid event ID');
      }

      const response = await eventsApi.registerForEvent(numericEventId);
      if (response.success) {
        setIsRsvpd(true);
        showSuccess(response.message || 'You have successfully RSVP\'d to this event!');
      } else {
        showError(response.message || 'Could not complete RSVP');
      }
    } catch (error: any) {
      console.error('[Event] RSVP error:', error);
      showError(error?.message || 'Failed to RSVP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchaseSuccess = (ticketCount: number) => {
    setIsPurchased(true);
    setIsRsvpd(true);
    showSuccess(`${ticketCount} ticket${ticketCount > 1 ? 's' : ''} purchased!`);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Derive map coordinates from event data
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

  // Dynamic gradient colors based on theme
  const gradientColors: [string, string, string, string] = isDark
    ? ['transparent', 'rgba(15, 9, 12, 0.3)', 'rgba(15, 9, 12, 0.7)', 'rgba(15, 9, 12, 0.97)']
    : ['transparent', 'rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.97)'];

  const renderContent = () => (
    <Animated.View
      entering={FadeInUp.duration(400).springify()}
      style={styles.tabContent}
    >
      {/* Poster/Organizer Info */}
      {username && (
        <TouchableOpacity style={styles.posterContainer} activeOpacity={0.8}>
          {userAvatar && (
            <Image
              source={{ uri: userAvatar }}
              style={[styles.posterAvatar, { borderColor: colors.borderStrong }]}
            />
          )}
          <Text style={[styles.posterName, { color: colors.text }]}>@{username}</Text>
        </TouchableOpacity>
      )}
      <Text style={[styles.tabContentTitle, { color: colors.text }]}>{eventTitle}</Text>
      {eventDate && (
        <Text style={[styles.tabContentDate, { color: colors.textSecondary }]}>
          {formatEventDate(eventDate, venueName)}
        </Text>
      )}
      <Text style={[styles.tabContentDescription, { color: colors.textTertiary }]}>
        Join us for an unforgettable night filled with great music, amazing vibes, and incredible people.
      </Text>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Blurred background */}
      {flyerImage && (
        <ImageBackground
          source={{ uri: flyerImage }}
          style={styles.backgroundImage}
          blurRadius={12}
        >
          <View style={[styles.backgroundOverlay, { backgroundColor: isDark ? 'rgba(15, 9, 12, 0.5)' : 'rgba(255, 255, 255, 0.5)' }]} />
        </ImageBackground>
      )}

      {/* Gradient overlay - darker at bottom */}
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.4, 0.7, 1]}
        style={styles.background}
      />

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
        {/* Flyer Card */}
        <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.flyerContainer}>
          <View style={[styles.flyerCard, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
            {flyerImage ? (
              <Image
                source={{ uri: flyerImage }}
                style={styles.flyerImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.flyerPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="image-outline" size={64} color={colors.textTertiary} />
                <Text style={[styles.flyerPlaceholderText, { color: colors.textTertiary }]}>No flyer available</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Content */}
        <View style={styles.tabContentContainer}>
          {renderContent()}
        </View>

        {/* Tables Section */}
        {hasTables ? (
          <Animated.View entering={FadeInDown.delay(150).duration(300)} style={styles.tablesSection}>
            <Text style={[styles.tablesSectionTitle, { color: colors.text }]}>Tables</Text>
            {Object.entries(tablesBySection).map(([sectionName, tables]) => {
              const isExpanded = expandedSections[sectionName] ?? false;
              const availableCount = tables.filter((t) => t.status === 'available').length;
              return (
                <View key={sectionName} style={styles.tableSectionGroup}>
                  {/* Dropdown header */}
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

                  {/* Expanded table list */}
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
                          <View
                            style={[
                              styles.tableCard,
                              unavailable && { opacity: 0.5 },
                            ]}
                          >
                            {table.imageUrl ? (
                              <Image
                                source={{ uri: table.imageUrl }}
                                style={styles.tableImage}
                              />
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
                                  <Text style={[styles.tableSoldText, { color: colors.textTertiary }]}>
                                    Sold
                                  </Text>
                                ) : isReserved ? (
                                  <Text style={[styles.tableSoldText, { color: colors.textTertiary }]}>
                                    Reserved
                                  </Text>
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

        {/* Spacer for bottom elements */}
        <View style={{ height: 140 }} />
      </ScrollView>

      {/* RSVP Button */}
      <View style={[styles.rsvpContainer, { bottom: insets.bottom + 16 }]}>
        {(() => {
          const isDone = !isPaid && isRsvpd;
          let label = 'RSVP';
          if (isLoading) {
            label = 'Processing...';
          } else if (isPaid) {
            label = eventPrice != null ? `From $${eventPrice.toFixed(2)}` : 'Tickets';
          } else if (isDone) {
            label = "RSVP'd";
          }
          return (
            <TouchableOpacity
              onPress={handleRsvp}
              activeOpacity={0.85}
              disabled={isLoading || isDone}
            >
              <Animated.View style={[
                styles.rsvpButton,
                { backgroundColor: isDone ? '#2a2a2a' : '#3897F0' },
                buttonAnimatedStyle,
              ]}>
                <Text style={[
                  styles.rsvpButtonText,
                  { color: isDone ? '#888' : '#fff' },
                ]}>
                  {label}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })()}
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
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundOverlay: {
    flex: 1,
  },
  background: {
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
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  flyerContainer: {
    alignItems: 'center',
    marginBottom: 0,
  },
  flyerCard: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.55,
    borderRadius: 12,
    overflow: 'hidden',
    // Subtle shadow effect
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    // Android elevation
    elevation: 10,
  },
  flyerImage: {
    width: '100%',
    height: '100%',
  },
  flyerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flyerPlaceholderText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  tabContentContainer: {
    paddingHorizontal: 8,
  },
  tabContent: {
    paddingVertical: 16,
  },
  tabContentTitle: {
    fontSize: 24,
    fontFamily: 'Lato_700Bold',
    marginBottom: 8,
  },
  tabContentDate: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    marginBottom: 16,
  },
  tabContentDescription: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    lineHeight: 22,
  },
  posterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  posterAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  posterName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  rsvpContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  rsvpButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rsvpButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 0.3,
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
