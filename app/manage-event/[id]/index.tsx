import { useMemo, useState } from "react";
import { useStableRouter } from "@/hooks/use-stable-router";
import { DarkGradientBg } from "@/components/shared/dark-gradient-bg";
import { GlassSurface } from "@/components/glass/glass-surface";
import { useToast } from "@/components/shared/toast";
import { useEvent, useEventPermissions } from "@/hooks";
import { useAppTheme } from "@/hooks/use-app-theme";
import { EventStatus } from "@/lib/types/events.types";
import { eventsApi } from "@/lib/api/events";
import type { RolePermissions } from "@/lib/types/team.types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
} from "react-native";
import { Image } from "react-native";
import { FeedMediaPlayer } from "@/components/feed/feed-media-player";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';

interface SectionItem {
  key: string;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  permission: { resource: keyof RolePermissions; action: string };
}

interface SectionGroup {
  title: string;
  items: SectionItem[];
}

const SECTION_GROUPS: SectionGroup[] = [
  {
    title: "Event",
    items: [
      { key: "edit-event", label: "Edit Event", subtitle: "Update event info and flyer", icon: "create-outline", permission: { resource: "events", action: "edit" } },
    ],
  },
  {
    title: "Operations",
    items: [
      { key: "check-ins", label: "Check Ins", subtitle: "Scan and verify tickets", icon: "checkmark-circle-outline", permission: { resource: "attendees", action: "view" } },
      { key: "bar", label: "Bar", subtitle: "Tabs and drink orders", icon: "beer-outline", permission: { resource: "bar", action: "view" } },
      { key: "scanner", label: "Scanner", subtitle: "Scan IDs and membership cards", icon: "scan-outline", permission: { resource: "attendees", action: "view" } },
      { key: "tap-to-pay", label: "Tap to Charge", subtitle: "Charge custom amounts", icon: "phone-portrait-outline", permission: { resource: "billing", action: "edit" } },
    ],
  },
  {
    title: "Insights",
    items: [
      { key: "analytics", label: "Analytics", subtitle: "View detailed insights", icon: "stats-chart-outline", permission: { resource: "analytics", action: "view" } },
      { key: "revenue", label: "Revenue", subtitle: "Track earnings and trends", icon: "trending-up-outline", permission: { resource: "billing", action: "view" } },
      { key: "payments", label: "Payments", subtitle: "Revenue and transactions", icon: "card-outline", permission: { resource: "billing", action: "view" } },
    ],
  },
];

function getStatusColor(status: EventStatus): string {
  switch (status) {
    case "draft":
      return "#f59e0b";
    case "published":
      return "#3b82f6";
    case "active":
      return "#22c55e";
    case "finished":
      return "rgba(255,255,255,0.4)";
    case "cancelled":
      return "#ef4444";
    default:
      return "rgba(255,255,255,0.4)";
  }
}

function getStatusLabel(status: EventStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "published":
      return "Published";
    case "active":
      return "Live";
    case "finished":
      return "Ended";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

const STATE_ABBREV: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
  "district of columbia": "DC",
};

function abbreviateState(state: string): string {
  if (state.length <= 2) return state.toUpperCase();
  return STATE_ABBREV[state.toLowerCase()] || state;
}

function formatShortLocation(event: {
  venue?: { name?: string; city?: string; state?: string; address?: string };
  location?: string;
  locationDetails?: {
    addressLine1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    formattedAddress?: string;
  };
}): string {
  if (event.location) {
    return event.location
      .replace(/,?\s*\d{5}(-\d{4})?\s*/g, "")
      .replace(/,?\s*(United States|USA|US)\s*$/i, "")
      .replace(/,\s*$/, "")
      .trim();
  }

  const venue = event.venue;
  const loc = event.locationDetails;

  const street = loc?.addressLine1 || venue?.address;
  const city = loc?.city || venue?.city;
  const state = loc?.state || venue?.state;
  const parts: string[] = [];

  if (street) parts.push(street);
  if (city) parts.push(city);
  if (state) parts.push(abbreviateState(state));

  if (parts.length > 0) return parts.join(", ");

  return "Location TBA";
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateStr = start.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const startTime = start.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const endTime = end.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${dateStr} \u00B7 ${startTime} - ${endTime}`;
}

export default function ManageEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useStableRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const eventId = id ? Number(id) : undefined;
  const { data: event, isLoading, refetch } = useEvent(eventId);
  const { showError } = useToast();
  const {
    hasPermission,
    canEditEvents,
    isLoading: permissionsLoading,
  } = useEventPermissions(eventId);

  const [activeSection, setActiveSection] = useState<string>("Event");

  const visibleGroups = useMemo(() => {
    return SECTION_GROUPS.map((group) => ({
      ...group,
      items: permissionsLoading
        ? group.items
        : group.items.filter((item) =>
            hasPermission(item.permission.resource, item.permission.action),
          ),
    })).filter((group) => group.items.length > 0);
  }, [permissionsLoading, hasPermission]);

  const activeGroup = useMemo(
    () => visibleGroups.find((g) => g.title === activeSection) ?? visibleGroups[0],
    [visibleGroups, activeSection],
  );

  const handleSectionPress = (sectionKey: string) => {
    if (sectionKey === "edit-event") {
      router.push({ pathname: "/edit-event", params: { id: id! } });
      return;
    }
    if (sectionKey === "tap-to-pay") {
      router.push({ pathname: "/tap-to-pay", params: { eventId: id! } });
      return;
    }
    if (sectionKey === "scanner") {
      router.push({ pathname: "/scan-qr", params: { eventId: id! } });
      return;
    }
    if (sectionKey === "bar" && !event?.venueId) {
      showError('Assign a venue to this event first to use the bar.');
      return;
    }
    router.push(`/manage-event/${id}/${sectionKey}`);
  };

  if (isLoading || !event) {
    return (
      <View style={styles.container}>
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 12 }}>
          <Pressable style={styles.iconPill} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#000" />
          </Pressable>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </View>
    );
  }

  const flyerUrl = event.flyer?.url || event.imageUrl;
  const VIDEO_EXT = /\.(mp4|mov|webm|m4v)(\?|$)/i;
  const flyerIsVideo =
    event.flyer?.mimeType?.startsWith("video/") ||
    VIDEO_EXT.test(event.flyer?.url || "");
  const flyerMediaType: "video" | "image" = flyerIsVideo ? "video" : "image";
  const flyerVideoUrl = flyerIsVideo ? event.flyer?.url : undefined;
  const flyerThumbnail = flyerIsVideo ? event.imageUrl || "" : "";
  const cardWidth = Dimensions.get("window").width - 32 - 2;
  const isPastEvent =
    event.status === EventStatus.FINISHED ||
    event.status === EventStatus.CANCELLED;

  return (
    <View style={styles.container}>
      {/* Header pills row */}
      <View style={{ paddingTop: insets.top + 16 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
          style={styles.pillScroll}
        >
          {/* Back button pill */}
          <Pressable style={styles.iconPill} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#000" />
          </Pressable>

          {/* Section filter pills */}
          {visibleGroups.map((group) => {
            const isActive = activeGroup?.title === group.title;
            return (
              <Pressable
                key={group.title}
                style={styles.filterPill}
                onPress={() => setActiveSection(group.title)}
              >
                <View
                  style={[
                    styles.filterPillBg,
                    isActive && styles.filterPillBgActive,
                  ]}
                />
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {group.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Event Flyer Card */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <View style={styles.eventCard}>
            {/* Blurred flyer backdrop */}
            {flyerUrl ? (
              <>
                <Image
                  source={{ uri: flyerUrl }}
                  style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
                  resizeMode="cover"
                />
                <BlurView
                  intensity={60}
                  tint="light"
                  style={[StyleSheet.absoluteFill, { borderRadius: 18, overflow: 'hidden' }]}
                />
              </>
            ) : null}

            <View style={styles.flyerWrapper}>
              {flyerUrl ? (
                <FeedMediaPlayer
                  mediaType={flyerMediaType}
                  videoUrl={flyerVideoUrl}
                  imageUrl={flyerUrl}
                  poster={flyerThumbnail || flyerUrl}
                  isActive={true}
                  muted
                  containerWidth={cardWidth - 24}
                  maxHeight={(cardWidth - 24) * (4 / 3)}
                />
              ) : (
                <View style={[styles.flyerPlaceholder, { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
                  <Ionicons
                    name="calendar"
                    size={48}
                    color="rgba(0,0,0,0.2)"
                  />
                </View>
              )}
            </View>

            {/* Card footer */}
            <View style={styles.cardFooter}>
              <Text style={styles.eventName} numberOfLines={2}>
                {event.name}
              </Text>
              <View style={styles.eventDateRow}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color="rgba(255,255,255,0.6)"
                />
                <Text style={styles.eventDate} numberOfLines={1}>
                  {formatDateRange(event.startDate, event.endDate)}
                </Text>
              </View>
              <View style={styles.eventDateRow}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color="rgba(255,255,255,0.6)"
                />
                <Text style={styles.eventLocation} numberOfLines={1}>
                  {formatShortLocation(event)}
                </Text>
              </View>
              <View style={styles.eventMeta}>
                {event.status !== EventStatus.PUBLISHED && (
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(event.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {getStatusLabel(event.status)}
                    </Text>
                  </View>
                )}
                {event.attendeeCount != null && (
                  <View style={styles.attendeeStat}>
                    <Ionicons
                      name="people-outline"
                      size={13}
                      color="rgba(255,255,255,0.6)"
                    />
                    <Text style={styles.attendeeText}>
                      {event.attendeeCount} RSVPs
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Publish button for draft events */}
        {event.status === EventStatus.DRAFT && (
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <TouchableOpacity
              style={{ backgroundColor: '#000', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 }}
              activeOpacity={0.85}
              onPress={async () => {
                try {
                  await eventsApi.publishEvent(event.id);
                  showSuccess('Event published!');
                  refetch();
                } catch (err: any) {
                  showError(err.message || 'Failed to publish');
                }
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, }}>Publish Event</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Active group only */}
        {activeGroup ? (() => {
          const displayItems = activeGroup.items;
          return (
          <Animated.View
            key={activeGroup.title}
            entering={FadeInDown.duration(300)}
            style={styles.menuSection}
          >
            <GlassSurface
              fill="subtle"
              border="subtle"
              cornerRadius="lg"
              style={styles.menuList}
            >
              {displayItems.map((section, index) => (
                <TouchableOpacity
                  key={section.key}
                  style={[
                    styles.menuItem,
                    index < displayItems.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={() => handleSectionPress(section.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuItemIcon, { overflow: 'hidden' }]}>
                    <GlassView {...liquidGlass.fillFaint} borderRadius={10} style={StyleSheet.absoluteFillObject} />
                    <Ionicons
                      name={section.icon}
                      size={20}
                      color="#000"
                    />
                  </View>
                  <View style={styles.menuItemContent}>
                    <Text style={styles.menuItemTitle}>{section.label}</Text>
                    <Text style={styles.menuItemSubtitle}>
                      {section.subtitle}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="rgba(0,0,0,0.3)"
                  />
                </TouchableOpacity>
              ))}
            </GlassSurface>
          </Animated.View>
          );
        })() : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  pillScroll: {
    flexGrow: 0,
  },
  pillRow: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: "center",
  },
  iconPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  filterPill: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  filterPillBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 19,
  },
  filterPillBgActive: {
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(0,0,0,0.5)",
  },
  filterPillTextActive: {
    color: "rgba(0,0,0,0.8)",
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    color: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  eventCard: {
    borderRadius: 18,
    padding: 12,
    overflow: "hidden",
  },
  flyerWrapper: {
    borderRadius: 12,
    overflow: "hidden",
  },
  flyerPlaceholder: {
    width: "100%",
    aspectRatio: 3 / 4,
    justifyContent: "center",
    alignItems: "center",
  },
  cardFooter: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 6,
  },
  eventName: {
    fontSize: 20,
    lineHeight: 26,
    marginBottom: 2,
    color: "#fff",
  },
  eventDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eventDate: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  eventLocation: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: "#fff",
    textTransform: "uppercase",
  },
  attendeeStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  attendeeText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  menuSection: {
    marginTop: 20,
  },
  groupTitle: {
    fontSize: 13,
    color: "rgba(0,0,0,0.5)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuList: {
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  menuItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    color: "#000",
  },
  menuItemSubtitle: {
    fontSize: 13,
    marginTop: 2,
    color: "rgba(0,0,0,0.5)",
  },
});
