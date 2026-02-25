import { useMemo } from "react";
import { useStableRouter } from "@/hooks/use-stable-router";
import { DarkGradientBg } from "@/components/shared/dark-gradient-bg";
import { GlassSurface } from "@/components/glass/glass-surface";
import { useEvent, useEventPermissions } from "@/hooks";
import { useAppTheme } from "@/hooks/use-app-theme";
import { EventStatus } from "@/lib/types/events.types";
import type { RolePermissions } from "@/lib/types/team.types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SECTIONS = [
  {
    key: "overview",
    label: "Overview",
    subtitle: "Event details and flyer",
    icon: "grid-outline" as const,
    permission: { resource: "events" as keyof RolePermissions, action: "view" },
  },
  {
    key: "attendees",
    label: "Attendees",
    subtitle: "View guest list",
    icon: "people-outline" as const,
    permission: {
      resource: "attendees" as keyof RolePermissions,
      action: "view",
    },
  },
  {
    key: "check-ins",
    label: "Check Ins",
    subtitle: "Scan and verify tickets",
    icon: "scan-outline" as const,
    permission: {
      resource: "attendees" as keyof RolePermissions,
      action: "view",
    },
  },
  {
    key: "analytics",
    label: "Analytics",
    subtitle: "View detailed insights",
    icon: "stats-chart-outline" as const,
    permission: {
      resource: "analytics" as keyof RolePermissions,
      action: "view",
    },
  },
  {
    key: "pricing",
    label: "Pricing",
    subtitle: "Tickets and pricing tiers",
    icon: "pricetag-outline" as const,
    permission: {
      resource: "billing" as keyof RolePermissions,
      action: "view",
    },
  },
  {
    key: "marketing",
    label: "Marketing",
    subtitle: "Promotions and sharing",
    icon: "megaphone-outline" as const,
    permission: {
      resource: "marketing" as keyof RolePermissions,
      action: "view",
    },
  },
  {
    key: "payments",
    label: "Payments",
    subtitle: "Revenue and transactions",
    icon: "card-outline" as const,
    permission: {
      resource: "billing" as keyof RolePermissions,
      action: "view",
    },
  },
  {
    key: "revenue",
    label: "Revenue",
    subtitle: "Track earnings and trends",
    icon: "trending-up-outline" as const,
    permission: {
      resource: "billing" as keyof RolePermissions,
      action: "view",
    },
  },
  {
    key: "team",
    label: "Team",
    subtitle: "Staff and permissions",
    icon: "person-add-outline" as const,
    permission: { resource: "team" as keyof RolePermissions, action: "view" },
  },
  {
    key: "artists",
    label: "Artists",
    subtitle: "Manage event lineup",
    icon: "musical-notes-outline" as const,
    permission: { resource: "events" as keyof RolePermissions, action: "edit" },
  },
  {
    key: "tap-to-pay",
    label: "Tap to Pay",
    subtitle: "Accept contactless payments",
    icon: "phone-portrait-outline" as const,
    permission: {
      resource: "billing" as keyof RolePermissions,
      action: "edit",
    },
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
  const { data: event, isLoading } = useEvent(eventId);
  const {
    hasPermission,
    canEditEvents,
    isLoading: permissionsLoading,
  } = useEventPermissions(eventId);

  const visibleSections = useMemo(() => {
    // Show all sections while permissions are loading to avoid flash
    if (permissionsLoading) return SECTIONS;
    return SECTIONS.filter((section) =>
      hasPermission(section.permission.resource, section.permission.action),
    );
  }, [permissionsLoading, hasPermission]);

  const handleSectionPress = (sectionKey: string) => {
    if (sectionKey === "tap-to-pay") {
      router.push({ pathname: "/tap-to-pay", params: { eventId: id! } });
      return;
    }
    router.push(`/manage-event/${id}/${sectionKey}`);
  };

  if (isLoading || !event) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {isDark && <DarkGradientBg />}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Manage Event
          </Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </View>
    );
  }

  const flyerUrl = event.flyer?.url || event.imageUrl;
  const isPastEvent =
    event.status === EventStatus.FINISHED ||
    event.status === EventStatus.CANCELLED;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[
          styles.header,
          { paddingTop: insets.top + 8, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Manage Event
        </Text>
        {!isPastEvent && canEditEvents() ? (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() =>
              router.push({ pathname: "/edit-event", params: { id: id! } })
            }
          >
            <Ionicons name="create-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerButton} />
        )}
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Event Info Section */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <GlassSurface
            fill="subtle"
            border="subtle"
            cornerRadius="lg"
            style={styles.eventInfo}
          >
            <View style={styles.eventInfoRow}>
              {flyerUrl ? (
                <Image
                  source={{ uri: flyerUrl }}
                  style={[
                    styles.flyerImage,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                />
              ) : (
                <View
                  style={[
                    styles.flyerPlaceholder,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                >
                  <Ionicons
                    name="calendar"
                    size={28}
                    color={colors.textTertiary}
                  />
                </View>
              )}
              <View style={styles.eventDetails}>
                <Text
                  style={[styles.eventName, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {event.name}
                </Text>
                <Text
                  style={[
                    styles.eventLocation,
                    { color: colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {event.venue?.name || event.location || "Location TBA"}
                </Text>
                <Text
                  style={[styles.eventDate, { color: colors.textTertiary }]}
                  numberOfLines={1}
                >
                  {formatDateRange(event.startDate, event.endDate)}
                </Text>
                <View style={styles.eventMeta}>
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
                  {event.attendeeCount != null && (
                    <View style={styles.attendeeStat}>
                      <Ionicons
                        name="people-outline"
                        size={13}
                        color={colors.textTertiary}
                      />
                      <Text
                        style={[
                          styles.attendeeText,
                          { color: colors.textTertiary },
                        ]}
                      >
                        {event.attendeeCount} RSVPs
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </GlassSurface>
        </Animated.View>

        {/* Menu Items */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(500).springify()}
          style={styles.menuSection}
        >
          <View
            style={[styles.menuList, { backgroundColor: colors.cardElevated }]}
          >
            {visibleSections.map((section) => (
              <TouchableOpacity
                key={section.key}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
                onPress={() => handleSectionPress(section.key)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.menuItemIcon,
                    { backgroundColor: colors.cardElevated },
                  ]}
                >
                  <Ionicons name={section.icon} size={22} color={colors.text} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={[styles.menuItemTitle, { color: colors.text }]}>
                    {section.label}
                  </Text>
                  <Text
                    style={[
                      styles.menuItemSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {section.subtitle}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.iconSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Lato_700Bold",
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
  eventInfo: {
    padding: 16,
  },
  eventInfoRow: {
    flexDirection: "row",
  },
  flyerImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  flyerPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  eventDetails: {
    flex: 1,
    marginLeft: 14,
  },
  eventName: {
    fontSize: 18,
    fontFamily: "Lato_700Bold",
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    marginBottom: 8,
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  attendeeStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  attendeeText: {
    fontSize: 12,
    fontFamily: "Lato_400Regular",
  },
  menuSection: {
    marginTop: 20,
  },
  menuList: {
    borderRadius: 12,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
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
    fontFamily: "Lato_700Bold",
  },
  menuItemSubtitle: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    marginTop: 2,
  },
});
