import { Ionicons } from '@expo/vector-icons';
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
import {
  AGENT_ATHLETES,
  AGENT_INSIGHTS,
  AGENT_PROFILE,
} from '@/lib/data/mock-agent-data';

const ACCENT = '#FF6F3C';
const TEAL = '#14B8A6';
const TAB_BAR_TOP_FROM_BOTTOM = 90;

type TabKey = 'about' | 'roster' | 'career' | 'network';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'about', label: 'About' },
  { key: 'roster', label: 'Roster' },
  { key: 'career', label: 'Career' },
  { key: 'network', label: 'Network' },
];

export default function AgentProfile() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const [tab, setTab] = React.useState<TabKey>('about');
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set(['mission']));
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
        <View style={[styles.bannerWrap, { height: insets.top + 180 }]} pointerEvents="none">
          <LinearGradient
            colors={[
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0.03)',
              'rgba(0,0,0,0.07)',
              'rgba(0,0,0,0.13)',
              'rgba(0,0,0,0.20)',
              'rgba(0,0,0,0.29)',
              'rgba(0,0,0,0.39)',
              'rgba(0,0,0,0.50)',
              'rgba(0,0,0,0.62)',
              'rgba(0,0,0,0.73)',
              'rgba(0,0,0,0.83)',
              'rgba(0,0,0,0.91)',
              'rgba(0,0,0,0.96)',
              'rgba(0,0,0,0.99)',
              '#000',
              '#000',
            ]}
            locations={[
              0, 0.07, 0.14, 0.21, 0.28, 0.35, 0.42, 0.49, 0.56, 0.63, 0.7,
              0.77, 0.83, 0.88, 0.92, 1,
            ]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </View>

        {/* Profile row */}
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: TEAL }]}>
            <Text style={styles.avatarText}>
              {AGENT_PROFILE.firstName[0]}{AGENT_PROFILE.lastName[0]}
            </Text>
          </View>
          <View style={styles.rightCol}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>
                {AGENT_PROFILE.firstName} {AGENT_PROFILE.lastName}
              </Text>
              <Ionicons name="shield-checkmark" size={15} color={TEAL} />
            </View>
            <Text style={[styles.metaLine, styles.metaLinePrimary]} numberOfLines={1}>
              {AGENT_PROFILE.metaPrimary}
            </Text>
            <Text style={styles.metaLine} numberOfLines={1}>
              {AGENT_PROFILE.metaSecondary}
            </Text>
          </View>
        </View>

        <Text style={styles.tagline}>{AGENT_PROFILE.tagline}</Text>

        <View style={styles.statRow}>
          {AGENT_PROFILE.stats.map((s) => (
            <View key={s.label} style={styles.statTile}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
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

        {/* Tab content */}
        <View>
          {tab === 'about' && (
            <View style={styles.section}>
              {AGENT_PROFILE.bio.map((s) => {
                const isOpen = expanded.has(s.key);
                return (
                  <View key={s.key} style={styles.bioItem}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => toggle(s.key)}
                      style={styles.bioHeader}
                    >
                      <Text style={styles.bioTitle}>{s.title}</Text>
                      <Ionicons
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="rgba(255,255,255,0.6)"
                      />
                    </TouchableOpacity>
                    {isOpen && <Text style={styles.bioBody}>{s.body}</Text>}
                  </View>
                );
              })}
            </View>
          )}

          {tab === 'roster' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>YOUR ATHLETES · {AGENT_ATHLETES.length}</Text>
              <View style={styles.card}>
                {AGENT_ATHLETES.map((a, i) => (
                  <Animated.View
                    key={a.id}
                    entering={FadeInDown.delay(i * 50).duration(380)}
                    style={[
                      styles.rosterRow,
                      i !== AGENT_ATHLETES.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <View style={[styles.rosterAvatar, { backgroundColor: a.color }]}>
                      <Text style={styles.rosterAvatarText}>{a.initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rosterName}>{a.name}</Text>
                      <Text style={styles.rosterMeta}>{a.sport} · {a.school}</Text>
                    </View>
                    <Text style={styles.rosterValue}>{a.totalDealValue}</Text>
                  </Animated.View>
                ))}
              </View>
              <Text style={styles.sectionLabel}>SNAPSHOT</Text>
              <View style={styles.card}>
                <View style={styles.snapshotRow}>
                  <Text style={styles.snapshotLabel}>YTD volume</Text>
                  <Text style={styles.snapshotValue}>{AGENT_INSIGHTS.totalVolume}</Text>
                </View>
                <View style={[styles.snapshotRow, styles.rowDivider]}>
                  <Text style={styles.snapshotLabel}>Pipeline value</Text>
                  <Text style={styles.snapshotValue}>{AGENT_INSIGHTS.pipelineValue}</Text>
                </View>
                <View style={[styles.snapshotRow, styles.rowDivider]}>
                  <Text style={styles.snapshotLabel}>Conversion rate</Text>
                  <Text style={styles.snapshotValue}>{AGENT_INSIGHTS.conversionRate}</Text>
                </View>
              </View>
            </View>
          )}

          {tab === 'career' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TIMELINE</Text>
              <View style={styles.card}>
                {AGENT_PROFILE.career.map((c, i) => (
                  <View
                    key={i}
                    style={[
                      styles.careerRow,
                      i !== AGENT_PROFILE.career.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <Text style={styles.careerYear}>{c.year}</Text>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.careerTitle}>{c.title}</Text>
                      <Text style={styles.careerDetail}>{c.detail}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {tab === 'network' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>KEY CONTACTS</Text>
              <View style={styles.card}>
                {AGENT_PROFILE.network.map((n, i) => (
                  <View
                    key={i}
                    style={[
                      styles.networkRow,
                      i !== AGENT_PROFILE.network.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <View style={styles.networkAvatar}>
                      <Text style={styles.networkAvatarText}>
                        {n.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.networkName}>{n.name}</Text>
                      <Text style={styles.networkRole}>{n.role}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom fade */}
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
        >
          <View style={styles.glassLayer} pointerEvents="none">
            <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
          </View>
          <Ionicons name="menu" size={20} color="#FFF" />
        </Pressable>

        <Pressable
          style={styles.toolbarPill}
          onPress={() => router.push('/edit-profile' as any)}
          accessibilityLabel="Edit profile"
        >
          <View style={styles.glassLayer} pointerEvents="none">
            <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
          </View>
          <Text style={styles.toolbarPillText}>Edit profile</Text>
        </Pressable>

        <Pressable style={styles.toolbarCircle} accessibilityLabel="Add athlete">
          <View style={styles.glassLayer} pointerEvents="none">
            <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
          </View>
          <Ionicons name="person-add" size={18} color="#FFF" />
        </Pressable>
      </View>

      <RoleSwitcherSheet visible={roleSheetVisible} onClose={() => setRoleSheetVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bannerWrap: { width: '100%', overflow: 'hidden', backgroundColor: '#000' },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    marginTop: -180,
    marginBottom: 5,
    gap: 14,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 30, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  rightCol: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 22, fontWeight: '700', color: '#FFF', letterSpacing: -0.4 },
  metaLine: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  metaLinePrimary: { color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

  tagline: {
    paddingHorizontal: 16,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 12,
  },

  statRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statTile: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statValue: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '600', textAlign: 'center' },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: ACCENT },
  tabLabel: { fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '500' },
  tabLabelActive: { color: ACCENT, fontWeight: '700' },

  // Section
  section: { paddingHorizontal: 16, gap: 10, paddingTop: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 4,
    marginTop: 6,
    marginBottom: 4,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  // Bio
  bioItem: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 8,
  },
  bioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bioTitle: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  bioBody: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 19,
    marginTop: 8,
  },

  // Roster (in profile)
  rosterRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.06)' },
  rosterAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rosterAvatarText: { fontSize: 14, fontWeight: '900', color: '#FFF' },
  rosterName: { fontSize: 14, color: '#FFF', fontWeight: '700' },
  rosterMeta: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  rosterValue: { fontSize: 12, color: TEAL, fontWeight: '700' },

  // Snapshot
  snapshotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  snapshotLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  snapshotValue: { fontSize: 14, color: '#FFF', fontWeight: '700' },

  // Career
  careerRow: { flexDirection: 'row', gap: 14, padding: 14, alignItems: 'flex-start' },
  careerYear: { fontSize: 12, color: TEAL, fontWeight: '800', width: 44 },
  careerTitle: { fontSize: 14, color: '#FFF', fontWeight: '700' },
  careerDetail: { fontSize: 12, color: 'rgba(255,255,255,0.55)' },

  // Network
  networkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  networkAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  networkAvatarText: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  networkName: { fontSize: 14, color: '#FFF', fontWeight: '700' },
  networkRole: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  // Bottom toolbar
  bottomFade: { position: 'absolute', left: 0, right: 0 },
  bottomToolbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    zIndex: 100,
  },
  glassLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 23, overflow: 'hidden' },
  toolbarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarPill: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarPillText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
