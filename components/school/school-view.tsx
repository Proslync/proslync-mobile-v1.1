// components/school/school-view.tsx
// ── SCHOOL / AD DASHBOARD ──────────────────────────────────────────────────
// Charter §A — tabs wiped to ['Home', 'Vault'].
// Header/avatar/role-switcher chrome preserved.
// Old Team/Compliance/News tab content is UNMOUNTED (functions kept below,
// not rendered). Old imports for fixtures kept; unused vars prefixed with _.

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

// Charter §A: new home + vault tabs
import { SchoolHome } from '@/components/school/school-home';
import { SchoolVault } from '@/components/school/school-vault';

// ── Kept (unmounted) fixtures — DO NOT DELETE ──────────────────────────────
// These were used by old Team/Compliance/News tabs. Prefixed _ to silence TS.
const _ROSTER = [
  { id: 'r-1', name: 'Kiyan Anthony',  sport: "Men's Basketball",   year: 'Freshman',  tag: '#3'  },
  { id: 'r-2', name: 'Donnie Freeman', sport: "Men's Basketball",   year: 'Sophomore', tag: '#5'  },
  { id: 'r-3', name: 'JJ Starling',    sport: "Men's Basketball",   year: 'Junior',    tag: '#11' },
  { id: 'r-4', name: 'Leila Walker',   sport: "Women's Basketball", year: 'Senior',    tag: '#22' },
  { id: 'r-5', name: 'Marcus Reid',    sport: 'Football',           year: 'Junior',    tag: '#7'  },
  { id: 'r-6', name: 'Tyrese Alston',  sport: 'Football',           year: 'Sophomore', tag: '#44' },
];

const _SCHEDULE = [
  { id: 's-1', date: 'Tonight · 7:00pm',  sport: 'M Basketball', opponent: 'vs Duke',     venue: 'JMA Wireless Dome' },
  { id: 's-2', date: 'Tomorrow · 1:00pm', sport: 'Football',     opponent: '@ Pitt',      venue: 'Acrisure Stadium'  },
  { id: 's-3', date: 'Saturday · 3:00pm', sport: 'W Basketball', opponent: 'vs UNC',      venue: 'JMA Wireless Dome' },
  { id: 's-4', date: 'Mar 12 · 8:00pm',   sport: 'M Lacrosse',   opponent: 'vs Virginia', venue: 'JMA Wireless Dome' },
];

const _COMPLIANCE = [
  { id: 'c-1', label: 'NIL deals reviewed',   value: '142 / 142',  status: 'ok'   },
  { id: 'c-2', label: 'Title IX equity',       value: '92%',        status: 'ok'   },
  { id: 'c-3', label: 'Eligibility checks',    value: '598 / 612',  status: 'warn' },
  { id: 'c-4', label: 'Travel manifests',      value: 'Up to date', status: 'ok'   },
];

const _NEWS = [
  { id: 'n-1', headline: 'Anthony drops 19 in first career start',    time: '2h ago' },
  { id: 'n-2', headline: 'Cuse hoops climbs to #18 in AP poll',       time: '5h ago' },
  { id: 'n-3', headline: 'New $14M practice facility breaks ground',  time: '1d ago' },
  { id: 'n-4', headline: 'Athletics dept reports record FY25 revenue', time: '2d ago' },
];
// ── End kept fixtures ──────────────────────────────────────────────────────

const _ACCENT = '#FF6F3C';
const _SCHOOL_BLUE = '#3B82F6';
const TAB_BAR_TOP_FROM_BOTTOM = 90;

// Charter §A: two tabs only
type TabKey = 'home' | 'vault';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'home',  label: 'Home'  },
  { key: 'vault', label: 'Vault' },
];

export function SchoolView() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState<TabKey>('home');
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

  return (
    <View style={styles.container}>
      {/* Tab content — charter: Home + Vault only */}
      {activeTab === 'home'  && <SchoolHome  topInset={insets.top} bottomInset={insets.bottom} />}
      {activeTab === 'vault' && <SchoolVault topInset={insets.top} bottomInset={insets.bottom} />}

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

// ============================================================
// Unmounted tab content — kept for reference, NOT rendered.
// Old TeamTab / ComplianceTab / NewsTab removed from active
// render; their underlying data fixtures live in _ prefixed
// constants above. Do NOT delete.
// ============================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 99 },
  bottomFade: { position: 'absolute', left: 0, right: 0, zIndex: 99 },

  // Floating header row — profile pill + segmented tabs
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
  headerPillAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerPillIcon: { marginLeft: 8 },
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
  },
  tabSegment: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabKnob: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tabPillText:       { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.55)' },
  tabPillTextActive: { color: '#EB621A', fontWeight: '800' },
});
