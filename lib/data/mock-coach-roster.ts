// ── MOCK COACH ROSTER (Sprint 4 — coach NIL Watch) ───────
// Synthetic, hand-authored fixture mapping the demo coach
// (`coach-001`) to a 6-athlete roster drawn from
// `BRAND_ATHLETES`. Each entry tags an `nilStatus` so the
// coach surface can show roster-NIL state without re-deriving
// from disclosures + deals every render.
//
// `nilStatus` is a coach-facing rollup, NOT a disclosure
// reviewState. It is intentionally coarse:
//   - active             → at least one signed deal, no flags
//   - pending-disclosure → deal in flight, disclosure draft/submitted
//   - flagged            → disclosure flagged or compliance review hit
//   - cleared            → deal closed cleanly (post-review approved)
//
// The `synthetic` source ref keeps this honest — the UI must NOT
// promote roster rows into anything implying official school data.

import type { ComparableDealSourceRef } from '@/lib/types/comparable-deal.types';

export type CoachRosterNilStatus =
  | 'active'
  | 'pending-disclosure'
  | 'flagged'
  | 'cleared';

export type CoachRosterClassYear = 'Fr' | 'So' | 'Jr' | 'Sr';

export interface CoachRosterEntry {
  /** Stable id pointing into `BRAND_ATHLETES`. */
  athleteId: string;
  jerseyNumber: number;
  position: string;
  classYear: CoachRosterClassYear;
  nilStatus: CoachRosterNilStatus;
}

export interface CoachRoster {
  coachId: string;
  team: string;
  entries: CoachRosterEntry[];
  source: ComparableDealSourceRef;
}

const SYNTHETIC_SOURCE: ComparableDealSourceRef = {
  id: 'src:mock-coach-roster',
  label: 'Synthetic · coach roster fixture',
  kind: 'synthetic',
  retrievedAt: '2026-05-10T00:00:00.000Z',
  freshnessDays: 0,
  caveat:
    'Synthetic fixture — coach roster + nilStatus are hand-authored. Replace once roster sync lands.',
};

// ── Demo coach — Paul VI ─────────────────────────────────
// Athlete ids reuse `BRAND_ATHLETES` (a-1 … a-7). Roster size
// is 6, leaving one BRAND_ATHLETE outside the roster so the
// demo also exercises an "off-roster" filter on the brand surface.
const COACH_001_ROSTER: CoachRoster = {
  coachId: 'coach-001',
  team: 'Paul VI Catholic',
  entries: [
    { athleteId: 'a-1', jerseyNumber: 23, position: 'PG', classYear: 'Fr', nilStatus: 'active' },
    { athleteId: 'a-2', jerseyNumber: 11, position: 'SG', classYear: 'Sr', nilStatus: 'cleared' },
    { athleteId: 'a-3', jerseyNumber: 32, position: 'F',  classYear: 'Fr', nilStatus: 'active' },
    { athleteId: 'a-4', jerseyNumber: 4,  position: 'SG', classYear: 'So', nilStatus: 'pending-disclosure' },
    { athleteId: 'a-5', jerseyNumber: 7,  position: 'PG', classYear: 'Fr', nilStatus: 'flagged' },
    { athleteId: 'a-6', jerseyNumber: 15, position: 'F',  classYear: 'Fr', nilStatus: 'pending-disclosure' },
  ],
  source: SYNTHETIC_SOURCE,
};

export const MOCK_COACH_ROSTERS: Record<string, CoachRoster> = {
  'coach-001': COACH_001_ROSTER,
};

export function getMockCoachRoster(coachId: string): CoachRoster | null {
  if (!coachId) return null;
  return MOCK_COACH_ROSTERS[coachId] ?? null;
}

/** Default coach id used by the demo when no coach is signed in. */
export const DEMO_COACH_ID = 'coach-001';
