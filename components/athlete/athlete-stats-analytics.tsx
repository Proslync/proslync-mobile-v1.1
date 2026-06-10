// Athlete Stats analytics — extracted from athlete-view.tsx for the R5 remix.
// Self-contained: includes the analytic cards (player hero, metric, recent
// games, peer compare), the score breakdown sheet, and all supporting data
// + styles. Surfaces three top-level components:
//   - PlayerStatsAnalytics
//   - GameLogAnalytics
//   - PeerCompareAnalytics
import * as React from 'react';
import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, G, Line, Rect } from 'react-native-svg';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

// ── Mock data ───────────────────────────────────────────────────

const SEASON_AVG = { ppg: 14.2, rpg: 3.8, apg: 3.1, spg: 1.1, fgPct: 46.1, threePct: 36.4, ftPct: 82.3, mpg: 28.4 };

export const GAME_LOG = [
  { id: 'gl-1', opponent: 'vs Duke', result: 'W 74-68', line: '21 PTS · 4 REB · 3 AST · 7-13 FG · 4-7 3P', date: 'Tue 4/22' },
  { id: 'gl-2', opponent: '@ Miami', result: 'W 72-69', line: '18 PTS · 2 REB · 4 AST · 6-11 FG · 3-5 3P', date: 'Sat 4/19' },
  { id: 'gl-3', opponent: 'vs Georgia Tech', result: 'L 65-70', line: '11 PTS · 5 REB · 2 AST · 4-10 FG', date: 'Thu 4/17' },
  { id: 'gl-4', opponent: 'vs Virginia Tech', result: 'W 78-71', line: '5 PTS · 3 REB · 2 AST · 2-6 FG', date: 'Tue 4/15' },
  { id: 'gl-5', opponent: '@ North Carolina', result: 'L 70-81', line: '10 PTS · 2 REB · 10-min night', date: 'Sat 4/12' },
  { id: 'gl-6', opponent: '@ #3 Duke', result: 'L 54-72', line: '6 PTS · 1 REB · 18 MIN', date: 'Wed 4/9' },
];

const PEER_COMP = [
  { label: 'PTS / game', you: '14.2', avg: '9.8', best: '18.4', delta: '+45%', positive: true },
  { label: 'FG %', you: '46.1%', avg: '42.8%', best: '51.2%', delta: '+8%', positive: true },
  { label: '3PT %', you: '36.4%', avg: '32.7%', best: '41.8%', delta: '+11%', positive: true },
  { label: 'AST / game', you: '3.1', avg: '2.4', best: '4.8', delta: '+29%', positive: true },
  { label: 'Minutes', you: '28.4', avg: '24.6', best: '32.1', delta: '+15%', positive: true },
];

const STATS_YELLOW = '#EB621A';
const STATS_CARD_BG = '#1C1C1E';
const STATS_FEMALE_GREY = 'rgba(255,255,255,0.35)';

// ── PlayerStatsAnalytics ────────────────────────────────────────

export function PlayerStatsAnalytics() {
  const ppg = SEASON_AVG.ppg;
  const fgPct = SEASON_AVG.fgPct;
  // Composite "stat rating" 0-100 — back-of-envelope from PPG + FG% + AST
  const score = Math.min(99, Math.round((ppg * 2.4) + (fgPct * 0.5) + (SEASON_AVG.apg * 3)));
  const [scoreSheetOpen, setScoreSheetOpen] = useState(false);

  return (
    <View style={{ gap: 10 }}>
      <PlayerHeroIdentityCard score={score} onScorePress={() => setScoreSheetOpen(true)} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <StatsMetricCard label="Points / Game" value={ppg.toFixed(1)} delta={+1.4} topPct={12} />
        </View>
        <View style={{ flex: 1 }}>
          <StatsMetricCard label="FG %" value={`${fgPct.toFixed(1)}%`} delta={+0.8} topPct={18} />
        </View>
      </View>
      <RecentGamesCard />
      <PeerComparisonChartCard />
      <ScoreBreakdownSheet
        score={score}
        visible={scoreSheetOpen}
        onClose={() => setScoreSheetOpen(false)}
      />
    </View>
  );
}

function PlayerHeroIdentityCard({
  score,
  onScorePress,
}: {
  score: number;
  onScorePress: () => void;
}) {
  return (
    <View style={statsCardStyles.heroCard}>
      <View style={statsCardStyles.heroLeft}>
        <View style={statsCardStyles.heroAvatarWrap}>
          <Image
            source={require('@/assets/images/kiyan-avatar.png')}
            style={statsCardStyles.heroAvatar}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={statsCardStyles.heroName} numberOfLines={1}>Kiyan Anthony</Text>
          <View style={statsCardStyles.sportRow}>
            <MaterialCommunityIcons name="basketball" size={14} color={STATS_YELLOW} />
            <Text style={statsCardStyles.heroSport}>Basketball · Syracuse</Text>
          </View>
        </View>
      </View>
      <Pressable
        onPress={onScorePress}
        accessibilityRole="button"
        accessibilityLabel="View score breakdown"
        accessibilityHint="Opens a breakdown of the factors making up this score"
        hitSlop={8}
        style={({ pressed }) => [statsCardStyles.scoreTouchable, { opacity: pressed ? 0.7 : 1 }]}
      >
        <StatScoreGauge score={score} />
        <View style={statsCardStyles.scoreInfoBadge} pointerEvents="none">
          <Ionicons name="information" size={11} color="#FFF" />
        </View>
      </Pressable>
    </View>
  );
}

// ── Score breakdown sheet ───────────────────────────────────────

type ScoreFactor = {
  key: string;
  name: string;
  score: number;
  weight: number;
  description: string;
  detail: string;
};

const SCORE_FACTORS: ScoreFactor[] = [
  {
    key: 'performance',
    name: 'Performance',
    score: 78,
    weight: 30,
    description: 'On-court output: PPG, FG%, AST, advanced metrics, win contribution.',
    detail: '20.1 PPG and 4.6 APG — top quartile of ACC freshmen.',
  },
  {
    key: 'engagement',
    name: 'Fan Engagement',
    score: 84,
    weight: 25,
    description: 'Reach, post engagement rate, comment quality, growth velocity.',
    detail: '7.9% engagement rate beats the 4.2% NIL average.',
  },
  {
    key: 'audience',
    name: 'Audience Quality',
    score: 71,
    weight: 20,
    description: 'Demographic alignment, geographic spread, audience depth and authenticity.',
    detail: '40% Gen Z; strong 18–34 skew, NYC + Northeast concentration.',
  },
  {
    key: 'brand',
    name: 'Brand Fit',
    score: 66,
    weight: 15,
    description: 'Alignment with verified brand archetypes and category demand.',
    detail: 'High match for athleticwear and energy categories; limited luxury alignment.',
  },
  {
    key: 'conversion',
    name: 'Conversion Potential',
    score: 58,
    weight: 10,
    description: 'Likelihood that fan attention converts to purchase, subscription, or attendance.',
    detail: 'CTR and lift data still developing; needs longer history.',
  },
];

function bandFor(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent', color: '#34C759' };
  if (score >= 65) return { label: 'Strong', color: STATS_YELLOW };
  if (score >= 50) return { label: 'Average', color: '#FFD60A' };
  return { label: 'Needs work', color: '#FF453A' };
}

const SCORE_SHEET_TRAVEL = 700;

function ScoreBreakdownSheet({
  score,
  visible,
  onClose,
}: {
  score: number;
  visible: boolean;
  onClose: () => void;
}) {
  const translateY = useSharedValue(SCORE_SHEET_TRAVEL);
  const backdropProgress = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      backdropProgress.value = withTiming(1, { duration: 280 });
      translateY.value = withTiming(0, { duration: 320 });
    }
  }, [visible]);

  const dismiss = React.useCallback(() => {
    translateY.value = withTiming(SCORE_SHEET_TRAVEL, { duration: 220 });
    backdropProgress.value = withTiming(0, { duration: 220 });
    setTimeout(onClose, 220);
  }, [onClose]);

  const panGesture = Gesture.Pan()
    .activeOffsetY(10)
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
        backdropProgress.value = 1 - Math.min(e.translationY / SCORE_SHEET_TRAVEL, 1);
      }
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 600) {
        translateY.value = withTiming(SCORE_SHEET_TRAVEL, { duration: 220 });
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={dismiss}
      statusBarTranslucent
    >
      <Animated.View style={[scoreSheetStyles.backdrop, backdropAnimStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        <Animated.View style={[scoreSheetStyles.sheet, sheetAnimStyle]}>
          <GestureDetector gesture={panGesture}>
            <View>
              <View style={scoreSheetStyles.handle} />
              <View style={scoreSheetStyles.header}>
                <View style={{ flex: 1 }}>
                  <Text style={scoreSheetStyles.title}>Score Breakdown</Text>
                  <Text style={scoreSheetStyles.subtitle}>
                    Your overall score of {score} is composed of these factors. Hover values reflect your current standing.
                  </Text>
                </View>
              </View>
            </View>
          </GestureDetector>
          <ScrollView style={scoreSheetStyles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
            {SCORE_FACTORS.map((factor) => {
              const band = bandFor(factor.score);
              return (
                <View key={factor.key} style={scoreSheetStyles.factorRow}>
                  <View style={scoreSheetStyles.factorHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={scoreSheetStyles.factorName}>{factor.name}</Text>
                      <Text style={scoreSheetStyles.factorWeight}>Weight {factor.weight}%</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={scoreSheetStyles.factorScore}>{factor.score}</Text>
                      <Text style={[scoreSheetStyles.factorBand, { color: band.color }]}>{band.label}</Text>
                    </View>
                  </View>
                  <View style={scoreSheetStyles.barTrack}>
                    <View style={[scoreSheetStyles.barFill, { width: `${factor.score}%`, backgroundColor: band.color }]} />
                  </View>
                  <Text style={scoreSheetStyles.factorDescription}>{factor.description}</Text>
                  <Text style={scoreSheetStyles.factorDetail}>{factor.detail}</Text>
                </View>
              );
            })}
            <View style={scoreSheetStyles.footnoteWrap}>
              <Ionicons name="sparkles-outline" size={14} color="rgba(255,255,255,0.55)" />
              <Text style={scoreSheetStyles.footnote}>
                Auto-calculated daily from performance, audience, and engagement signals. Influence your score by improving on-court output, growing engagement, and broadening your audience.
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function StatScoreGauge({ score }: { score: number }) {
  const size = 64;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const visible = 0.82;
  const dash = c * pct * visible;
  const gap = c - dash;
  return (
    <View style={statsCardStyles.gaugeWrap}>
      <Svg width={size} height={size}>
        <G rotation="-200" originX={size / 2} originY={size / 2}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.10)" strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={STATS_YELLOW}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      </Svg>
      <View style={statsCardStyles.gaugeCenter} pointerEvents="none">
        <Text style={statsCardStyles.gaugeText}>{score}</Text>
      </View>
    </View>
  );
}

function StatsMetricCard({
  label,
  value,
  delta,
  topPct,
}: {
  label: string;
  value: string;
  delta: number;
  topPct: number;
}) {
  return (
    <View style={statsCardStyles.metricCard}>
      <View style={statsCardStyles.metricLabelRow}>
        <Text style={statsCardStyles.metricLabel}>{label}</Text>
        <Ionicons name="information-circle-outline" size={13} color="rgba(255,255,255,0.4)" />
      </View>
      <View style={statsCardStyles.metricValueRow}>
        <Text style={statsCardStyles.metricValue}>{value}</Text>
        <View style={statsCardStyles.deltaPill}>
          <Ionicons name="arrow-up" size={10} color={STATS_YELLOW} style={{ transform: [{ rotate: '45deg' }] }} />
          <Text style={statsCardStyles.deltaText}>{delta.toFixed(2)}</Text>
        </View>
      </View>
      <View style={statsCardStyles.metricFooter}>
        <Text style={statsCardStyles.metricFooterText}>TOP {topPct}%</Text>
        <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.4)" />
      </View>
    </View>
  );
}

function RecentGamesCard() {
  // Parse points from each GAME_LOG line (e.g., "21 PTS · ...")
  const games = GAME_LOG.slice(0, 4).map((g) => {
    const ptsMatch = g.line.match(/(\d+)\s*PTS/);
    const pts = ptsMatch ? parseInt(ptsMatch[1], 10) : 0;
    const win = g.result.startsWith('W');
    return { id: g.id, opponent: g.opponent, pts, win, result: g.result };
  });
  const maxPts = games.reduce((m, x) => Math.max(m, x.pts), 0) || 1;

  return (
    <View style={statsCardStyles.bigCard}>
      <Text style={statsCardStyles.bigCardLabel}>Recent Games</Text>
      <View style={{ gap: 10, marginTop: 14 }}>
        {games.map((g) => {
          const widthPct = (g.pts / maxPts) * 100;
          return (
            <View key={g.id} style={statsCardStyles.gameRow}>
              <View style={statsCardStyles.gameHeaderRow}>
                <Text style={statsCardStyles.gameOpponent}>{g.opponent}</Text>
                <Text
                  style={[
                    statsCardStyles.gameResult,
                    { color: g.win ? '#34C759' : '#FF4444' },
                  ]}
                >
                  {g.result}
                </Text>
              </View>
              <View style={statsCardStyles.gameBarRow}>
                <View style={statsCardStyles.gameBarTrack}>
                  <View style={[statsCardStyles.gameBarFill, { width: `${widthPct}%` }]} />
                </View>
                <Text style={statsCardStyles.gamePts}>{g.pts} PTS</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function PeerComparisonChartCard() {
  // Use first 5 PEER_COMP rows; parse values to numbers
  const data = PEER_COMP.slice(0, 5).map((p) => ({
    label: p.label.replace(' / game', '').replace('PTS', 'PTS'),
    you: parseFloat(p.you.replace('%', '')),
    avg: parseFloat(p.avg.replace('%', '')),
  }));

  const width = 320;
  const height = 140;
  const padLeft = 30;
  const padRight = 8;
  const padTop = 14;
  const padBottom = 22;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;
  const max = Math.max(...data.flatMap((d) => [d.you, d.avg])) * 1.2;
  const groupW = innerW / data.length;
  const barW = (groupW - 8) / 2;

  return (
    <View style={statsCardStyles.bigCard}>
      <View style={statsCardStyles.headerRow}>
        <Text style={statsCardStyles.bigCardLabel}>vs ACC Freshmen</Text>
        <View style={statsCardStyles.legendRow}>
          <View style={[statsCardStyles.legendDot, { backgroundColor: STATS_YELLOW }]} />
          <Text style={statsCardStyles.legendText}>You</Text>
          <View style={[statsCardStyles.legendDot, { backgroundColor: STATS_FEMALE_GREY, marginLeft: 8 }]} />
          <Text style={statsCardStyles.legendText}>Avg</Text>
        </View>
      </View>
      <View style={{ marginTop: 14 }}>
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {[0, 0.5, 1].map((t) => {
            const yPos = padTop + innerH * (1 - t);
            return (
              <Line
                key={t}
                x1={padLeft}
                y1={yPos}
                x2={width - padRight}
                y2={yPos}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
            );
          })}
          {data.map((d, i) => {
            const groupX = padLeft + i * groupW + 4;
            const youH = (d.you / max) * innerH;
            const avgH = (d.avg / max) * innerH;
            return (
              <G key={d.label}>
                <Rect
                  x={groupX}
                  y={padTop + innerH - youH}
                  width={barW}
                  height={Math.max(youH, 1)}
                  fill={STATS_YELLOW}
                  rx={2}
                />
                <Rect
                  x={groupX + barW + 2}
                  y={padTop + innerH - avgH}
                  width={barW}
                  height={Math.max(avgH, 1)}
                  fill={STATS_FEMALE_GREY}
                  rx={2}
                />
              </G>
            );
          })}
        </Svg>
        <View style={statsCardStyles.barLabelsRow} pointerEvents="none">
          {data.map((d) => (
            <View key={d.label} style={statsCardStyles.bucketCol}>
              <View style={statsCardStyles.bucketValuesRow}>
                <Text style={statsCardStyles.bucketValue}>{d.you}</Text>
                <Text style={[statsCardStyles.bucketValue, { color: 'rgba(255,255,255,0.55)' }]}>{d.avg}</Text>
              </View>
              <Text style={statsCardStyles.bucketLabel} numberOfLines={1}>{d.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ── GameLogAnalytics ────────────────────────────────────────────

export function GameLogAnalytics() {
  const wins = GAME_LOG.filter((g) => g.result.startsWith('W')).length;
  const losses = GAME_LOG.length - wins;
  const recentForm = GAME_LOG.slice(0, 5).map((g) => (g.result.startsWith('W') ? 'W' : 'L'));
  const ptsList = GAME_LOG.map((g) => {
    const m = g.line.match(/(\d+)\s*PTS/);
    return m ? parseInt(m[1], 10) : 0;
  });
  const totalPts = ptsList.reduce((s, p) => s + p, 0);
  const avgPts = ptsList.length ? totalPts / ptsList.length : 0;
  const high = ptsList.length ? Math.max(...ptsList) : 0;
  const maxPts = high || 1;

  return (
    <View style={{ gap: 10 }}>
      {/* Hero summary */}
      <View style={statsCardStyles.heroCard}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={gameLogStyles.heroLabel}>SEASON RECORD</Text>
          <Text style={gameLogStyles.heroRecord}>
            {wins}–{losses}
          </Text>
          <View style={gameLogStyles.formRow}>
            <Text style={gameLogStyles.formLabel}>Last 5</Text>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {recentForm.map((r, i) => (
                <View
                  key={i}
                  style={[
                    gameLogStyles.formBadge,
                    {
                      backgroundColor: r === 'W' ? 'rgba(52,199,89,0.18)' : 'rgba(255,68,68,0.18)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      gameLogStyles.formBadgeText,
                      { color: r === 'W' ? '#34C759' : '#FF4444' },
                    ]}
                  >
                    {r}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        <View style={gameLogStyles.heroStatsCol}>
          <View style={gameLogStyles.heroStatBlock}>
            <Text style={gameLogStyles.heroStatValue}>{avgPts.toFixed(1)}</Text>
            <Text style={gameLogStyles.heroStatLabel}>AVG PTS</Text>
          </View>
          <View style={gameLogStyles.heroStatBlock}>
            <Text style={[gameLogStyles.heroStatValue, { color: STATS_YELLOW }]}>{high}</Text>
            <Text style={gameLogStyles.heroStatLabel}>SEASON HIGH</Text>
          </View>
        </View>
      </View>

      {/* Per-game cards */}
      {GAME_LOG.map((g, i) => {
        const win = g.result.startsWith('W');
        const pts = ptsList[i];
        const widthPct = (pts / maxPts) * 100;
        return (
          <View key={g.id} style={gameLogStyles.gameCard}>
            <View style={gameLogStyles.gameCardTop}>
              <View style={gameLogStyles.dateChip}>
                <Text style={gameLogStyles.dateChipText}>{g.date}</Text>
              </View>
              <Text style={gameLogStyles.gameOpponent} numberOfLines={1}>{g.opponent}</Text>
              <View
                style={[
                  gameLogStyles.resultPill,
                  {
                    backgroundColor: win ? 'rgba(52,199,89,0.16)' : 'rgba(255,68,68,0.16)',
                  },
                ]}
              >
                <Text
                  style={[
                    gameLogStyles.resultPillText,
                    { color: win ? '#34C759' : '#FF4444' },
                  ]}
                >
                  {g.result}
                </Text>
              </View>
            </View>
            <View style={gameLogStyles.gameBarRow}>
              <View style={gameLogStyles.gameBarTrack}>
                <View
                  style={[
                    gameLogStyles.gameBarFill,
                    { width: `${widthPct}%` },
                  ]}
                />
              </View>
              <Text style={gameLogStyles.gamePts}>{pts} PTS</Text>
            </View>
            <Text style={gameLogStyles.gameLine}>{g.line}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ── PeerCompareAnalytics ────────────────────────────────────────

export function PeerCompareAnalytics() {
  const data = PEER_COMP.map((p) => {
    const youNum = parseFloat(p.you.replace('%', ''));
    const avgNum = parseFloat(p.avg.replace('%', ''));
    const bestNum = parseFloat(p.best.replace('%', ''));
    return {
      label: p.label,
      you: youNum,
      avg: avgNum,
      best: bestNum,
      youStr: p.you,
      avgStr: p.avg,
      bestStr: p.best,
      delta: p.delta,
      positive: p.positive,
    };
  });

  // Average percentile (you vs best across stats)
  const percentile = Math.round(
    (data.reduce((sum, d) => sum + (d.you / d.best), 0) / data.length) * 100,
  );

  return (
    <View style={{ gap: 10 }}>
      {/* Percentile hero card */}
      <View style={statsCardStyles.heroCard}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={gameLogStyles.heroLabel}>PERCENTILE · ACC FROSH</Text>
          <Text style={gameLogStyles.heroRecord}>{percentile}%</Text>
          <Text style={peerStyles.heroSub}>Among ACC freshmen guards</Text>
        </View>
        <StatScoreGauge score={percentile} />
      </View>

      {/* Bar chart card */}
      <View style={statsCardStyles.bigCard}>
        <View style={statsCardStyles.headerRow}>
          <Text style={statsCardStyles.bigCardLabel}>Head-to-Head</Text>
          <View style={statsCardStyles.legendRow}>
            <View style={[statsCardStyles.legendDot, { backgroundColor: STATS_YELLOW }]} />
            <Text style={statsCardStyles.legendText}>You</Text>
            <View style={[statsCardStyles.legendDot, { backgroundColor: STATS_FEMALE_GREY, marginLeft: 8 }]} />
            <Text style={statsCardStyles.legendText}>Avg</Text>
          </View>
        </View>
        <PeerBarChart data={data} />
      </View>

      {/* Detailed comparison list */}
      <View style={statsCardStyles.bigCard}>
        <Text style={statsCardStyles.bigCardLabel}>Detailed Breakdown</Text>
        <View style={{ marginTop: 12, gap: 14 }}>
          {data.map((d) => {
            const widthPct = Math.min(100, (d.you / d.best) * 100);
            return (
              <View key={d.label} style={peerStyles.statRow}>
                <View style={peerStyles.statHeader}>
                  <Text style={peerStyles.statLabel}>{d.label}</Text>
                  <Text
                    style={[
                      peerStyles.statDelta,
                      { color: d.positive ? '#34C759' : 'rgba(255,255,255,0.55)' },
                    ]}
                  >
                    {d.delta} vs avg
                  </Text>
                </View>
                <View style={peerStyles.statBarRow}>
                  <View style={peerStyles.statBarTrack}>
                    <View style={[peerStyles.statBarFill, { width: `${widthPct}%` }]} />
                  </View>
                  <Text style={peerStyles.statYou}>{d.youStr}</Text>
                </View>
                <View style={peerStyles.statRefRow}>
                  <Text style={peerStyles.statRefText}>Avg {d.avgStr}</Text>
                  <Text style={peerStyles.statRefText}>Best {d.bestStr}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function PeerBarChart({ data }: { data: { label: string; you: number; avg: number }[] }) {
  const width = 320;
  const height = 140;
  const padLeft = 30;
  const padRight = 8;
  const padTop = 14;
  const padBottom = 22;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;
  const max = Math.max(...data.flatMap((d) => [d.you, d.avg])) * 1.2;
  const groupW = innerW / data.length;
  const barW = (groupW - 8) / 2;

  return (
    <View style={{ marginTop: 14 }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {[0, 0.5, 1].map((t) => {
          const yPos = padTop + innerH * (1 - t);
          return (
            <Line
              key={t}
              x1={padLeft}
              y1={yPos}
              x2={width - padRight}
              y2={yPos}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
          );
        })}
        {data.map((d, i) => {
          const groupX = padLeft + i * groupW + 4;
          const youH = (d.you / max) * innerH;
          const avgH = (d.avg / max) * innerH;
          return (
            <G key={d.label}>
              <Rect
                x={groupX}
                y={padTop + innerH - youH}
                width={barW}
                height={Math.max(youH, 1)}
                fill={STATS_YELLOW}
                rx={2}
              />
              <Rect
                x={groupX + barW + 2}
                y={padTop + innerH - avgH}
                width={barW}
                height={Math.max(avgH, 1)}
                fill={STATS_FEMALE_GREY}
                rx={2}
              />
            </G>
          );
        })}
      </Svg>
      <View style={statsCardStyles.barLabelsRow} pointerEvents="none">
        {data.map((d) => (
          <View key={d.label} style={statsCardStyles.bucketCol}>
            <View style={statsCardStyles.bucketValuesRow}>
              <Text style={statsCardStyles.bucketValue}>{d.you}</Text>
              <Text style={[statsCardStyles.bucketValue, { color: 'rgba(255,255,255,0.55)' }]}>{d.avg}</Text>
            </View>
            <Text style={statsCardStyles.bucketLabel} numberOfLines={1}>
              {d.label.replace(' / game', '').replace(' %', '%')}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────

const statsCardStyles = StyleSheet.create({
  // Hero
  heroCard: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroAvatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,111,60,0.35)',
  },
  heroAvatar: { width: '100%', height: '100%' },
  heroName: { color: '#FFF', fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  sportRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  heroSport: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500' },

  // Score gauge
  gaugeWrap: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  gaugeCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  gaugeText: { color: '#FFF', fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
  scoreTouchable: { position: 'relative' },
  scoreInfoBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: STATS_YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: STATS_CARD_BG,
  },

  // Metric card
  metricCard: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    minHeight: 124,
  },
  metricLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metricLabel: { color: '#FFF', fontSize: 13, fontWeight: '500' },
  metricValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  metricValue: { color: '#FFF', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  deltaPill: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  deltaText: { color: STATS_YELLOW, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  metricFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 'auto' },
  metricFooterText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },

  // Big cards
  bigCard: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: 16,
    padding: 16,
  },
  bigCardLabel: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { color: 'rgba(255,255,255,0.55)', fontSize: 10 },

  // Recent games
  gameRow: { gap: 6 },
  gameHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gameOpponent: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  gameResult: { fontSize: 11, fontWeight: '700' },
  gameBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gameBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  gameBarFill: { height: '100%', backgroundColor: STATS_YELLOW, borderRadius: 3 },
  gamePts: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700', minWidth: 50, textAlign: 'right' },

  // Bar chart labels
  barLabelsRow: { flexDirection: 'row', paddingLeft: 30, paddingRight: 8, marginTop: 2 },
  bucketCol: { flex: 1, alignItems: 'center' },
  bucketValuesRow: { flexDirection: 'row', gap: 2, marginBottom: -2 },
  bucketValue: { color: '#FFF', fontSize: 9, fontWeight: '600' },
  bucketLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 9, marginTop: 4 },
});

const scoreSheetStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0F1012',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scroll: { flexShrink: 1 },
  handle: {
    width: 38, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center', marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: -0.2 },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4, lineHeight: 17 },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  factorRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  factorName: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  factorWeight: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  factorScore: { fontSize: 20, fontWeight: '900', color: '#FFF', fontVariant: ['tabular-nums'] },
  factorBand: { fontSize: 11, fontWeight: '700', marginTop: -2 },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginTop: 10,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  factorDescription: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 9, lineHeight: 17 },
  factorDetail: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4, fontStyle: 'italic', lineHeight: 15 },
  footnoteWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  footnote: { flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 16 },
});

const gameLogStyles = StyleSheet.create({
  heroLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroRecord: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  formRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  formLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '600',
  },
  formBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formBadgeText: { fontSize: 11, fontWeight: '900' },
  heroStatsCol: { gap: 12, alignItems: 'flex-end' },
  heroStatBlock: { alignItems: 'flex-end' },
  heroStatValue: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  gameCard: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  gameCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  dateChipText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700' },
  gameOpponent: { flex: 1, color: '#FFF', fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },
  resultPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  resultPillText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  gameBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gameBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  gameBarFill: { height: '100%', backgroundColor: STATS_YELLOW, borderRadius: 3 },
  gamePts: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    minWidth: 50,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  gameLine: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    letterSpacing: -0.1,
  },
});

const peerStyles = StyleSheet.create({
  heroSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 2,
  },
  statRow: { gap: 6 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  statDelta: { fontSize: 11, fontWeight: '700' },
  statBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  statBarFill: { height: '100%', backgroundColor: STATS_YELLOW, borderRadius: 3 },
  statYou: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    minWidth: 60,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  statRefRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statRefText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '600',
  },
});
