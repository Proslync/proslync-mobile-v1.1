// lib/brand/brand-reliability.ts
// Typed façade over brand-reliability.mjs (pure projection). The .mjs holds the
// implementation so node:test can run it without the TS toolchain; this file
// exposes TS types + a typed wrapper, plus the demo source-of-truth builder
// that derives the Nike Hoops reliability card from the real payment LEDGER
// (deal-truth + Kiyan's payout history) instead of hand-typed literals.
// Pattern mirrors lib/athlete/truth.ts.

import { buildBrandReliability as _buildBrandReliability } from './brand-reliability.mjs';
import { DEAL_TRUTH_FIXTURE, HERO_DEAL_TRUTH } from '@/lib/data/mock-deal-truth';
import { getMockAthletePayoutSummary } from '@/lib/data/mock-athlete-payouts';

export type ReliabilityPaymentStatus =
  | 'paid'
  | 'in-review'
  | 'cleared'
  | 'expected'
  | 'projected';

export interface ReliabilityPaymentRecord {
  dealId: string;
  brandLabel: string;
  amountCents: number;
  status: ReliabilityPaymentStatus;
  executedAtISO?: string;
  paidAtISO?: string;
  escrowFundedBeforeWork?: boolean;
}

export interface BrandReliability {
  dealsFullyPaid: number;
  dealsTotal: number;
  dealsFullyPaidLabel: string;
  medianDaysToPay: number | null;
  medianDaysToPayLabel: string;
  escrowFundedBeforeWorkPct: number;
  escrowFundedBeforeWorkLabel: string;
  reliable: boolean;
}

export const buildBrandReliability = _buildBrandReliability as (
  records: ReliabilityPaymentRecord[],
) => BrandReliability;

// ── Demo ledger → Nike Hoops reliability card ─────────────────────────────
// The athlete/agent viewing the Nike Hoops trust card sees a reliability badge
// DERIVED from Kiyan's (a-1) confirmed payment history: every settled deal in
// the DEAL_TRUTH_FIXTURE (the paid Gatorade record + the in-flight small deals)
// plus the hero d-4 Nike Hoops renewal (signed, payments scheduled). Pulling
// the timing off real paid events makes "median days to pay" a computed number
// the athlete's own ledger backs — not a literal the brand typed in.
const KIYAN_LEDGER: ReliabilityPaymentRecord[] = [
  ...DEAL_TRUTH_FIXTURE.map((d) => ({
    dealId: d.dealId,
    brandLabel: d.brand,
    amountCents: d.amountCents,
    status: d.paymentState as ReliabilityPaymentStatus,
    executedAtISO: d.disclosure.executedAtISO,
    paidAtISO: d.paidAtISO,
    // Escrow-funded-before-work proxy: any deal that reached cleared/paid was
    // funded ahead of settlement in this demo's payment model.
    escrowFundedBeforeWork:
      d.paymentState === 'paid' || d.paymentState === 'cleared',
  })),
  ...HERO_DEAL_TRUTH.map((d) => ({
    dealId: 'd-4',
    brandLabel: d.brand,
    amountCents: d.amountCents,
    status: d.paymentState as ReliabilityPaymentStatus,
    executedAtISO: d.disclosure.executedAtISO,
    paidAtISO: d.paidAtISO,
    escrowFundedBeforeWork: true,
  })),
];

/** The Nike Hoops PAYMENT RELIABILITY card, derived from Kiyan's ledger. */
export function getNikeHoopsReliability(): BrandReliability {
  return buildBrandReliability(KIYAN_LEDGER);
}
