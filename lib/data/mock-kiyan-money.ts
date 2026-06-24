// lib/data/mock-kiyan-money.ts
// ── CANONICAL DEMO MONEY STORY — Kiyan Anthony (a-1), FY 2025-26 H1 ──────────
// ONE source of truth for every money surface that shows Kiyan's numbers so
// Home / Deals / Wallet / Payout-breakdown can never contradict each other.
//
// The spine is `DEAL_TRUTH_FIXTURE` (lib/data/mock-deal-truth.ts) — already the
// source for the Home MONEY module. This module DERIVES the wallet + nil-deal +
// payout numbers from those same four deals so a coach/investor tabbing between
// surfaces always sees the SAME figures reconcile:
//
//   Deal (truth)     Brand            Amount    State        Counts toward
//   ───────────────  ───────────────  ────────  ───────────  ──────────────────
//   dt-gatorade-1    Gatorade         $3,200    paid         YTD paid
//   dt-jma-1         JMA Wireless     $4,500    expected     booked (expected)
//   dt-nike-1        Nike             $2,400    in-review    pending
//   dt-legacy-1      Legacy Athletics $1,800    cleared      booked (expected)
//
// Canonical roll-up (all derived, never eyeballed):
//   YTD DEAL VALUE  = sum of all four contract amounts   ($11,900)
//   YTD PAID        = sum of `paid` deals                ($3,200)
//   AVAILABLE       = YTD paid − tax set-aside on paid    ($3,200 − $768 = $2,432)
//   PENDING         = in-review + cleared-awaiting-settle ($2,400 + $1,800 = $4,200)
//
// Acceptance: Home "paid this season" == Wallet YTD == Payout paidYtd == $3,200;
// Deals "YTD DEAL VALUE" == $11,900 with a derived (not hardcoded) delta;
// available/pending reconcile against the same four deals.

import { DEAL_TRUTH_FIXTURE } from '@/lib/data/mock-deal-truth';

export const KIYAN_ATHLETE_ID = 'a-1';
export const KIYAN_WALLET_ID = 'wallet-a1';

/** Suggested tax set-aside rate (bp). Matches the payout fixture (24%). */
export const KIYAN_TAX_RATE_BP = 2400;

// ── Roll-ups derived from the canonical truth fixture ───────────────────────

/** Total contracted value across every Kiyan deal — Deals "YTD DEAL VALUE". */
export const kiyanYtdDealValueCents = DEAL_TRUTH_FIXTURE.reduce(
  (acc, d) => acc + d.amountCents,
  0,
);

/** Money actually settled this season — Home "paid this season" + Wallet YTD. */
export const kiyanPaidYtdCents = DEAL_TRUTH_FIXTURE.filter(
  (d) => d.paymentState === 'paid',
).reduce((acc, d) => acc + d.amountCents, 0);

/** Tax set aside on paid deals (24% of paid). */
export const kiyanTaxSetAsideCents = DEAL_TRUTH_FIXTURE.filter(
  (d) => d.paymentState === 'paid',
).reduce(
  (acc, d) => acc + (d.taxSetAsideCents ?? Math.round((d.amountCents * KIYAN_TAX_RATE_BP) / 10_000)),
  0,
);

/** Spendable now = paid − tax set-aside — Wallet "Available now". */
export const kiyanAvailableCents = kiyanPaidYtdCents - kiyanTaxSetAsideCents;

/** Not-yet-settled = in-review + cleared-awaiting-settlement — Wallet "Pending". */
export const kiyanPendingCents = DEAL_TRUTH_FIXTURE.filter(
  (d) => d.paymentState === 'in-review' || d.paymentState === 'cleared',
).reduce((acc, d) => acc + d.amountCents, 0);

/**
 * Derived Deals-screen delta: share of YTD deal value already settled.
 * Replaces the hardcoded "+12%" that sat next to a $0. Positive, integer %,
 * computed from the same canonical numbers the hero shows.
 */
export const kiyanPaidShareOfBookedPct =
  kiyanYtdDealValueCents > 0
    ? Math.round((kiyanPaidYtdCents / kiyanYtdDealValueCents) * 100)
    : 0;
