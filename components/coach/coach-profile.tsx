import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
import Animated, {
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStableRouter } from '@/hooks/use-stable-router';

const ACCENT = '#FF6F3C';

const COACH = {
  firstName: 'Glenn',
  lastName: 'Farello',
  username: 'coachfarello',
  metaPrimary: 'Head Coach at Paul VI Catholic',
  metaSecondary: 'Fairfax, Virginia',
  bio: [
    {
      key: 'philosophy',
      title: 'Coaching Philosophy',
      body: "Defense wins. Pace controls. Culture compounds. We play the most disciplined 32 minutes in the WCAC — rim-to-rim, shoulders squared, and everybody accountable for the next guy. I don't coach stars; I coach decisions. The stars take care of themselves.",
    },
    {
      key: 'career',
      title: 'Career Highlights',
      body: '318–82 career record over 14 seasons. 4× WCAC Tournament champion (\'18, \'21, \'23, \'25). 2024 GEICO Nationals quarterfinalist. 27 players committed to D1 programs including Duke, Villanova, Maryland, Georgetown, and UConn.',
    },
    {
      key: 'background',
      title: 'Background',
      body: 'Raised in Brooklyn, played point guard at Boston College (2003-07). Started coaching as a Georgetown graduate assistant in 2009, then three seasons on Patrick Ewing\'s staff before taking the Paul VI job in 2012.',
    },
    {
      key: 'program',
      title: 'Program',
      body: 'Paul VI Catholic · Fairfax, VA · WCAC (Washington Catholic Athletic Conference). Home: Carmel Hall. Rival: DeMatha Catholic. 2025-26 projected: #3 nationally by ESPN, #2 by MaxPreps.',
    },
    {
      key: 'life',
      title: 'Off the Court',
      body: 'Husband to Dr. Amara Thompson (OB/GYN at Inova Fairfax). Girl-dad of two: Imani (9) and Zahra (6). Open-water swimmer. Sub-3:15 marathoner. Unreasonable about sleep hygiene.',
    },
  ],
  focus: [
    {
      key: 'recruiting',
      title: 'Recruiting',
      body: 'Class of \'26 ranked top-5 nationally — 3 Chipotle Nationals watchlist names, 2 McDonald\'s All-American nominees. Active in the \'27 and \'28 classes in the DMV and Tri-State regions.',
    },
    {
      key: 'devo',
      title: 'Player Development',
      body: 'Individual film sessions 2× a week per starter. Shot-diet reviewed every Monday with analytics lead. Strength + sleep monitored via whoop across the entire top-9.',
    },
    {
      key: 'analytics',
      title: 'Analytics',
      body: 'Partnered with Proslync AI since 2024 — pre-scout generation, in-game pattern flags, and post-game film pipeline. Eliminated ~14 hours of weekly scout prep.',
    },
  ],
  staff: [
    { name: 'Ray Diggs', role: 'Associate Head Coach · Defense' },
    { name: 'Travis Smith', role: 'Assistant · Analytics' },
    { name: 'Jon McCloud', role: 'Assistant · Recruiting' },
    { name: 'Sarah Rivera', role: 'Director of Ops' },
  ],
  commits: [
    { name: 'Jordan Miles', year: "'26", to: 'Duke', pos: 'SG' },
    { name: 'Marcus Reid', year: "'26", to: 'Villanova', pos: 'PG' },
    { name: 'Aaron Brooks', year: "'26", to: 'Maryland', pos: 'SF' },
    { name: 'Tyrese Alston', year: "'27", to: 'Uncommitted', pos: 'C' },
  ],
  recentWins: [
    { date: 'Apr 19', opponent: 'DeMatha Catholic', result: 'W 74-68', note: 'WCAC semifinal · Road' },
    { date: 'Apr 17', opponent: 'Bishop O\'Connell', result: 'W 82-61', note: 'Senior night' },
    { date: 'Apr 15', opponent: 'St. John\'s College HS', result: 'W 69-64', note: 'OT · Dan McPherson clutch' },
    { date: 'Apr 12', opponent: '@ Gonzaga College HS', result: 'L 64-71', note: 'Turnover-heavy 4th' },
    { date: 'Apr 9', opponent: 'Bishop Ireton', result: 'W 88-52', note: '' },
  ],
};

type TabKey = 'about' | 'focus' | 'staff' | 'commits' | 'results';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'about', label: 'About' },
  { key: 'focus', label: 'Focus' },
  { key: 'staff', label: 'Staff' },
  { key: 'commits', label: 'Commits' },
  { key: 'results', label: 'Results' },
];

export default function CoachProfile() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const [tab, setTab] = React.useState<TabKey>('about');
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set(['philosophy']));

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const dimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 60], [0, 1], Extrapolation.CLAMP),
  }));

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
      {/* Top bar — matches Kiyan profile structure */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.topBarCircle} activeOpacity={0.7}>
          <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 19 }]} />
          <Ionicons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarUsername}>{COACH.username}</Text>
          <MaterialCommunityIcons name="check-decagram" size={17} color="#FF6F3C" />
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

      <Animated.View
        style={[styles.scrollDim, { height: insets.top + 72 }, dimStyle]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0)']}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Banner */}
        <View
          style={[
            styles.bannerWrap,
            { height: insets.top + 190, backgroundColor: '#E7D8AC' },
          ]}
          pointerEvents="none"
        >
          <Image
            source={require('@/assets/images/coach-banner.png')}
            style={[
              StyleSheet.absoluteFill,
              { transform: [{ translateX: -145 }, { translateY: -65 }, { scale: 0.6 }] },
            ]}
            resizeMode="contain"
          />
          {/* dark vignette — overall dimmer so the logo reads softer behind content */}
          <LinearGradient
            colors={[
              'rgba(0,0,0,0.45)',
              'rgba(0,0,0,0.6)',
              'rgba(0,0,0,0.88)',
              '#000',
            ]}
            locations={[0, 0.5, 0.88, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </View>

        {/* Profile row — avatar + name + meta */}
        <View style={styles.profileRow}>
          <Image
            source={require('@/assets/images/coach-avatar.png')}
            style={styles.avatar}
            resizeMode="cover"
          />
          <View style={styles.rightCol}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>
                Coach {COACH.firstName} {COACH.lastName}
              </Text>
              <MaterialCommunityIcons name="check-decagram" size={16} color="#FF6F3C" />
            </View>
            <Text style={[styles.metaLine, styles.metaLinePrimary]} numberOfLines={1}>
              {COACH.metaPrimary}
            </Text>
            <Text style={styles.metaLine} numberOfLines={1}>
              {COACH.metaSecondary}
            </Text>
          </View>
        </View>

        {/* Tab row — underline style matching Kiyan */}
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
              {COACH.bio.map((section) => {
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

          {tab === 'focus' && (
            <View style={styles.aboutSection}>
              <Text style={styles.aboutLabel}>Program Focus</Text>
              {COACH.focus.map((section) => {
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

          {tab === 'staff' && (
            <View style={styles.listSection}>
              <Text style={styles.aboutLabel}>Coaching Staff</Text>
              <View style={styles.card}>
                {COACH.staff.map((s, i) => (
                  <Animated.View
                    key={s.name}
                    entering={FadeInDown.delay(i * 60).duration(400)}
                    style={[styles.row, i !== COACH.staff.length - 1 && styles.rowDivider]}
                  >
                    <View style={styles.staffAvatar}>
                      <Text style={styles.staffInitial}>
                        {s.name.split(' ').map((p) => p[0]).join('')}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{s.name}</Text>
                      <Text style={styles.rowMeta}>{s.role}</Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </View>
          )}

          {tab === 'commits' && (
            <View style={styles.listSection}>
              <Text style={styles.aboutLabel}>D1 Commits · '26-'27</Text>
              <View style={styles.card}>
                {COACH.commits.map((c, i) => (
                  <Animated.View
                    key={c.name}
                    entering={FadeInDown.delay(i * 60).duration(400)}
                    style={[styles.row, i !== COACH.commits.length - 1 && styles.rowDivider]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{c.name}</Text>
                      <Text style={styles.rowMeta}>{c.year} · {c.pos}</Text>
                    </View>
                    <View
                      style={[
                        styles.pill,
                        c.to === 'Uncommitted' && styles.pillMuted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          c.to === 'Uncommitted' && { color: 'rgba(255,255,255,0.6)' },
                        ]}
                      >
                        {c.to}
                      </Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </View>
          )}

          {tab === 'results' && (
            <View style={styles.listSection}>
              <Text style={styles.aboutLabel}>Recent Games</Text>
              <View style={styles.card}>
                {COACH.recentWins.map((g, i) => {
                  const won = g.result.startsWith('W');
                  return (
                    <Animated.View
                      key={`${g.date}-${g.opponent}`}
                      entering={FadeInDown.delay(i * 60).duration(400)}
                      style={[styles.row, i !== COACH.recentWins.length - 1 && styles.rowDivider]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle}>{g.opponent}</Text>
                        <Text style={styles.rowMeta}>
                          {g.date}
                          {g.note ? ` · ${g.note}` : ''}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.rowResult,
                          { color: won ? '#34C759' : '#FF4444' },
                        ]}
                      >
                        {g.result}
                      </Text>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </Animated.ScrollView>
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
    backgroundColor: '#1a1c22',
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

  tabsRow: {
    flexDirection: 'row',
    marginTop: 6,
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
    letterSpacing: -0.1,
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
  rowResult: { fontSize: 13, fontWeight: '700' },

  staffAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  staffInitial: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,111,60,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.35)',
  },
  pillMuted: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  pillText: { color: ACCENT, fontSize: 12, fontWeight: '700' },
});
