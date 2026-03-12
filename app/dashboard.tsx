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

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  subtitle?: string;
  colors: {
    cardElevated: string;
    textSecondary: string;
    text: string;
    textTertiary: string;
  };
}

function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
  colors,
}: StatCardProps) {
  return (
    <View
      style={[
        styles.statCard,
        { borderLeftColor: color, backgroundColor: colors.cardElevated },
      ]}
    >
      <View style={styles.statCardHeader}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={[styles.statCardTitle, { color: colors.textSecondary }]}>
          {title}
        </Text>
      </View>
      <Text style={[styles.statCardValue, { color: colors.text }]}>
        {value}
      </Text>
      {subtitle && (
        <Text style={[styles.statCardSubtitle, { color: colors.textTertiary }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

interface MenuItemProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  colors: {
    text: string;
    textSecondary: string;
    iconSecondary: string;
    cardElevated: string;
    border: string;
  };
}

function MenuItem({ title, subtitle, icon, onPress, colors }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[styles.menuItemIcon, { backgroundColor: colors.cardElevated }]}
      >
        <Ionicons name={icon} size={22} color={colors.text} />
      </View>
      <View style={styles.menuItemContent}>
        <Text style={[styles.menuItemTitle, { color: colors.text }]}>
          {title}
        </Text>
        <Text
          style={[styles.menuItemSubtitle, { color: colors.textSecondary }]}
        >
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.iconSecondary} />
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { user, isLoading: authLoading } = useAuth();
  const {
    stats,
    isLoading: statsLoading,
    error,
    refetch,
  } = useDashboard();
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

  if (isLoading && !refreshing) {
    return (
      <View
        style={[
          styles.container,
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.text} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Dashboard
        </Text>
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
            tintColor={colors.text}
            colors={[colors.text]}
          />
        }
      >
        {/* Status Card */}
        {walletUser && (
          <Animated.View entering={FadeInDown.duration(500)} style={styles.cardContainer}>
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
              <Text style={[styles.retryText, { color: colors.buttonPrimary }]}>
                Retry
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Menu Items */}
        <Animated.View
          entering={FadeInDown.delay(200)
            .duration(500)
            .springify()}
          style={styles.section}
        >
          <View
            style={[styles.menuList, { backgroundColor: colors.cardElevated }]}
          >
            <MenuItem
              title="Create Event"
              subtitle="Set up a new event"
              icon="add-circle-outline"
              onPress={() => router.push("/create-event")}
              colors={colors}
            />
            <MenuItem
              title="My Events"
              subtitle="View and edit your events"
              icon="calendar-outline"
              onPress={() => router.push("/my-events")}
              colors={colors}
            />
            <MenuItem
              title="My Venues"
              subtitle="Manage your venues"
              icon="business-outline"
              onPress={() => router.push("/my-venues")}
              colors={colors}
            />
            <MenuItem
              title="My List"
              subtitle="Everyone who RSVP'd to your events"
              icon="list-outline"
              onPress={() => router.push("/dashboard/attendees")}
              colors={colors}
            />
            <MenuItem
              title="Analytics"
              subtitle="View detailed insights"
              icon="bar-chart-outline"
              onPress={() => router.push("/dashboard/analytics")}
              colors={colors}
            />
            <MenuItem
              title="Revenue"
              subtitle="Track earnings and trends"
              icon="trending-up-outline"
              onPress={() => router.push("/dashboard/revenue")}
              colors={colors}
            />
            <MenuItem
              title="Text Blast"
              subtitle="SMS to all your contacts"
              icon="chatbubble-outline"
              onPress={() => router.push("/dashboard/text-blast")}
              colors={colors}
            />
            <MenuItem
              title="Wallet"
              subtitle="View earnings and payouts"
              icon="wallet-outline"
              onPress={() => router.push("/dashboard/payments")}
              colors={colors}
            />
            {user?.role === UserRole.ADMIN && (
              <MenuItem
                title="Admin Panel"
                subtitle="Manage users, events, and posts"
                icon="shield-checkmark-outline"
                onPress={() => router.push("/admin")}
                colors={colors}
              />
            )}
          </View>
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
  },
  loadingContainer: {
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
    borderRadius: 8,
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
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
  },
  statCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  statCardTitle: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
  },
  statCardValue: {
    fontSize: 28,
    fontFamily: "Lato_700Bold",
  },
  statCardSubtitle: {
    fontSize: 12,
    fontFamily: "Lato_400Regular",
    marginTop: 4,
  },
  cardContainer: {
    marginHorizontal: -16,
    marginBottom: 8,
  },
  section: {
    marginBottom: 24,
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
