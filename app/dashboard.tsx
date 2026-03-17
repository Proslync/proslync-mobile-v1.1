import { useAppTheme } from "@/hooks/use-app-theme";
import { useStableRouter } from "@/hooks/use-stable-router";
import { useDashboard } from "@/hooks/use-dashboard";
import { useAuth } from "@/lib/providers/auth-provider";
import { useWallet } from "@/lib/providers/wallet-provider";
import { UserRole } from "@/lib/types/auth.types";
import { Ionicons } from "@expo/vector-icons";
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
import { DarkGradientBg } from "@/components/shared/dark-gradient-bg";
import { GlassSurface } from "@/components/glass/glass-surface";

interface MenuItemProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  isLast?: boolean;
}

function MenuItem({ title, subtitle, icon, onPress, isLast }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, !isLast && styles.menuItemBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemIcon}>
        <Ionicons name={icon} size={20} color="rgba(255,255,255,0.9)" />
      </View>
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemTitle}>{title}</Text>
        <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color="rgba(255,255,255,0.3)"
      />
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { stats, isLoading: statsLoading, error, refetch } = useDashboard();
  const { colors } = useAppTheme();
  const { user: walletUser } = useWallet();
  const [cardMenuVisible, setCardMenuVisible] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const isLoading = authLoading || statsLoading;

  const menuItems = React.useMemo(() => {
    const items = [
      {
        title: "Create Event",
        subtitle: "Set up a new event",
        icon: "add-circle-outline" as const,
        route: "/create-event",
      },
      {
        title: "My Events",
        subtitle: "View and edit your events",
        icon: "calendar-outline" as const,
        route: "/my-events",
      },
      {
        title: "My Venues",
        subtitle: "Manage your venues",
        icon: "business-outline" as const,
        route: "/my-venues",
      },
      {
        title: "My List",
        subtitle: "Everyone who RSVP'd to your events",
        icon: "list-outline" as const,
        route: "/dashboard/attendees",
      },
      {
        title: "Analytics",
        subtitle: "View detailed insights",
        icon: "bar-chart-outline" as const,
        route: "/dashboard/analytics",
      },
      {
        title: "Revenue",
        subtitle: "Track earnings and trends",
        icon: "trending-up-outline" as const,
        route: "/dashboard/revenue",
      },
      {
        title: "Text Blast",
        subtitle: "SMS to all your contacts",
        icon: "chatbubble-outline" as const,
        route: "/dashboard/text-blast",
      },
      {
        title: "Wallet",
        subtitle: "View earnings and payouts",
        icon: "wallet-outline" as const,
        route: "/dashboard/payments",
      },
    ];
    if (user?.role === UserRole.ADMIN) {
      items.push({
        title: "Admin Panel",
        subtitle: "Manage users, events, and posts",
        icon: "shield-checkmark-outline" as const,
        route: "/admin",
      });
    }
    return items;
  }, [user?.role]);

  if (isLoading && !refreshing) {
    return (
      <View style={styles.container}>
        <DarkGradientBg />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DarkGradientBg />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
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
            tintColor="#fff"
            colors={["#fff"]}
          />
        }
      >
        {/* Status Card */}
        {walletUser && (
          <Animated.View
            entering={FadeInDown.duration(500)}
            style={styles.cardContainer}
          >
            <MembershipCard
              user={walletUser}
              onPress={() => setCardMenuVisible(true)}
            />
          </Animated.View>
        )}

        {/* Error Banner */}
        {error && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={styles.errorBanner}
          >
            <Ionicons name="warning-outline" size={20} color="#f87171" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={refetch} activeOpacity={0.7}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Menu Items */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500).springify()}
        >
          <GlassSurface
            fill="subtle"
            border="subtle"
            cornerRadius="lg"
            style={styles.menuList}
          >
            {menuItems.map((item, index) => (
              <MenuItem
                key={item.route}
                title={item.title}
                subtitle={item.subtitle}
                icon={item.icon}
                onPress={() => router.push(item.route as any)}
                isLast={index === menuItems.length - 1}
              />
            ))}
          </GlassSurface>
        </Animated.View>

        {/* Bottom spacing */}
        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>

      {/* Status Card Menu Sheet */}
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
    backgroundColor: "#000",
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
    color: "rgba(255,255,255,0.5)",
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
    color: "rgba(255,255,255,0.7)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    color: "#fff",
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  cardContainer: {
    marginHorizontal: -16,
    marginBottom: 8,
  },
  menuList: {
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  menuItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontFamily: "Lato_700Bold",
    color: "#fff",
  },
  menuItemSubtitle: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    marginTop: 2,
    color: "rgba(255,255,255,0.45)",
  },
});
