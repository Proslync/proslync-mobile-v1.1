import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStableRouter } from '@/hooks/use-stable-router';
import {
  SK_ASSIGNMENTS,
  SK_PROFILE,
  SK_STATS,
} from '@/lib/data/mock-scorekeeper-data';

const ACCENT = '#FF6F3C';

type TabKey = 'about' | 'stats' | 'credentials' | 'upcoming';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'about', label: 'About' },
  { key: 'stats', label: 'Stats' },
  { key: 'credentials', label: 'Credentials' },
  { key: 'upcoming', label: 'Schedule' },
];

export default function ScorekeeperProfile() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const [tab, setTab] = React.useState<TabKey>('about');
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set(['role']));

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const upcoming = SK_ASSIGNMENTS.filter((g) => g.status !== 'completed');
  const completed = SK_ASSIGNMENTS.filter((g) => g.status === 'completed');

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.topBarCircle} activeOpacity={0.7}>
          <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 19 }]} />
          <Ionicons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarUsername}>{SK_PROFILE.username}</Text>
        </View>
        <TouchableOpacity
          style={styles.topBarCircle}
          activeOpacity={0.7}
          onPress={() => router.push('/settings')}
        >
          <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 19 }]} />
          <Ionicons name="menu" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0)']}
        locations={[0, 0.55, 1]}
        style={[styles.scrollDim, { height: insets.top + 72 }]}
        pointerEvents="none"
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={[styles.bannerWrap, { height: insets.top + 190 }]} pointerEvents="none">
          <Image
            source={require('@/assets/images/kiyan-banner.png')}
            style={{ position: 'absolute', top: -15, left: -3, width: 420, height: 269 }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={[
              'rgba(0,0,0,0.45)',
              'rgba(0,0,0,0.65)',
              'rgba(0,0,0,0.92)',
              '#000',
            ]}
            locations={[0, 0.5, 0.9, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['rgba(59,130,246,0.18)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            locations={[0, 0.8]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </View>

        {/* Profile row */}
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {SK_PROFILE.firstName[0]}
              {SK_PROFILE.lastName[0]}
            </Text>
          </View>
          <View style={styles.rightCol}>
            <Text style={styles.name}>
              {SK_PROFILE.firstName} {SK_PROFILE.lastName}
            </Text>
            <Text style={[styles.metaLine, styles.metaLinePrimary]} numberOfLines={1}>
              {SK_PROFILE.metaPrimary}
            </Text>
            <Text style={styles.metaLine} numberOfLines={1}>
              {SK_PROFILE.metaSecondary}
            </Text>
          </View>
        </View>

        {/* Credential pills row */}
        <View style={styles.credRow}>
          {SK_PROFILE.credentials.map((c) => (
            <View key={c.label} style={styles.credTile}>
              <Text style={styles.credValue}>{c.value}</Text>
              <Text style={styles.credLabel}>{c.label}</Text>
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
        <View style={styles.tabContent}>
          {tab === 'about' && (
            <View style={styles.aboutSection}>
              <Text style={styles.aboutLabel}>Bio</Text>
              {SK_PROFILE.bio.map((section) => {
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

          {tab === 'stats' && (
            <View style={styles.listSection}>
              <Text style={styles.aboutLabel}>Scorekeeper Stats</Text>
              <View style={styles.statsGrid}>
                <StatTile big label="Games this season" value={String(SK_STATS.gamesThisSeason)} />
                <StatTile big label="Career games" value={String(SK_STATS.careerGames)} />
                <StatTile label="Accuracy" value={`${SK_STATS.accuracy}%`} />
                <StatTile label="Corrections / game" value={SK_STATS.correctionsPerGame.toFixed(1)} />
                <StatTile label="Avg entries / game" value={String(SK_STATS.avgLogEntriesPerGame)} />
                <StatTile label="Sanction games" value={String(SK_STATS.sanctionsFlagged)} />
              </View>
            </View>
          )}

          {tab === 'credentials' && (
            <View style={styles.listSection}>
              <Text style={styles.aboutLabel}>Certifications</Text>
              <View style={styles.card}>
                {[
                  { name: 'NFHS Certified Scorer', detail: 'National Federation · Active through 2027', icon: 'shield-checkmark' as const },
                  { name: 'IAABO Bookkeeper Training', detail: 'International Assoc. of Basketball Officials · Tier 2', icon: 'document-text' as const },
                  { name: 'USA Basketball Background Check', detail: 'Cleared · Expires Dec 2026', icon: 'person-circle' as const },
                  { name: 'FIBA 3x3 Secondary', detail: 'Provisional · Qualified for GL3 events', icon: 'basketball' as const },
                ].map((c, i) => (
                  <Animated.View
                    key={c.name}
                    entering={FadeInDown.delay(i * 60).duration(380)}
                    style={[styles.credentialRow, i !== 3 && styles.rowDivider]}
                  >
                    <View style={styles.credIconBox}>
                      <Ionicons name={c.icon} size={18} color={ACCENT} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.credentialName}>{c.name}</Text>
                      <Text style={styles.credentialDetail}>{c.detail}</Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </View>
          )}

          {tab === 'upcoming' && (
            <View style={styles.listSection}>
              <Text style={styles.aboutLabel}>Upcoming · {upcoming.length}</Text>
              <View style={styles.card}>
                {upcoming.map((g, i) => (
                  <Animated.View
                    key={g.id}
                    entering={FadeInDown.delay(i * 60).duration(380)}
                    style={[styles.scheduleRow, i !== upcoming.length - 1 && styles.rowDivider]}
                  >
                    <View style={styles.scheduleDateCol}>
                      <Text style={styles.scheduleDate}>{g.date}</Text>
                      <Text
                        style={[
                          styles.scheduleTime,
                          g.status === 'live' && { color: '#FF4444' },
                        ]}
                      >
                        {g.status === 'live' ? 'LIVE' : g.tipoff}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.scheduleMatchup}>{g.matchup}</Text>
                      <Text style={styles.scheduleVenue}>
                        {g.venue} · {g.role}
                      </Text>
                    </View>
                  </Animated.View>
                ))}
              </View>

              <Text style={[styles.aboutLabel, { marginTop: 18 }]}>Recent</Text>
              <View style={styles.card}>
                {completed.map((g, i) => (
                  <View
                    key={g.id}
                    style={[styles.scheduleRow, i !== completed.length - 1 && styles.rowDivider]}
                  >
                    <View style={styles.scheduleDateCol}>
                      <Text style={styles.scheduleDate}>{g.date}</Text>
                      <Text style={[styles.scheduleTime, { color: 'rgba(255,255,255,0.45)' }]}>
                        Final
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.scheduleMatchup}>{g.matchup}</Text>
                      <Text style={styles.scheduleVenue}>
                        {g.venue} · {g.role}
                      </Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function StatTile({
  label,
  value,
  big,
}: {
  label: string;
  value: string;
  big?: boolean;
}) {
  return (
    <View style={[styles.statTile, big && styles.statTileBig]}>
      <Text style={[styles.statTileValue, big && { fontSize: 24 }]}>{value}</Text>
      <Text style={styles.statTileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scrollDim: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 },
  topBarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topBarUsername: { fontSize: 20, fontWeight: '700', color: '#FFF' },

  bannerWrap: { width: '100%', overflow: 'hidden', backgroundColor: '#111' },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    marginTop: -120,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: '#000',
    backgroundColor: 'rgba(59,130,246,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 28, color: '#3B82F6', fontWeight: '800' },
  rightCol: { flex: 1, marginLeft: 16 },
  name: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  metaLine: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
    lineHeight: 18,
  },
  metaLinePrimary: { color: '#FFF', fontWeight: '700' },

  credRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
  },
  credTile: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
  },
  credValue: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  credLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 3,
    fontWeight: '600',
  },

  tabsRow: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
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
  },
  tabLabelActive: { color: '#FFF', fontWeight: '700' },

  tabContent: {},
  aboutSection: { paddingHorizontal: 16, paddingVertical: 20, gap: 12 },
  listSection: { paddingHorizontal: 16, paddingVertical: 20, gap: 12 },
  aboutLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: ACCENT,
    textTransform: 'uppercase',
  },

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
  },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statTile: {
    width: '48%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  statTileBig: {},
  statTileValue: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  statTileLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 3 },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },

  credentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  credIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,111,60,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  credentialName: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  credentialDetail: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 3 },

  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  scheduleDateCol: { alignItems: 'center', minWidth: 66 },
  scheduleDate: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700' },
  scheduleTime: { color: '#FFF', fontSize: 12, fontWeight: '700', marginTop: 3 },
  scheduleMatchup: { color: '#FFF', fontSize: 13.5, fontWeight: '700' },
  scheduleVenue: { color: 'rgba(255,255,255,0.55)', fontSize: 11.5, marginTop: 3 },
});
