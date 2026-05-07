import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Rect, Line, G } from 'react-native-svg';
import Animated, {
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import {
  AGENT_ATHLETES,
  AGENT_ATHLETE_AUDIENCE,
  type AgentAthlete,
  type AthleteAudience,
} from '@/lib/data/mock-agent-data';

const YELLOW = '#FFD60A';
const CARD_BG = '#1C1C1E';
const FEMALE_GREY = 'rgba(255,255,255,0.35)';
const TAB_BAR_TOP_FROM_BOTTOM = 90;

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function sportIcon(sport: string): keyof typeof MaterialCommunityIcons.glyphMap {
  const s = sport.toLowerCase();
  if (s.includes('basket')) return 'basketball';
  if (s.includes('football')) return 'football';
  if (s.includes('soccer')) return 'soccer';
  if (s.includes('soft')) return 'baseball';
  if (s.includes('base')) return 'baseball';
  return 'basketball';
}

export default function AthleteDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const athlete = AGENT_ATHLETES.find((a) => a.id === params.id);
  const audience = athlete ? AGENT_ATHLETE_AUDIENCE[athlete.id] : undefined;
  const [scoreSheetOpen, setScoreSheetOpen] = React.useState(false);

  if (!athlete || !audience) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
        <Text style={styles.notFoundText}>Athlete not found.</Text>
        <Pressable onPress={() => router.back()} style={styles.notFoundBack}>
          <Text style={styles.notFoundBackText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 180 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(360)}>
          <HeroIdentityCard
            athlete={athlete}
            score={audience.score}
            onScorePress={() => setScoreSheetOpen(true)}
          />
        </Animated.View>

        <View style={styles.row}>
          <Animated.View entering={FadeInDown.delay(60).duration(360)} style={{ flex: 1 }}>
            <MetricCard
              label="Total Followers"
              value={formatNumber(audience.totalFollowers)}
              delta={audience.followersDelta}
              topPct={audience.followersTopPct}
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(120).duration(360)} style={{ flex: 1 }}>
            <MetricCard
              label="Engagement Rate"
              value={`${audience.engagementRate.toFixed(2)}%`}
              delta={audience.engagementDelta}
              topPct={audience.engagementTopPct}
            />
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(180).duration(360)}>
          <LocationCard locations={audience.locations} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(360)}>
          <AgeGenderCard data={audience.ageGender} />
        </Animated.View>
      </ScrollView>

      {/* Floating back button — bottom-left, just above safe area */}
      <Pressable
        onPress={() => router.back()}
        style={[styles.backBtn, { bottom: insets.bottom + 20 }]}
        accessibilityLabel="Back"
        accessibilityRole="button"
      >
        <Ionicons name="chevron-back" size={28} color="#FFF" />
      </Pressable>

      <ScoreBreakdownSheet
        score={audience.score}
        athleteName={athlete.name}
        visible={scoreSheetOpen}
        onClose={() => setScoreSheetOpen(false)}
      />
    </View>
  );
}

// ───── Hero identity card ─────

function HeroIdentityCard({
  athlete,
  score,
  onScorePress,
}: {
  athlete: AgentAthlete;
  score: number;
  onScorePress: () => void;
}) {
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroLeft}>
        {athlete.id === 'a-1' ? (
          <View style={styles.heroAvatarWrap}>
            <Image
              source={require('@/assets/images/kiyan-avatar.png')}
              style={styles.heroAvatar}
            />
          </View>
        ) : (
          <View style={[styles.heroAvatarWrap, { backgroundColor: athlete.color }]}>
            <Text style={styles.heroAvatarInitials}>{athlete.initials}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.heroName} numberOfLines={1}>{athlete.name}</Text>
          <View style={styles.sportRow}>
            <MaterialCommunityIcons
              name={sportIcon(athlete.sport)}
              size={14}
              color={YELLOW}
            />
            <Text style={styles.heroSport}>{athlete.sport}</Text>
          </View>
        </View>
      </View>
      <Pressable
        onPress={onScorePress}
        accessibilityRole="button"
        accessibilityLabel="View score breakdown"
        accessibilityHint="Opens a breakdown of the factors making up this score"
        hitSlop={8}
        style={({ pressed }) => [styles.scoreTouchable, { opacity: pressed ? 0.7 : 1 }]}
      >
        <ScoreGauge score={score} />
        <View style={styles.scoreInfoBadge} pointerEvents="none">
          <Ionicons name="information" size={11} color="#000" />
        </View>
      </Pressable>
    </View>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const size = 64;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  // Reserve the bottom-right gap (~20%) for visual balance per the screenshot.
  const visiblePortion = 0.82;
  const dash = c * pct * visiblePortion;
  const gap = c - dash;
  return (
    <View style={styles.gaugeWrap}>
      <Svg width={size} height={size}>
        <G rotation="-200" originX={size / 2} originY={size / 2}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={YELLOW}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      </Svg>
      <View style={styles.gaugeCenter} pointerEvents="none">
        <Text style={styles.gaugeText}>{score}</Text>
      </View>
    </View>
  );
}

// ───── Metric card ─────

function MetricCard({
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
    <View style={styles.metricCard}>
      <View style={styles.metricLabelRow}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Ionicons name="information-circle-outline" size={13} color="rgba(255,255,255,0.4)" />
      </View>
      <View style={styles.metricValueRow}>
        <Text style={styles.metricValue}>{value}</Text>
        <View style={styles.deltaPill}>
          <Ionicons name="arrow-up" size={10} color={YELLOW} style={{ transform: [{ rotate: '45deg' }] }} />
          <Text style={styles.deltaText}>{delta.toFixed(2)}%</Text>
        </View>
      </View>
      <View style={styles.metricFooter}>
        <Text style={styles.metricFooterText}>TOP {topPct}%</Text>
        <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.4)" />
      </View>
    </View>
  );
}

// ───── Audience location card ─────

function LocationCard({
  locations,
}: {
  locations: { city: string; state: string; followers: number; pct: number }[];
}) {
  const maxPct = locations.reduce((m, l) => Math.max(m, l.pct), 0) || 1;
  return (
    <View style={styles.bigCard}>
      <Text style={styles.bigCardLabel}>Audience Location</Text>
      <View style={{ gap: 12, marginTop: 14 }}>
        {locations.map((l, i) => {
          const widthPct = (l.pct / maxPct) * 100;
          return (
            <View key={`${l.city}-${l.state}`} style={styles.locRow}>
              <View style={styles.locHeader}>
                <Text style={styles.locName}>
                  {i + 1}. {l.city}, {l.state}
                </Text>
                <Text style={styles.locFollowers}>{formatNumber(l.followers)} followers</Text>
              </View>
              <View style={styles.locBarRow}>
                <View style={styles.locBarTrack}>
                  <View style={[styles.locBarFill, { width: `${widthPct}%` }]} />
                </View>
                <Text style={styles.locPct}>{l.pct.toFixed(2)}%</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ───── Age & Gender card ─────

function AgeGenderCard({ data }: { data: { bucket: string; male: number; female: number }[] }) {
  return (
    <View style={styles.bigCard}>
      <View style={styles.ageGenderHeaderRow}>
        <Text style={styles.bigCardLabel}>Age & Gender</Text>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: YELLOW }]} />
          <Text style={styles.legendText}>Male</Text>
          <View style={[styles.legendDot, { backgroundColor: FEMALE_GREY, marginLeft: 8 }]} />
          <Text style={styles.legendText}>Female</Text>
        </View>
      </View>
      <BarChart data={data} />
    </View>
  );
}

function BarChart({ data }: { data: { bucket: string; male: number; female: number }[] }) {
  const width = 320;
  const height = 140;
  const padLeft = 28;
  const padRight = 8;
  const padTop = 12;
  const padBottom = 22;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;
  const max = 50; // y-axis max — 30%/15%/0% labels match this scale visually
  const groupW = innerW / data.length;
  const barW = (groupW - 6) / 2;

  // Y-axis labels: 30%, 15%, 0%
  const yLabels = [
    { label: '30%', pct: 30 },
    { label: '15%', pct: 15 },
    { label: '0%', pct: 0 },
  ];

  return (
    <View style={{ marginTop: 14 }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {yLabels.map((y) => {
          const yPos = padTop + innerH * (1 - y.pct / max);
          return (
            <G key={y.label}>
              <Line
                x1={padLeft}
                y1={yPos}
                x2={width - padRight}
                y2={yPos}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
            </G>
          );
        })}
        {data.map((d, i) => {
          const groupX = padLeft + i * groupW + 3;
          const maleH = (d.male / max) * innerH;
          const femaleH = (d.female / max) * innerH;
          return (
            <G key={d.bucket}>
              <Rect
                x={groupX}
                y={padTop + innerH - maleH}
                width={barW}
                height={Math.max(maleH, 1)}
                fill={YELLOW}
                rx={2}
              />
              <Rect
                x={groupX + barW + 2}
                y={padTop + innerH - femaleH}
                width={barW}
                height={Math.max(femaleH, 1)}
                fill={FEMALE_GREY}
                rx={2}
              />
            </G>
          );
        })}
      </Svg>
      {/* Y-axis labels (rendered as Text outside SVG for crisp text) */}
      <View style={styles.yAxisCol} pointerEvents="none">
        <Text style={styles.yAxisText}>30%</Text>
        <Text style={styles.yAxisText}>15%</Text>
        <Text style={styles.yAxisText}>0%</Text>
      </View>
      {/* Value labels above bars + x-axis bucket labels */}
      <View style={styles.barLabelsRow} pointerEvents="none">
        {data.map((d) => (
          <View key={d.bucket} style={styles.bucketCol}>
            <View style={styles.bucketValuesRow}>
              <Text style={styles.bucketValue}>{d.male}</Text>
              <Text style={[styles.bucketValue, { color: 'rgba(255,255,255,0.55)' }]}>{d.female}</Text>
            </View>
            <Text style={styles.bucketLabel}>{d.bucket}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ───── Score breakdown sheet ─────

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
    description: 'On-field/court output: stats, advanced metrics, win contribution.',
    detail: 'Top quartile of conference peers in primary statistical category.',
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
    detail: '40% Gen Z; strong 18–34 skew with concentrated regional reach.',
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
  if (score >= 65) return { label: 'Strong', color: YELLOW };
  if (score >= 50) return { label: 'Average', color: '#FFD60A' };
  return { label: 'Needs work', color: '#FF453A' };
}

const SCORE_SHEET_TRAVEL = 700;

function ScoreBreakdownSheet({
  score,
  athleteName,
  visible,
  onClose,
}: {
  score: number;
  athleteName: string;
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
                    {athleteName}'s overall score of {score} is composed of these factors.
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
                Auto-calculated daily from performance, audience, and engagement signals. The athlete can influence their score by improving on-field output, growing engagement, and broadening audience quality.
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const scoreSheetStyles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
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
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: -0.2 },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4, lineHeight: 17 },
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

// ───── Styles ─────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scroll: { paddingHorizontal: 16, gap: 10 },

  // Back button
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(28,28,30,0.85)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },

  notFoundText: { color: '#FFF', fontSize: 15, textAlign: 'center', marginTop: 40 },
  notFoundBack: { alignSelf: 'center', marginTop: 16, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#FFF', borderRadius: 999 },
  notFoundBackText: { color: '#000', fontWeight: '700' },

  // Hero card
  heroCard: {
    backgroundColor: CARD_BG,
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
    borderColor: 'rgba(255,214,10,0.35)',
  },
  heroAvatar: { width: '100%', height: '100%' },
  heroAvatarInitials: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
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
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: CARD_BG,
  },

  // Row layout
  row: { flexDirection: 'row', gap: 8 },

  // Metric card (followers / engagement)
  metricCard: {
    backgroundColor: CARD_BG,
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
  deltaText: { color: YELLOW, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  metricFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 'auto' },
  metricFooterText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },

  // Big cards (location + age/gender)
  bigCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
  },
  bigCardLabel: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  // Location
  locRow: { gap: 6 },
  locHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  locName: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  locFollowers: { color: 'rgba(255,255,255,0.55)', fontSize: 11 },
  locBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  locBarFill: { height: '100%', backgroundColor: YELLOW, borderRadius: 3 },
  locPct: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600', minWidth: 50, textAlign: 'right' },

  // Age & gender
  ageGenderHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { color: 'rgba(255,255,255,0.55)', fontSize: 10 },
  yAxisCol: {
    position: 'absolute',
    top: 12,
    left: 0,
    height: 118,
    justifyContent: 'space-between',
  },
  yAxisText: { color: 'rgba(255,255,255,0.45)', fontSize: 9 },
  barLabelsRow: { flexDirection: 'row', paddingLeft: 28, paddingRight: 8, marginTop: 2 },
  bucketCol: { flex: 1, alignItems: 'center' },
  bucketValuesRow: { flexDirection: 'row', gap: 2, marginBottom: -2 },
  bucketValue: { color: '#FFF', fontSize: 9, fontWeight: '600' },
  bucketLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 9, marginTop: 4 },
});
