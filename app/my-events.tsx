import { DarkGradientBg } from "@/components/shared/dark-gradient-bg";
import { GlassButton } from "@/components/glass";
import { useStableRouter } from "@/hooks/use-stable-router";
import { useMyEvents } from "@/hooks";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useRefreshControl } from "@/hooks/use-refresh-control";
import type { Event } from "@/lib/types/events.types";
import { EventStatus } from "@/lib/types/events.types";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as VideoThumbnails from "expo-video-thumbnails";
import * as React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type EventTab = "current" | "past";

function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart.getTime() + 86400000);

  if (date >= todayStart && date < tomorrowStart) {
    return "Today";
  } else if (
    date >= tomorrowStart &&
    date < new Date(tomorrowStart.getTime() + 86400000)
  ) {
    return "Tomorrow";
  } else {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
}

function formatEventTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getStatusColor(status: EventStatus): string {
  switch (status) {
    case EventStatus.DRAFT:
      return "#f59e0b";
    case EventStatus.PUBLISHED:
      return "#3b82f6";
    case EventStatus.ACTIVE:
      return "#22c55e";
    case EventStatus.FINISHED:
      return "rgba(255,255,255,0.4)";
    case EventStatus.CANCELLED:
      return "#ef4444";
    default:
      return "rgba(255,255,255,0.4)";
  }
}

function getStatusLabel(status: EventStatus): string {
  switch (status) {
    case EventStatus.DRAFT:
      return "Draft";
    case EventStatus.PUBLISHED:
      return "Published";
    case EventStatus.ACTIVE:
      return "Live";
    case EventStatus.FINISHED:
      return "Ended";
    case EventStatus.CANCELLED:
      return "Cancelled";
    default:
      return status;
  }
}

interface EventCardProps {
  event: Event;
  onPress: () => void;
  onDashboard: () => void;
  colors: ReturnType<typeof useAppTheme>["colors"];
  isDark: boolean;
}

function EventCard({
  event,
  onPress,
  onDashboard,
  colors,
  isDark,
}: EventCardProps) {
  const showStatus = event.status !== EventStatus.PUBLISHED;
  const statusColor = getStatusColor(event.status);
  const statusLabel = getStatusLabel(event.status);

  // For video flyers, generate a thumbnail from the video
  const VIDEO_EXT = /\.(mp4|mov|webm|m4v)(\?|$)/i;
  const flyerIsVideo =
    event.flyer?.mimeType?.startsWith("video/") ||
    VIDEO_EXT.test(event.flyer?.url || "");

  const [videoThumb, setVideoThumb] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!flyerIsVideo || !event.flyer?.url || event.imageUrl) return;
    let cancelled = false;

    const TIMESTAMPS = [0, 500, 1000, 2000, 4000, 8000, 15000, 30000];

    async function isColorfulFrame(videoUrl: string, time: number): Promise<string | null> {
      try {
        // Generate the same frame at low and high JPEG quality.
        // Solid-color frames compress nearly identically at any quality,
        // while frames with real content get much larger at high quality.
        const [low, high] = await Promise.all([
          VideoThumbnails.getThumbnailAsync(videoUrl, { time, quality: 0.1 }),
          VideoThumbnails.getThumbnailAsync(videoUrl, { time, quality: 1 }),
        ]);
        const [lowResp, highResp] = await Promise.all([
          fetch(low.uri),
          fetch(high.uri),
        ]);
        const [lowBlob, highBlob] = await Promise.all([
          lowResp.blob(),
          highResp.blob(),
        ]);
        const ratio = highBlob.size / Math.max(lowBlob.size, 1);
        // Solid color: ratio ~1.0-1.5. Real content: ratio >2.0
        return ratio > 2 ? high.uri : null;
      } catch {
        return null;
      }
    }

    async function findGoodThumbnail() {
      const url = event.flyer!.url!;
      for (const time of TIMESTAMPS) {
        if (cancelled) return;
        const uri = await isColorfulFrame(url, time);
        if (uri) {
          if (!cancelled) setVideoThumb(uri);
          return;
        }
      }
      // Fallback: use whatever we got from the first timestamp
      try {
        const fallback = await VideoThumbnails.getThumbnailAsync(url, { time: 0 });
        if (!cancelled) setVideoThumb(fallback.uri);
      } catch {
        // no thumbnail available
      }
    }

    findGoodThumbnail();
    return () => { cancelled = true; };
  }, [flyerIsVideo, event.flyer?.url, event.imageUrl]);

  const thumbUri = flyerIsVideo
    ? event.imageUrl || videoThumb || undefined
    : event.flyer?.url || event.imageUrl || undefined;

  return (
    <TouchableOpacity
      style={[styles.eventCard, { backgroundColor: colors.cardElevated }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View>
        {thumbUri ? (
          <Image
            source={{ uri: thumbUri }}
            style={[
              styles.eventImage,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          />
        ) : (
          <View
            style={[
              styles.eventImage,
              { backgroundColor: colors.backgroundSecondary, justifyContent: "center", alignItems: "center" },
            ]}
          >
            <Ionicons name="calendar" size={28} color={colors.textTertiary} />
          </View>
        )}
      </View>
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <Text
            style={[styles.eventName, { color: colors.text }]}
            numberOfLines={1}
          >
            {event.name}
          </Text>
          {showStatus && (
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor }]}
            >
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.eventDate, { color: colors.textSecondary }]}>
          {formatEventDate(event.startDate)} at{" "}
          {formatEventTime(event.startDate)}
        </Text>
        <Text
          style={[styles.eventLocation, { color: colors.textTertiary }]}
          numberOfLines={1}
        >
          {event.venue?.name || event.location || "Location TBA"}
        </Text>
        <View style={styles.eventBottomRow}>
          <View style={styles.eventStat}>
            <Ionicons
              name="people-outline"
              size={14}
              color={colors.textTertiary}
            />
            <Text
              style={[styles.eventStatText, { color: colors.textTertiary }]}
            >
              {event.attendeeCount || 0} RSVPs
            </Text>
          </View>
          <TouchableOpacity
            style={styles.dashboardButton}
            onPress={(e) => {
              e.stopPropagation();
              onDashboard();
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons
              name="grid-outline"
              size={13}
              color={colors.textSecondary}
            />
            <Text
              style={[
                styles.dashboardButtonText,
                { color: colors.textSecondary },
              ]}
            >
              Dashboard
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MyEventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();
  const [activeTab, setActiveTab] = React.useState<EventTab>("current");

  // Fetch events using React Query - auto-invalidated when events are created/updated
  const { data: events = [], isLoading, refetch } = useMyEvents();

  // Shared value for smooth tab indicator animation
  const scrollPosition = useSharedValue(0);

  // Pull-to-refresh with haptic feedback
  const { refreshControl } = useRefreshControl({
    onRefresh: async () => {
      await refetch();
    },
  });

  // Filter events by status: finished/cancelled → past, everything else → current
  const currentEvents = React.useMemo(() => {
    return events.filter(
      (event) =>
        event.status !== EventStatus.FINISHED &&
        event.status !== EventStatus.CANCELLED,
    );
  }, [events]);

  const pastEvents = React.useMemo(() => {
    return events.filter(
      (event) =>
        event.status === EventStatus.FINISHED ||
        event.status === EventStatus.CANCELLED,
    );
  }, [events]);

  // Handle tab press
  const handleTabPress = React.useCallback(
    (tab: EventTab) => {
      const pageIndex = tab === "current" ? 0 : 1;
      scrollPosition.value = withTiming(pageIndex, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
      if (tab !== activeTab) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setActiveTab(tab);
    },
    [scrollPosition, activeTab],
  );

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
    router.push(`/manage-event/${event.id}`);
  };

  const renderEvent = ({ item, index }: { item: Event; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <EventCard
        event={item}
        onPress={() => handleEventPress(item)}
        onDashboard={() => router.push(`/manage-event/${item.id}`)}
        colors={colors}
        isDark={isDark}
      />
    </Animated.View>
  );

  const currentCount = currentEvents.length;
  const pastCount = pastEvents.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[
          styles.header,
          { paddingTop: insets.top + 8, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          My Events
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/create-event")}
        >
          <Ionicons name="add" size={24} color={colors.text} />
        </TouchableOpacity>
      </Animated.View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <Animated.View
          style={[
            styles.tabIndicator,
            { width: tabWidth, backgroundColor: colors.text },
            indicatorStyle,
          ]}
        />
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabPress("current")}
          activeOpacity={0.7}
        >
          <Animated.Text
            style={[
              styles.tabText,
              { color: colors.text },
              currentTabTextStyle,
            ]}
          >
            Current
          </Animated.Text>
          {currentCount > 0 && (
            <View
              style={[
                styles.tabBadge,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.1)",
                },
                activeTab === "current" && {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.3)"
                    : "rgba(0,0,0,0.15)",
                },
              ]}
            >
              <Text style={[styles.tabBadgeText, { color: colors.text }]}>
                {currentCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabPress("past")}
          activeOpacity={0.7}
        >
          <Animated.Text
            style={[styles.tabText, { color: colors.text }, pastTabTextStyle]}
          >
            Past
          </Animated.Text>
          {pastCount > 0 && (
            <View
              style={[
                styles.tabBadge,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.1)",
                },
                activeTab === "past" && {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.3)"
                    : "rgba(0,0,0,0.15)",
                },
              ]}
            >
              <Text style={[styles.tabBadgeText, { color: colors.text }]}>
                {pastCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      ) : activeTab === "current" ? (
        <View style={styles.pageContainer}>
          {currentEvents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="calendar-outline"
                size={64}
                color={colors.textTertiary}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No current events
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textTertiary }]}
              >
                Create your first event to get started
              </Text>
              <View style={styles.createButtonWrapper}>
                <GlassButton
                  label="Create Event"
                  icon={<Ionicons name="add" size={18} color="#fff" />}
                  variant="glass"
                  size="lg"
                  onPress={() => router.push("/create-event")}
                />
              </View>
            </View>
          ) : (
            <FlatList
              data={currentEvents}
              renderItem={renderEvent}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: insets.bottom + 20 },
              ]}
              showsVerticalScrollIndicator={false}
              refreshControl={refreshControl}
            />
          )}
        </View>
      ) : (
        <View style={styles.pageContainer}>
          {pastEvents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="time-outline"
                size={64}
                color={colors.textTertiary}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No past events
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textTertiary }]}
              >
                Your completed events will appear here
              </Text>
            </View>
          ) : (
            <FlatList
              data={pastEvents}
              renderItem={renderEvent}
              keyExtractor={(item) => `past-${item.id.toString()}`}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: insets.bottom + 20 },
              ]}
              showsVerticalScrollIndicator={false}
              refreshControl={refreshControl}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Lato_700Bold",
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    position: "relative",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  tabText: {
    fontSize: 15,
    fontFamily: "Lato_600SemiBold",
  },
  tabBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tabBadgeText: {
    fontSize: 12,
    fontFamily: "Lato_700Bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Lato_700Bold",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
    marginTop: 8,
    textAlign: "center",
  },
  createButtonWrapper: {
    marginTop: 24,
  },
  listContent: {
    padding: 16,
  },
  eventCard: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  eventImage: {
    width: 100,
    height: 100,
  },
  eventContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  eventName: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Lato_700Bold",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontFamily: "Lato_700Bold",
    color: "#fff",
    textTransform: "uppercase",
  },
  eventDate: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    marginTop: 4,
  },
  eventLocation: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
  },
  eventBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  eventStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eventStatText: {
    fontSize: 12,
    fontFamily: "Lato_400Regular",
  },
  dashboardButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dashboardButtonText: {
    fontSize: 11,
    fontFamily: "Lato_600SemiBold",
  },
});
