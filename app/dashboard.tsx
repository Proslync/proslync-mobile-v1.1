import { useAppTheme } from "@/hooks/use-app-theme";
import { useStableRouter } from "@/hooks/use-stable-router";
import { useDashboard } from "@/hooks/use-dashboard";
import { useAuth } from "@/lib/providers/auth-provider";
import { useWallet } from "@/lib/providers/wallet-provider";
import { UserRole } from "@/lib/types/auth.types";
import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { DarkGradientBg } from "@/components/shared/dark-gradient-bg";
import {
  liquidGlass,
  glassBorder,
  glassText,
  glassSurfaceTint,
} from "@/constants/glass/liquid-glass";
import * as React from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MembershipCard, StatusCardMenuSheet } from "@/components/wallet";

interface MenuItemData {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

function MenuItem({
  item,
  isLast,
  t,
  border,
  isDark,
  onPress,
}: {
  item: MenuItemData;
  isLast: boolean;
  t: (typeof glassText)["dark"];
  border: string;
  isDark: boolean;
  onPress: () => void;
}) {
  return (
    <>
      <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
        <View
          style={[
            styles.menuItemIcon,
            { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" },
          ]}
        >
          <Ionicons name={item.icon} size={18} color={t.primary} />
        </View>
        <View style={styles.menuItemContent}>
          <Text style={[styles.menuItemTitle, { color: t.primary }]}>{item.title}</Text>
          <Text style={[styles.menuItemSubtitle, { color: t.muted }]}>{item.subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={t.muted} />
      </TouchableOpacity>
      {!isLast && <View style={[styles.divider, { backgroundColor: border }]} />}
    </>
  );
}

function MenuGroup({
  title,
  items,
  delay,
  t,
  border,
  surfaceTint,
  isDark,
  onItemPress,
}: {
  title: string;
  items: MenuItemData[];
  delay: number;
  t: (typeof glassText)["dark"];
  border: string;
  surfaceTint: string;
  isDark: boolean;
  onItemPress: (route: string) => void;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(500).springify()}
      style={styles.section}
    >
      <Text style={[styles.sectionTitle, { color: t.muted }]}>{title}</Text>
      <View style={[styles.sectionCard, { borderColor: border, backgroundColor: "#ffffff" }]}>
        {items.map((item, index) => (
          <MenuItem
            key={item.route}
            item={item}
            isLast={index === items.length - 1}
            t={t}
            border={border}
            isDark={isDark}
            onPress={() => onItemPress(item.route)}
          />
        ))}
      </View>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { stats, isLoading: statsLoading, error, refetch } = useDashboard();
  const { isDark } = useAppTheme();
  const { user: walletUser } = useWallet();
  const [cardMenuVisible, setCardMenuVisible] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const t = glassText["light"];
  const border = glassBorder["light"];
  const surfaceTint = glassSurfaceTint["light"];

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const isLoading = authLoading || statsLoading;

  const handleNav = React.useCallback(
    (route: string) => router.push(route as any),
    [router],
  );

  // Grouped menu items
  const manageItems: MenuItemData[] = [
    { title: "Create Event", subtitle: "Set up a new event", icon: "add-circle-outline", route: "/create-event" },
    { title: "My Events", subtitle: "View and edit your events", icon: "calendar-outline", route: "/my-events" },
    { title: "My Venues", subtitle: "Manage your venues", icon: "business-outline", route: "/my-venues" },
    { title: "My List", subtitle: "Everyone who RSVP'd", icon: "list-outline", route: "/dashboard/attendees" },
  ];

  const insightsItems: MenuItemData[] = [
    { title: "Analytics", subtitle: "View detailed insights", icon: "bar-chart-outline", route: "/dashboard/analytics" },
    { title: "Revenue", subtitle: "Track earnings and trends", icon: "trending-up-outline", route: "/dashboard/revenue" },
    { title: "Wallet", subtitle: "View earnings and payouts", icon: "wallet-outline", route: "/dashboard/payments" },
  ];

  const toolsItems: MenuItemData[] = [
    { title: "Text Blast", subtitle: "SMS to all your contacts", icon: "chatbubble-outline", route: "/dashboard/text-blast" },
  ];

  const adminItems: MenuItemData[] = user?.role === UserRole.ADMIN
    ? [{ title: "Admin Panel", subtitle: "Manage users, events, and posts", icon: "shield-checkmark-outline", route: "/admin" }]
    : [];

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: "#f2f2f2" }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={t.primary} />
          <Text style={[styles.loadingText, { color: t.muted }]}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#f2f2f2" }]}>

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity
          style={[styles.backButton, { borderColor: border }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={18} style={StyleSheet.absoluteFill} />
          <Ionicons name="chevron-back" size={22} color={t.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.primary }]}>Dashboard</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={t.primary}
          />
        }
      >
        {/* Status Card */}
        {walletUser && (
          <Animated.View entering={FadeInDown.duration(500)} style={styles.cardContainer}>
            <MembershipCard user={walletUser} onPress={() => setCardMenuVisible(true)} />
          </Animated.View>
        )}

        {/* Error Banner */}
        {error && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={20} color="#f87171" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={refetch} activeOpacity={0.7}>
              <Text style={[styles.retryText, { color: t.secondary }]}>Retry</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Menu Groups */}
        <MenuGroup title="MANAGE" items={manageItems} delay={100} t={t} border={border} surfaceTint={surfaceTint} isDark={isDark} onItemPress={handleNav} />
        <MenuGroup title="INSIGHTS" items={insightsItems} delay={200} t={t} border={border} surfaceTint={surfaceTint} isDark={isDark} onItemPress={handleNav} />
        <MenuGroup title="TOOLS" items={toolsItems} delay={300} t={t} border={border} surfaceTint={surfaceTint} isDark={isDark} onItemPress={handleNav} />
        {adminItems.length > 0 && (
          <MenuGroup title="ADMIN" items={adminItems} delay={400} t={t} border={border} surfaceTint={surfaceTint} isDark={isDark} onItemPress={handleNav} />
        )}

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>

      {walletUser && (
        <StatusCardMenuSheet
          visible={cardMenuVisible}
          onClose={() => setCardMenuVisible(false)}
          user={walletUser}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Lato_400Regular",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(248, 113, 113, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    color: "#ef4444",
  },
  retryText: {
    fontSize: 13,
    fontFamily: "Lato_700Bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  cardContainer: {
    marginHorizontal: -16,
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Lato_700Bold",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardGlass: {
    ...StyleSheet.absoluteFillObject,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
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
  divider: {
    height: 1,
    marginLeft: 62,
  },
});
