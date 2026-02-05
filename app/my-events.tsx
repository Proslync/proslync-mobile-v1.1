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
import { eventsApi } from '@/lib/api/events';
import { useRefreshControl } from '@/hooks/use-refresh-control';
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
}

function EventCard({ event, onPress }: EventCardProps) {
  const statusColor = getStatusColor(event.status);
  const statusLabel = getStatusLabel(event.status);

  return (
    <TouchableOpacity style={styles.eventCard} onPress={onPress} activeOpacity={0.8}>
      <Image
        source={{ uri: event.flyer?.url || event.imageUrl || 'https://picsum.photos/200/300' }}
        style={styles.eventImage}
      />
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventName} numberOfLines={1}>{event.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>
        <Text style={styles.eventDate}>
          {formatEventDate(event.startDate)} at {formatEventTime(event.startDate)}
        </Text>
        <Text style={styles.eventLocation} numberOfLines={1}>
          {event.venue?.name || event.location || 'Location TBA'}
        </Text>
        <View style={styles.eventStats}>
          <View style={styles.eventStat}>
            <Ionicons name="people-outline" size={14} color="rgba(255,255,255,0.6)" />
            <Text style={styles.eventStatText}>{event.attendeeCount || 0} RSVPs</Text>
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
  const pagerRef = React.useRef<PagerView>(null);
  const [events, setEvents] = React.useState<Event[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<EventTab>('current');

  // Shared value for smooth tab indicator animation
  const scrollPosition = useSharedValue(0);

  const fetchEvents = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const myEvents = await eventsApi.getMyEvents();
      // Sort by start date, newest first
      myEvents.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      setEvents(myEvents);
    } catch (error) {
      console.error('[MyEvents] Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Pull-to-refresh with haptic feedback
  const { refreshControl } = useRefreshControl({
    onRefresh: fetchEvents,
  });

  React.useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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
      <EventCard event={item} onPress={() => handleEventPress(item)} />
    </Animated.View>
  );

  const currentCount = currentEvents.length;
  const pastCount = pastEvents.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Events</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/create-event')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <Animated.View style={[styles.tabIndicator, { width: tabWidth }, indicatorStyle]} />
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabPress('current')}
          activeOpacity={0.7}
        >
          <Animated.Text style={[styles.tabText, currentTabTextStyle]}>
            Current
          </Animated.Text>
          {currentCount > 0 && (
            <View style={[styles.tabBadge, activeTab === 'current' && styles.tabBadgeActive]}>
              <Text style={styles.tabBadgeText}>{currentCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabPress('past')}
          activeOpacity={0.7}
        >
          <Animated.Text style={[styles.tabText, pastTabTextStyle]}>
            Past
          </Animated.Text>
          {pastCount > 0 && (
            <View style={[styles.tabBadge, activeTab === 'past' && styles.tabBadgeActive]}>
              <Text style={styles.tabBadgeText}>{pastCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
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
                  color="rgba(255,255,255,0.3)"
                />
                <Text style={styles.emptyTitle}>No current events</Text>
                <Text style={styles.emptySubtitle}>
                  Create your first event to get started
                </Text>
                <TouchableOpacity
                  style={styles.createButton}
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
                  color="rgba(255,255,255,0.3)"
                />
                <Text style={styles.emptyTitle}>No past events</Text>
                <Text style={styles.emptySubtitle}>
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
    backgroundColor: '#000',
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
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
    color: '#fff',
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
    borderBottomColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    backgroundColor: '#fff',
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
    color: '#fff',
  },
  tabBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeText: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
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
    color: '#fff',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  eventImage: {
    width: 100,
    height: 100,
    backgroundColor: '#1a1a1a',
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
    color: '#fff',
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
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  eventLocation: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.6)',
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
    color: 'rgba(255,255,255,0.6)',
  },
});
