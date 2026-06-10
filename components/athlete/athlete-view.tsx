// Athlete dashboard view. Two account modes (toggled from the hamburger menu
// via the actor context): Personal → Today / Stats / Team / Schedule;
// Professional → Today / Deals / Wallet. "Today" is the universal first tab,
// always shown regardless of account mode, and is the default selection.
// Header row = avatar+menu pill beside the segmented glass tabs.
import React, { useCallback } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from 'expo-glass-effect';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useWallet } from '@/lib/providers/wallet-provider';
import { useActorContext } from '@/lib/providers/actor-context-provider';
import { RoleSwitcherSheet } from '@/components/shared/role-switcher-menu';
import {
  StatusCardMenuSheet,
  WalletSkeleton,
} from '@/components/wallet';
import { AthleteToday } from '@/components/athlete/athlete-today';
import { AthleteStatsSection } from '@/components/athlete/athlete-stats-section';
import { AthleteTeamSection } from '@/components/athlete/athlete-team-section';
import { AthleteScheduleSection } from '@/components/athlete/athlete-schedule-section';
import { AthleteDealsSection } from '@/components/athlete/athlete-deals-section';
import { AthleteWalletSection } from '@/components/athlete/athlete-wallet-section';
import { TAB_BAR_TOP_FROM_BOTTOM } from '@/lib/navigation/constants';

const useMembershipCard = (_enabled?: boolean) => ({ data: undefined as any, isLoading: false });

// Top inset beneath the fixed pill header (tab row only)
const HEADER_OFFSET = 140;
// Base page background (matches styles.container.backgroundColor)
const PAGE_BG = '#000';

// "Today" is universal — always first, always present.
const TODAY_TAB = 'Today' as const;
// Personal account → on-court life. Professional account → NIL business.
const PERSONAL_TABS = ['Stats', 'Team', 'Schedule'] as const;
const PRO_TABS = ['Deals', 'Wallet'] as const;
type PersonalTab = (typeof PERSONAL_TABS)[number];
type ProTab = (typeof PRO_TABS)[number];
type AthleteTab = typeof TODAY_TAB | PersonalTab | ProTab;

export function AthleteView() {
  const insets = useSafeAreaInsets();
  const {
    user,
    isLoading,
    refreshWallet,
  } = useWallet();

  const [cardMenuVisible, setCardMenuVisible] = React.useState(false);
  const [roleSheetVisible, setRoleSheetVisible] = React.useState(false);
  // Default to Today (the new first tab)
  const [activeTab, setActiveTab] = React.useState<AthleteTab>(TODAY_TAB);

  // Personal vs professional account — driven by the actor-context override
  // (toggled from the hamburger menu). Defaults to personal on the dashboard.
  const { override, setOverride } = useActorContext();
  const accountMode: 'personal' | 'professional' = override ?? 'personal';
  // Build the full tab list: Today + mode-specific tabs
  const modeTabs: readonly (PersonalTab | ProTab)[] =
    accountMode === 'professional' ? PRO_TABS : PERSONAL_TABS;
  const tabs: readonly AthleteTab[] = [TODAY_TAB, ...modeTabs];

  // If the current activeTab is a mode-specific tab that no longer exists
  // after an account-mode switch, fall back to Today.
  const safeActiveTab: AthleteTab = (tabs as readonly AthleteTab[]).includes(activeTab)
    ? activeTab
    : TODAY_TAB;

  // Animated sliding knob behind the active tab (selected-item indicator).
  // `tabs.length` is now 4 (personal) or 3 (professional) — the knob width
  // math derives from this value at runtime, so no hardcoding needed.
  const tabIndex = Math.max(0, tabs.indexOf(safeActiveTab));
  const tabPillWidth = useSharedValue(0);
  const animatedTabIndex = useSharedValue(tabIndex);
  React.useEffect(() => {
    animatedTabIndex.value = withTiming(tabIndex, { duration: 180 });
  }, [tabIndex, animatedTabIndex]);
  const tabKnobStyle = useAnimatedStyle(() => {
    const segW = tabPillWidth.value / Math.max(tabs.length, 1);
    const inset = 4;
    return {
      width: Math.max(segW - inset * 2, 0),
      transform: [{ translateX: animatedTabIndex.value * segW + inset }],
    };
  });

  const { data: membershipCard, isLoading: isLoadingCard } = useMembershipCard(
    !!user?.isProfileComplete
  );

  const handleExpandQR = useCallback(() => {
    setCardMenuVisible(false);
  }, []);

  // Pull-to-refresh with haptic feedback
  const { refreshControl } = useRefreshControl({
    onRefresh: refreshWallet,
  });

  // Deep-link callback from AthleteToday — switches the parent tab
  const handleTodayNavigate = useCallback((tab: 'stats' | 'team' | 'schedule' | 'deals' | 'wallet') => {
    const map: Record<string, AthleteTab> = {
      stats: 'Stats',
      team: 'Team',
      schedule: 'Schedule',
      deals: 'Deals',
      wallet: 'Wallet',
    };
    const target = map[tab];
    if (target && (tabs as readonly AthleteTab[]).includes(target)) {
      setActiveTab(target);
    }
  }, [tabs]);

  const showSkeleton = isLoading || !user;

  // Padding for AthleteToday's own ScrollView — mirrors the outer ScrollView's
  // contentContainerStyle so content clears the fixed pill header.
  const todayTopPad = insets.top + 70;
  const todayBottomPad = TAB_BAR_TOP_FROM_BOTTOM + 110;

  return (
    <View style={styles.container}>
      {/* Floating header row — avatar/menu pill + segmented tabs (TOP) */}
      <View style={[styles.headerScrollFixed, styles.headerScrollContent, { top: insets.top + 8 }]}>
        <Pressable
          style={styles.profilePill}
          onPress={() => setRoleSheetVisible(true)}
          accessibilityLabel="Open menu"
          accessibilityRole="button"
        >
          <View style={styles.glassLayer} pointerEvents="none">
            <GlassView
              glassEffectStyle="regular"
              style={[StyleSheet.absoluteFill, { borderRadius: 23 }]}
            />
          </View>
          <Image
            source={require('@/assets/images/kiyan-avatar.png')}
            style={styles.profilePillAvatar}
          />
          <Ionicons name="menu" size={22} color="#FFF" style={{ marginLeft: 8 }} />
        </Pressable>
        <View
          style={styles.tabSegmentedPill}
          onLayout={(e) => {
            tabPillWidth.value = e.nativeEvent.layout.width;
          }}
        >
          <View style={styles.glassLayer} pointerEvents="none">
            <GlassView
              glassEffectStyle="regular"
              style={[StyleSheet.absoluteFill, { borderRadius: 23 }]}
            />
          </View>
          <Animated.View style={[styles.tabKnob, tabKnobStyle]} pointerEvents="none" />
          {tabs.map((label) => {
            const isActive = safeActiveTab === label;
            return (
              <Pressable
                key={label}
                style={styles.tabSegment}
                onPress={() => setActiveTab(label)}
                accessibilityLabel={`${label} tab`}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {showSkeleton ? (
        <WalletSkeleton topOffset={HEADER_OFFSET} />
      ) : safeActiveTab === TODAY_TAB ? (
        /* Today tab has its own inner ScrollView — renders directly in the
         * container, NOT nested inside the outer ScrollView. */
        <AthleteToday
          onNavigateTab={handleTodayNavigate}
          topPad={todayTopPad}
          bottomPad={todayBottomPad}
        />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: insets.top + 70, paddingBottom: 160, paddingHorizontal: 16, gap: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {safeActiveTab === 'Stats' && <AthleteStatsSection />}
          {safeActiveTab === 'Team' && <AthleteTeamSection />}
          {safeActiveTab === 'Schedule' && <AthleteScheduleSection />}
          {safeActiveTab === 'Deals' && <AthleteDealsSection />}
          {safeActiveTab === 'Wallet' && <AthleteWalletSection />}
        </ScrollView>
      )}

      {user && (
        <StatusCardMenuSheet
          visible={cardMenuVisible}
          onClose={() => setCardMenuVisible(false)}
          onExpandQR={handleExpandQR}
          user={user}
          pdf417Payload={membershipCard?.pdf417Payload}
          cardNumber={membershipCard?.cardNumber ?? undefined}
          isLoadingCard={isLoadingCard}
        />
      )}

      {/* Top fade — gives the floating top pill row visual depth */}
      <LinearGradient
        colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']}
        locations={[0, 0.5, 1]}
        style={[styles.topFade, { height: insets.top + 90 }]}
        pointerEvents="none"
      />

      {/* Bottom fade — keeps content fading into the floating native tab bar */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 1]}
        style={[styles.bottomFade, { bottom: 0, height: TAB_BAR_TOP_FROM_BOTTOM + 110 }]}
        pointerEvents="none"
      />

      <RoleSwitcherSheet
        visible={roleSheetVisible}
        onClose={() => setRoleSheetVisible(false)}
        accountMode={accountMode}
        onSwitchAccountMode={(m) => setOverride(m)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  headerScrollFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    flexGrow: 0,
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    zIndex: 99,
  },
  headerScrollContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    paddingLeft: 3,
    paddingRight: 12,
    borderRadius: 23,
    overflow: 'hidden',
  },
  profilePillAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  tabSegmentedPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
  },
  tabKnob: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tabSegment: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 23,
  },
  tabPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
  },
  tabPillTextActive: {
    color: '#EB621A',
    fontWeight: '800',
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99,
  },
});
