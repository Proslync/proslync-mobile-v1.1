// Athlete dashboard view. Fixed tabs: Home (default) · Deals · Wallet.
// Charter §A — one athlete = one business. No account-mode split.
// Stats/Team/Schedule section components remain in the repo but are UNMOUNTED
// (files not deleted). RoleSwitcherSheet + actor-context untouched (they
// control other things beyond tab routing).
import React, { useCallback } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from 'expo-glass-effect';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
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
import { AthleteDealsSection } from '@/components/athlete/athlete-deals-section';
import { AthleteWalletSection } from '@/components/athlete/athlete-wallet-section';
import { AthleteHome } from '@/components/athlete/athlete-home';
import { TAB_BAR_TOP_FROM_BOTTOM } from '@/lib/navigation/constants';

// Stats/Team/Schedule files remain in repo. Imports commented so the files
// are not tree-shaken away; they simply aren't rendered (charter §A).
// import { AthleteStatsSection } from '@/components/athlete/athlete-stats-section';
// import { AthleteTeamSection } from '@/components/athlete/athlete-team-section';
// import { AthleteScheduleSection } from '@/components/athlete/athlete-schedule-section';

const useMembershipCard = (_enabled?: boolean) => ({ data: undefined as any, isLoading: false });

// Top inset beneath the fixed pill header (tab row only)
const HEADER_OFFSET = 140;
// Base page background
const PAGE_BG = '#000';

// Charter §A: fixed tabs — no account-mode split.
const ATHLETE_TABS = ['Home', 'Deals', 'Wallet'] as const;
type AthleteTab = (typeof ATHLETE_TABS)[number];

export function AthleteView() {
  const insets = useSafeAreaInsets();
  const {
    user,
    isLoading,
    refreshWallet,
  } = useWallet();

  const [cardMenuVisible, setCardMenuVisible] = React.useState(false);
  const [roleSheetVisible, setRoleSheetVisible] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<AthleteTab>('Home');

  // Actor context kept — RoleSwitcherSheet uses it for role display and
  // other surfaces that read the override beyond tab routing.
  const { override: _override, setOverride: _setOverride } = useActorContext();

  // Animated sliding knob — same math as before, now always 3 tabs.
  const tabIndex = Math.max(0, ATHLETE_TABS.indexOf(activeTab));
  const tabPillWidth = useSharedValue(0);
  const animatedTabIndex = useSharedValue(tabIndex);
  React.useEffect(() => {
    animatedTabIndex.value = withTiming(tabIndex, { duration: 180 });
  }, [tabIndex, animatedTabIndex]);
  const tabKnobStyle = useAnimatedStyle(() => {
    const segW = tabPillWidth.value / ATHLETE_TABS.length;
    const inset = 4;
    return {
      width: Math.max(segW - inset * 2, 0),
      transform: [{ translateX: animatedTabIndex.value * segW + inset }],
    };
  });

  // Floating-pill collapse — shrinks on scroll-down, grows on scroll-up
  // (identical to the profile's Kit/Posts/Merch pill).
  const tabsLastScrollY = useSharedValue(0);
  const tabsCollapsed = useSharedValue(0);
  const onAthleteScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      const y = e.contentOffset.y;
      const dy = y - tabsLastScrollY.value;
      if (dy > 1.5 && y > 30) {
        tabsCollapsed.value = withTiming(1, { duration: 200 });
      } else if (dy < -1.5) {
        tabsCollapsed.value = withTiming(0, { duration: 200 });
      }
      tabsLastScrollY.value = y;
    },
  });
  const floatingTabsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(tabsCollapsed.value, [0, 1], [1, 0.8]) }],
    opacity: interpolate(tabsCollapsed.value, [0, 1], [1, 0.85]),
  }));

  const { data: membershipCard, isLoading: isLoadingCard } = useMembershipCard(
    !!user?.isProfileComplete
  );

  const handleExpandQR = useCallback(() => {
    setCardMenuVisible(false);
  }, []);

  // Pull-to-refresh — meaningful on Deals/Wallet; Home uses focus-effect.
  const { refreshControl } = useRefreshControl({
    onRefresh: refreshWallet,
  });

  const showSkeleton = isLoading || !user;

  return (
    <View style={styles.container}>
      {/* Floating segmented tabs — hovers above the bottom nav, matches the
          profile's Kit/Posts/Merch pill (size + position) */}
      <View
        style={[styles.floatingTabsWrap, { bottom: insets.bottom + 14 }]}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[styles.tabSegmentedPill, floatingTabsStyle]}
          onLayout={(e) => {
            tabPillWidth.value = e.nativeEvent.layout.width;
          }}
        >
          <View style={styles.glassLayer} pointerEvents="none">
            <GlassView
              glassEffectStyle="regular"
              style={[StyleSheet.absoluteFill, { borderRadius: 21 }]}
            />
          </View>
          <Animated.View style={[styles.tabKnob, tabKnobStyle]} pointerEvents="none" />
          {ATHLETE_TABS.map((label) => {
            const isActive = activeTab === label;
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
        </Animated.View>
      </View>

      {showSkeleton ? (
        <WalletSkeleton topOffset={HEADER_OFFSET} />
      ) : (
        <>
          {activeTab === 'Home' && (
            <View style={{ flex: 1, paddingTop: insets.top + 16 }}>
              <AthleteHome
                onNavigateToDeals={() => setActiveTab('Deals')}
                onScroll={onAthleteScroll}
                scrollEventThrottle={16}
              />
            </View>
          )}
          {activeTab === 'Deals' && (
            <Animated.ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 160, paddingHorizontal: 16, gap: 16 }}
              showsVerticalScrollIndicator={false}
              refreshControl={refreshControl}
              onScroll={onAthleteScroll}
              scrollEventThrottle={16}
            >
              <AthleteDealsSection />
            </Animated.ScrollView>
          )}
          {activeTab === 'Wallet' && (
            <Animated.ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 160, paddingHorizontal: 16, gap: 16 }}
              showsVerticalScrollIndicator={false}
              refreshControl={refreshControl}
              onScroll={onAthleteScroll}
              scrollEventThrottle={16}
            >
              <AthleteWalletSection />
            </Animated.ScrollView>
          )}
        </>
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
        style={[styles.topFade, { height: insets.top + 28 }]}
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
        accountMode="professional"
        onSwitchAccountMode={(_m) => {}}
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
  floatingTabsWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  tabSegmentedPill: {
    width: 240,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 21,
    overflow: 'hidden',
  },
  tabKnob: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    borderRadius: 18,
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
    borderRadius: 21,
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
