// ── ATHLETE HERO PICKER ───────────────────────────────────
// Pure decision function for the dashboard hero card per W3.
// Lives in `lib/utils/` (alongside `currency.ts`, `date.ts`) so it is
// trivially unit-testable and free of React / network dependencies.
//
// Decision rules (in order, first match wins):
//   1. `hasLiveGame === true`                          → mode 'live'
//   2. `topOpenDealMatchScore && score >= 80`          → mode 'top-match'
//   3. `trendingFollowerDelta && delta >= 0.05`        → mode 'trending'
//   4. fallback                                        → mode 'top-match'
//      with placeholder copy (we always render something — the home tab
//      should not have an empty hero slot).
//
// `pickRationale` is mandatory on every state so the surface can render
// "why this card?" copy under the metric — same evidence discipline
// the deal-detail surface uses for source-ref provenance.

import type {
  AthleteHeroPickerInput,
  AthleteHeroProjection,
  AthleteHeroState,
} from '@/lib/types/athlete-hero.types';

const MATCH_SCORE_THRESHOLD = 80;
const TRENDING_DELTA_THRESHOLD = 0.05;

const PLACEHOLDER_MATCH_SUBJECT = 'No high-fit OpenDeals right now';
const PLACEHOLDER_MATCH_META = 'Keep your profile updated to surface here.';

/**
 * Pick the hero state for the dashboard. Pure function.
 *
 * @example
 *   pickAthleteHero({ athleteId: 'a-1', hasLiveGame: true, projection })
 *     → { mode: 'live', tone: 'live', pickRationale: 'Game in progress.', … }
 */
export function pickAthleteHero(
  input: AthleteHeroPickerInput,
): AthleteHeroState {
  const projection = input.projection ?? {};

  if (input.hasLiveGame) {
    return liveState(projection);
  }

  if (
    typeof input.topOpenDealMatchScore === 'number'
    && input.topOpenDealMatchScore >= MATCH_SCORE_THRESHOLD
  ) {
    return topMatchState(projection, input.topOpenDealMatchScore);
  }

  if (
    typeof input.trendingFollowerDelta === 'number'
    && input.trendingFollowerDelta >= TRENDING_DELTA_THRESHOLD
  ) {
    return trendingState(projection, input.trendingFollowerDelta);
  }

  return placeholderState(projection);
}

function liveState(p: AthleteHeroProjection): AthleteHeroState {
  return {
    mode: 'live',
    tone: 'live',
    pickRationale: 'Game in progress.',
    primaryActionLabel: 'Open game',
    subjectLabel: p.liveSubjectLabel ?? 'Live game in progress',
    subjectMeta: p.liveSubjectMeta ?? 'Tap to open the live scoreboard.',
    metric: p.liveMetric ?? { label: 'STATUS', value: 'ON AIR' },
    sourceRef: p.liveSourceRef,
  };
}

function topMatchState(
  p: AthleteHeroProjection,
  score: number,
): AthleteHeroState {
  return {
    mode: 'top-match',
    tone: 'success',
    pickRationale: 'High-fit OpenDeal posted.',
    primaryActionLabel: 'Review match',
    subjectLabel: p.matchSubjectLabel ?? 'High-fit OpenDeal',
    subjectMeta:
      p.matchSubjectMeta ?? `Match score ${Math.round(score)} of 100.`,
    metric:
      p.matchMetric ?? {
        label: 'MATCH SCORE',
        value: `${Math.round(score)}/100`,
      },
    sourceRef: p.matchSourceRef,
  };
}

function trendingState(
  p: AthleteHeroProjection,
  delta: number,
): AthleteHeroState {
  const pct = `${(delta * 100).toFixed(1)}%`;
  return {
    mode: 'trending',
    tone: 'accent',
    pickRationale: 'Engagement spike — review your post strategy.',
    primaryActionLabel: 'Boost a clip',
    subjectLabel: p.trendingSubjectLabel ?? 'You are trending',
    subjectMeta:
      p.trendingSubjectMeta
      ?? `Follower base up ${pct} in the last 7 days.`,
    metric:
      p.trendingMetric ?? { label: 'FOLLOWER LIFT', value: `+${pct}` },
    sourceRef: p.trendingSourceRef,
  };
}

function placeholderState(p: AthleteHeroProjection): AthleteHeroState {
  return {
    mode: 'top-match',
    tone: 'success',
    pickRationale:
      'No live game, no high-fit OpenDeal, and no engagement spike right now.',
    primaryActionLabel: 'Browse OpenDeals',
    subjectLabel: p.matchSubjectLabel ?? PLACEHOLDER_MATCH_SUBJECT,
    subjectMeta: p.matchSubjectMeta ?? PLACEHOLDER_MATCH_META,
    metric:
      p.matchMetric ?? { label: 'MATCH SCORE', value: '—' },
    sourceRef: p.matchSourceRef,
  };
}
