// ── ATHLETE HERO HOOK ─────────────────────────────────────
// Sprint 4+ P1 (W3) — feeds the dashboard hero card with three signals
// (live game / top OpenDeal match / trending engagement) and runs them
// through the pure picker in `lib/utils/athlete-hero-picker.ts`.
//
// Source posture:
//   - Live game: `useExploreGames` (ncaa-api, MIT mirror, Tier-2 cached
//     per `recursive-research-2026-05-10.md`). We match on the
//     athlete's school (parsed off `BRAND_ATHLETES[*].school`).
//   - OpenDeal match: `useOpenDeals` returns the surface-projected deal
//     pool. The Sprint 2.3 fixture does not include `aiRanking` on
//     applicants yet, so we fall back to the brand-level `fitScore`
//     attached to the athlete row when no live AI score exists.
//   - Trending engagement: hand-authored fixture (`MOCK_TRENDING_DELTA`)
//     until a real engagement endpoint exists. Cited honestly via a
//     `synthetic` source ref.
//
// The hook is defensive — every signal is optional, and the picker is
// designed to always return a renderable state.

import { useMemo } from 'react';

import { useExploreGames } from '@/hooks/use-explore-games';
import { useOpenDeals } from '@/hooks/use-open-deals';
import { BRAND_ATHLETES } from '@/lib/data/mock-brand-data';
import type {
  AthleteHeroPickerInput,
  AthleteHeroProjection,
  AthleteHeroState,
} from '@/lib/types/athlete-hero.types';
import type { ComparableDealSourceRef } from '@/lib/types/comparable-deal.types';
import type { NcaaGame } from '@/lib/types/explore.types';
import type { OpenDealSurfaceRecord } from '@/lib/types/open-deal.types';
import { pickAthleteHero } from '@/lib/utils/athlete-hero-picker';

/**
 * Fixture-only trending deltas keyed by athlete id. Negative or zero
 * means "no spike" — the picker treats it as below threshold and falls
 * through to the placeholder state. Replace with a real engagement
 * endpoint once Q-band: athlete engagement instrumentation lands.
 */
const MOCK_TRENDING_DELTA: Record<string, number> = {
  'a-1': 0.074, // Kiyan Anthony — 7.4% week-over-week
  'a-2': 0.012,
  'a-3': 0.108,
  'a-4': 0.0,
  'a-5': 0.052,
  'a-6': 0.061,
  'a-7': -0.004,
};

const TRENDING_SOURCE_REF: ComparableDealSourceRef = {
  id: 'src:mock-trending-delta',
  label: 'Synthetic · platform engagement signal',
  kind: 'synthetic',
  retrievedAt: '2026-05-10T00:00:00.000Z',
  freshnessDays: 0,
  caveat:
    'Synthetic fixture — engagement instrumentation not yet wired. Replace once analytics endpoint lands.',
};

export interface UseAthleteHeroResult {
  state: AthleteHeroState;
  isLoading: boolean;
}

/**
 * Resolve the athlete dashboard hero state. Defaults `athleteId` to the
 * canonical demo athlete (`a-1`, Kiyan Anthony) so the home tab renders
 * immediately even before an auth-bound athlete id is wired in.
 */
export function useAthleteHero(
  athleteId: string = 'a-1',
): UseAthleteHeroResult {
  const explore = useExploreGames();
  const openDeals = useOpenDeals();

  const isLoading = explore.isLoading || openDeals.isLoading;

  const state = useMemo<AthleteHeroState>(() => {
    const athlete = BRAND_ATHLETES.find((a) => a.id === athleteId);
    const schoolName = parseSchoolName(athlete?.school);

    const liveGame = schoolName
      ? findLiveGameForSchool(explore.liveGames, schoolName)
      : undefined;

    const topMatch = findTopOpenDealMatch(openDeals.data ?? [], athleteId);

    const projection: AthleteHeroProjection = {
      ...buildLiveProjection(liveGame),
      ...buildMatchProjection(topMatch, athlete?.fitScore),
      ...buildTrendingProjection(athleteId, athlete?.followers),
    };

    const input: AthleteHeroPickerInput = {
      athleteId,
      hasLiveGame: Boolean(liveGame),
      topOpenDealMatchScore: topMatch?.matchScore,
      trendingFollowerDelta: MOCK_TRENDING_DELTA[athleteId],
      projection,
    };

    return pickAthleteHero(input);
  }, [athleteId, explore.liveGames, openDeals.data]);

  return { state, isLoading };
}

// ── helpers ───────────────────────────────────────────────

/**
 * Pull the school short-name out of `BRAND_ATHLETES[*].school` strings
 * shaped like "Syracuse · Fr". Returns `undefined` for empty input.
 */
function parseSchoolName(school: string | undefined): string | undefined {
  if (!school) return undefined;
  const [head] = school.split('·');
  return head?.trim() || undefined;
}

function findLiveGameForSchool(
  liveGames: NcaaGame[],
  schoolName: string,
): NcaaGame | undefined {
  const needle = schoolName.toLowerCase();
  return liveGames.find((g) => {
    const home = g.home.shortName.toLowerCase();
    const away = g.away.shortName.toLowerCase();
    return home.includes(needle) || away.includes(needle);
  });
}

interface OpenDealMatch {
  record: OpenDealSurfaceRecord;
  matchScore: number;
}

/**
 * Best OpenDeal match for the athlete. Prefers live `aiRanking.score`
 * when present (none in the Sprint 2.3 fixture yet) — otherwise falls
 * back to the brand-level `fitScore` on the athlete row, which the
 * Sprint 2.3 PUMA Hoops fixture uses for ranking.
 */
function findTopOpenDealMatch(
  records: OpenDealSurfaceRecord[],
  athleteId: string,
): OpenDealMatch | undefined {
  const athlete = BRAND_ATHLETES.find((a) => a.id === athleteId);
  const fallbackScore = athlete?.fitScore;

  let best: OpenDealMatch | undefined;
  for (const record of records) {
    const applicant = record.applicants.find(
      (app) => app.athleteId === athleteId,
    );
    if (!applicant) continue;

    const liveScore = applicant.aiRanking?.score;
    const matchScore =
      typeof liveScore === 'number'
        ? liveScore
        : typeof fallbackScore === 'number'
          ? fallbackScore
          : undefined;

    if (typeof matchScore !== 'number') continue;

    if (!best || matchScore > best.matchScore) {
      best = { record, matchScore };
    }
  }
  return best;
}

function buildLiveProjection(
  game: NcaaGame | undefined,
): Partial<AthleteHeroProjection> {
  if (!game) return {};
  // We render both teams in the meta line so we don't have to re-run
  // the school matcher to figure out which side is the athlete's.
  return {
    liveSubjectLabel: `vs ${game.home.shortName} · ${game.periodLabel}`,
    liveSubjectMeta: `${game.away.shortName} ${game.away.score ?? 0} – ${game.home.score ?? 0} ${game.home.shortName}${game.network ? ` · ${game.network}` : ''}`,
    liveMetric: { label: 'CLOCK', value: game.clockLabel || 'LIVE' },
    liveSourceRef: game.source,
  };
}

function buildMatchProjection(
  match: OpenDealMatch | undefined,
  fitScore: number | undefined,
): Partial<AthleteHeroProjection> {
  if (!match) return {};
  const { record, matchScore } = match;
  const lowK = Math.round(record.budget.low.cents / 100_000) / 10;
  const highK = Math.round(record.budget.high.cents / 100_000) / 10;
  const budgetLabel = `$${lowK}K-$${highK}K`;
  const sourceLabel = match.record.source.label;
  const usedFallback =
    typeof matchScore === 'number'
    && typeof fitScore === 'number'
    && matchScore === fitScore;

  return {
    matchSubjectLabel: record.deal.title,
    matchSubjectMeta: `${record.brandLabel} · ${budgetLabel} · ${record.slots} slot${record.slots === 1 ? '' : 's'}`,
    matchMetric: {
      label: usedFallback ? 'BRAND FIT' : 'MATCH SCORE',
      value: `${Math.round(matchScore)}/100`,
    },
    matchSourceRef: {
      id: `src:open-deal:${record.deal.id}`,
      label: sourceLabel,
      kind: 'synthetic',
      retrievedAt: record.postedAt,
      freshnessDays: 0,
      caveat: record.source.caveat,
    },
  };
}

function buildTrendingProjection(
  athleteId: string,
  followers: string | undefined,
): Partial<AthleteHeroProjection> {
  const delta = MOCK_TRENDING_DELTA[athleteId];
  if (typeof delta !== 'number' || delta <= 0) return {};
  const pct = `${(delta * 100).toFixed(1)}%`;
  return {
    trendingSubjectLabel: 'Your audience is heating up',
    trendingSubjectMeta: followers
      ? `Base of ${followers} followers up ${pct} this week.`
      : `Engagement up ${pct} this week.`,
    trendingMetric: { label: '7D LIFT', value: `+${pct}` },
    trendingSourceRef: TRENDING_SOURCE_REF,
  };
}
