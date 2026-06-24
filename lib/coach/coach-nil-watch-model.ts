// ── COACH NIL WATCH — MODEL ──────────────────────────────
// Pure projection from (roster entry + brand athlete + brand
// deals + disclosures) to the row shape the
// `CoachNilWatchCard` renders. Pulled out of the component so
// the data join is testable and the view stays presentational.

import type {
  Athlete,
  Deal,
} from '@/lib/data/mock-brand-data';
import type {
  CoachRosterEntry,
  CoachRosterNilStatus,
} from '@/lib/data/mock-coach-roster';
import type {
  ComplianceDisclosure,
  DisclosureReviewState,
} from '@/lib/types/compliance-disclosure.types';

export interface CoachNilRow {
  athleteId: string;
  athleteName: string;
  initials: string;
  school: string;
  position: string;
  classYear: string;
  jerseyNumber: number;
  nilStatus: CoachRosterNilStatus;
  /**
   * Dollar-BLIND status of the latest BRAND_DEAL for this athlete (deal
   * stage, e.g. "Signed" / "In negotiation"), or null. Coach surfaces never
   * see deal dollar amounts (the dollar-blind wall) — the coach needs to know
   * a deal exists and where it sits in compliance, not what it's worth.
   */
  lastDealStatus: string | null;
  /** Latest disclosure review state for this athlete, or null. */
  lastDisclosureState: DisclosureReviewState | null;
  /** Pre-formatted human label for `lastDisclosureState` (sentence case). */
  lastDisclosureLabel: string | null;
}

export interface BuildCoachNilRowsInput {
  entries: CoachRosterEntry[];
  athletes: readonly Athlete[];
  deals: readonly Deal[];
  /** Injected lookup so callers can pass the mock list helper. */
  listDisclosures: (athleteId: string) => readonly ComplianceDisclosure[];
}

export function buildCoachNilRows({
  entries,
  athletes,
  deals,
  listDisclosures,
}: BuildCoachNilRowsInput): CoachNilRow[] {
  const athleteById = new Map(athletes.map((a) => [a.id, a]));

  return entries
    .map<CoachNilRow | null>((entry) => {
      const athlete = athleteById.get(entry.athleteId);
      if (!athlete) return null;

      const latestDeal = pickLatestDealForAthlete(athlete, deals);
      const disclosures = listDisclosures(entry.athleteId);
      const latestDisclosure = pickLatestDisclosure(disclosures);

      return {
        athleteId: entry.athleteId,
        athleteName: athlete.name,
        initials: athlete.initials,
        school: athlete.school,
        position: entry.position,
        classYear: entry.classYear,
        jerseyNumber: entry.jerseyNumber,
        nilStatus: entry.nilStatus,
        lastDealStatus: latestDeal ? formatDealStage(latestDeal.stage) : null,
        lastDisclosureState: latestDisclosure?.reviewState ?? null,
        lastDisclosureLabel: latestDisclosure
          ? formatDisclosureState(latestDisclosure.reviewState)
          : null,
      };
    })
    .filter((row): row is CoachNilRow => row !== null);
}

/**
 * Roll up the four `nilStatus` buckets so the hero stat row can
 * render counts without re-iterating in the view.
 */
export function countByNilStatus(
  rows: readonly CoachNilRow[],
): Record<CoachRosterNilStatus, number> {
  const acc: Record<CoachRosterNilStatus, number> = {
    active: 0,
    'pending-disclosure': 0,
    flagged: 0,
    cleared: 0,
  };
  for (const row of rows) {
    acc[row.nilStatus] += 1;
  }
  return acc;
}

// ── INTERNALS ────────────────────────────────────────────

/**
 * `BRAND_DEALS[*].athlete` is a free-form display string like
 * "Dylan Harper · Rutgers" — match by case-insensitive substring
 * on the athlete's display name. Returns the latest matching deal
 * (last in array wins; the fixture order is stable enough for the
 * demo + reflects "most recently surfaced").
 */
function pickLatestDealForAthlete(
  athlete: Athlete,
  deals: readonly Deal[],
): Deal | null {
  const needle = athlete.name.toLowerCase();
  let match: Deal | null = null;
  for (const deal of deals) {
    if (deal.athlete.toLowerCase().includes(needle)) {
      match = deal;
    }
  }
  return match;
}

function pickLatestDisclosure(
  disclosures: readonly ComplianceDisclosure[],
): ComplianceDisclosure | null {
  if (disclosures.length === 0) return null;
  // Disclosures already arrive in fixture order; reuse last as latest
  // until we have a real `updatedAt` to sort on.
  return disclosures[disclosures.length - 1] ?? null;
}

/** Dollar-free, sentence-case label for a deal stage — the only deal signal a
 *  (dollar-blind) coach surface is allowed to show. */
function formatDealStage(stage: Deal['stage']): string {
  switch (stage) {
    case 'draft':
      return 'Drafting';
    case 'sent':
      return 'Offer sent';
    case 'negotiation':
      return 'In negotiation';
    case 'signed':
      return 'Signed';
    case 'live':
      return 'Active';
    default: {
      const exhaustive: never = stage;
      return exhaustive;
    }
  }
}

function formatDisclosureState(state: DisclosureReviewState): string {
  switch (state) {
    case 'draft':
      return 'Draft';
    case 'submitted':
      return 'Submitted';
    case 'school-review':
      return 'School review';
    case 'approved':
      return 'Approved';
    case 'flagged':
      return 'Flagged';
    case 'amended':
      return 'Amended';
    default: {
      const exhaustive: never = state;
      return exhaustive;
    }
  }
}
