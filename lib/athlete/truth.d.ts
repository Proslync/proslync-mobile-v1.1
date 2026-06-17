// lib/athlete/truth.d.ts
// TypeScript declarations for lib/athlete/truth.mjs.
// Follows the lib/fan/seeded.d.ts pattern — lets TS resolve the .mjs
// functions when imported as '@/lib/athlete/truth.mjs'.

export declare function addBusinessDays(startDate: Date, businessDays: number): Date;
export declare function hoursUntilISO(isoString: string | null | undefined): number | null;
export declare function thresholdForHours(hours: number | null): 'red' | 'amber' | 'green';
export declare function urgencyForDeadline(deadlineISO: string | null | undefined): 'red' | 'amber' | 'green';

export interface TruthSummaryResult {
  expectedCents: number;
  inReviewCount: number;
  lastPaid?: { dateISO: string; amountCents: number };
}

export interface DealTruth {
  dealId: string;
  brand: string;
  title: string;
  amountCents: number;
  paymentState: 'expected' | 'in-review' | 'cleared' | 'paid';
  paidAtISO?: string;
  taxSetAsideCents?: number;
  disclosure: {
    state: 'not-required' | 'undisclosed' | 'submitted' | 'in-review' | 'cleared' | 'denied';
    executedAtISO: string;
    deadlineISO?: string;
  };
  deliverables: Array<{
    label: string;
    dueISO: string;
    done: boolean;
  }>;
}

export declare function truthSummary(deals: DealTruth[]): TruthSummaryResult;
export declare function nextDisclosureDeadline(deals: DealTruth[]): DealTruth | null;
export declare function upcomingDeliverables(
  deals: DealTruth[],
  n: number
): Array<{ dealId: string; brand: string; label: string; dueISO: string }>;
