// lib/brand/brand-reliability.d.ts
// TypeScript declarations for lib/brand/brand-reliability.mjs.
// Follows the lib/athlete/truth.d.ts pattern — lets TS resolve the .mjs
// function when imported as '@/lib/brand/brand-reliability.mjs'.

export interface ReliabilityPaymentRecord {
  dealId: string;
  brandLabel: string;
  amountCents: number;
  status: 'paid' | 'in-review' | 'cleared' | 'expected' | 'projected';
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

export declare function buildBrandReliability(
  records: ReliabilityPaymentRecord[],
): BrandReliability;
