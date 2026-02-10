import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import PagerView, { PagerViewOnPageScrollEventData } from 'react-native-pager-view';
import * as Haptics from 'expo-haptics';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useMyEvents } from '@/hooks';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { Event } from '@/lib/types/events.types';
import { EventStatus } from '@/lib/types/events.types';

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

type EventTab = 'current' | 'past';

function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart.getTime() + 86400000);

  if (date >= todayStart && date < tomorrowStart) {
    return 'Today';
  } else if (date >= tomorrowStart && date < new Date(tomorrowStart.getTime() + 86400000)) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

function formatEventTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

function getStatusColor(status: EventStatus): string {
  switch (status) {
    case EventStatus.DRAFT:
      return '#f59e0b';
    case EventStatus.PUBLISHED:
      return '#3b82f6';
    case EventStatus.ACTIVE:
      return '#22c55e';
    case EventStatus.FINISHED:
      return 'rgba(255,255,255,0.4)';
    case EventStatus.CANCELLED:
      return '#ef4444';
    default:
      return 'rgba(255,255,255,0.4)';
  }
}

function getStatusLabel(status: EventStatus): string {
  switch (status) {
    case EventStatus.DRAFT:
      return 'Draft';
    case EventStatus.PUBLISHED:
      return 'Published';
    case EventStatus.ACTIVE:
      return 'Live';
    case EventStatus.FINISHED:
      return 'Ended';
    case EventStatus.CANCELLED:
      return 'Cancelled';
    default:
      return status;
  }
}

interface EventCardProps {
  event: Event;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
  isDark: boolean;
}

function EventCard({ event, onPress, colors, isDark }: EventCardProps) {
  const statusColor = getStatusColor(event.status);
  const statusLabel = getStatusLabel(event.status);

  return (
    <TouchableOpacity
      style={[styles.eventCard, { backgroundColor: colors.cardElevated }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: event.flyer?.url || event.imageUrl || 'https://picsum.photos/200/300' }}
        style={[styles.eventImage, { backgroundColor: colors.backgroundSecondary }]}
      />
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <Text style={[styles.eventName, { color: colors.text }]} numberOfLines={1}>{event.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>
        <Text style={[styles.eventDate, { color: colors.textSecondary }]}>
          {formatEventDate(event.startDate)} at {formatEventTime(event.startDate)}
        </Text>
        <Text style={[styles.eventLocation, { color: colors.textTertiary }]} numberOfLines={1}>
          {event.venue?.name || event.location || 'Location TBA'}
        </Text>
        <View style={styles.eventStats}>
          <View style={styles.eventStat}>
            <Ionicons name="people-outline" size={14} color={colors.textTertiary} />
            <Text style={[styles.eventStatText, { color: colors.textTertiary }]}>{event.attendeeCount || 0} RSVPs</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MyEventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();
  const pagerRef = React.useRef<PagerView>(null);
  const [activeTab, setActiveTab] = React.useState<EventTab>('current');

  // Fetch events using React Query - auto-invalidated when events are created/updated
  const { data: events = [], isLoading, refetch } = useMyEvents();

  // Shared value for smooth tab indicator animation
  const scrollPosition = useSharedValue(0);

  // Pull-to-refresh with haptic feedback
  const { refreshControl } = useRefreshControl({
    onRefresh: refetch,
  });

  // Filter events for current tab
  const currentEvents = React.useMemo(() => {
    const now = new Date();
    return events.filter(event => {
      const isPastEvent = event.status === EventStatus.FINISHED || event.status === EventStatus.CANCELLED;
      const eventDate = new Date(event.endDate || event.startDate);
      const hasEnded = eventDate < now && event.status !== EventStatus.ACTIVE;
      return !isPastEvent && !hasEnded;
    });
  }, [events]);

  // Filter events for past tab
  const pastEvents = React.useMemo(() => {
    const now = new Date();
    return events.filter(event => {
      const isPastEvent = event.status === EventStatus.FINISHED || event.status === EventStatus.CANCELLED;
      const eventDate = new Date(event.endDate || event.startDate);
      const hasEnded = eventDate < now && event.status !== EventStatus.ACTIVE;
      return isPastEvent || hasEnded;
    });
  }, [events]);

  // Handle tab press - navigate pager to the corresponding page
  const handleTabPress = React.useCallback((tab: EventTab) => {
    const pageIndex = tab === 'current' ? 0 : 1;
    pagerRef.current?.setPageWithoutAnimation(pageIndex);
    scrollPosition.value = withTiming(pageIndex, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
    setActiveTab(tab);
  }, [scrollPosition]);

  // Handle page scroll for smooth indicator animation
  const handlePageScroll = React.useCallback((event: { nativeEvent: PagerViewOnPageScrollEventData }) => {
    const { position, offset } = event.nativeEvent;
    scrollPosition.value = position + offset;
  }, [scrollPosition]);

  // Handle page change from swipe - sync tab selection with haptic feedback
  const handlePageSelected = React.useCallback((event: { nativeEvent: { position: number } }) => {
    const pageIndex = event.nativeEvent.position;
    const newTab: EventTab = pageIndex === 0 ? 'current' : 'past';
    if (newTab !== activeTab) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setActiveTab(newTab);
    }
  }, [activeTab]);

  // Animated style for tab indicator
  const tabWidth = screenWidth / 2;
  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: scrollPosition.value * tabWidth }],
    };
  });

  // Animated styles for tab text opacity
  const currentTabTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollPosition.value, [0, 1], [1, 0.5]);
    return { opacity };
  });

  const pastTabTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollPosition.value, [0, 1], [0.5, 1]);
    return { opacity };
  });

  const handleEventPress = (event: Event) => {
    router.push({
      pathname: '/event/[id]',
      params: {
        id: event.id.toString(),
        title: event.name,
        date: event.startDate,
        imageUrl: event.flyer?.url || event.imageUrl || '',
        venueName: event.venue?.name || event.location || '',
      },
    });
  };

  const renderEvent = ({ item, index }: { item: Event; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <EventCard event={item} onPress={() => handleEventPress(item)} colors={colors} isDark={isDark} />
    </Animated.View>
  );

  const currentCount = currentEvents.length;
  const pastCount = pastEvents.length;

  // Accent color for primary actions
  const accentColor = '#8b5cf6';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Events</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/create-event')}
        >
          <Ionicons name="add" size={24} color={colors.text} />
        </TouchableOpacity>
      </Animated.View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <Animated.View style={[styles.tabIndicator, { width: tabWidth, backgroundColor: colors.text }, indicatorStyle]} />
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabPress('current')}
          activeOpacity={0.7}
        >
          <Animated.Text style={[styles.tabText, { color: colors.text }, currentTabTextStyle]}>
            Current
          </Animated.Text>
          {currentCount > 0 && (
            <View style={[
              styles.tabBadge,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' },
              activeTab === 'current' && { backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)' },
            ]}>
              <Text style={[styles.tabBadgeText, { color: colors.text }]}>{currentCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabPress('past')}
          activeOpacity={0.7}
        >
          <Animated.Text style={[styles.tabText, { color: colors.text }, pastTabTextStyle]}>
            Past
          </Animated.Text>
          {pastCount > 0 && (
            <View style={[
              styles.tabBadge,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' },
              activeTab === 'past' && { backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)' },
            ]}>
              <Text style={[styles.tabBadgeText, { color: colors.text }]}>{pastCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      ) : (
        <AnimatedPagerView
          ref={pagerRef}
          style={styles.pagerView}
          initialPage={0}
          onPageScroll={handlePageScroll}
          onPageSelected={handlePageSelected}
          overdrag
        >
          {/* Current Events Page */}
          <View key="current" style={styles.pageContainer}>
            {currentEvents.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={64}
                  color={colors.textTertiary}
                />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No current events</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
                  Create your first event to get started
                </Text>
                <TouchableOpacity
                  style={[styles.createButton, { backgroundColor: accentColor }]}
                  onPress={() => router.push('/create-event')}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.createButtonText}>Create Event</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={currentEvents}
                renderItem={renderEvent}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={refreshControl}
              />
            )}
          </View>

          {/* Past Events Page */}
          <View key="past" style={styles.pageContainer}>
            {pastEvents.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="time-outline"
                  size={64}
                  color={colors.textTertiary}
                />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No past events</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
                  Your completed events will appear here
                </Text>
              </View>
            ) : (
              <FlatList
                data={pastEvents}
                renderItem={renderEvent}
                keyExtractor={(item) => `past-${item.id.toString()}`}
                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={refreshControl}
              />
            )}
          </View>
        </AnimatedPagerView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  tabText: {
    fontSize: 15,
    fontFamily: 'Lato_600SemiBold',
  },
  tabBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tabBadgeText: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    marginTop: 8,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  eventCard: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  eventImage: {
    width: 100,
    height: 100,
  },
  eventContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  eventName: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  eventDate: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 4,
  },
  eventLocation: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  eventStats: {
    flexDirection: 'row',
    marginTop: 4,
  },
  eventStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventStatText: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
});
