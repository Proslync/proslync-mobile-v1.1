import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from 'expo-glass-effect';
import * as React from 'react';
import {
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
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Path,
  Stop,
} from 'react-native-svg';

import {
  DEMO_META,
  LIVE_GAME,
  OPPONENT,
  PATTERNS,
  PLAYER_TRENDS,
  ROTATING_INSIGHTS,
  type AIInsight,
  type Pattern,
  type PlayerTrend,
} from '@/lib/data/mock-coach-data';
import { liquidGlass } from '@/constants/glass/liquid-glass';

const ACCENT = '#FF6F3C';
const CARD_BG = 'rgba(255,255,255,0.05)';
const CARD_BORDER = 'rgba(255,255,255,0.09)';

type TabKey = 'live' | 'patterns' | 'scout' | 'trends';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'live', label: 'Live Game' },
  { key: 'patterns', label: 'Patterns' },
  { key: 'scout', label: 'Opponent Scout' },
  { key: 'trends', label: 'Player Trends' },
];

export function CoachView() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState<TabKey>('live');

  return (
    <View style={[styles.container, { paddingTop: insets.top + 4 }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Coach Dashboard</Text>
          <Text style={styles.headerSubtitle}>{DEMO_META.team} · {DEMO_META.season}</Text>
        </View>
        <View style={styles.demoPill}>
          <View style={styles.demoDot} />
          <Text style={styles.demoPillText}>DEMO MODE</Text>
        </View>
      </View>

      {/* Tab row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabPill, active && styles.tabPillActive]}
            >
              <Text style={[styles.tabPillText, active && styles.tabPillTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tab content */}
      {activeTab === 'live' && <LiveGameTab insets={insets.bottom} />}
      {activeTab === 'patterns' && <PatternsTab insets={insets.bottom} />}
      {activeTab === 'scout' && <ScoutTab insets={insets.bottom} />}
      {activeTab === 'trends' && <TrendsTab insets={insets.bottom} />}
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
// Tab 2 — Patterns
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
// Tab 3 — Opponent Scout
// ============================================================

function ScoutTab({ insets }: { insets: number }) {
  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Opponent header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.scoutHeaderCard}>
        <LinearGradient
          colors={['rgba(255,111,60,0.2)', 'rgba(255,111,60,0)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.scoutHeaderRow}>
          <View style={styles.opponentLogo}>
            <Text style={styles.opponentLogoText}>{OPPONENT.logoInitial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.opponentName}>{OPPONENT.name}</Text>
            <Text style={styles.opponentMeta}>
              {OPPONENT.record} · {OPPONENT.rank} · {OPPONENT.city}
            </Text>
          </View>
        </View>
        <View style={styles.scoutNextGame}>
          <Ionicons name="calendar-outline" size={14} color={ACCENT} />
          <Text style={styles.scoutNextGameText}>{OPPONENT.nextGameDate}</Text>
          <Text style={styles.scoutNextGameVenue}>· {OPPONENT.venue}</Text>
        </View>
      </Animated.View>

      {/* Top 3 tendencies */}
      <Text style={styles.sectionLabel}>TOP 3 TENDENCIES</Text>
      {OPPONENT.tendencies.map((t, i) => (
        <Animated.View
          key={t.id}
          entering={FadeInDown.delay(100 + i * 80).duration(400)}
          style={styles.tendencyCard}
        >
          <View style={styles.tendencyThumb}>
            <Ionicons name="play" size={22} color="#FFFFFF" />
            <Text style={styles.tendencyThumbLabel}>{t.clipLabel}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tendencyTitle}>{t.title}</Text>
            <Text style={styles.tendencyDetail}>{t.detail}</Text>
          </View>
        </Animated.View>
      ))}

      {/* Key player */}
      <Text style={styles.sectionLabel}>THEIR KEY PLAYER</Text>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.keyPlayerCard}>
        <View style={styles.keyPlayerHead}>
          <View style={styles.keyPlayerAvatar}>
            <Text style={styles.keyPlayerAvatarText}>#{OPPONENT.keyPlayer.number}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.keyPlayerName}>{OPPONENT.keyPlayer.name}</Text>
            <Text style={styles.keyPlayerMeta}>{OPPONENT.keyPlayer.position}</Text>
            <Text style={styles.keyPlayerStats}>{OPPONENT.keyPlayer.stats}</Text>
          </View>
        </View>
        <View style={styles.keyPlayerDivider} />
        {OPPONENT.keyPlayer.tendencies.map((t, idx) => (
          <View key={idx} style={styles.keyPlayerBulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.keyPlayerBullet}>{t}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Predicted plays */}
      <Text style={styles.sectionLabel}>PREDICTED PLAY CALLS</Text>
      <View style={styles.playsCard}>
        {OPPONENT.predictedPlays.map((p, i) => (
          <View
            key={p.name}
            style={[styles.playRow, i !== OPPONENT.predictedPlays.length - 1 && styles.playRowDivider]}
          >
            <Text style={styles.playName}>{p.name}</Text>
            <View style={styles.playBarTrack}>
              <View style={[styles.playBarFill, { width: `${p.likelihood}%` }]} />
            </View>
            <Text style={styles.playLikelihood}>{p.likelihood}%</Text>
          </View>
        ))}
      </View>

      {/* Adjustments */}
      <Text style={styles.sectionLabel}>RECOMMENDED ADJUSTMENTS</Text>
      <View style={styles.adjustmentsCard}>
        {OPPONENT.adjustments.map((a, i) => (
          <View key={i} style={styles.adjustmentRow}>
            <View style={styles.adjustmentNumber}>
              <Text style={styles.adjustmentNumberText}>{i + 1}</Text>
            </View>
            <Text style={styles.adjustmentText}>{a}</Text>
          </View>
        ))}
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
  container: { flex: 1, backgroundColor: '#000000' },

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
    fontSize: 13,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
  },
  tabPillTextActive: { color: '#FFFFFF', fontWeight: '700' },

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

  // Scout
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
});
