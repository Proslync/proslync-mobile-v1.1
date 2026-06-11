// lib/athlete/truth.ts
// Types and typed selectors for the athlete thin truth layer.
// Selectors live in truth.mjs (plain JS so node:test can run them without
// a TS toolchain). This file exposes TS types + typed selector references
// that components import. Pattern mirrors lib/fan/seeded — .d.ts handles
// the .mjs side; this .ts file holds the TS-side canonical type exports.

export type PaymentState = 'expected' | 'in-review' | 'cleared' | 'paid';

export type DisclosureState =
  | 'not-required'
  | 'undisclosed'
  | 'submitted'
  | 'in-review'
  | 'cleared'
  | 'denied';

export interface DealTruth {
  dealId: string;
  brand: string;
  title: string;
  amountCents: number;
  paymentState: PaymentState;
  paidAtISO?: string;          // only when paid
  taxSetAsideCents?: number;   // only when paid
  disclosure: {
    state: DisclosureState;
    executedAtISO: string;
    deadlineISO?: string;      // only while undisclosed (executed + 5 business days)
  };
  deliverables: Array<{
    label: string;
    dueISO: string;
    done: boolean;
  }>;
}

export interface TruthSummaryResult {
  expectedCents: number;
  inReviewCount: number;
  lastPaid?: { dateISO: string; amountCents: number };
}

// ── Typed wrappers around the .mjs pure functions ─────────────────────────
// Import as values, cast to typed function signatures.
// This avoids the TS re-export-from-.mjs pitfall while keeping the
// implementation in a single testable .mjs file.

import {
  addBusinessDays as _addBusinessDays,
  hoursUntilISO as _hoursUntilISO,
  thresholdForHours as _thresholdForHours,
  truthSummary as _truthSummary,
  nextDisclosureDeadline as _nextDisclosureDeadline,
  upcomingDeliverables as _upcomingDeliverables,
} from './truth.mjs';

export const addBusinessDays = _addBusinessDays as (startDate: Date, businessDays: number) => Date;

export const hoursUntilISO = _hoursUntilISO as (isoString: string | null | undefined) => number | null;

export const thresholdForHours = _thresholdForHours as (hours: number | null) => 'red' | 'amber' | 'green';

export const truthSummary = _truthSummary as (deals: DealTruth[]) => TruthSummaryResult;

export const nextDisclosureDeadline = _nextDisclosureDeadline as (deals: DealTruth[]) => DealTruth | null;

export const upcomingDeliverables = _upcomingDeliverables as (
  deals: DealTruth[],
  n: number,
) => Array<{ dealId: string; brand: string; label: string; dueISO: string }>;
