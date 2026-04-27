import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStableRouter } from '@/hooks/use-stable-router';
import { RoleSwitcherSheet } from '@/components/shared/role-switcher-menu';

const ACCENT = '#FF6F3C';
const SCHOOL_BLUE = '#3B82F6';
const TAB_BAR_TOP_FROM_BOTTOM = 90;

const SCHOOL = {
  username: 'syracuse',
  name: 'Syracuse University',
  metaPrimary: 'Athletics Department',
  metaSecondary: 'Syracuse, NY · ACC',
  about: [
    {
      key: 'mission',
      title: 'Mission',
      body: 'Develop student-athletes who win on the court and in the classroom. 20 NCAA Division I programs, 612 athletes, 40+ team championships.',
    },
    {
      key: 'history',
      title: 'History',
      body: 'Founded 1870. Big East charter member; ACC since 2013. Home of the JMA Wireless Dome — 49,000 capacity, the largest on-campus structure in the world for college basketball.',
    },
    {
      key: 'compliance',
      title: 'Compliance',
      body: 'NCAA Division I · Title IX score 92%. NIL Office reviews every deal. Full eligibility, travel, and academic monitoring across all 20 sports.',
    },
  ],
  highlights: [
    { key: 'rev', label: 'Athletics revenue', value: '$142M FY25' },
    { key: 'champs', label: 'Team championships', value: '40+' },
    { key: 'enroll', label: 'Student-athletes', value: '612' },
    { key: 'sports', label: 'D-I programs', value: '20' },
  ],
};

type TabKey = 'about' | 'highlights';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'about', label: 'About' },
  { key: 'highlights', label: 'Highlights' },
];

export default function SchoolProfile() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const [tab, setTab] = React.useState<TabKey>('about');
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set(['mission']));
  const [isEditing, setIsEditing] = React.useState(false);
  const [roleSheetVisible, setRoleSheetVisible] = React.useState(false);

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={[styles.bannerWrap, { height: insets.top + 140 }]} pointerEvents="none">
          <LinearGradient
            colors={['rgba(59,130,246,0.35)', 'rgba(59,130,246,0.10)', 'rgba(0,0,0,0.85)', '#000']}
            locations={[0, 0.4, 0.85, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Profile row */}
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Ionicons name="school" size={36} color={SCHOOL_BLUE} />
          </View>
          <View style={styles.rightCol}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{SCHOOL.name}</Text>
              <MaterialCommunityIcons name="check-decagram" size={15} color={SCHOOL_BLUE} />
            </View>
            <Text style={[styles.metaLine, styles.metaLinePrimary]} numberOfLines={1}>
              {SCHOOL.metaPrimary}
            </Text>
            <Text style={styles.metaLine} numberOfLines={1}>
              {SCHOOL.metaSecondary}
            </Text>
          </View>
        </View>

        {/* Tab row */}
        <View style={styles.tabsRow}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setTab(t.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.tabContent}>
          {tab === 'about' && (
            <View style={styles.aboutSection}>
              {SCHOOL.about.map((section) => {
                const isOpen = expanded.has(section.key);
                return (
                  <View key={section.key} style={styles.bioItem}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => toggle(section.key)}
                      style={styles.bioHeader}
                    >
                      <Text style={styles.bioTitle}>{section.title}</Text>
                      <Ionicons
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="rgba(255,255,255,0.6)"
                      />
                    </TouchableOpacity>
                    {isOpen && <Text style={styles.bioBody}>{section.body}</Text>}
                  </View>
                );
              })}
            </View>
          )}

          {tab === 'highlights' && (
            <View style={styles.listSection}>
              <View style={styles.card}>
                {SCHOOL.highlights.map((h, i) => (
                  <Animated.View
                    key={h.key}
                    entering={FadeInDown.delay(i * 60).duration(400)}
                    style={[styles.row, i !== SCHOOL.highlights.length - 1 && styles.rowDivider]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{h.label}</Text>
                    </View>
                    <Text style={styles.rowValue}>{h.value}</Text>
                  </Animated.View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom darken gradient */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 1]}
        style={[styles.bottomFade, { bottom: 0, height: TAB_BAR_TOP_FROM_BOTTOM + 170 }]}
        pointerEvents="none"
      />

      {/* Floating bottom toolbar */}
      <View style={[styles.bottomToolbar, { bottom: TAB_BAR_TOP_FROM_BOTTOM + 10 }]}>
        <Pressable
          style={styles.toolbarCircle}
          onPress={() => setRoleSheetVisible(true)}
          accessibilityLabel="Switch role"
          accessibilityRole="button"
        >
          <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
          <Ionicons name="menu" size={22} color="#FFF" />
        </Pressable>

        <Pressable
          style={[styles.toolbarPill, isEditing && styles.toolbarPillActive]}
          onPress={() => setIsEditing((v) => !v)}
          accessibilityLabel={isEditing ? 'Save profile changes' : 'Edit profile'}
          accessibilityRole="button"
        >
          <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
          <Text style={styles.toolbarPillText}>{isEditing ? 'Save' : 'Edit Profile'}</Text>
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

      <RoleSwitcherSheet visible={roleSheetVisible} onClose={() => setRoleSheetVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topUsername: { fontSize: 17, fontWeight: '600', color: '#FFF', letterSpacing: -0.2 },

  bannerWrap: { width: '100%', overflow: 'hidden', backgroundColor: '#0a1929' },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    marginTop: -140,
    marginBottom: 5,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(59,130,246,0.16)',
    borderWidth: 3,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightCol: { flex: 1, marginLeft: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  metaLine: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
    letterSpacing: -0.1,
    lineHeight: 18,
  },
  metaLinePrimary: { color: '#FFF', fontWeight: '700' },

  tabsRow: { flexDirection: 'row', marginTop: 6, marginBottom: 10, paddingHorizontal: 4 },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: ACCENT },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: -0.1,
  },
  tabLabelActive: { color: ACCENT, fontWeight: '700' },

  tabContent: {},
  aboutSection: { paddingHorizontal: 16, paddingVertical: 20, gap: 12 },
  listSection: { paddingHorizontal: 16, paddingVertical: 20, gap: 12 },

  bioItem: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 10,
    paddingBottom: 2,
    gap: 8,
  },
  bioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bioTitle: { fontSize: 15, color: '#FFF', fontWeight: '600' },
  bioBody: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    letterSpacing: -0.1,
  },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowTitle: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  rowValue: { color: SCHOOL_BLUE, fontSize: 14, fontWeight: '700' },

  bottomFade: { position: 'absolute', left: 0, right: 0, zIndex: 99 },

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
    gap: 8,
  },
  toolbarPillActive: {},
  toolbarPillText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
