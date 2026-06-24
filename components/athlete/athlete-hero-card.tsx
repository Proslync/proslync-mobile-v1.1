// ── ATHLETE DASHBOARD HERO CARD ───────────────────────────
// Mrs. Wilson W3 (PLAN.md §5 Sprint 4+ P1).
//
// Auto-picks one of three modes via `useAthleteHero` and renders a
// single tone-aware card at the top of the athlete home/Stats tab:
//   - LIVE NOW           (red pulse + "ON AIR" tag)
//   - TOP MATCH FOR YOU  (teal)
//   - TRENDING NOW       (orange)
//
// Card surface is visual-only in this slice — the CTA pill does not
// route. The next slice can wire it to game / open-deal / boost flows.
//
// Reuses `ui-kit` primitives (`StatusPill`, tokens) so the tone palette
// stays in lockstep with the deal-detail surface and Brand HQ.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useAthleteHero } from '@/hooks/use-athlete-hero';
import {
  CARD_BG,
  CARD_BORDER,
  RADIUS_MD,
  RADIUS_PILL,
  StatusPill,
  TONE_COLOR,
  type Tone,
} from '@/components/shared/ui-kit';
import type {
  AthleteHeroMode,
  AthleteHeroState,
  AthleteHeroTone,
} from '@/lib/types/athlete-hero.types';

const MODE_EYEBROW: Record<AthleteHeroMode, string> = {
  'live': 'LIVE NOW',
  'top-match': 'TOP MATCH FOR YOU',
  'trending': 'TRENDING NOW',
};

const MODE_ICON: Record<AthleteHeroMode, keyof typeof Ionicons.glyphMap> = {
  'live': 'radio',
  'top-match': 'sparkles',
  'trending': 'trending-up',
};

/** Map hero tone → ui-kit Tone for `StatusPill` etc. */
function toUiTone(tone: AthleteHeroTone): Tone {
  return tone === 'live' ? 'danger' : tone;
}

export interface AthleteHeroCardProps {
  /** Defaults to the canonical demo athlete `a-1`. */
  athleteId?: string;
}

export function AthleteHeroCard({ athleteId }: AthleteHeroCardProps) {
  const { state, isLoading } = useAthleteHero(athleteId);

  if (isLoading) {
    return <HeroSkeleton />;
  }
  return <HeroBody state={state} />;
}

// ── body ──────────────────────────────────────────────────

function HeroBody({ state }: { state: AthleteHeroState }) {
  const accent = state.tone === 'live'
    ? TONE_COLOR.danger
    : state.tone === 'success'
      ? TONE_COLOR.success
      : TONE_COLOR.accent;

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: `${accent}55`,
          backgroundColor: `${accent}0F`,
        },
      ]}
    >
      <View style={styles.eyebrowRow}>
        <Ionicons name={MODE_ICON[state.mode]} size={13} color={accent} />
        <Text style={[styles.eyebrow, { color: accent }]}>
          {MODE_EYEBROW[state.mode]}
        </Text>
        {state.mode === 'live' ? <OnAirTag color={accent} /> : null}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {state.subjectLabel}
      </Text>
      <Text style={styles.meta} numberOfLines={2}>
        {state.subjectMeta}
      </Text>

      <View style={styles.metricRow}>
        <View style={styles.metricCol}>
          <Text style={[styles.metricValue, { color: accent }]}>
            {state.metric.value}
          </Text>
          <Text style={styles.metricLabel}>{state.metric.label}</Text>
        </View>
        <CtaPill label={state.primaryActionLabel} accent={accent} />
      </View>

      <Text style={styles.rationale}>{state.pickRationale}</Text>

      {state.sourceRef ? (
        <View style={styles.sourceRow}>
          <StatusPill
            label={state.sourceRef.kind === 'synthetic' ? 'signal' : state.sourceRef.kind.replace('-', ' ')}
            tone={toUiTone(state.tone)}
            icon="link"
          />
          <Text style={styles.sourceLabel} numberOfLines={1}>
            {state.sourceRef.label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// ── pieces ────────────────────────────────────────────────

function OnAirTag({ color }: { color: string }) {
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.35, { duration: 700 }),
      -1,
      true,
    );
  }, [opacity]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View
      style={[
        styles.onAirTag,
        { borderColor: `${color}66`, backgroundColor: `${color}1F` },
      ]}
    >
      <Animated.View
        style={[styles.onAirDot, { backgroundColor: color }, dotStyle]}
      />
      <Text style={[styles.onAirText, { color }]}>ON AIR</Text>
    </View>
  );
}

function CtaPill({ label, accent }: { label: string; accent: string }) {
  return (
    <View
      style={[
        styles.ctaPill,
        { borderColor: `${accent}66`, backgroundColor: `${accent}26` },
      ]}
    >
      <Text style={[styles.ctaText, { color: accent }]} numberOfLines={1}>
        {label}
      </Text>
      <Ionicons name="arrow-forward" size={13} color={accent} />
    </View>
  );
}

function HeroSkeleton() {
  return (
    <View style={[styles.card, styles.skeleton]}>
      <View style={styles.skeletonLineEyebrow} />
      <View style={styles.skeletonLineTitle} />
      <View style={styles.skeletonLineMeta} />
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonMetric} />
        <View style={styles.skeletonCta} />
      </View>
    </View>
  );
}

// ── styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    gap: 8,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  eyebrowRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  eyebrow: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  onAirTag: {
    alignItems: 'center',
    borderRadius: RADIUS_PILL,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 5,
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  onAirDot: {
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  onAirText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginTop: 4,
  },
  meta: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 17,
  },
  metricRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  metricCol: {
    flex: 1,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  ctaPill: {
    alignItems: 'center',
    borderRadius: RADIUS_PILL,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  rationale: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11.5,
    fontStyle: 'italic',
    fontWeight: '500',
    marginTop: 4,
  },
  sourceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  sourceLabel: {
    color: 'rgba(255,255,255,0.45)',
    flex: 1,
    fontSize: 10.5,
    fontWeight: '600',
  },
  // skeleton
  skeleton: {
    backgroundColor: CARD_BG,
    borderColor: CARD_BORDER,
    gap: 10,
  },
  skeletonLineEyebrow: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 4,
    height: 10,
    width: 100,
  },
  skeletonLineTitle: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 4,
    height: 18,
    width: '70%',
  },
  skeletonLineMeta: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    height: 12,
    width: '90%',
  },
  skeletonRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  skeletonMetric: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 6,
    flex: 1,
    height: 32,
  },
  skeletonCta: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: RADIUS_PILL,
    height: 30,
    width: 110,
  },
});
