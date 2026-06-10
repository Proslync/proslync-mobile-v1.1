import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from 'expo-glass-effect';
import * as React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoleSwitcherSheet } from '@/components/shared/role-switcher-menu';

const ACCENT = '#FF6F3C';
const SCHOOL_BLUE = '#3B82F6';
const CARD_BG = 'rgba(255,255,255,0.05)';
const CARD_BORDER = 'rgba(255,255,255,0.09)';
const TAB_BAR_TOP_FROM_BOTTOM = 90;

const ROSTER = [
  { id: 'r-1', name: 'Kiyan Anthony', sport: "Men's Basketball", year: 'Freshman', tag: '#3' },
  { id: 'r-2', name: 'Donnie Freeman', sport: "Men's Basketball", year: 'Sophomore', tag: '#5' },
  { id: 'r-3', name: 'JJ Starling', sport: "Men's Basketball", year: 'Junior', tag: '#11' },
  { id: 'r-4', name: 'Leila Walker', sport: "Women's Basketball", year: 'Senior', tag: '#22' },
  { id: 'r-5', name: 'Marcus Reid', sport: 'Football', year: 'Junior', tag: '#7' },
  { id: 'r-6', name: 'Tyrese Alston', sport: 'Football', year: 'Sophomore', tag: '#44' },
];

const SCHEDULE = [
  { id: 's-1', date: 'Tonight · 7:00pm', sport: 'M Basketball', opponent: 'vs Duke', venue: 'JMA Wireless Dome' },
  { id: 's-2', date: 'Tomorrow · 1:00pm', sport: 'Football', opponent: '@ Pitt', venue: 'Acrisure Stadium' },
  { id: 's-3', date: 'Saturday · 3:00pm', sport: 'W Basketball', opponent: 'vs UNC', venue: 'JMA Wireless Dome' },
  { id: 's-4', date: 'Mar 12 · 8:00pm', sport: 'M Lacrosse', opponent: 'vs Virginia', venue: 'JMA Wireless Dome' },
];

const COMPLIANCE = [
  { id: 'c-1', label: 'NIL deals reviewed', value: '142 / 142', status: 'ok' },
  { id: 'c-2', label: 'Title IX equity', value: '92%', status: 'ok' },
  { id: 'c-3', label: 'Eligibility checks', value: '598 / 612', status: 'warn' },
  { id: 'c-4', label: 'Travel manifests', value: 'Up to date', status: 'ok' },
];

const NEWS = [
  { id: 'n-1', headline: 'Anthony drops 19 in first career start', time: '2h ago' },
  { id: 'n-2', headline: 'Cuse hoops climbs to #18 in AP poll', time: '5h ago' },
  { id: 'n-3', headline: 'New $14M practice facility breaks ground', time: '1d ago' },
  { id: 'n-4', headline: 'Athletics dept reports record FY25 revenue', time: '2d ago' },
];

type TabKey = 'team' | 'compliance' | 'news';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'team', label: 'Team' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'news', label: 'News' },
];

export function SchoolView() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState<TabKey>('team');
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

  const topPad = insets.top + 70;
  const bottomPad = insets.bottom + 120;

  return (
    <View style={styles.container}>
      {activeTab === 'team' && <TeamTab topPad={topPad} bottomPad={bottomPad} />}
      {activeTab === 'compliance' && <ComplianceTab topPad={topPad} bottomPad={bottomPad} />}
      {activeTab === 'news' && <NewsTab topPad={topPad} bottomPad={bottomPad} />}

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

function SectionHeader({ label }: { label: string }) {
  return <Text style={styles.sectionHeader}>{label}</Text>;
}

function TeamTab({ topPad, bottomPad }: { topPad: number; bottomPad: number }) {
  const [subTab, setSubTab] = React.useState<'roster' | 'schedule'>('roster');
  const SUB_TABS = [
    { key: 'roster', label: 'Roster', count: ROSTER.length },
    { key: 'schedule', label: 'Schedule', count: SCHEDULE.length },
  ] as const;

  const subIndex = Math.max(0, SUB_TABS.findIndex((t) => t.key === subTab));
  const subPillWidth = useSharedValue(0);
  const animatedSubIndex = useSharedValue(subIndex);
  React.useEffect(() => {
    animatedSubIndex.value = withTiming(subIndex, { duration: 180 });
  }, [subIndex, animatedSubIndex]);
  const subKnobStyle = useAnimatedStyle(() => {
    const segW = subPillWidth.value / Math.max(SUB_TABS.length, 1);
    const inset = 4;
    return {
      width: Math.max(segW - inset * 2, 0),
      transform: [{ translateX: animatedSubIndex.value * segW + inset }],
    };
  });

  return (
    <View style={{ flex: 1, paddingTop: topPad }}>
      <View
        style={styles.subTabsRow}
        onLayout={(e) => {
          subPillWidth.value = e.nativeEvent.layout.width;
        }}
      >
        <View style={styles.glassLayer} pointerEvents="none">
          <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
        </View>
        <Animated.View style={[styles.tabKnob, subKnobStyle]} pointerEvents="none" />
        {SUB_TABS.map(({ key, label, count }) => {
          const isActive = subTab === key;
          return (
            <Pressable
              key={key}
              style={styles.subTab}
              onPress={() => setSubTab(key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.subTabLabel, isActive && styles.subTabLabelActive]}>
                {label}
              </Text>
              <View style={[styles.subTabBadge, isActive && styles.subTabBadgeActive]}>
                <Text style={[styles.subTabBadgeText, isActive && styles.subTabBadgeTextActive]}>
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {subTab === 'roster' && <RosterTab bottomPad={bottomPad} />}
      {subTab === 'schedule' && <ScheduleTab bottomPad={bottomPad} />}
    </View>
  );
}

function RosterTab({ bottomPad }: { bottomPad: number }) {
  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <SectionHeader label="ATHLETES" />
      <View style={styles.card}>
        {ROSTER.map((r, i) => (
          <Animated.View
            key={r.id}
            entering={FadeInDown.delay(i * 40).duration(360)}
            style={[styles.row, i !== ROSTER.length - 1 && styles.rowDivider]}
          >
            <View style={styles.avatarChip}>
              <Text style={styles.avatarChipText}>{r.name.split(' ').map((p) => p[0]).join('')}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{r.name}</Text>
              <Text style={styles.rowMeta}>{r.sport} · {r.year}</Text>
            </View>
            <Text style={styles.rowTag}>{r.tag}</Text>
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  );
}

function ScheduleTab({ bottomPad }: { bottomPad: number }) {
  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <SectionHeader label="UPCOMING" />
      <View style={styles.card}>
        {SCHEDULE.map((g, i) => (
          <Animated.View
            key={g.id}
            entering={FadeInDown.delay(i * 40).duration(360)}
            style={[styles.row, i !== SCHEDULE.length - 1 && styles.rowDivider]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{g.sport} · {g.opponent}</Text>
              <Text style={styles.rowMeta}>{g.date} · {g.venue}</Text>
            </View>
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  );
}

function ComplianceTab({ topPad, bottomPad }: { topPad: number; bottomPad: number }) {
  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingTop: topPad, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <SectionHeader label="NCAA · TITLE IX" />
      <View style={styles.card}>
        {COMPLIANCE.map((c, i) => (
          <Animated.View
            key={c.id}
            entering={FadeInDown.delay(i * 40).duration(360)}
            style={[styles.row, i !== COMPLIANCE.length - 1 && styles.rowDivider]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{c.label}</Text>
              <Text style={[styles.rowMeta, { color: c.status === 'warn' ? '#FFB020' : '#34C759' }]}>{c.value}</Text>
            </View>
            <Ionicons
              name={c.status === 'warn' ? 'warning' : 'checkmark-circle'}
              size={18}
              color={c.status === 'warn' ? '#FFB020' : '#34C759'}
            />
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  );
}

function NewsTab({ topPad, bottomPad }: { topPad: number; bottomPad: number }) {
  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingTop: topPad, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <SectionHeader label="LATEST" />
      <View style={styles.card}>
        {NEWS.map((n, i) => (
          <Animated.View
            key={n.id}
            entering={FadeInDown.delay(i * 40).duration(360)}
            style={[styles.row, i !== NEWS.length - 1 && styles.rowDivider]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{n.headline}</Text>
              <Text style={styles.rowMeta}>{n.time}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Sub-tab pill switcher (Roster | Schedule inside Team tab) — glass pill
  subTabsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    position: 'relative',
  },
  subTab: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  subTabLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.55)' },
  subTabLabelActive: { color: '#FFF' },
  subTabBadge: {
    minWidth: 20,
    height: 18,
    paddingHorizontal: 6,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  subTabBadgeActive: { backgroundColor: ACCENT },
  subTabBadgeText: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.6)' },
  subTabBadgeTextActive: { color: '#FFF' },

  scrollContent: { paddingHorizontal: 16, paddingTop: 4 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: ACCENT,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 8,
  },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowTitle: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  rowMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 },
  rowTag: { color: SCHOOL_BLUE, fontSize: 12, fontWeight: '700' },
  avatarChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(59,130,246,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarChipText: { color: SCHOOL_BLUE, fontSize: 12, fontWeight: '700' },

  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 99 },
  bottomFade: { position: 'absolute', left: 0, right: 0, zIndex: 99 },

  // Floating header row — profile pill + segmented tabs (matches player activity)
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
  tabPillText: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.55)' },
  tabPillTextActive: { color: '#FF6F3C', fontWeight: '800' },
});
