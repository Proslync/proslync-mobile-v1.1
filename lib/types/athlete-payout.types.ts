// ── ATHLETE PAYOUT SPLIT ──────────────────────────────────
// W31 (PLAN §5 P1) — athlete-financial-view extension. Splits a single
// athlete's NIL pay into the actual category mix that drives a 1099-style
// reconciliation (guaranteed base, performance bonuses, usage-rights
// licensing, appearance fees, royalties), with one synthetic category
// for the **suggested tax set-aside** that the surface holds back.
//
// Distinction vs. `RevShareLedgerEntry` (Sprint 3.1):
//   - `RevShareLedgerEntry` is the AD-side ledger row — three commercial
//     splits (Proslync ↔ AD ↔ school ↔ athlete) for an entire deal.
//   - `AthletePayoutItem` is the **athlete's slice broken back down**
//     by the kind of pay it represents. Same money, different lens.
//
// TAX-ADVICE DISCIPLINE (non-negotiable):
//   The `taxSetAside` total and `suggestedTaxRateBp` are SUGGESTIONS
//   surfaced to nudge athletes to set aside money for federal + state
//   liability. They are NOT tax advice, NOT enforced withholding, and
//   the UI must always restate "estimate, not tax advice. Verify with
//   your accountant." See `capContextNote` and the wallet card / route
//   footnote.
//
// Money in integer cents (`MoneyAmount` precedent). Source attribution
// via `ComparableDealSourceRef` so every row carries provenance.

import type {
  ComparableDealSourceRef,
  MoneyAmount,
} from './comparable-deal.types';

/**
 * The kind of pay a single payout item represents.
 *
 *   - `guaranteed`             — flat base / signing payment.
 *   - `performance`            — bonus tied to a metric (games started,
 *                                conference honours, NCAA tourney run).
 *   - `usage-rights`           — licensing fee for likeness / footage
 *                                / NIL clip use beyond the base contract.
 *   - `appearance`             — per-event appearance fee.
 *   - `royalty`                — recurring per-unit / per-stream payment.
 *   - `tax-withhold-reserve`   — synthetic category — the **suggested**
 *                                amount the surface holds back from
 *                                `gross` for federal + state taxes.
 *                                NOT enforced withholding.
 */
export type AthletePayoutCategory =
  | 'guaranteed'
  | 'performance'
  | 'usage-rights'
  | 'appearance'
  | 'royalty'
  | 'tax-withhold-reserve';

/** Lifecycle of a single payout row from projection through settlement. */
export type AthletePayoutItemStatus =
  | 'projected'   // anticipated; no funds movement yet
  | 'pending'     // owed, not yet paid out
  | 'paid'        // settled in athlete account
  | 'held';       // gated on disclosure / compliance / school clearance

/**
 * One row of an athlete's payout breakdown — typically one per deal +
 * category combination.
 *
 * `dealId` and `brandId` are optional because some categories (e.g. a
 * roll-up royalty across many deals, or the synthetic tax-withhold
 * reserve) don't tie back to a single deal.
 */
export interface AthletePayoutItem {
  id: string;
  /** Period this row rolls up into (FK to `AthletePayoutSummary.period.id`). */
  periodId: string;
  /** Originating deal id, when the row maps 1:1 to a deal. */
  dealId?: string;
  /** Brand counterparty id, when known. */
  brandId?: string;
  /** Human label for the brand (always populated for display). */
  brandLabel: string;
  category: AthletePayoutCategory;
  amountCents: MoneyAmount;
  status: AthletePayoutItemStatus;
  /** ISO 8601 — date the row was earned / projected. */
  date: string;
  /** Optional reviewer / ops note (e.g. "held pending school clearance"). */
  note?: string;
  /** Source attribution (synthetic fixture, disclosure export, etc.). */
  source: ComparableDealSourceRef;
}

/**
 * Pre-rolled payout totals for a single athlete in a single period.
 *
 * `taxSetAside` is the **suggested** federal-plus-state set-aside,
 * computed from `gross * (suggestedTaxRateBp / 10_000)`. NOT enforced
 * withholding. NOT tax advice. UI must restate the caveat.
 */
export interface AthletePayoutTotals {
  gross: MoneyAmount;
  net: MoneyAmount;
  taxSetAside: MoneyAmount;
  pendingPayout: MoneyAmount;
  paidYtd: MoneyAmount;
}

/**
 * Full athlete payout summary — what the wallet card and full payouts
 * route both consume. Period scope is single-period for the mock; the
 * real swap will paginate by `period.id`.
 */
export interface AthletePayoutSummary {
  athleteId: string;
  period: {
    id: string;
    label: string;
  };
  totals: AthletePayoutTotals;
  /** Suggested tax rate in basis points (2400 = 24%). */
  suggestedTaxRateBp: number;
  items: AthletePayoutItem[];
  /** ISO 8601 — last refresh of this summary. */
  updatedAt: string;
  /**
   * Caveat string the UI surfaces alongside the totals. Always:
   * "Athlete payout is your money. Set aside taxes. Verify with your
   * accountant."
   */
  capContextNote: string;
}
