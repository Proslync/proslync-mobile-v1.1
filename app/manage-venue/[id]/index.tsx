import { DarkGradientBg } from "@/components/shared/dark-gradient-bg";
import { useStableRouter } from "@/hooks/use-stable-router";
import { GlassSurface } from "@/components/glass/glass-surface";
import { GlassView } from "expo-glass-effect";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import { LiquidGlassView, isLiquidGlassSupported } from "@callstack/liquid-glass";
import { LinearGradient } from "expo-linear-gradient";
import { useVenue } from "@/hooks/use-venue-query";
import { useAppTheme } from "@/hooks/use-app-theme";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { useAuth } from "@/lib/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SavedAccount {
  id: number;
  phoneNumber: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  accessToken?: string;
  refreshToken?: string;
}

interface VenueSection {
  key: string;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface VenueSectionGroup {
  title: string;
  items: VenueSection[];
}

const SECTION_GROUPS: VenueSectionGroup[] = [
  {
    title: "Manage Venue",
    items: [
      { key: "info", label: "Edit Profile", subtitle: "Update venue info and details", icon: "create-outline" },
      { key: "staff", label: "Team", subtitle: "Manage team members", icon: "people-outline" },
      { key: "schedule", label: "Schedule", subtitle: "Shifts and assignments", icon: "time-outline" },
      { key: "tables", label: "Tables", subtitle: "Manage table sections", icon: "grid-outline" },
      { key: "menu", label: "Menu", subtitle: "Manage food & drink items", icon: "restaurant-outline" },
    ],
  },
];

function getStatusColor(status?: string): string {
  switch (status) {
    case "active":
      return "#22c55e";
    case "pending":
      return "#f59e0b";
    case "inactive":
      return "rgba(255,255,255,0.4)";
    default:
      return "rgba(255,255,255,0.4)";
  }
}

function getStatusLabel(status?: string): string {
  switch (status) {
    case "active":
      return "Active";
    case "pending":
      return "Pending";
    case "inactive":
      return "Inactive";
    default:
      return status || "Unknown";
  }
}

export default function ManageVenueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useStableRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { user, switchAccount } = useAuth();
  const [activeSection, setActiveSection] = React.useState<string>('Manage Venue');
  const [isSwitching, setIsSwitching] = React.useState(false);
  const [errorAlert, setErrorAlert] = React.useState<{
    title: string;
    message: string;
  } | null>(null);

  const venueId = id ? Number(id) : undefined;
  const { data: venue, isLoading } = useVenue(venueId);

  // Check if current user is NOT the venue owner (show login button)
  const isOwner = user && venue?.ownerId ? user.id === venue.ownerId : true;

  const handleLoginAsVenue = React.useCallback(async () => {
    if (!venue?.ownerId) return;
    setIsSwitching(true);
    try {
      const stored = await AsyncStorage.getItem("saved_accounts");
      if (!stored) {
        setErrorAlert({
          title: "Account Not Found",
          message:
            "The venue owner account is not saved on this device. Add it via the account switcher first.",
        });
        return;
      }
      const accounts: SavedAccount[] = JSON.parse(stored);
      const ownerAccount = accounts.find((a) => a.id === venue.ownerId);
      if (!ownerAccount || !ownerAccount.accessToken) {
        setErrorAlert({
          title: "Account Not Found",
          message:
            "The venue owner account is not saved on this device. Add it via the account switcher first.",
        });
        return;
      }
      const success = await switchAccount(
        ownerAccount.accessToken,
        ownerAccount.refreshToken,
      );
      if (success) {
        router.replace("/(tabs)");
      } else {
        setErrorAlert({
          title: "Switch Failed",
          message:
            "Could not log into the venue account. The session may have expired.",
        });
      }
    } catch {
      setErrorAlert({ title: "Error", message: "Failed to switch accounts." });
    } finally {
      setIsSwitching(false);
    }
  }, [venue?.ownerId, switchAccount, router]);

  const handleSectionPress = (sectionKey: string) => {
    router.push(`/manage-venue/${id}/${sectionKey}`);
  };

  const activeGroup = SECTION_GROUPS.find((g) => g.title === activeSection) ?? SECTION_GROUPS[0];

  if (isLoading || !venue) {
    return (
      <View style={[styles.container, { backgroundColor: '#f2f2f2' }]}>
        <View style={[styles.pillRow, { paddingTop: insets.top + 16 }]}>
          <Pressable style={styles.pillIcon} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#000" />
          </Pressable>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </View>
    );
  }

  const location =
    [venue.city, venue.state].filter(Boolean).join(", ") || venue.address;

  return (
    <View style={[styles.container, { backgroundColor: '#f2f2f2' }]}>
      <ConfirmSheet
        visible={!!errorAlert}
        onClose={() => setErrorAlert(null)}
        title={errorAlert?.title || "Error"}
        message={errorAlert?.message || ""}
        alertOnly
        icon="alert-circle-outline"
      />

      {/* Pill row header */}
      <View style={[styles.pillRow, { paddingTop: insets.top + 16 }]}>
        <Pressable style={styles.pillIcon} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#000" />
        </Pressable>
        {SECTION_GROUPS.map((group) => {
          const isActive = activeSection === group.title;
          return (
            <Pressable
              key={group.title}
              style={styles.pillFilter}
              onPress={() => setActiveSection(group.title)}
            >
              {isLiquidGlassSupported ? (
                <LiquidGlassView effect="regular" style={StyleSheet.absoluteFill} />
              ) : (
                <View style={styles.pillGlassLayer} pointerEvents="none">
                  <GlassView {...liquidGlass.surface} tintColor={isActive ? 'rgba(0,0,0,0.12)' : 'transparent'} borderRadius={19} style={StyleSheet.absoluteFill} />
                </View>
              )}
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{group.title}</Text>
            </Pressable>
          );
        })}
      </View>

      <LinearGradient colors={['#f2f2f2', 'rgba(242,242,242,0)']} style={styles.topFade} pointerEvents="none" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Venue Info Card */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <View style={styles.venueInfo}>
            <View style={styles.venueInfoRow}>
              <View style={styles.venueLogoPlaceholder}>
                <Ionicons name="business" size={28} color="rgba(0,0,0,0.3)" />
              </View>
              <View style={styles.venueDetails}>
                <Text style={styles.venueName} numberOfLines={2}>{venue.name}</Text>
                {location ? <Text style={styles.venueAddress} numberOfLines={1}>{location}</Text> : null}
                {venue.phoneNumber ? <Text style={styles.venuePhone} numberOfLines={1}>{venue.phoneNumber}</Text> : null}
                <View style={styles.venueMeta}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(venue.status) }]}>
                    <Text style={styles.statusText}>{getStatusLabel(venue.status)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Active section */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.menuSection}>
          <View style={styles.menuList}>
            {activeGroup.items.map((section, index) => (
              <TouchableOpacity
                key={section.key}
                style={[
                  styles.menuItem,
                  index < activeGroup.items.length - 1 && styles.menuItemBorder,
                ]}
                onPress={() => handleSectionPress(section.key)}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemIcon}>
                  <Ionicons name={section.icon} size={20} color="#000" />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>{section.label}</Text>
                  <Text style={styles.menuItemSubtitle}>{section.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(0,0,0,0.3)" />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Login as Venue Owner */}
        {!isOwner && (
          <Animated.View
            entering={FadeInDown.delay(250).duration(500).springify()}
            style={styles.loginSection}
          >
            <TouchableOpacity
              style={[
                styles.loginButton,
                { overflow: 'hidden' },
              ]}
              onPress={handleLoginAsVenue}
              activeOpacity={0.7}
              disabled={isSwitching}
            >
              <GlassView {...liquidGlass.fill} borderRadius={12} style={StyleSheet.absoluteFillObject} />
              {isSwitching ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <Ionicons
                    name="log-in-outline"
                    size={20}
                    color={colors.text}
                  />
                  <Text
                    style={[styles.loginButtonText, { color: colors.text }]}
                  >
                    Login to Venue Account
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pillRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, alignItems: 'center', paddingBottom: 8, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 9 },
  pillIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' },
  pillFilter: { height: 38, borderRadius: 19, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  pillGlassLayer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', borderRadius: 19 },
  pillText: { fontSize: 14, fontWeight: '500', color: 'rgba(0,0,0,0.5)' },
  pillTextActive: { color: 'rgba(0,0,0,0.8)' },
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
  venueInfo: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  venueInfoRow: {
    flexDirection: "row",
  },
  venueLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  venueDetails: {
    flex: 1,
    marginLeft: 14,
  },
  venueName: {
    fontSize: 18,
    fontFamily: "Lato_700Bold",
    color: '#000',
    marginBottom: 4,
  },
  venueAddress: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
    color: 'rgba(0,0,0,0.55)',
    marginBottom: 2,
  },
  venuePhone: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    color: 'rgba(0,0,0,0.4)',
    marginBottom: 8,
  },
  venueMeta: {
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
  menuSection: {
    marginTop: 16,
  },
  groupTitle: {
    fontSize: 13,
    fontFamily: "Lato_700Bold",
    color: "rgba(0,0,0,0.5)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuList: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontFamily: "Lato_700Bold",
    color: '#000',
  },
  menuItemSubtitle: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    color: 'rgba(0,0,0,0.5)',
    marginTop: 2,
  },
  loginSection: {
    marginTop: 20,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  loginButtonText: {
    fontSize: 15,
    fontFamily: "Lato_700Bold",
  },
});
