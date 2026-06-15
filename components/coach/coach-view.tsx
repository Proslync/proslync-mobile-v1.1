// coach-view.tsx
// ── COACH DASHBOARD ───────────────────────────────────────────────────────
// Charter §A — tabs wiped to ['Home', 'Roster'].
// Floating bottom pill (matches athlete-view). Old top header removed.
// Old Insights/Scout tab content is UNMOUNTED (functions kept below, not rendered).
// Old imports for mock-coach-data kept (still used by unmounted fns); unused
// vars prefixed with _ to satisfy TS.

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOutUp,
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStableRouter } from '@/hooks/use-stable-router';
import { RoleSwitcherSheet } from '@/components/shared/role-switcher-menu';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Path,
  Stop,
} from 'react-native-svg';
import { FloatingTabPill, useTabCollapse } from '@/components/shared/floating-tab-pill';

import {
  DEMO_META,
  LIVE_GAME,
  MY_ROSTER,
  MY_TEAM_SUMMARY,
  OPPONENT,
  PATTERNS,
  PLAYER_TRENDS,
  PRACTICE_TRACKING_PROVIDER,
  ROTATING_INSIGHTS,
  type AIInsight,
  type Pattern,
  type PlayerTrend,
  type RosterPlayer,
} from '@/lib/data/mock-coach-data';
import { liquidGlass as _liquidGlass } from '@/constants/glass/liquid-glass';

// New charter home + roster tabs
import { CoachHome } from '@/components/coach/coach-home';
import { CoachRoster } from '@/components/coach/coach-roster';

import {
  ACCENT,
  CANVAS,
  HAIRLINE,
  HAIRLINE_SUBTLE,
  SURFACE,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
} from '@/components/shared/ui-kit/tokens';

const CARD_BG = SURFACE;
const CARD_BORDER = HAIRLINE;
const TAB_BAR_TOP_FROM_BOTTOM = 90; // iOS 26 floating glass tab bar — top edge from screen bottom (incl. safe area)

// Charter §A: two tabs only
type TabKey = 'home' | 'roster';

const COACH_TABS = ['Home', 'Roster'] as const;
type CoachTabLabel = (typeof COACH_TABS)[number];

const _TABS_OLD: { key: TabKey; label: string }[] = [
  { key: 'home',   label: 'Home'   },
  { key: 'roster', label: 'Roster' },
];

function tabLabelToKey(label: CoachTabLabel): TabKey {
  return label.toLowerCase() as TabKey;
}

export function CoachView() {
  const insets = useSafeAreaInsets();
  const _router = useStableRouter();
  const [activeTab, setActiveTab] = React.useState<TabKey>('home');
  const [roleSheetVisible, setRoleSheetVisible] = React.useState(false);
  const { collapsed, onScroll } = useTabCollapse();

  const activeLabel: CoachTabLabel = activeTab === 'home' ? 'Home' : 'Roster';

  return (
    <View style={styles.container}>
      {/* Tab content — charter: Home + Roster only */}
      {activeTab === 'home'   && <CoachHome   topInset={insets.top} bottomInset={insets.bottom} onScroll={onScroll} />}
      {activeTab === 'roster' && <CoachRoster topInset={insets.top} bottomInset={insets.bottom} onScroll={onScroll} />}

      {/* Top fade */}
      <LinearGradient
        colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']}
        locations={[0, 0.5, 1]}
        style={[styles.topFade, { height: insets.top + 28 }]}
        pointerEvents="none"
      />

      {/* Bottom darken gradient */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 1]}
        style={[styles.bottomFade, { bottom: 0, height: TAB_BAR_TOP_FROM_BOTTOM + 110 }]}
        pointerEvents="none"
      />

      {/* Floating bottom pill */}
      <FloatingTabPill
        tabs={COACH_TABS}
        activeKey={activeLabel}
        onSelect={(label) => setActiveTab(tabLabelToKey(label))}
        collapsed={collapsed}
        bottomInset={insets.bottom}
      />

      <RoleSwitcherSheet visible={roleSheetVisible} onClose={() => setRoleSheetVisible(false)} />
    </View>
  );
}

// ============================================================
// Tab 1 — Live Game
// ============================================================

function LiveGameTab({ insets }: { insets: number }) {
  const [alertsPaused, setAlertsPaused] = React.useState(false);
  const [feed, setFeed] = React.useState<AIInsight[]>(ROTATING_INSIGHTS.slice(0, 3));
  const cursorRef = React.useRef(3);

  React.useEffect(() => {
    if (alertsPaused) return;
    const pushNext = () => {
      const next = ROTATING_INSIGHTS[cursorRef.current % ROTATING_INSIGHTS.length];
      cursorRef.current += 1;
      // Give each pushed insight a fresh id so Animated list treats it as new
      const stamped: AIInsight = { ...next, id: `${next.id}-${Date.now()}` };
      setFeed((prev) => [stamped, ...prev].slice(0, 8));
    };
    const tick = () => {
      pushNext();
      const delay = 8000 + Math.floor(Math.random() * 4000);
      timer = setTimeout(tick, delay);
    };
    let timer = setTimeout(tick, 9000);
    return () => clearTimeout(timer);
  }, [alertsPaused]);

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Scoreboard card */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.scoreboardCard}>
        <LinearGradient
          colors={['rgba(255,111,60,0.18)', 'rgba(255,111,60,0.02)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.scoreboardHeader}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <Text style={styles.clockText}>{LIVE_GAME.quarter} · {LIVE_GAME.clock}</Text>
          <View style={styles.possessionPill}>
            <Text style={styles.possessionText}>
              {LIVE_GAME.possession === 'home' ? 'PAUL VI BALL' : "ST. JOHN'S BALL"}
            </Text>
          </View>
        </View>

        <View style={styles.scoreRow}>
          <View style={styles.teamBlock}>
            <Text style={styles.teamName}>{LIVE_GAME.homeTeam}</Text>
            <Text style={styles.teamScore}>{LIVE_GAME.homeScore}</Text>
            <Text style={styles.teamMeta}>{LIVE_GAME.timeoutsHome} TO · {LIVE_GAME.homeFouls} Fouls</Text>
          </View>
          <Text style={styles.scoreDash}>—</Text>
          <View style={styles.teamBlock}>
            <Text style={styles.teamName}>{LIVE_GAME.awayTeam}</Text>
            <Text style={[styles.teamScore, { color: 'rgba(255,255,255,0.6)' }]}>{LIVE_GAME.awayScore}</Text>
            <Text style={styles.teamMeta}>{LIVE_GAME.timeoutsAway} TO · {LIVE_GAME.awayFouls} Fouls</Text>
          </View>
        </View>
      </Animated.View>

      {/* Pause alerts toggle */}
      <View style={styles.alertsToggleRow}>
        <View style={styles.alertsToggleLeft}>
          <Ionicons name="flash" size={16} color={ACCENT} />
          <Text style={styles.alertsToggleLabel}>
            AI Insights {alertsPaused ? 'Paused' : 'Live'}
          </Text>
        </View>
        <Switch
          value={!alertsPaused}
          onValueChange={(v) => setAlertsPaused(!v)}
          trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(255,111,60,0.4)' }}
          thumbColor={alertsPaused ? 'rgba(255,255,255,0.5)' : ACCENT}
        />
      </View>

      {/* Feed */}
      <Animated.View layout={LinearTransition.duration(350)}>
        {feed.map((insight, i) => (
          <InsightCard key={insight.id} insight={insight} isTop={i === 0} />
        ))}
      </Animated.View>
    </ScrollView>
  );
}

function InsightCard({ insight, isTop }: { insight: AIInsight; isTop: boolean }) {
  const [vote, setVote] = React.useState<'up' | 'down' | null>(null);
  const urgencyColor =
    insight.urgency === 'high' ? '#FF4444' : insight.urgency === 'medium' ? ACCENT : 'rgba(255,255,255,0.45)';

  return (
    <Animated.View
      entering={FadeInUp.duration(450)}
      exiting={FadeOutUp.duration(250)}
      layout={LinearTransition.duration(350)}
      style={[styles.insightCard, isTop && styles.insightCardTop]}
    >
      {isTop && (
        <LinearGradient
          colors={['rgba(255,111,60,0.12)', 'rgba(255,111,60,0)']}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={styles.insightTopRow}>
        <Text style={styles.insightIcon}>{insight.icon}</Text>
        <View style={styles.insightTags}>
          <View style={[styles.urgencyDot, { backgroundColor: urgencyColor }]} />
          <Text style={styles.insightCategory}>{insight.category.toUpperCase()}</Text>
        </View>
        <Text style={styles.insightConfidence}>{insight.confidence}%</Text>
      </View>
      <Text style={styles.insightText}>{insight.text}</Text>
      <View style={styles.confidenceBarTrack}>
        <View
          style={[
            styles.confidenceBarFill,
            { width: `${insight.confidence}%`, backgroundColor: urgencyColor },
          ]}
        />
      </View>
      <View style={styles.insightFooter}>
        <Text style={styles.insightTimestamp}>Just now</Text>
        <View style={styles.voteRow}>
          <TouchableOpacity
            onPress={() => setVote(vote === 'up' ? null : 'up')}
            hitSlop={8}
            style={styles.voteBtn}
          >
            <Ionicons
              name={vote === 'up' ? 'thumbs-up' : 'thumbs-up-outline'}
              size={16}
              color={vote === 'up' ? ACCENT : 'rgba(255,255,255,0.5)'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setVote(vote === 'down' ? null : 'down')}
            hitSlop={8}
            style={styles.voteBtn}
          >
            <Ionicons
              name={vote === 'down' ? 'thumbs-down' : 'thumbs-down-outline'}
              size={16}
              color={vote === 'down' ? '#FF4444' : 'rgba(255,255,255,0.5)'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

// ============================================================
// Tab 2 — Insights (Patterns + Trends combined)
// ============================================================

function InsightsTab({ insets, onOpenLive }: { insets: number; onOpenLive: () => void }) {
  const topInset = useSafeAreaInsets().top;
  const [subTab, setSubTab] = React.useState<'patterns' | 'trends'>('patterns');
  const SUB_TABS: { key: 'patterns' | 'trends'; label: string }[] = [
    { key: 'patterns', label: 'Patterns' },
    { key: 'trends', label: 'Trends' },
  ];

  return (
    <View style={{ flex: 1, paddingTop: topInset + 70 }}>
      <Pressable
        onPress={onOpenLive}
        style={({ pressed }) => [styles.liveButtonCard, { opacity: pressed ? 0.85 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel="Open live game view"
      >
        <View style={styles.liveButtonDotWrap}>
          <View style={styles.liveButtonDot} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.liveButtonTitle}>Live Game</Text>
          <Text style={styles.liveButtonSubtitle}>vs {LIVE_GAME.awayTeam} · {LIVE_GAME.quarter} {LIVE_GAME.clock}</Text>
        </View>
        <Text style={styles.liveButtonScore}>{LIVE_GAME.homeScore}–{LIVE_GAME.awayScore}</Text>
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
      </Pressable>
      <View style={styles.subTabsRow}>
        {SUB_TABS.map(({ key, label }) => {
          const isActive = subTab === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.subTab, isActive && styles.subTabActive]}
              onPress={() => setSubTab(key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.subTabLabel, isActive && styles.subTabLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {subTab === 'patterns' && <PatternsTab insets={insets} />}
      {subTab === 'trends' && <TrendsTab insets={insets} />}
    </View>
  );
}

// ============================================================
// Tab 2a — Patterns
// ============================================================

function PatternsTab({ insets }: { insets: number }) {
  const [evidenceFor, setEvidenceFor] = React.useState<Pattern | null>(null);

  return (
    <>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(300)} style={styles.kickerRow}>
          <Text style={styles.kickerTitle}>{PATTERNS.length} patterns detected</Text>
          <Text style={styles.kickerSub}>Analyzed across last 10 games · {DEMO_META.lastSyncLabel}</Text>
        </Animated.View>

        {PATTERNS.map((p, i) => (
          <Animated.View
            key={p.id}
            entering={FadeInDown.delay(i * 60).duration(400)}
            style={styles.patternCard}
          >
            <View style={styles.patternTopRow}>
              <View style={styles.patternCategory}>
                <Text style={styles.patternCategoryText}>{p.category.toUpperCase()}</Text>
              </View>
              <Text style={styles.patternConfidence}>{p.pValue}</Text>
            </View>
            <Text style={styles.patternHeadline}>{p.headline}</Text>
            <View style={styles.patternEvidenceRow}>
              <Ionicons name="stats-chart-outline" size={14} color="rgba(255,255,255,0.6)" />
              <Text style={styles.patternEvidence}>{p.evidence}</Text>
            </View>
            <View style={styles.patternBarTrack}>
              <View
                style={[
                  styles.patternBarFill,
                  { width: `${(p.observedGames / p.totalGames) * 100}%` },
                ]}
              />
            </View>
            <View style={styles.patternFooter}>
              <Text style={styles.patternFooterMeta}>
                Observed in {p.observedGames} of {p.totalGames} games
              </Text>
              <TouchableOpacity
                style={styles.evidenceBtn}
                onPress={() => setEvidenceFor(p)}
                activeOpacity={0.7}
              >
                <Ionicons name="play-circle" size={14} color={ACCENT} />
                <Text style={styles.evidenceBtnText}>{p.clipCount} clips</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      <Modal
        visible={!!evidenceFor}
        transparent
        animationType="fade"
        onRequestClose={() => setEvidenceFor(null)}
        statusBarTranslucent
      >
        <Pressable style={styles.evidenceBackdrop} onPress={() => setEvidenceFor(null)}>
          <Pressable style={styles.evidenceModal} onPress={(e) => e.stopPropagation()}>
            <Ionicons name="videocam-outline" size={32} color={ACCENT} />
            <Text style={styles.evidenceTitle}>Video Evidence</Text>
            <Text style={styles.evidenceSubtitle}>
              {evidenceFor?.clipCount} clips — coming soon
            </Text>
            <TouchableOpacity
              style={styles.evidenceClose}
              onPress={() => setEvidenceFor(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.evidenceCloseText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ============================================================
// Tab 3 — My Roster
// ============================================================

function trendBadge(trend: 'up' | 'down' | 'flat'): { icon: keyof typeof Ionicons.glyphMap; color: string } {
  if (trend === 'up') return { icon: 'caret-up', color: '#34C759' };
  if (trend === 'down') return { icon: 'caret-down', color: '#FF453A' };
  return { icon: 'remove', color: 'rgba(255,255,255,0.55)' };
}

function statusBadge(status: RosterPlayer['status']): { label: string; color: string } | null {
  if (status === 'active') return null;
  if (status === 'questionable') return { label: 'Q', color: '#FFD60A' };
  return { label: 'OUT', color: '#FF453A' };
}

function RosterTab({ insets }: { insets: number }) {
  const topInset = useSafeAreaInsets().top;
  const [selectedPlayerId, setSelectedPlayerId] = React.useState<string | null>(null);
  const selectedPlayer = MY_ROSTER.find((p) => p.id === selectedPlayerId);

  const teamPpg = (MY_ROSTER.reduce((s, p) => s + p.ppg, 0)).toFixed(1);
  const teamRpg = (MY_ROSTER.reduce((s, p) => s + p.rpg, 0)).toFixed(1);
  const teamApg = (MY_ROSTER.reduce((s, p) => s + p.apg, 0)).toFixed(1);
  const totalPracticeShots = MY_ROSTER.reduce((s, p) => s + p.practice.totalShots, 0);
  const weightedMakes = MY_ROSTER.reduce((s, p) => s + p.practice.totalShots * (p.practice.makesPct / 100), 0);
  const teamPracticePct = totalPracticeShots > 0 ? (weightedMakes / totalPracticeShots) * 100 : 0;

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 70, paddingBottom: insets + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Team summary card */}
      <Animated.View entering={FadeInDown.duration(360)} style={styles.rosterTeamCard}>
        <View style={styles.rosterTeamHead}>
          <View style={styles.rosterTeamLogo}>
            <Text style={styles.rosterTeamLogoText}>PV</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rosterTeamName}>{MY_TEAM_SUMMARY.name}</Text>
            <Text style={styles.rosterTeamMeta}>
              {MY_TEAM_SUMMARY.record} · {MY_TEAM_SUMMARY.conferenceRecord} · {MY_TEAM_SUMMARY.rank}
            </Text>
          </View>
        </View>
        <View style={styles.rosterTeamStatsRow}>
          <View style={styles.rosterTeamStat}>
            <Text style={styles.rosterTeamStatValue}>{teamPpg}</Text>
            <Text style={styles.rosterTeamStatLabel}>PPG (team)</Text>
          </View>
          <View style={styles.rosterTeamStatDivider} />
          <View style={styles.rosterTeamStat}>
            <Text style={styles.rosterTeamStatValue}>{teamRpg}</Text>
            <Text style={styles.rosterTeamStatLabel}>RPG</Text>
          </View>
          <View style={styles.rosterTeamStatDivider} />
          <View style={styles.rosterTeamStat}>
            <Text style={styles.rosterTeamStatValue}>{teamApg}</Text>
            <Text style={styles.rosterTeamStatLabel}>APG</Text>
          </View>
        </View>
      </Animated.View>

      {/* Roster list */}
      <Text style={styles.sectionLabel}>ROSTER · {MY_ROSTER.length}</Text>
      {MY_ROSTER.map((p, i) => {
        const trend = trendBadge(p.trend);
        const stat = statusBadge(p.status);
        return (
          <Animated.View
            key={p.id}
            entering={FadeInDown.delay(60 + i * 30).duration(300)}
          >
            <Pressable
              onPress={() => setSelectedPlayerId(p.id)}
              style={({ pressed }) => [styles.rosterRow, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.rosterAvatar, { backgroundColor: p.color }]}>
                <Text style={styles.rosterAvatarText}>{p.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.rosterNameRow}>
                  <Text style={styles.rosterName} numberOfLines={1}>
                    #{p.number}  {p.name}
                  </Text>
                  {stat && (
                    <View style={[styles.rosterStatusPill, { backgroundColor: `${stat.color}26`, borderColor: `${stat.color}66` }]}>
                      <Text style={[styles.rosterStatusText, { color: stat.color }]}>{stat.label}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.rosterMeta}>
                  {p.position} · {p.classYear} · {p.height}
                </Text>
              </View>
              <View style={styles.rosterStatBlock}>
                <Text style={styles.rosterStatBig}>{p.ppg.toFixed(1)}</Text>
                <Text style={styles.rosterStatSmall}>PPG</Text>
              </View>
              <View style={styles.rosterStatBlock}>
                <Text style={styles.rosterStatBig}>{p.fgPct.toFixed(0)}%</Text>
                <Text style={styles.rosterStatSmall}>FG</Text>
              </View>
              <Ionicons name={trend.icon} size={16} color={trend.color} />
            </Pressable>
          </Animated.View>
        );
      })}

      {/* Practice facility shot tracking */}
      <View style={styles.practiceHeaderRow}>
        <Text style={styles.sectionLabel}>PRACTICE SHOTS · LAST 7 DAYS</Text>
        <View style={styles.practiceUnverifiedPill}>
          <Ionicons name="ellipsis-horizontal-circle" size={11} color="rgba(255,214,10,0.95)" />
          <Text style={styles.practiceUnverifiedText}>Awaiting integration</Text>
        </View>
      </View>

      <Animated.View entering={FadeInDown.duration(360)} style={styles.practiceSummaryCard}>
        <View style={styles.practiceSummaryRow}>
          <View style={styles.practiceSummaryStat}>
            <Text style={styles.practiceSummaryValue}>{totalPracticeShots.toLocaleString()}</Text>
            <Text style={styles.practiceSummaryLabel}>Shots taken</Text>
          </View>
          <View style={styles.rosterTeamStatDivider} />
          <View style={styles.practiceSummaryStat}>
            <Text style={styles.practiceSummaryValue}>{teamPracticePct.toFixed(1)}%</Text>
            <Text style={styles.practiceSummaryLabel}>Team make rate</Text>
          </View>
          <View style={styles.rosterTeamStatDivider} />
          <View style={styles.practiceSummaryStat}>
            <Text style={styles.practiceSummaryValue}>{MY_ROSTER.filter((p) => p.practice.totalShots > 0).length}</Text>
            <Text style={styles.practiceSummaryLabel}>Players logged</Text>
          </View>
        </View>
      </Animated.View>

      {MY_ROSTER.filter((p) => p.practice.totalShots > 0).slice(0, 5).map((p, i) => {
        const threePct = p.practice.threeAttempts > 0 ? (p.practice.threeMakes / p.practice.threeAttempts) * 100 : 0;
        const midPct = p.practice.midAttempts > 0 ? (p.practice.midMakes / p.practice.midAttempts) * 100 : 0;
        const rimPct = p.practice.rimAttempts > 0 ? (p.practice.rimMakes / p.practice.rimAttempts) * 100 : 0;
        return (
          <Animated.View
            key={`prac-${p.id}`}
            entering={FadeInDown.delay(60 + i * 40).duration(300)}
            style={styles.practiceRow}
          >
            <View style={styles.practiceRowHead}>
              <View style={[styles.rosterAvatarSmall, { backgroundColor: p.color }]}>
                <Text style={styles.rosterAvatarTextSmall}>{p.initials}</Text>
              </View>
              <Text style={styles.practiceRowName} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.practiceRowTotal}>{p.practice.totalShots} shots · {p.practice.makesPct.toFixed(1)}%</Text>
            </View>
            <View style={styles.practiceZoneRow}>
              <PracticeZone label="3PT" makes={p.practice.threeMakes} attempts={p.practice.threeAttempts} pct={threePct} />
              <PracticeZone label="MID" makes={p.practice.midMakes} attempts={p.practice.midAttempts} pct={midPct} />
              <PracticeZone label="RIM" makes={p.practice.rimMakes} attempts={p.practice.rimAttempts} pct={rimPct} />
            </View>
          </Animated.View>
        );
      })}

      {/* Provider note */}
      <View style={styles.practiceProviderCard}>
        <View style={styles.practiceProviderHead}>
          <Ionicons name="link" size={14} color={ACCENT} />
          <Text style={styles.practiceProviderTitle}>Connect a shot-tracking provider</Text>
        </View>
        <Text style={styles.practiceProviderBody}>
          {PRACTICE_TRACKING_PROVIDER.note} Candidate partners we're evaluating:
        </Text>
        {PRACTICE_TRACKING_PROVIDER.candidateProviders.map((prov) => (
          <View key={prov.name} style={styles.practiceProviderRow}>
            <Text style={styles.practiceProviderName}>{prov.name}</Text>
            <Text style={styles.practiceProviderDetail} numberOfLines={1}>{prov.detail}</Text>
          </View>
        ))}
      </View>

      {/* Player detail sheet */}
      <RosterPlayerSheet
        player={selectedPlayer ?? null}
        visible={!!selectedPlayer}
        onClose={() => setSelectedPlayerId(null)}
      />
    </ScrollView>
  );
}

function PracticeZone({ label, makes, attempts, pct }: { label: string; makes: number; attempts: number; pct: number }) {
  const color = pct >= 50 ? '#34C759' : pct >= 38 ? ACCENT : '#FF453A';
  return (
    <View style={styles.practiceZone}>
      <Text style={styles.practiceZoneLabel}>{label}</Text>
      <Text style={[styles.practiceZonePct, { color }]}>{attempts === 0 ? '—' : `${pct.toFixed(0)}%`}</Text>
      <Text style={styles.practiceZoneAtt}>{makes}/{attempts}</Text>
    </View>
  );
}

const ROSTER_SHEET_TRAVEL = 700;

function RosterPlayerSheet({
  player,
  visible,
  onClose,
}: {
  player: RosterPlayer | null;
  visible: boolean;
  onClose: () => void;
}) {
  const translateY = useSharedValue(ROSTER_SHEET_TRAVEL);
  const backdropProgress = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      backdropProgress.value = withTiming(1, { duration: 280 });
      translateY.value = withTiming(0, { duration: 320 });
    }
  }, [visible]);

  const dismiss = React.useCallback(() => {
    translateY.value = withTiming(ROSTER_SHEET_TRAVEL, { duration: 220 });
    backdropProgress.value = withTiming(0, { duration: 220 });
    setTimeout(onClose, 220);
  }, [onClose]);

  const panGesture = Gesture.Pan()
    .activeOffsetY(10)
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
        backdropProgress.value = 1 - Math.min(e.translationY / ROSTER_SHEET_TRAVEL, 1);
      }
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 600) {
        translateY.value = withTiming(ROSTER_SHEET_TRAVEL, { duration: 220 });
        backdropProgress.value = withTiming(0, { duration: 220 });
        runOnJS(onClose)();
      } else {
        translateY.value = withTiming(0, { duration: 200 });
        backdropProgress.value = withTiming(1, { duration: 200 });
      }
    });

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropAnimStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0,0,0,${0.65 * backdropProgress.value})`,
  }));

  if (!player) return null;
  const trend = trendBadge(player.trend);
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss} statusBarTranslucent>
      <Animated.View style={[styles.rosterSheetBackdrop, backdropAnimStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        <Animated.View style={[styles.rosterSheet, sheetAnimStyle]}>
          <GestureDetector gesture={panGesture}>
            <View>
              <View style={styles.rosterSheetHandle} />
              <View style={styles.rosterSheetHeader}>
                <View style={[styles.rosterAvatarLg, { backgroundColor: player.color }]}>
                  <Text style={styles.rosterAvatarLgText}>{player.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rosterSheetName}>#{player.number}  {player.name}</Text>
                  <Text style={styles.rosterSheetMeta}>{player.position} · {player.classYear} · {player.height}</Text>
                  {player.statusNote && (
                    <Text style={styles.rosterSheetStatusNote}>{player.statusNote}</Text>
                  )}
                </View>
                <Ionicons name={trend.icon} size={22} color={trend.color} />
              </View>
            </View>
          </GestureDetector>
          <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: 28 }}>
            <Text style={styles.sectionLabel}>SEASON STATS</Text>
            <View style={styles.sheetStatsGrid}>
              <StatCell label="PPG" value={player.ppg.toFixed(1)} />
              <StatCell label="RPG" value={player.rpg.toFixed(1)} />
              <StatCell label="APG" value={player.apg.toFixed(1)} />
              <StatCell label="MPG" value={player.mpg.toFixed(1)} />
              <StatCell label="FG%" value={`${player.fgPct.toFixed(1)}%`} />
              <StatCell label="3P%" value={player.threePct === 0 ? '—' : `${player.threePct.toFixed(1)}%`} />
              <StatCell label="FT%" value={`${player.ftPct.toFixed(1)}%`} />
            </View>
            {player.practice.totalShots > 0 && (
              <>
                <Text style={styles.sectionLabel}>PRACTICE · LAST 7 DAYS</Text>
                <View style={styles.practiceRow}>
                  <View style={styles.practiceRowHead}>
                    <Text style={styles.practiceRowName}>Total</Text>
                    <Text style={styles.practiceRowTotal}>{player.practice.totalShots} shots · {player.practice.makesPct.toFixed(1)}%</Text>
                  </View>
                  <View style={styles.practiceZoneRow}>
                    <PracticeZone label="3PT" makes={player.practice.threeMakes} attempts={player.practice.threeAttempts} pct={player.practice.threeAttempts > 0 ? (player.practice.threeMakes / player.practice.threeAttempts) * 100 : 0} />
                    <PracticeZone label="MID" makes={player.practice.midMakes} attempts={player.practice.midAttempts} pct={player.practice.midAttempts > 0 ? (player.practice.midMakes / player.practice.midAttempts) * 100 : 0} />
                    <PracticeZone label="RIM" makes={player.practice.rimMakes} attempts={player.practice.rimAttempts} pct={player.practice.rimAttempts > 0 ? (player.practice.rimMakes / player.practice.rimAttempts) * 100 : 0} />
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.sheetStatCell}>
      <Text style={styles.sheetStatCellValue}>{value}</Text>
      <Text style={styles.sheetStatCellLabel}>{label}</Text>
    </View>
  );
}

// ============================================================
// Tab 4 — Opponent Scout
// ============================================================

const TENDENCY_COLOR: Record<string, string> = {
  OFFENSE: '#FF6F3C',
  DEFENSE: '#3B82F6',
  TRANSITION: '#14B8A6',
};

const ADJUSTMENT_PRIORITY: { label: string; color: string; bg: string; border: string }[] = [
  { label: 'HIGH',   color: '#FF4444', bg: 'rgba(255,68,68,0.14)',  border: 'rgba(255,68,68,0.45)' },
  { label: 'MEDIUM', color: '#FFD60A', bg: 'rgba(255,214,10,0.14)', border: 'rgba(255,214,10,0.45)' },
  { label: 'LOW',    color: '#FFFFFF', bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.20)' },
];

function ScoutTab({ insets }: { insets: number }) {
  const topInset = useSafeAreaInsets().top;
  const sortedPlays = [...OPPONENT.predictedPlays].sort((a, b) => b.likelihood - a.likelihood);
  const playerBullets = OPPONENT.keyPlayer.tendencies;
  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 70, paddingBottom: insets + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Matchup hero */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.scoutHero}>
        <LinearGradient
          colors={['rgba(255,68,68,0.22)', 'rgba(255,111,60,0.06)', 'rgba(0,0,0,0)']}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.scoutHeroTopRow}>
          <Text style={styles.scoutHeroEyebrow}>SCOUTING REPORT</Text>
          <View style={styles.threatPill}>
            <View style={styles.threatDot} />
            <Text style={styles.threatPillText}>{OPPONENT.threat.level} THREAT</Text>
          </View>
        </View>
        <View style={styles.scoutHeroMatchup}>
          <View style={styles.scoutHeroTeamCol}>
            <View style={[styles.scoutHeroLogo, { backgroundColor: 'rgba(255,111,60,0.16)', borderColor: 'rgba(255,111,60,0.35)' }]}>
              <Text style={[styles.scoutHeroLogoText, { color: ACCENT }]}>P</Text>
            </View>
            <Text style={styles.scoutHeroTeamLabel}>US</Text>
          </View>
          <View style={styles.scoutHeroVs}>
            <Text style={styles.scoutHeroVsText}>VS</Text>
          </View>
          <View style={styles.scoutHeroTeamCol}>
            <View style={styles.scoutHeroLogo}>
              <Text style={styles.scoutHeroLogoText}>{OPPONENT.logoInitial}</Text>
            </View>
            <Text style={styles.scoutHeroTeamLabel}>{OPPONENT.name.toUpperCase().split(' ').slice(0, 2).join(' ')}</Text>
          </View>
        </View>
        <Text style={styles.scoutHeroOppName}>{OPPONENT.name}</Text>
        <Text style={styles.scoutHeroOppMeta}>
          {OPPONENT.record} · {OPPONENT.rank} · {OPPONENT.city}
        </Text>
        <View style={styles.scoutHeroDivider} />
        <View style={styles.scoutHeroFooter}>
          <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.7)" />
          <Text style={styles.scoutHeroFooterText}>{OPPONENT.nextGameDate}</Text>
          <View style={styles.scoutHeroFooterDot} />
          <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.7)" />
          <Text style={styles.scoutHeroFooterText} numberOfLines={1}>{OPPONENT.venue}</Text>
        </View>
        <Text style={styles.scoutThreatReason}>{OPPONENT.threat.reason}</Text>
      </Animated.View>

      {/* Matchup stats grid */}
      <Text style={styles.sectionLabel}>MATCHUP · SEASON AVERAGES</Text>
      <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.statsGrid}>
        {OPPONENT.matchupStats.map((s) => {
          const usBetter =
            s.betterIs === 'high' ? s.us > s.them : s.us < s.them;
          const fmt = (v: number) =>
            s.fmt === 'pct' ? `${v.toFixed(1)}%` : v.toFixed(1);
          return (
            <View key={s.label} style={styles.statCell}>
              <Text style={styles.statCellLabel}>{s.label}</Text>
              <View style={styles.statCellRow}>
                <Text style={[styles.statCellValue, usBetter && { color: '#34C759' }]}>{fmt(s.us)}</Text>
                <Text style={styles.statCellSep}>vs</Text>
                <Text style={[styles.statCellValue, !usBetter && { color: '#FF4444' }]}>{fmt(s.them)}</Text>
              </View>
              <Text style={styles.statCellLegend}>US · THEM</Text>
            </View>
          );
        })}
      </Animated.View>

      {/* Top 3 tendencies */}
      <Text style={styles.sectionLabel}>TOP 3 TENDENCIES</Text>
      {OPPONENT.tendencies.map((t, i) => {
        const tone = TENDENCY_COLOR[t.category] ?? ACCENT;
        return (
          <Animated.View
            key={t.id}
            entering={FadeInDown.delay(100 + i * 80).duration(400)}
            style={styles.tendencyCardV2}
          >
            <View style={[styles.tendencyAccent, { backgroundColor: tone }]} />
            <View style={{ flex: 1, paddingLeft: 14, paddingRight: 12, paddingVertical: 14 }}>
              <View style={styles.tendencyTopRow}>
                <View style={[styles.categoryPill, { backgroundColor: `${tone}26`, borderColor: `${tone}55` }]}>
                  <Text style={[styles.categoryPillText, { color: tone }]}>{t.category}</Text>
                </View>
                <View style={styles.pppPill}>
                  <Text style={styles.pppPillLabel}>PPP</Text>
                  <Text style={styles.pppPillValue}>{t.ppp}</Text>
                </View>
              </View>
              <Text style={styles.tendencyTitle}>{t.title}</Text>
              <Text style={styles.tendencyDetail}>{t.detail}</Text>
              <View style={styles.tendencyClipsBtn}>
                <Ionicons name="play-circle" size={14} color="#FFFFFF" />
                <Text style={styles.tendencyClipsText}>Watch {t.clipCount} clips</Text>
              </View>
            </View>
          </Animated.View>
        );
      })}

      {/* Key player */}
      <Text style={styles.sectionLabel}>THEIR KEY PLAYER</Text>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.keyPlayerCardV2}>
        <View style={styles.keyPlayerHeadV2}>
          <View style={styles.jerseyBadge}>
            <Text style={styles.jerseyHash}>#</Text>
            <Text style={styles.jerseyNumber}>{OPPONENT.keyPlayer.number}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.keyPlayerName}>{OPPONENT.keyPlayer.name}</Text>
            <Text style={styles.keyPlayerMeta}>{OPPONENT.keyPlayer.position}</Text>
            <Text style={styles.keyPlayerStats}>{OPPONENT.keyPlayer.stats}</Text>
          </View>
        </View>
        <View style={styles.keyPlayerSubLabel}>
          <Ionicons name="shield-half-outline" size={12} color={ACCENT} />
          <Text style={styles.keyPlayerSubLabelText}>DEFENSIVE PRIORITIES</Text>
        </View>
        {playerBullets.map((t, idx) => (
          <View key={idx} style={styles.priorityRow}>
            <View style={styles.priorityNum}>
              <Text style={styles.priorityNumText}>{idx + 1}</Text>
            </View>
            <Text style={styles.priorityText}>{t}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Predicted plays */}
      <Text style={styles.sectionLabel}>PREDICTED PLAY CALLS</Text>
      <View style={styles.playsCard}>
        {sortedPlays.map((p, i) => (
          <View
            key={p.name}
            style={[styles.playRowV2, i !== sortedPlays.length - 1 && styles.playRowDivider]}
          >
            <View style={styles.playRankBadge}>
              <Text style={styles.playRankText}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.playName}>{p.name}</Text>
              <View style={styles.playBarTrack}>
                <LinearGradient
                  colors={['#FF6F3C', '#FF4444']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.playBarFillV2, { width: `${p.likelihood}%` }]}
                />
              </View>
            </View>
            <Text style={styles.playLikelihoodV2}>{p.likelihood}%</Text>
          </View>
        ))}
      </View>

      {/* Adjustments */}
      <Text style={styles.sectionLabel}>RECOMMENDED ADJUSTMENTS</Text>
      <View style={{ gap: 10, marginBottom: 14 }}>
        {OPPONENT.adjustments.map((a, i) => {
          const pri = ADJUSTMENT_PRIORITY[Math.min(i, ADJUSTMENT_PRIORITY.length - 1)];
          return (
            <Animated.View
              key={i}
              entering={FadeInDown.delay(80 + i * 60).duration(380)}
              style={styles.adjustmentCardV2}
            >
              <View
                style={[
                  styles.adjustmentPriPill,
                  { backgroundColor: pri.bg, borderColor: pri.border },
                ]}
              >
                <Text style={[styles.adjustmentPriText, { color: pri.color }]}>{pri.label}</Text>
              </View>
              <Text style={styles.adjustmentText}>{a}</Text>
            </Animated.View>
          );
        })}
      </View>

      <Text style={styles.disclaimer}>{DEMO_META.generatedBy}</Text>
    </ScrollView>
  );
}

// ============================================================
// Tab 4 — Player Trends
// ============================================================

function TrendsTab({ insets }: { insets: number }) {
  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn.duration(300)} style={styles.kickerRow}>
        <Text style={styles.kickerTitle}>3 players flagged</Text>
        <Text style={styles.kickerSub}>AI-detected trends from last 10 games</Text>
      </Animated.View>
      {PLAYER_TRENDS.map((p, i) => (
        <Animated.View
          key={p.id}
          entering={FadeInDown.delay(i * 100).duration(400)}
        >
          <PlayerTrendCard trend={p} />
        </Animated.View>
      ))}
    </ScrollView>
  );
}

function PlayerTrendCard({ trend }: { trend: PlayerTrend }) {
  const trendColor =
    trend.trendDirection === 'up' ? '#34C759' : trend.trendDirection === 'down' ? '#FF4444' : ACCENT;
  const trendIcon: 'trending-up' | 'trending-down' | 'remove' =
    trend.trendDirection === 'up'
      ? 'trending-up'
      : trend.trendDirection === 'down'
        ? 'trending-down'
        : 'remove';

  return (
    <View style={styles.trendCard}>
      <View style={styles.trendHeadRow}>
        <View style={styles.trendAvatar}>
          <Text style={styles.trendAvatarText}>{trend.avatarInitial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.trendName}>
            #{trend.number} {trend.name}
          </Text>
          <Text style={styles.trendPos}>{trend.position}</Text>
        </View>
        <View style={[styles.trendDirPill, { borderColor: trendColor }]}>
          <Ionicons name={trendIcon} size={12} color={trendColor} />
          <Text style={[styles.trendDirText, { color: trendColor }]}>
            {trend.trendDirection.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.trendChartTitle}>{trend.chartTitle}</Text>
      <Text style={styles.trendChartSub}>{trend.chartSubtitle}</Text>

      <LineChart data={trend.data} color={trendColor} />

      <View style={styles.trendHeadline}>
        <Ionicons name="sparkles" size={14} color={ACCENT} />
        <Text style={styles.trendHeadlineText}>{trend.headline}</Text>
      </View>

      {trend.insights.map((ins, i) => (
        <View key={i} style={styles.trendBulletRow}>
          <View style={styles.bulletDot} />
          <Text style={styles.trendBullet}>{ins}</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.discussBtn} activeOpacity={0.7}>
        <Ionicons name="chatbubble-ellipses-outline" size={14} color="#FFFFFF" />
        <Text style={styles.discussBtnText}>Discuss with Player</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------- SVG line chart ----------

function LineChart({ data, color }: { data: number[]; color: string }) {
  const width = 320;
  const height = 100;
  const padding = 8;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = Math.max(max - min, 0.0001);
  const stepX = (width - padding * 2) / (data.length - 1);

  const points = data.map((v, i) => {
    const x = padding + i * stepX;
    const y = padding + (1 - (v - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const fillPath =
    linePath +
    ` L ${points[points.length - 1].x.toFixed(1)} ${height - padding} L ${points[0].x.toFixed(1)} ${height - padding} Z`;

  return (
    <View style={styles.chartWrap}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <Defs>
          <SvgGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.35" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </SvgGradient>
        </Defs>
        <Path d={fillPath} fill="url(#trendFill)" />
        <Path
          d={linePath}
          stroke={color}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 ? 4 : 2}
            fill={i === points.length - 1 ? color : 'rgba(255,255,255,0.5)'}
            stroke={i === points.length - 1 ? '#0A0B0D' : 'transparent'}
            strokeWidth={i === points.length - 1 ? 2 : 0}
          />
        ))}
      </Svg>
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CANVAS },

  // Sub-tab pill switcher (Patterns | Trends inside Insights tab)
  subTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  subTab: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  subTabActive: { borderBottomColor: ACCENT },
  subTabLabel: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.55)' },
  subTabLabelActive: { color: '#FFF', fontWeight: '700' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,111,60,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.35)',
  },
  demoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT },
  demoPillText: {
    fontSize: 10,
    color: ACCENT,
    letterSpacing: 0.8,
    fontWeight: '700',
  },

  tabRow: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 14,
    gap: 8,
    alignItems: 'center',
  },
  tabPill: {
    paddingHorizontal: 16,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tabPillActive: {
    backgroundColor: 'rgba(255,111,60,0.12)',
    borderColor: 'rgba(255,111,60,0.4)',
  },
  tabPillText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
  tabPillTextActive: { color: '#FF6F3C', fontWeight: '700' },

  // Floating bottom row — profile pill + segmented tabs (matches player activity)
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
    zIndex: 99,
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
    backgroundColor: 'rgba(255,255,255,0.22)',
  },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 4 },

  // Scoreboard
  scoreboardCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.25)',
    padding: 18,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: CARD_BG,
  },
  scoreboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.35)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF4444' },
  liveText: { fontSize: 10, color: '#FF4444', fontWeight: '700', letterSpacing: 0.5 },
  clockText: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },
  possessionPill: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,111,60,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.3)',
  },
  possessionText: { fontSize: 9.5, color: ACCENT, fontWeight: '700', letterSpacing: 0.5 },

  scoreRow: { flexDirection: 'row', alignItems: 'center' },
  teamBlock: { flex: 1, alignItems: 'center', gap: 4 },
  teamName: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  teamScore: { fontSize: 52, color: '#FFFFFF', fontWeight: '800', lineHeight: 58 },
  teamMeta: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  scoreDash: { fontSize: 28, color: 'rgba(255,255,255,0.3)', marginHorizontal: 8 },

  // Pause alerts
  alertsToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    marginBottom: 14,
  },
  alertsToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertsToggleLabel: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },

  // Insight card
  insightCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 14,
    marginBottom: 10,
    overflow: 'hidden',
    backgroundColor: CARD_BG,
  },
  insightCardTop: { borderColor: 'rgba(255,111,60,0.4)' },
  insightTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  insightIcon: { fontSize: 18 },
  insightTags: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  urgencyDot: { width: 6, height: 6, borderRadius: 3 },
  insightCategory: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  insightConfidence: { fontSize: 13, color: '#FFFFFF', fontWeight: '700' },
  insightText: { fontSize: 14, color: '#FFFFFF', lineHeight: 20, marginBottom: 10 },
  confidenceBarTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: 10,
  },
  confidenceBarFill: { height: 3, borderRadius: 2 },
  insightFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  insightTimestamp: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  voteRow: { flexDirection: 'row', gap: 10 },
  voteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },

  // Patterns
  kickerRow: { marginBottom: 14 },
  kickerTitle: { fontSize: 16, color: '#FFFFFF', fontWeight: '700' },
  kickerSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3 },
  patternCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 14,
    marginBottom: 10,
    backgroundColor: CARD_BG,
  },
  patternTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  patternCategory: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,111,60,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.3)',
  },
  patternCategoryText: {
    fontSize: 9.5,
    color: ACCENT,
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  patternConfidence: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  patternHeadline: { fontSize: 15, color: '#FFFFFF', lineHeight: 21, marginBottom: 8 },
  patternEvidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  patternEvidence: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  patternBarTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: 10,
  },
  patternBarFill: { height: 3, borderRadius: 2, backgroundColor: ACCENT },
  patternFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  patternFooterMeta: { fontSize: 11, color: 'rgba(255,255,255,0.45)' },
  evidenceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,111,60,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.28)',
  },
  evidenceBtnText: { fontSize: 11.5, color: ACCENT, fontWeight: '700' },

  // Evidence modal
  evidenceBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  evidenceModal: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0F1012',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 8,
  },
  evidenceTitle: { fontSize: 17, color: '#FFFFFF', fontWeight: '700', marginTop: 4 },
  evidenceSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },
  evidenceClose: {
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  evidenceCloseText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  // Scout — hero
  scoutHero: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.30)',
    padding: 18,
    overflow: 'hidden',
    marginBottom: 18,
    backgroundColor: CARD_BG,
  },
  scoutHeroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  scoutHeroEyebrow: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '800', letterSpacing: 1.5 },
  threatPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,68,68,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,68,68,0.50)',
  },
  threatDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF4444' },
  threatPillText: { fontSize: 10, color: '#FF4444', fontWeight: '900', letterSpacing: 0.6 },
  scoutHeroMatchup: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    marginBottom: 14,
  },
  scoutHeroTeamCol: { alignItems: 'center', gap: 6, flex: 1 },
  scoutHeroLogo: {
    width: 60, height: 60, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1a1b1e',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  scoutHeroLogoText: { fontSize: 26, color: '#FFF', fontWeight: '900' },
  scoutHeroTeamLabel: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '800', letterSpacing: 1.2 },
  scoutHeroVs: { paddingHorizontal: 4 },
  scoutHeroVsText: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '900', letterSpacing: 1.5 },
  scoutHeroOppName: { fontSize: 18, color: '#FFF', fontWeight: '800', textAlign: 'center' },
  scoutHeroOppMeta: { fontSize: 12, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 3 },
  scoutHeroDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 14 },
  scoutHeroFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  scoutHeroFooterText: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  scoutHeroFooterDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.35)', marginHorizontal: 6 },
  scoutThreatReason: { fontSize: 11, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 10, fontStyle: 'italic' },

  // Scout — stats grid
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    marginBottom: 18,
  },
  statCell: {
    width: '48%',
    flexGrow: 1,
    minWidth: 150,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 6,
  },
  statCellLabel: { fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: '800', letterSpacing: 1.2 },
  statCellRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  statCellValue: { fontSize: 18, color: '#FFF', fontWeight: '800', fontVariant: ['tabular-nums'] },
  statCellSep: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '700' },
  statCellLegend: { fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.8, fontWeight: '700' },

  // Scout — tendencies v2
  tendencyCardV2: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    marginBottom: 10,
    overflow: 'hidden',
  },
  tendencyAccent: { width: 4 },
  tendencyTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  categoryPill: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  categoryPillText: { fontSize: 9.5, fontWeight: '900', letterSpacing: 0.8 },
  pppPill: {
    flexDirection: 'row', alignItems: 'baseline', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  pppPillLabel: { fontSize: 8, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.6, fontWeight: '800' },
  pppPillValue: { fontSize: 11, color: '#FFF', fontWeight: '800', fontVariant: ['tabular-nums'] },
  tendencyClipsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  tendencyClipsText: { fontSize: 11, color: '#FFF', fontWeight: '700' },

  // Scout — key player v2
  keyPlayerCardV2: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 14,
    backgroundColor: CARD_BG,
    marginBottom: 18,
  },
  keyPlayerHeadV2: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  jerseyBadge: {
    width: 64, height: 64,
    borderRadius: 14,
    backgroundColor: 'rgba(255,111,60,0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,111,60,0.4)',
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 1,
  },
  jerseyHash: { fontSize: 14, color: ACCENT, fontWeight: '800', opacity: 0.7 },
  jerseyNumber: { fontSize: 26, color: ACCENT, fontWeight: '900', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  keyPlayerSubLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingTop: 10, paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.10)',
  },
  keyPlayerSubLabelText: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '800', letterSpacing: 1.2 },
  priorityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  priorityNum: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,111,60,0.16)',
    borderWidth: 1, borderColor: 'rgba(255,111,60,0.35)',
    marginTop: 1,
  },
  priorityNumText: { fontSize: 11, color: ACCENT, fontWeight: '800' },
  priorityText: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 18 },

  // Scout — predicted plays v2
  playRowV2: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  playRankBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  playRankText: { fontSize: 11, color: '#FFF', fontWeight: '800' },
  playBarFillV2: { height: 5, borderRadius: 3 },
  playLikelihoodV2: {
    width: 44, fontSize: 13, color: '#FFF', fontWeight: '800',
    textAlign: 'right', fontVariant: ['tabular-nums'],
  },

  // Scout — adjustments v2
  adjustmentCardV2: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    paddingVertical: 14, paddingHorizontal: 14,
  },
  adjustmentPriPill: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 60,
    alignItems: 'center',
  },
  adjustmentPriText: { fontSize: 9.5, fontWeight: '900', letterSpacing: 0.8 },

  // Scout — legacy (kept; unused by new layout)
  scoutHeaderCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.25)',
    padding: 18,
    overflow: 'hidden',
    marginBottom: 18,
    backgroundColor: CARD_BG,
  },
  scoutHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  opponentLogo: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#1a1b1e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  opponentLogoText: { fontSize: 26, color: '#FFFFFF', fontWeight: '800' },
  opponentName: { fontSize: 18, color: '#FFFFFF', fontWeight: '700' },
  opponentMeta: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  scoutNextGame: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  scoutNextGameText: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
  scoutNextGameVenue: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },

  sectionLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.8,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 6,
  },

  tendencyCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    marginBottom: 10,
  },
  tendencyThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#1a1b1e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CARD_BORDER,
    gap: 4,
  },
  tendencyThumbLabel: {
    fontSize: 8.5,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  tendencyTitle: { fontSize: 14, color: '#FFFFFF', fontWeight: '700', marginBottom: 4 },
  tendencyDetail: { fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 17 },

  keyPlayerCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 14,
    backgroundColor: CARD_BG,
    marginBottom: 18,
  },
  keyPlayerHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  keyPlayerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(255,111,60,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyPlayerAvatarText: { fontSize: 14, color: ACCENT, fontWeight: '800' },
  keyPlayerName: { fontSize: 16, color: '#FFFFFF', fontWeight: '700' },
  keyPlayerMeta: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  keyPlayerStats: { fontSize: 12, color: ACCENT, marginTop: 3, fontWeight: '600' },
  keyPlayerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 12,
  },
  keyPlayerBulletRow: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
  keyPlayerBullet: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: ACCENT,
    marginTop: 7,
  },

  playsCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    marginBottom: 18,
    overflow: 'hidden',
  },
  playRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  playRowDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  playName: { width: 130, fontSize: 12.5, color: '#FFFFFF', fontWeight: '500' },
  playBarTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  playBarFill: { height: 4, borderRadius: 2, backgroundColor: ACCENT },
  playLikelihood: { width: 36, fontSize: 12, color: '#FFFFFF', fontWeight: '700', textAlign: 'right' },

  adjustmentsCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 14,
    backgroundColor: CARD_BG,
    gap: 10,
    marginBottom: 12,
  },
  adjustmentRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  adjustmentNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,111,60,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustmentNumberText: { fontSize: 11, color: ACCENT, fontWeight: '800' },
  adjustmentText: { flex: 1, fontSize: 13, color: '#FFFFFF', lineHeight: 18 },

  disclaimer: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
  },

  // Trends
  trendCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 14,
    backgroundColor: CARD_BG,
    marginBottom: 14,
  },
  trendHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  trendAvatar: {
    width: 46,
    height: 46,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: CARD_BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendAvatarText: { fontSize: 14, color: '#FFFFFF', fontWeight: '700' },
  trendName: { fontSize: 15, color: '#FFFFFF', fontWeight: '700' },
  trendPos: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  trendDirPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  trendDirText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  trendChartTitle: { fontSize: 13, color: '#FFFFFF', fontWeight: '700' },
  trendChartSub: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2, marginBottom: 8 },
  chartWrap: { marginBottom: 14 },

  trendHeadline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  trendHeadlineText: { flex: 1, fontSize: 13, color: ACCENT, fontWeight: '600' },
  trendBulletRow: { flexDirection: 'row', gap: 10, marginBottom: 7, alignItems: 'flex-start' },
  trendBullet: { flex: 1, fontSize: 12.5, color: 'rgba(255,255,255,0.78)', lineHeight: 17 },

  discussBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  discussBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

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
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99,
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
  },
  toolbarPillText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  // ── Live button (in Insights tab) ────────────────────────
  liveButtonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,68,68,0.10)',
    borderColor: 'rgba(255,68,68,0.40)',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  liveButtonDotWrap: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,68,68,0.20)',
  },
  liveButtonDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF4444' },
  liveButtonTitle: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
  liveButtonSubtitle: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 },
  liveButtonScore: { color: '#FFF', fontSize: 16, fontWeight: '900', fontVariant: ['tabular-nums'], marginRight: 4 },

  // Live full-screen header
  liveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  liveBackBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  liveHeaderTitle: { color: '#FFF', fontSize: 17, fontWeight: '800' },

  // ── Roster tab ────────────────────────────────────────────
  rosterTeamCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  rosterTeamHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rosterTeamLogo: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: ACCENT,
    alignItems: 'center', justifyContent: 'center',
  },
  rosterTeamLogoText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: -0.3 },
  rosterTeamName: { color: '#FFF', fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  rosterTeamMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 },
  rosterTeamStatsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)' },
  rosterTeamStat: { flex: 1, alignItems: 'center' },
  rosterTeamStatValue: { color: '#FFF', fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  rosterTeamStatLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '600', marginTop: 2 },
  rosterTeamStatDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.10)' },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  rosterAvatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  rosterAvatarText: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: -0.3 },
  rosterAvatarSmall: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  rosterAvatarTextSmall: { color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: -0.2 },
  rosterAvatarLg: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  rosterAvatarLgText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  rosterNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rosterName: { color: '#FFF', fontSize: 14, fontWeight: '700', flexShrink: 1 },
  rosterMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 1 },
  rosterStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rosterStatusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  rosterStatBlock: { alignItems: 'center', minWidth: 36 },
  rosterStatBig: { color: '#FFF', fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
  rosterStatSmall: { color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: '600', marginTop: 1 },

  // Practice tracking
  practiceHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  practiceUnverifiedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,214,10,0.15)',
    borderColor: 'rgba(255,214,10,0.45)',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
  },
  practiceUnverifiedText: { color: '#FFD60A', fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  practiceSummaryCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  practiceSummaryRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  practiceSummaryStat: { flex: 1, alignItems: 'center' },
  practiceSummaryValue: { color: '#FFF', fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  practiceSummaryLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '600', marginTop: 2 },
  practiceRow: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    padding: 12,
    marginTop: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  practiceRowHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  practiceRowName: { flex: 1, color: '#FFF', fontSize: 13, fontWeight: '700' },
  practiceRowTotal: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontVariant: ['tabular-nums'] },
  practiceZoneRow: { flexDirection: 'row', marginTop: 10, gap: 8 },
  practiceZone: {
    flex: 1, alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  practiceZoneLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  practiceZonePct: { fontSize: 14, fontWeight: '800', marginTop: 2, fontVariant: ['tabular-nums'] },
  practiceZoneAtt: { color: 'rgba(255,255,255,0.45)', fontSize: 9, marginTop: 1, fontVariant: ['tabular-nums'] },
  practiceProviderCard: {
    backgroundColor: 'rgba(255,111,60,0.06)',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,111,60,0.25)',
  },
  practiceProviderHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  practiceProviderTitle: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  practiceProviderBody: { color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 17, marginTop: 6, marginBottom: 8 },
  practiceProviderRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingVertical: 4 },
  practiceProviderName: { color: '#FFF', fontSize: 12, fontWeight: '700', minWidth: 96 },
  practiceProviderDetail: { flex: 1, color: 'rgba(255,255,255,0.55)', fontSize: 11 },

  // Roster player sheet
  rosterSheetBackdrop: { flex: 1, justifyContent: 'flex-end' },
  rosterSheet: {
    backgroundColor: '#0F1012',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 16,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rosterSheetHandle: {
    width: 38, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center', marginTop: -6, marginBottom: 12,
  },
  rosterSheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  rosterSheetName: { color: '#FFF', fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  rosterSheetMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 },
  rosterSheetStatusNote: { color: '#FFD60A', fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  sheetStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: 4 },
  sheetStatCell: {
    width: '23%',
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sheetStatCellValue: { color: '#FFF', fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  sheetStatCellLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: '700', marginTop: 2 },
});
