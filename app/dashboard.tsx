import { useStableRouter } from "@/hooks/use-stable-router";
import { useAuth } from "@/lib/providers/auth-provider";
import { useWallet } from "@/lib/providers/wallet-provider";
import { UserRole } from "@/lib/types/auth.types";
import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";
import { DarkGradientBg } from "@/components/shared/dark-gradient-bg";
import { glassBorder, glassText } from "@/constants/glass/liquid-glass";
import * as React from "react";
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
import { MembershipCard, StatusCardMenuSheet } from "@/components/wallet";

const TAB_BAR_TOP_FROM_BOTTOM = 90; // iOS 26 floating glass tab bar — top edge from screen bottom (incl. safe area)

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
  onPress,
}: {
  item: MenuItemData;
  isLast: boolean;
  t: (typeof glassText)[keyof typeof glassText];
  border: string;
  onPress: () => void;
}) {
  return (
    <>
      <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.menuItemIcon, { backgroundColor: "rgba(0,0,0,0.05)" }]}>
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
  onItemPress,
}: {
  title: string;
  items: MenuItemData[];
  delay: number;
  t: (typeof glassText)[keyof typeof glassText];
  border: string;
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
  const { user, isLoading } = useAuth();
  const { user: walletUser } = useWallet();
  const [cardMenuVisible, setCardMenuVisible] = React.useState(false);

  const t = glassText["light"];
  const border = glassBorder["light"];

  const handleNav = React.useCallback(
    (route: string) => router.push(route as any),
    [router],
  );

  // Grouped menu items — NIL athlete-focused
  const dealItems: MenuItemData[] = [
    { title: "My Deals", subtitle: "Active contracts and deliverables", icon: "flash-outline", route: "/dashboard/my-deals" },
    { title: "Offer Inbox", subtitle: "New brand offers waiting for review", icon: "mail-unread-outline", route: "/dashboard/offers" },
    { title: "Brand Matches", subtitle: "Open deals matched to your profile", icon: "sparkles-outline", route: "/dashboard/matches" },
    { title: "Contracts & Docs", subtitle: "Signed agreements, W-9s, disclosures", icon: "document-text-outline", route: "/dashboard/documents" },
  ];

  const performanceItems: MenuItemData[] = [
    { title: "Brand Impact Score", subtitle: "Live valuation · sentiment · reach", icon: "analytics-outline", route: "/dashboard/impact" },
    { title: "Audience Insights", subtitle: "Followers, demographics, top cities", icon: "people-outline", route: "/dashboard/audience" },
    { title: "On-Court Stats", subtitle: "Season averages vs ACC frosh guards", icon: "basketball-outline", route: "/dashboard/stats" },
    { title: "Award Watch", subtitle: "ACC FOY, Wayman Tisdale, Jerry West", icon: "trophy-outline", route: "/dashboard/awards" },
  ];

  const businessItems: MenuItemData[] = [
    { title: "Earnings", subtitle: "YTD payouts + upcoming invoices", icon: "trending-up-outline", route: "/dashboard/earnings" },
    { title: "Payouts & Wallet", subtitle: "Stripe Connect · tax forms", icon: "wallet-outline", route: "/dashboard/payments" },
    { title: "Merch Storefront", subtitle: "Drops, inventory, fulfillment", icon: "shirt-outline", route: "/dashboard/merch" },
    { title: "Appearance Calendar", subtitle: "Bookings, cameos, signings", icon: "calendar-outline", route: "/dashboard/calendar" },
  ];

  const toolsItems: MenuItemData[] = [
    { title: "Content Manager", subtitle: "Schedule posts across IG / TikTok / X", icon: "images-outline", route: "/dashboard/content" },
    { title: "Fan Messaging", subtitle: "Broadcast SMS + premium subscribers", icon: "chatbubble-outline", route: "/dashboard/text-blast" },
    { title: "Compliance Center", subtitle: "NCAA + school pre-approvals", icon: "shield-checkmark-outline", route: "/dashboard/compliance" },
    { title: "Agent & Team", subtitle: "Rich Paul · Klutch · legal", icon: "briefcase-outline", route: "/dashboard/team" },
  ];

  const adminItems: MenuItemData[] = user?.role === UserRole.ADMIN
    ? [{ title: "Admin Panel", subtitle: "Manage users, events, and posts", icon: "shield-checkmark-outline", route: "/admin" }]
    : [];

  if (isLoading) {
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

      {/* Header — centered title; back action moved to floating bottom toolbar */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <Text style={[styles.headerTitle, { color: t.primary }]}>Dashboard</Text>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        {walletUser && (
          <Animated.View entering={FadeInDown.duration(500)} style={styles.cardContainer}>
            <MembershipCard user={walletUser} onPress={() => setCardMenuVisible(true)} />
          </Animated.View>
        )}

        {/* Menu Groups */}
        <MenuGroup title="DEALS" items={dealItems} delay={100} t={t} border={border} onItemPress={handleNav} />
        <MenuGroup title="PERFORMANCE" items={performanceItems} delay={200} t={t} border={border} onItemPress={handleNav} />
        <MenuGroup title="BUSINESS" items={businessItems} delay={300} t={t} border={border} onItemPress={handleNav} />
        <MenuGroup title="TOOLS" items={toolsItems} delay={400} t={t} border={border} onItemPress={handleNav} />
        {adminItems.length > 0 && (
          <MenuGroup title="ADMIN" items={adminItems} delay={500} t={t} border={border} onItemPress={handleNav} />
        )}

        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>

      {/* Floating bottom toolbar — back | dashboard | live */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.06)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 1]}
        style={[styles.bottomFade, { bottom: 0, height: TAB_BAR_TOP_FROM_BOTTOM + 80 }]}
        pointerEvents="none"
      />
      <View style={[styles.bottomToolbar, { bottom: TAB_BAR_TOP_FROM_BOTTOM + 10 }]}>
        <Pressable
          style={styles.toolbarCircle}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/');
          }}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
          <Ionicons name="chevron-back" size={20} color="#FFF" />
        </Pressable>

        <Pressable
          style={styles.toolbarPill}
          onPress={() => {}}
          accessibilityLabel="Dashboard"
          accessibilityRole="button"
        >
          <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
          <Text style={styles.toolbarPillText}>Dashboard</Text>
        </Pressable>

        <Pressable
          style={styles.toolbarCircle}
          onPress={() => {}}
          accessibilityLabel="Go live"
          accessibilityRole="button"
        >
          <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
          <Ionicons name="radio" size={22} color="#FF4444" />
        </Pressable>
      </View>

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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
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
  },
  menuItemSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginLeft: 62,
  },

  bottomToolbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 100,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99,
  },
  toolbarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarPill: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarPillText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
