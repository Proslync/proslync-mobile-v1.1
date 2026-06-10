// ── AD REVENUE-SHARE LEDGER ───────────────────────────────
// Sprint 3.1 primitive (PLAN.md §3.1). The defensible Proslync
// differentiator vs. Opendorse / INFLCR / Athliance / MOGL is
// revenue-share with the athletic department — *not* SaaS, per-deal,
// or retainer pricing (PLAN P3).
//
// CLEAR SEPARATION DISCIPLINE (PLAN P4 — non-negotiable):
//
//   1. `platformFeeCents` is the **Proslync ↔ AD revenue-share** —
//      what the AD pays Proslync for using the platform. This is the
//      buyer-side commercial term and is NOT subject to the
//      House-v.-NCAA $20.5M/year/school cap.
//
//   2. `schoolDisbursementCents` is the AD's **post-platform-fee
//      slice** of the deal — the AD's retained revenue from
//      brand-funded NIL activity. Not capped by House (it's
//      institutional revenue, not payment to a student-athlete).
//
//   3. `athletePayoutCents` is the **school ↔ athlete pass-through**
//      to the participating athlete. This IS counted against the
//      House-v.-NCAA cap and the school is source-of-truth for that
//      reconciliation. Proslync surfaces the number alongside the
//      `HouseCapContext` reference display but does not own the cap
//      math (mirrors Sprint 3.10 `risk-report` posture).
//
// Money in integer cents (`MoneyAmount` precedent). The `HouseCapContext`
// reference is re-imported from `risk-report.types.ts` so the cap
// math is defined exactly once across the AD cockpit.
//
// Schema attribution: original to Proslync. Field naming mirrors
// `ComparableDeal*`, `OpenDeal*`, and `RiskReport*` for readability.

import type {
  ComparableDealSourceRef,
  MoneyAmount,
} from './comparable-deal.types';
import type { HouseCapContext } from './risk-report.types';

/**
 * Shape of the platform-fee agreement between Proslync and the AD.
 *
 *   - `flat`       — single percentage applied to every gross deal.
 *   - `tiered`     — bracketed rates (e.g. 6% up to $250K, 5% to $1M,
 *                    4% above) — `brackets` defines the curve.
 *   - `negotiated` — bespoke contract, free-form note. Used when the
 *                    school's commercial term doesn't fit a percentage
 *                    schedule (rev-share floor + ceiling, hybrid, etc.).
 */
export type PlatformFeeTier = 'flat' | 'tiered' | 'negotiated';

/**
 * Platform-fee agreement metadata. This describes the **Proslync ↔ AD
 * commercial term** — distinct from House-v.-NCAA school↔athlete math.
 */
export interface PlatformFeeStructure {
  tier: PlatformFeeTier;
  /** Headline rate in basis points (100bp = 1.00%). Optional for `negotiated`. */
  percentageBp?: number;
  /**
   * Bracketed rate curve, lowest threshold first. Each bracket applies
   * *above* its `thresholdCents`. Used when `tier === 'tiered'`.
   */
  brackets?: {
    thresholdCents: number;
    rateBp: number;
  }[];
  /** Free-form description for `negotiated`. */
  negotiatedRateNote?: string;
}

/** Lifecycle of a single ledger row from projection through settlement. */
export type RevShareLedgerEntryStatus =
  | 'projected'   // anticipated, no funds movement yet
  | 'recorded'    // brand funds received, splits computed, not yet disbursed
  | 'disbursed'   // school + athlete + platform payouts settled
  | 'disputed';   // contested by AD, brand, or athlete; on hold

/**
 * One ledger row — represents the platform fee + downstream splits for
 * a single brand-funded deal in a given reporting period.
 *
 * Three money fields, three commercial relationships:
 *   - `platformFeeCents`        Proslync ↔ AD (NOT House-capped)
 *   - `schoolDisbursementCents` AD's retained slice (NOT House-capped)
 *   - `athletePayoutCents`      School ↔ athlete (IS House-capped)
 *
 * Invariant: `platformFeeCents + schoolDisbursementCents +
 *            athletePayoutCents === grossDealCents`.
 */
export interface RevShareLedgerEntry {
  id: string;
  /** Period this row rolls up into (FK to `RevShareLedgerPeriod.id`). */
  periodId: string;
  /** Cross-ref to the originating deal — same id space as `BRAND_DEALS`. */
  dealId: string;
  /** Brand counterparty id. Free-form; aligns with brand-side data. */
  brandId: string;
  /** Athlete counterparty id — same id space as `BRAND_ATHLETES`. */
  athleteId: string;
  /** Gross brand-funded amount before any splits. */
  grossDealCents: MoneyAmount;
  /** Proslync ↔ AD rev-share (the platform's slice). NOT House-capped. */
  platformFeeCents: MoneyAmount;
  /** AD's retained slice after the platform fee. NOT House-capped. */
  schoolDisbursementCents: MoneyAmount;
  /** Pass-through to the participating athlete. IS House-capped. */
  athletePayoutCents: MoneyAmount;
  /** ISO 8601 — when the row was first recorded. */
  recordedAt: string;
  status: RevShareLedgerEntryStatus;
  /** Source attribution for this row (synthetic fixture, disclosure, etc.). */
  source: ComparableDealSourceRef;
  /** Optional reviewer / ops note. */
  note?: string;
}

/**
 * Reporting period a ledger covers. Half-open `[startDate, endDate)`
 * by convention, matching `RiskReportPeriod` shape.
 */
export interface RevShareLedgerPeriod {
  id: string;
  /** Human label, e.g. "FY 2025-26 H1". */
  label: string;
  /** ISO 8601 — inclusive start. */
  startDate: string;
  /** ISO 8601 — exclusive end. */
  endDate: string;
  /** Fiscal-year identifier, e.g. "FY 2025-26". */
  fiscalYear: string;
}

/** Pre-rolled totals across all entries in a ledger. Cents, currency USD. */
export interface RevShareLedgerTotals {
  grossCents: MoneyAmount;
  platformFeeCents: MoneyAmount;
  schoolDisbursementCents: MoneyAmount;
  athletePayoutCents: MoneyAmount;
}

/* ── LEGACY SCHEMA-CANDIDATE SHAPES (pre-Sprint-3.1) ──────────
 * Pre-Sprint-3.1 schema-candidate exports — kept for the
 * marketplace-barrel back-compat surface. New code should consume
 * the Sprint-3.1 `RevShareLedger` / `RevShareLedgerEntry` /
 * `PlatformFeeStructure` types above; these stubs exist only so the
 * `marketplace.types.ts` barrel keeps compiling while callers
 * migrate.
 */

export type PlatformFeeShape =
  | 'flat-percent'
  | 'tiered-by-deal-size'
  | 'negotiated-per-school';

export type LedgerEntryKind =
  | 'platform-fee-accrual'
  | 'school-disbursement'
  | 'adjustment'
  | 'refund';

/** Legacy band shape. Sprint 3.1 uses `PlatformFeeStructure.brackets`. */
export interface PlatformFeeBand {
  minDealCents: number;
  maxDealCents?: number;
  rateBps: number;
}

/**
 * @deprecated Schema-candidate placeholder for the per-school fee
 * agreement record. The Sprint-3.1 type is `PlatformFeeStructure`.
 * Kept under the legacy name `PlatformFeeAgreement` (re-exported
 * from `marketplace.types.ts` as `PlatformFeeTier` for back-compat).
 */
export interface PlatformFeeAgreement {
  id: string;
  shape: PlatformFeeShape;
  flatPercentBps?: number;
  bands?: PlatformFeeBand[];
  effectiveFrom: string;
  effectiveUntil?: string;
}

/**
 * @deprecated Schema-candidate accrual / payout shape. Sprint-3.1
 * uses `RevShareLedgerEntry` (above) with explicit Proslync ↔ AD ↔
 * athlete splits.
 */
export interface RevShareLegacyEntry {
  id: string;
  schoolId: string;
  adId?: string;
  kind: LedgerEntryKind;
  amountCents: number;
  dealId?: string;
  feeTierId: string;
  occurredAt: string;
  notes?: string;
}

export type SchoolDisbursementStatus =
  | 'pending'
  | 'sent'
  | 'failed'
  | 'reconciled';

/**
 * @deprecated Schema-candidate periodic disbursement record. Sprint-3.1
 * rolls disbursement state into `RevShareLedgerEntry.status`.
 */
export interface SchoolDisbursement {
  id: string;
  schoolId: string;
  periodStart: string;
  periodEnd: string;
  grossFeesCents: number;
  adjustmentsCents: number;
  netDisbursedCents: number;
  status: SchoolDisbursementStatus;
  ledgerEntryIds: string[];
}

/**
 * @deprecated Schema-candidate top-level shape. Sprint-3.1 uses
 * `RevShareLedger` above with `period + entries + totals + capContext`.
 */
export interface RevShareLegacyLedger {
  schoolId: string;
  feeTier: PlatformFeeAgreement;
  entries: RevShareLegacyEntry[];
  disbursements: SchoolDisbursement[];
}

export type HouseVNcaaCapSource =
  | 'reference-only'
  | 'school-self-reported'
  | 'csc-public';

/**
 * @deprecated Schema-candidate cap shape. The Sprint-3.10 / 3.1 cap
 * primitive is `HouseCapContext` in `risk-report.types.ts`, used
 * uniformly across the AD cockpit.
 */
export interface HouseVNcaaCap {
  schoolId: string;
  capYear: number;
  capCents: number;
  utilizationCents: number;
  utilizationAsOf: string;
  source: HouseVNcaaCapSource;
}

/**
 * Full ledger payload — one per `schoolId` per period.
 *
 * `capContext` is *reference display only* and is re-imported verbatim
 * from `risk-report.types.ts`. Proslync does not own the cap math
 * (PLAN P4).
 */
export interface RevShareLedger {
  schoolId: string;
  period: RevShareLedgerPeriod;
  feeStructure: PlatformFeeStructure;
  entries: RevShareLedgerEntry[];
  totals: RevShareLedgerTotals;
  /**
   * House-v.-NCAA cap context — re-display of the school's own reported
   * usage. Surfaced here so AD reviewers can see the platform-fee total
   * (NOT capped) next to the athlete-payout total (cap-bound).
   */
  capContext: HouseCapContext;
  /** ISO 8601 — last refresh of this ledger. */
  updatedAt: string;
}
