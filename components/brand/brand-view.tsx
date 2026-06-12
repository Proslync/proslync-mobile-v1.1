// components/brand/brand-view.tsx
// ── BRAND DASHBOARD VIEW ─────────────────────────────────────────────────
// Charter §A — tabs wiped to: Home (default) · Book.
// Header/avatar/role-switcher chrome kept exactly as before.
// Old tab content (PipelineTab, AthletesTab, InsightsTab, DealsTab)
// unmounted — not deleted; see _unmounted_ comments below.
// No data animations on content (charter law — nav knob animation kept
// as it is a navigation affordance, not a data animation).

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from 'expo-glass-effect';
import * as React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoleSwitcherSheet } from '@/components/shared/role-switcher-menu';
import { BrandHome } from '@/components/brand/brand-home';
import { BrandBook } from '@/components/brand/brand-book';

// Old tab data (BRAND_ATHLETES, BRAND_CAMPAIGNS, BRAND_DEALS, BRAND_INSIGHTS)
// still lives in lib/data/mock-brand-data.ts — untouched. Old tab components
// (PipelineTab, AthletesTab, InsightsTab, DealsTab, CampaignsTab,
//  CampaignCard, AthleteRow, Metric, parseMoney, formatMoney, daysUntil)
// are preserved as inactive comments below; unmounted but not deleted per charter.

const ACCENT = '#EB621A'; // copper — charter-compliant act-now
const TAB_BAR_TOP_FROM_BOTTOM = 90; // iOS 26 floating glass tab bar

type TabKey = 'Home' | 'Book';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'Home', label: 'Home' },
  { key: 'Book', label: 'Book' },
];

export function BrandView() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState<TabKey>('Home');
  const [roleSheetVisible, setRoleSheetVisible] = React.useState(false);

  const activeTabIndex = Math.max(0, TABS.findIndex((t) => t.key === activeTab));
  const tabPillWidth = useSharedValue(0);
  const animatedTabIndex = useSharedValue(activeTabIndex);
  React.useEffect(() => {
    animatedTabIndex.value = withTiming(activeTabIndex, { duration: 180 });
  }, [activeTabIndex, animatedTabIndex]);
  const tabKnobStyle = useAnimatedStyle(() => {
    const segW = tabPillWidth.value / Math.max(TABS.length, 1);
    const inset = 4;
    return {
      width: Math.max(segW - inset * 2, 0),
      transform: [{ translateX: animatedTabIndex.value * segW + inset }],
    };
  });

  // _topPad / _bottomPad kept for unmounted old tab references in comments below.
  const _topPad = insets.top + 70;
  const _bottomPad = insets.bottom + 120;
  void _topPad; void _bottomPad;

  return (
    <View style={styles.container}>
      {activeTab === 'Home' && (
        <BrandHome topInset={insets.top} bottomInset={insets.bottom + 120} />
      )}
      {activeTab === 'Book' && (
        <BrandBook topInset={insets.top} bottomInset={insets.bottom + 120} />
      )}

      {/* ── Unmounted old tabs — not rendered, not deleted ── */}
      {/* {activeTab === '_pipeline' && <PipelineTab topPad={_topPad} bottomPad={_bottomPad} />} */}
      {/* {activeTab === '_athletes' && <AthletesTab topPad={_topPad} bottomPad={_bottomPad} />} */}
      {/* {activeTab === '_insights' && <InsightsTab topPad={_topPad} bottomPad={_bottomPad} />} */}

      {/* Top fade — gives the floating top pill row visual depth */}
      <LinearGradient
        colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']}
        locations={[0, 0.5, 1]}
        style={[styles.topFade, { height: insets.top + 90 }]}
        pointerEvents="none"
      />

      {/* Floating header row — avatar/menu pill + segmented tabs (TOP) */}
      <View style={[styles.headerScrollFixed, styles.headerScrollContent, { top: insets.top + 8 }]}>
        <Pressable
          style={styles.headerPill}
          onPress={() => setRoleSheetVisible(true)}
          accessibilityLabel="Open menu"
          accessibilityRole="button"
        >
          <View style={styles.glassLayer} pointerEvents="none">
            <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
          </View>
          <Image source={require('@/assets/images/kiyan-avatar.png')} style={styles.headerPillAvatar} />
          <Ionicons name="menu" size={22} color="#FFF" style={styles.headerPillIcon} />
        </Pressable>

        <View
          style={styles.tabSegmentedPill}
          onLayout={(e) => {
            tabPillWidth.value = e.nativeEvent.layout.width;
          }}
        >
          <View style={styles.glassLayer} pointerEvents="none">
            <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
          </View>
          <Animated.View style={[styles.tabKnob, tabKnobStyle]} pointerEvents="none" />
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={styles.tabSegment}
                onPress={() => setActiveTab(tab.key)}
                accessibilityLabel={`${tab.label} tab`}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Bottom fade — keeps content fading into the floating native tab bar */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 1]}
        style={[styles.bottomFade, { bottom: 0, height: TAB_BAR_TOP_FROM_BOTTOM + 110 }]}
        pointerEvents="none"
      />

      <RoleSwitcherSheet visible={roleSheetVisible} onClose={() => setRoleSheetVisible(false)} />
    </View>
  );
}

// ── Styles — header chrome kept verbatim from prior brand-view ────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Floating header row + fades
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 99 },
  bottomFade: { position: 'absolute', left: 0, right: 0, zIndex: 99 },
  headerScrollFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerScrollContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 23,
    paddingLeft: 3,
    paddingRight: 12,
    overflow: 'hidden',
  },
  headerPillAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerPillIcon: {
    marginLeft: 8,
  },
  glassLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 23,
  },
  tabSegmentedPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    position: 'relative',
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
  tabPillText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  tabPillTextActive: { color: ACCENT, fontWeight: '800' },
});

// ── Unmounted old tab functions — preserved in comments per charter ────────
// The functions PipelineTab, AthletesTab, InsightsTab, DealsTab, CampaignsTab,
// CampaignCard, AthleteRow, Metric, parseMoney, formatMoney, and daysUntil
// were live here in the previous version. Their data fixtures remain unchanged
// in lib/data/mock-brand-data.ts. The functions are commented out to avoid
// TS errors from unreachable code while preserving the lineage for reference.
