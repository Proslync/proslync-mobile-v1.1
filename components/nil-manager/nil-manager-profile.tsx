// PR-3 (nav-restoration 2026-05-11): NIL Manager profile screen.
//
// Until now, profile.tsx routed role=nilManager to <SchoolProfile />, so
// the NIL Manager persona inherited school-tinted chrome, school name +
// stats, and a cabinet whose verbs were wrong ([Go live] for an AD, not
// for a compliance reviewer). This file is the NIL-tuned mirror: same
// chassis as school-profile.tsx (banner / profile row / segmented tabs /
// ProfileSecondaryCabinet) but with NIL-domain content and verbs.
//
// Cabinet verbs (NIL-tuned): [☰ Switch role] [Edit Profile] [+ Disclosure]
//   — left circle preserves Arshia's role-switcher gesture
//   — right circle is the NIL Manager's primary verb (open a new disclosure)
//
// Source spec: research-plane/nav-restoration/2026-05-11-inventory.md PR-3

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeedNavBar } from '@/components/feed/feed-nav-bar';
import { useStableRouter } from '@/hooks/use-stable-router';

// NIL Manager accent — deep navy, matches the role-switcher menu entry
// (`color: '#001A57'`) and the proslync-role-accents-application skill's
// "nil-manager-admin" persona. Distinct from the school's #3B82F6 blue so
// users can see at a glance which surface they're on.
const ACCENT = '#EB621A';
const NIL_NAVY = '#001A57';
const NIL_NAVY_SOFT = 'rgba(0,26,87,0.16)';

const NIL_MANAGER = {
  username: 'syracuse-compliance',
  name: 'Syracuse · NIL Office',
  metaPrimary: 'Compliance · Mrs. Wilson',
  metaSecondary: 'NIL Manager · view-only roster + deals',
  about: [
    {
      key: 'scope',
      title: 'Scope',
      body: 'Review every NIL disclosure submitted by Syracuse student-athletes. Track NCAA, school, and ethics review status independently. Flag deals for follow-up; escalate to the AD.',
    },
    {
      key: 'consent',
      title: 'Consent posture',
      body: 'Per-athlete consent levels (full / summary / withheld) gate what this surface can see about each athlete’s deals. Withheld athletes appear in the roster as initials only, with no deal detail.',
    },
    {
      key: 'authority',
      title: 'Authority',
      body: 'NIL Office is advisory to the AD. Approvals route through the school’s compliance chair; this surface does not unilaterally approve or reject deals. Audit trail is preserved on every action.',
    },
  ],
  workload: [
    { key: 'queue', label: 'Deals in review', value: '12' },
    { key: 'critical', label: 'Critical flags', value: '2' },
    { key: 'disclosed', label: 'Disclosed FY26', value: '184' },
    { key: 'sla', label: 'Median review time', value: '36h' },
  ],
};

type TabKey = 'about' | 'workload';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'about', label: 'About' },
  { key: 'workload', label: 'Workload' },
];

export default function NilManagerProfile() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const [tab, setTab] = React.useState<TabKey>('about');
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set(['scope']));

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
            colors={['rgba(0,26,87,0.35)', 'rgba(0,26,87,0.10)', 'rgba(0,0,0,0.85)', '#000']}
            locations={[0, 0.4, 0.85, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Profile row */}
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Ionicons name="shield-checkmark" size={36} color={NIL_NAVY} />
          </View>
          <View style={styles.rightCol}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{NIL_MANAGER.name}</Text>
              <MaterialCommunityIcons name="check-decagram" size={15} color={NIL_NAVY} />
            </View>
            <Text style={[styles.metaLine, styles.metaLinePrimary]} numberOfLines={1}>
              {NIL_MANAGER.metaPrimary}
            </Text>
            <Text style={styles.metaLine} numberOfLines={1}>
              {NIL_MANAGER.metaSecondary}
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
              {NIL_MANAGER.about.map((section) => {
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

          {tab === 'workload' && (
            <View style={styles.listSection}>
              <View style={styles.card}>
                {NIL_MANAGER.workload.map((h, i) => (
                  <Animated.View
                    key={h.key}
                    entering={FadeInDown.delay(i * 60).duration(400)}
                    style={[styles.row, i !== NIL_MANAGER.workload.length - 1 && styles.rowDivider]}
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

      <FeedNavBar
        variant="slots"
        slots={{
          left: {
            variant: 'circle',
            icon: 'settings-outline',
            onPress: () => router.push('/settings' as any),
            accessibilityLabel: 'Settings',
          },
          center: {
            variant: 'pill',
            label: 'Edit profile',
            onPress: () => router.push('/edit-profile' as any),
            accessibilityLabel: 'Edit profile',
          },
          right: {
            variant: 'circle',
            icon: 'document-text',
            iconColor: NIL_NAVY,
            onPress: () => {},
            accessibilityLabel: 'Open a new disclosure',
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  bannerWrap: { width: '100%', overflow: 'hidden', backgroundColor: '#020616' },

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
    backgroundColor: NIL_NAVY_SOFT,
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
  rowValue: { color: NIL_NAVY, fontSize: 14, fontWeight: '700' },
});
