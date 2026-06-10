// ── ATHLETE DASHBOARD HERO TYPES ──────────────────────────
// Mrs. Wilson W3 (PLAN.md §5 Sprint 4+ P1) — the athlete dashboard
// hero card auto-picks one of three modes (LIVE / TOP MATCH / TRENDING)
// based on whichever signal is most relevant to the athlete right now.
//
// Decision discipline (mirrors deal-detail evidence model):
//   - Every state carries a human `pickRationale` so the surface can
//     explain *why* this mode was chosen rather than render a black-box
//     recommendation.
//   - Optional `sourceRef` cites the underlying datum (live game,
//     OpenDeal post, engagement spike) using the same
//     `ComparableDealSourceRef` shape the deal-detail surface uses.
//
// Schema is iOS-surface scoped — there is no backend OpenAPI shape for
// this yet. The types live alongside `lib/types/explore.types.ts` and
// `lib/types/open-deal.types.ts` and depend only on `comparable-deal`
// for source-ref provenance.

import type { ComparableDealSourceRef } from './comparable-deal.types';

/**
 * Three auto-picked hero modes. The picker selects exactly one per
 * render. There is no "none" — the picker always returns a state, with
 * `'top-match'` as the placeholder fallback when no signal fires.
 */
export type AthleteHeroMode = 'live' | 'top-match' | 'trending';

/**
 * Visual tone for the hero card. Maps to the `ui-kit/tokens` palette:
 *   - `'live'`     → red pulse + ON AIR tag
 *   - `'success'`  → teal (TOP MATCH)
 *   - `'accent'`   → orange (TRENDING)
 */
export type AthleteHeroTone = 'live' | 'success' | 'accent';

export interface AthleteHeroMetric {
  /** Uppercase label, e.g. "FOLLOWERS", "ASK", "MIN LEFT". */
  label: string;
  /** Pre-formatted value, e.g. "1.2M", "$280K-$420K", "+7.4%". */
  value: string;
}

export interface AthleteHeroState {
  mode: AthleteHeroMode;
  tone: AthleteHeroTone;
  /** One-sentence "why this mode" copy. Always non-empty. */
  pickRationale: string;
  /** Visual-only CTA pill label, e.g. "Open game", "Review match". */
  primaryActionLabel: string;
  /** Headline subject of the card, e.g. "vs Duke · Q3". */
  subjectLabel: string;
  /** Subtitle / meta line under the headline. */
  subjectMeta: string;
  metric: AthleteHeroMetric;
  /** Optional source ref — present when the state cites real evidence. */
  sourceRef?: ComparableDealSourceRef;
}

/**
 * Picker input. The hook (`useAthleteHero`) gathers these signals from
 * `useExploreGames`, `useOpenDeals`, and a small fixture-driven
 * engagement delta until a real engagement endpoint exists.
 */
export interface AthleteHeroPickerInput {
  athleteId: string;
  /** True when any live game involves the athlete's school. */
  hasLiveGame: boolean;
  /**
   * Highest match score (0-100) on an OpenDeal that has the athlete in
   * its applicant pool. Undefined when no scored OpenDeal applies.
   */
  topOpenDealMatchScore?: number;
  /**
   * Engagement delta as a fraction of follower base over a recent
   * window (e.g. 7 days). 0.05 = +5%. Negative or undefined = no spike.
   */
  trendingFollowerDelta?: number;
  /**
   * Optional projection bag. Used by the picker to populate
   * `subjectLabel`, `subjectMeta`, and `metric` without re-fetching.
   * All fields optional so the hook can be defensive.
   */
  projection?: AthleteHeroProjection;
}

/**
 * Lightweight projection bundle pulled from the source signals the hook
 * already inspected. Picker-shaped, not API-shaped — no required field.
 */
export interface AthleteHeroProjection {
  /** Live game subject — e.g. "vs Duke · Q3". */
  liveSubjectLabel?: string;
  liveSubjectMeta?: string;
  liveMetric?: AthleteHeroMetric;
  liveSourceRef?: ComparableDealSourceRef;

  /** Top-match OpenDeal subject — e.g. "Signature Capsule — Lead Guard Spotlight". */
  matchSubjectLabel?: string;
  matchSubjectMeta?: string;
  matchMetric?: AthleteHeroMetric;
  matchSourceRef?: ComparableDealSourceRef;

  /** Trending subject — usually the athlete's own profile. */
  trendingSubjectLabel?: string;
  trendingSubjectMeta?: string;
  trendingMetric?: AthleteHeroMetric;
  trendingSourceRef?: ComparableDealSourceRef;
}
