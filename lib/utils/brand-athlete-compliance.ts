// ── BRAND-SIDE PER-ATHLETE COMPLIANCE SUMMARY ─────────────
// Pure roll-up used by `<BrandComplianceChip />` (Sprint 2.8, W37) to
// turn the cross-fixture compliance state into a single dot-or-pill on
// the brand-dashboard roster. Reads `MOCK_DISCLOSURES` (NIL Go-shaped
// disclosure fixtures) by `athleteId`, and reads `NIL_MANAGER_ATHLETES`
// by name overlap to surface the manager-side flag severities that
// already drive the NIL-manager surface. Stays a pure function — the
// chip is render-only, no hook needed.
//
// Source-ref reuse: returns a `ComparableDealSourceRef` tagged as
// `synthetic` per the Proslync TrustMeta posture so any consuming UI
// can render the "synthetic — demo fixture" caveat alongside the chip.

import {
  MOCK_DISCLOSURES,
  listMockDisclosuresForAthlete,
} from '@/lib/data/mock-disclosures';
import {
  NIL_MANAGER_ATHLETES,
  type ComplianceFlag,
  type NilManagerAthlete,
} from '@/lib/data/mock-nil-manager-data';
import { BRAND_ATHLETES } from '@/lib/data/mock-brand-data';
import type { ComparableDealSourceRef } from '@/lib/types/comparable-deal.types';
import type {
  ComplianceDisclosure,
  DisclosureReviewState,
} from '@/lib/types/compliance-disclosure.types';

export type BrandAthleteComplianceStatus =
  | 'cleared'
  | 'review'
  | 'flagged'
  | 'unknown';

export interface BrandAthleteComplianceSummary {
  status: BrandAthleteComplianceStatus;
  counts: {
    criticalFlags: number;
    warnFlags: number;
    pendingDisclosures: number;
    approvedDisclosures: number;
  };
  latestActivity?: string;
  sourceRef: ComparableDealSourceRef;
}

const ROLLUP_SOURCE_AT = '2026-05-10T00:00:00.000Z';

/** Disclosures that count as "pending" reviewer attention on the brand side. */
const PENDING_REVIEW_STATES: ReadonlySet<DisclosureReviewState> = new Set([
  'draft',
  'submitted',
  'school-review',
  'amended',
]);

function findManagerAthleteByBrandId(
  brandAthleteId: string,
): NilManagerAthlete | undefined {
  const brandAthlete = BRAND_ATHLETES.find((a) => a.id === brandAthleteId);
  if (!brandAthlete) return undefined;
  return NIL_MANAGER_ATHLETES.find((m) => m.name === brandAthlete.name);
}

function severityCounts(flags: readonly ComplianceFlag[]): {
  criticalFlags: number;
  warnFlags: number;
} {
  let criticalFlags = 0;
  let warnFlags = 0;
  for (const f of flags) {
    if (f.severity === 'critical') criticalFlags += 1;
    else if (f.severity === 'warn') warnFlags += 1;
  }
  return { criticalFlags, warnFlags };
}

function disclosureCounts(disclosures: readonly ComplianceDisclosure[]): {
  pendingDisclosures: number;
  approvedDisclosures: number;
  flaggedDisclosures: number;
} {
  let pendingDisclosures = 0;
  let approvedDisclosures = 0;
  let flaggedDisclosures = 0;
  for (const d of disclosures) {
    if (d.reviewState === 'flagged') flaggedDisclosures += 1;
    else if (d.reviewState === 'approved') approvedDisclosures += 1;
    else if (PENDING_REVIEW_STATES.has(d.reviewState)) pendingDisclosures += 1;
  }
  return { pendingDisclosures, approvedDisclosures, flaggedDisclosures };
}

function latestActivityIso(
  disclosures: readonly ComplianceDisclosure[],
): string | undefined {
  let latest: string | undefined;
  for (const d of disclosures) {
    for (const entry of d.actionHistory) {
      if (!latest || entry.at > latest) latest = entry.at;
    }
  }
  return latest;
}

function makeSourceRef(athleteId: string): ComparableDealSourceRef {
  return {
    id: `src-brand-compliance-${athleteId}`,
    label: 'Hand-authored brand-side compliance roll-up (Sprint 2.8 demo)',
    kind: 'synthetic',
    retrievedAt: ROLLUP_SOURCE_AT,
    freshnessDays: 0,
    caveat:
      'Synthetic roll-up over MOCK_DISCLOSURES + NIL_MANAGER_ATHLETES — replace before external use.',
  };
}

/**
 * Summarize per-athlete compliance state for the brand dashboard roster.
 * Pure function — re-reads the in-memory fixtures on each call.
 */
export function summarizeAthleteCompliance(
  athleteId: string,
): BrandAthleteComplianceSummary {
  const disclosures = listMockDisclosuresForAthlete(athleteId);
  const manager = findManagerAthleteByBrandId(athleteId);
  const flags = manager?.complianceFlags ?? [];

  const { criticalFlags, warnFlags } = severityCounts(flags);
  const { pendingDisclosures, approvedDisclosures, flaggedDisclosures } =
    disclosureCounts(disclosures);

  let status: BrandAthleteComplianceStatus;
  if (disclosures.length === 0 && !manager) {
    status = 'unknown';
  } else if (criticalFlags > 0 || flaggedDisclosures > 0) {
    status = 'flagged';
  } else if (warnFlags > 0 || pendingDisclosures > 0) {
    status = 'review';
  } else if (approvedDisclosures > 0 || (manager && flags.length === 0)) {
    status = 'cleared';
  } else {
    status = 'unknown';
  }

  return {
    status,
    counts: {
      criticalFlags,
      warnFlags,
      pendingDisclosures,
      approvedDisclosures,
    },
    latestActivity: latestActivityIso(disclosures),
    sourceRef: makeSourceRef(athleteId),
  };
}

/** Exported for tests / debug only — kept off the public barrel. */
export const __INTERNAL = {
  MOCK_DISCLOSURES,
  PENDING_REVIEW_STATES,
};
