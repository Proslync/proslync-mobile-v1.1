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
import { eventsApi } from '@/lib/api/events';
import { useToast } from '@/components/shared/toast';
import { useAppTheme } from '@/hooks/use-app-theme';
import { PurchaseTicketSheet } from '@/components/tickets/purchase-ticket-sheet';
import { useTrackEventView } from '@/hooks/use-track-event-view';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type TabType = 'overview' | 'map';

const TABS: { key: TabType; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'map', label: 'Map' },
];

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

  const [activeTab, setActiveTab] = React.useState<TabType>('overview');
  const [isRsvpd, setIsRsvpd] = React.useState(params.isUserRegistered === 'true');
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPurchaseSheet, setShowPurchaseSheet] = React.useState(false);
  const buttonScale = useSharedValue(1);

  const eventId = params.id;
  const eventTitle = params.title || 'Event';
  const eventDate = params.date;
  const flyerImage = params.imageUrl;
  const venueName = params.venueName;
  const username = params.username;
  const userAvatar = params.userAvatar;
  const isPaid = params.isPaid === 'true';
  const eventPrice = params.price ? parseFloat(params.price) : undefined;

  // Fetch event details to get current registration status
  React.useEffect(() => {
    async function checkRegistrationStatus() {
      if (!eventId) return;
      try {
        const numericEventId = parseInt(eventId, 10);
        if (isNaN(numericEventId)) return;

        const event = await eventsApi.getEvent(numericEventId);
        if (event.isUserRegistered) {
          setIsRsvpd(true);
        }
      } catch (error) {
        // Silently fail - user may not be registered
        console.log('[Event] Could not fetch registration status:', error);
      }
    }
    checkRegistrationStatus();
  }, [eventId]);

  // Track event page view
  const numericId = eventId ? parseInt(eventId, 10) : undefined;
  const { trackView } = useTrackEventView(
    numericId && !isNaN(numericId) ? numericId : undefined,
  );

  React.useEffect(() => {
    if (numericId && !isNaN(numericId)) {
      trackView();
    }
  }, [numericId, trackView]);

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
    setIsRsvpd(true);
    showSuccess(`${ticketCount} ticket${ticketCount > 1 ? 's' : ''} purchased!`);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Dynamic gradient colors based on theme
  const gradientColors: [string, string, string, string] = isDark
    ? ['transparent', 'rgba(15, 9, 12, 0.3)', 'rgba(15, 9, 12, 0.7)', 'rgba(15, 9, 12, 0.97)']
    : ['transparent', 'rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.97)'];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
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
      case 'map':
        return (
          <Animated.View
            entering={FadeInUp.duration(400).springify()}
            style={styles.tabContent}
          >
            <Text style={[styles.tabContentTitle, { color: colors.text }]}>Venue Location</Text>
            {venueName && (
              <Text style={[styles.tabContentDescription, { color: colors.textTertiary }]}>{venueName}</Text>
            )}
            <Text style={[styles.tabContentDescription, { color: colors.textTertiary }]}>
              Map and directions coming soon.
            </Text>
          </Animated.View>
        );
      default:
        return null;
    }
  };

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

        {/* Tab Bar - below flyer */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(400).springify()}
          style={styles.tabBarInner}
        >
          {TABS.map((tab, index) => {
            const isActive = activeTab === tab.key;
            return (
              <Animated.View
                key={tab.key}
                entering={FadeInUp.delay(300 + index * 100).duration(300).springify()}
                style={{ flex: 1 }}
              >
                <TouchableOpacity
                  onPress={() => setActiveTab(tab.key)}
                  style={[
                    styles.tabButton,
                    { borderColor: colors.borderStrong },
                    isActive && { borderColor: colors.text },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      { color: colors.textTertiary },
                      isActive && { color: colors.text },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Tab Content */}
        <View style={styles.tabContentContainer}>
          {renderTabContent()}
        </View>

        {/* Spacer for bottom elements */}
        <View style={{ height: 140 }} />
      </ScrollView>

      {/* RSVP Button */}
      <View style={[styles.rsvpContainer, { bottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          onPress={handleRsvp}
          activeOpacity={0.8}
          disabled={isLoading || isRsvpd}
        >
          <Animated.View style={[
            styles.rsvpButton,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#D3D3D3' },
            buttonAnimatedStyle,
            isRsvpd && styles.rsvpButtonSuccess,
          ]}>
            <Text style={[
              styles.rsvpButtonText,
              { color: colors.text },
              isRsvpd && styles.rsvpButtonTextSuccess,
            ]}>
              {isLoading ? 'Processing...' : isRsvpd ? "RSVP'd" : isPaid ? 'Buy' : 'RSVP'}
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
  tabBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 8,
    gap: 8,
  },
  tabButton: {
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
  },
  rsvpContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  rsvpButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rsvpButtonSuccess: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  rsvpButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 0.5,
  },
  rsvpButtonTextSuccess: {
    color: '#22c55e',
  },
});
