// ── MOCK ATHLETE DISCOVERY ────────────────────────────────
// Sprint 2.3 athlete-side discovery selector. Filters the brand-side
// `MOCK_OPEN_DEALS` fixture pool down to the OpenDeals that fit a given
// athlete, returning hand-authored "why this matches you" reasons.
//
// Pre-persistence: deterministic per-athlete fixture. Once Q17 / PLAN §9
// clears, this swaps to a backend `/api/discovery/open-deals` endpoint
// fed by the AI ranking pipeline.
//
// Trust posture: matches are advisory. Every athlete-facing surface that
// renders these MUST visibly restate "AI rank + human approval gate" —
// matched != accepted.

import type { OpenDealSurfaceRecord } from '@/lib/types/open-deal.types';

import { MOCK_OPEN_DEALS } from './mock-open-deals';

export interface AthleteDiscoveryMatch {
  /** Matching OpenDeal surface record. */
  record: OpenDealSurfaceRecord;
  /** Hand-authored fit reasons rendered as bullets on the detail page. */
  reasons: string[];
}

export interface AthleteDiscoveryResult {
  matched: AthleteDiscoveryMatch[];
  /** Top-level summary copy for the discovery surface header. */
  reason: string[];
}

/**
 * Hand-authored discovery snapshot for the Sprint 2.3 demo athlete
 * (`a-1` Kiyan Anthony — Syracuse PG, 1.2M reach, signed). Three
 * matches, drawn straight from `MOCK_OPEN_DEALS`. Order = priority.
 */
const A1_MATCH_FIXTURES: readonly { openDealId: string; reasons: string[] }[] = [
  {
    openDealId: 'od-1',
    reasons: [
      'Top-25 PG fit — Syracuse freshman, 1.2M cross-platform reach',
      'DMV / EYBL roots align with the brand\'s summer tour requirement',
      'Already Nike-aligned — clean disclosure record on prior signature post',
    ],
  },
  {
    openDealId: 'od-2',
    reasons: [
      'Reach exceeds the 100K follower floor by ~12x',
      'Affiliate format pairs cleanly with your existing Gameday content cadence',
      'Non-exclusive — no conflict with your active capsule applications',
    ],
  },
  {
    openDealId: 'od-3',
    reasons: [
      'Class-year filter (Fr / Sr) matches your freshman status',
      'AA-adjacent series content aligns with your stated content goals',
      'Off-position flexibility — appearance-only, no signature commitment',
    ],
  },
];

/**
 * Resolve the discovery snapshot for a given athlete id. Returns an
 * empty result when the athlete has no fixture (defensive — only `a-1`
 * is wired up in Sprint 2.3).
 */
export function getAthleteDiscovery(athleteId: string): AthleteDiscoveryResult {
  if (athleteId !== 'a-1') {
    return {
      matched: [],
      reason: [
        'No matched open deals right now. Check back soon.',
      ],
    };
  }

  const matched: AthleteDiscoveryMatch[] = A1_MATCH_FIXTURES.flatMap(
    ({ openDealId, reasons }) => {
      const record = MOCK_OPEN_DEALS.find((d) => d.deal.id === openDealId);
      return record ? [{ record, reasons }] : [];
    },
  );

  return {
    matched,
    reason: [
      'Filtered to PG-tier deals you have not yet committed to',
      'Reach, position, and class-year overlap with the brand\'s desired attributes',
    ],
  };
}

/**
 * Lookup helper for the detail screen — returns the per-deal reasons
 * for the currently-resolved athlete. Falls back to a single defensive
 * line when the deal isn't in the athlete's match set.
 */
export function getMatchReasonsForOpenDeal(
  athleteId: string,
  openDealId: string,
): string[] {
  const result = getAthleteDiscovery(athleteId);
  const match = result.matched.find((m) => m.record.deal.id === openDealId);
  if (match) return match.reasons;
  return [
    'You\'re viewing this deal outside your matched set — submitting still goes through AI rank + human approval.',
  ];
}
