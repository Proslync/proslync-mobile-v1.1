import { GlassButton } from "@/components/glass";
import { useStableRouter } from "@/hooks/use-stable-router";
import { useLocalSearchParams } from "expo-router";
import { useMyEvents } from "@/hooks";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useRefreshControl } from "@/hooks/use-refresh-control";
import { GlassView } from "expo-glass-effect";
import { DarkGradientBg } from "@/components/shared/dark-gradient-bg";
import {
  liquidGlass,
  glassBorder,
  glassText,
  glassSurfaceTint,
} from "@/constants/glass/liquid-glass";
import { SegmentedControl } from "@/components/shared/segmented-control";
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
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
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
  t: (typeof glassText)["dark"] | (typeof glassText)["light"];
  border: string;
  surfaceTint: string;
  isDark: boolean;
}

function EventCard({
  event,
  onPress,
  onDashboard,
  t,
  border,
  surfaceTint,
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
      style={[styles.eventCard, { borderColor: border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={14} style={StyleSheet.absoluteFill} />
      <View>
        {thumbUri ? (
          <Image
            source={{ uri: thumbUri }}
            style={[styles.eventImage, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
          />
        ) : (
          <View style={[styles.eventImage, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', justifyContent: "center", alignItems: "center" }]}>
            <Ionicons name="calendar" size={28} color={t.muted} />
          </View>
        )}
      </View>
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <Text style={[styles.eventName, { color: t.primary }]} numberOfLines={1}>
            {event.name}
          </Text>
          {showStatus && (
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.eventDate, { color: t.secondary }]}>
          {formatEventDate(event.startDate)} at {formatEventTime(event.startDate)}
        </Text>
        <Text style={[styles.eventLocation, { color: t.muted }]} numberOfLines={1}>
          {event.venue?.name || event.location || "Location TBA"}
        </Text>
        <View style={styles.eventBottomRow}>
          <View style={styles.eventStat}>
            <Ionicons name="people-outline" size={14} color={t.muted} />
            <Text style={[styles.eventStatText, { color: t.muted }]}>
              {event.attendeeCount || 0} RSVPs
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.dashboardChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
            onPress={(e) => { e.stopPropagation(); onDashboard(); }}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="grid-outline" size={13} color={t.tertiary} />
            <Text style={[styles.dashboardChipText, { color: t.tertiary }]}>Manage</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MyEventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { organizationId: orgIdParam } = useLocalSearchParams<{ organizationId?: string }>();
  const { isDark } = useAppTheme();
  const theme = isDark ? "dark" : "light";
  const t = glassText[theme];
  const border = glassBorder[theme];
  const surfaceTint = glassSurfaceTint[theme];
  const [activeTab, setActiveTab] = React.useState<EventTab>("current");

  // Fetch events using React Query - auto-invalidated when events are created/updated
  const orgId = orgIdParam ? parseInt(orgIdParam, 10) : undefined;
  const { data: events = [], isLoading, refetch } = useMyEvents(orgId);

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

  const handleTabPress = React.useCallback(
    (tab: EventTab) => {
      if (tab !== activeTab) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setActiveTab(tab);
    },
    [activeTab],
  );

  const handleEventPress = (event: Event) => {
    router.push(`/manage-event/${event.id}`);
  };

  const renderEvent = ({ item, index }: { item: Event; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <EventCard
        event={item}
        onPress={() => handleEventPress(item)}
        onDashboard={() => router.push(`/manage-event/${item.id}`)}
        t={t}
        border={border}
        surfaceTint={surfaceTint}
        isDark={isDark}
      />
    </Animated.View>
  );

  const currentCount = currentEvents.length;
  const pastCount = pastEvents.length;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <DarkGradientBg />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity
          style={[styles.backButton, { borderColor: border }]}
          onPress={() => router.back()}
        >
          <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={18} style={StyleSheet.absoluteFill} />
          <Ionicons name="arrow-back" size={20} color={t.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.primary }]}>My Events</Text>
        <TouchableOpacity
          style={[styles.addButton, { borderColor: border }]}
          onPress={() => router.push("/create-event")}
        >
          <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={18} style={StyleSheet.absoluteFill} />
          <Ionicons name="add" size={20} color={t.primary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Segmented Tabs */}
      <View style={styles.tabBar}>
        <SegmentedControl
          segments={[`Current${currentCount > 0 ? ` (${currentCount})` : ''}`, `Past${pastCount > 0 ? ` (${pastCount})` : ''}`]}
          selectedIndex={activeTab === "current" ? 0 : 1}
          onSelect={(index) => handleTabPress(index === 0 ? "current" : "past")}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      ) : activeTab === "current" ? (
        <View style={styles.pageContainer}>
          {currentEvents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={t.muted} />
              <Text style={[styles.emptyTitle, { color: t.primary }]}>
                No current events
              </Text>
              <Text style={[styles.emptySubtitle, { color: t.muted }]}>
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
              <Ionicons name="time-outline" size={64} color={t.muted} />
              <Text style={[styles.emptyTitle, { color: t.primary }]}>
                No past events
              </Text>
              <Text style={[styles.emptySubtitle, { color: t.muted }]}>
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
    paddingBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Lato_700Bold",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
  },
  tabBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
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
  dashboardChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dashboardChipText: {
    fontSize: 11,
    fontFamily: "Lato_600SemiBold",
  },
});
