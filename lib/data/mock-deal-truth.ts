// lib/data/mock-deal-truth.ts
// ── ATHLETE DEAL TRUTH FIXTURE ─────────────────────────────────────────
// Four deals that tell the spec §7 demo story:
//   (1) JMA Wireless — executed yesterday, UNDISCLOSED, 3 biz-day deadline
//   (2) Nike — disclosed, payment IN-REVIEW (CSC), IG Reel deliverable due ~71h
//   (3) Legacy Athletics — CLEARED, payment expected
//   (4) Gatorade — PAID 8 days ago, tax set-aside 24%
//
// ── PHASE 0 STRANGLER REFACTOR ──────────────────────────────────────────
// Each deal is now BUILT in the canonical, event-sourced, cents-based shape
// (CanonicalDealTruth: payment events + attested clearance + payout + ledger),
// then the EXISTING display shape (DealTruth, consumed by ~6 readers and
// truth.mjs) is DERIVED via toDealTruth(). Readers are untouched and the demo
// is pixel-identical. The canonical shape is the source of truth a real
// backend (Stripe payouts / Plaid settled / CSC attestation / ledger) emits.
// See lib/money/money-machine.mjs for the state-machine spec.
//
// All deadlines are computed relative to Date.now() at module load so
// the fixture never expires. Export EMPTY_DEAL_TRUTH for empty-state testing.

import { addBusinessDays } from '@/lib/athlete/truth';
import type { DealTruth } from '@/lib/athlete/truth';
import { deriveState, ledgerBalance } from '@/lib/money/money-machine.mjs';
import type {
  PaymentEvent,
  AttestedStatus,
  PayoutState,
  LedgerEntry,
} from '@/lib/money/money-model';

// ── Canonical shape (source of truth) ───────────────────────────────────

interface CanonicalDealTruth {
  dealId: string;
  brand: string;
  title: string;
  amountCents: number;
  /** Event-sourced payment history; paymentState is DERIVED from this. */
  paymentEvents: PaymentEvent[];
  /** Human-attested clearance (NIL Go), not a synthetic flag. */
  clearance: AttestedStatus;
  /** ISO of deal execution. */
  executedAtISO: string;
  /** Disclosure deadline (executed + business days) while undisclosed. */
  disclosureDeadlineISO?: string;
  /** Double-entry ledger; tax set-aside & paid amounts derive from this. */
  ledger: LedgerEntry[];
  deliverables: Array<{ label: string; dueISO: string; done: boolean }>;
}

// ── Derive the legacy display shape from the canonical record ────────────

/**
 * The clearance.state vocabulary IS the DisclosureState vocabulary, so the
 * disclosure view maps 1:1. paymentState derives from the event log; paidAt
 * and taxSetAside derive from the payment events + ledger respectively.
 */
function toDealTruth(c: CanonicalDealTruth): DealTruth {
  const paymentState = deriveState(c.paymentEvents) as DealTruth['paymentState'];

  // Last `paid` event carries the settlement time.
  const paidEv = [...c.paymentEvents].reverse().find((e) => e.kind === 'paid');

  // Tax set-aside is the magnitude of the tax-set-aside ledger debit, if any.
  const taxLedger = c.ledger.filter((l) => l.kind === 'tax-set-aside');
  const taxSetAsideCents = taxLedger.length
    ? Math.abs(ledgerBalance(taxLedger))
    : undefined;

  const disclosure: DealTruth['disclosure'] = {
    state: c.clearance.state,
    executedAtISO: c.executedAtISO,
    ...(c.disclosureDeadlineISO ? { deadlineISO: c.disclosureDeadlineISO } : {}),
  };

  return {
    dealId: c.dealId,
    brand: c.brand,
    title: c.title,
    amountCents: c.amountCents,
    paymentState,
    ...(paidEv ? { paidAtISO: paidEv.atISO } : {}),
    ...(taxSetAsideCents !== undefined ? { taxSetAsideCents } : {}),
    disclosure,
    deliverables: c.deliverables,
  };
}

// ── Reference timestamps ─────────────────────────────────────────────────

// ① JMA Wireless: executed yesterday, NIL Go deadline ~3 biz days out.
const JMA_EXECUTED_ISO = new Date(Date.now() - 24 * 3600e3).toISOString();
const JMA_DEADLINE_ISO = addBusinessDays(new Date(Date.now()), 3).toISOString();

// ② Nike: disclosed, payment in-review.
const NIKE_EXECUTED_ISO = new Date(Date.now() - 7 * 24 * 3600e3).toISOString();
const NIKE_REEL_DUE_ISO = new Date(Date.now() + 71 * 3600e3).toISOString(); // ~71h → amber

// ③ Legacy Athletics: cleared.
const LEGACY_EXECUTED_ISO = new Date(Date.now() - 14 * 24 * 3600e3).toISOString();

// ④ Gatorade: paid 8 days ago; ACH return window = +5 days from settlement.
const GATORADE_EXECUTED_ISO = new Date(Date.now() - 30 * 24 * 3600e3).toISOString();
const GATORADE_PAID_ISO = new Date(Date.now() - 8 * 24 * 3600e3).toISOString();
const GATORADE_REVERSIBLE_UNTIL_ISO = new Date(
  new Date(GATORADE_PAID_ISO).getTime() + 5 * 24 * 3600e3,
).toISOString();

// ── Canonical fixture (source of truth) ──────────────────────────────────

const CANONICAL_DEALS: CanonicalDealTruth[] = [
  // ① JMA Wireless — executed, NIL Go clock running, UNDISCLOSED, payment expected
  {
    dealId: 'dt-jma-1',
    brand: 'JMA Wireless',
    title: 'Brand Ambassador · Q3',
    amountCents: 4_500_00,
    paymentEvents: [
      { kind: 'expected', atISO: JMA_EXECUTED_ISO, source: 'contract' },
    ],
    clearance: { state: 'undisclosed', source: 'fixture' },
    executedAtISO: JMA_EXECUTED_ISO,
    disclosureDeadlineISO: JMA_DEADLINE_ISO,
    ledger: [
      { id: 'lg-jma-credit', atISO: JMA_EXECUTED_ISO, kind: 'deal-credit', amountCents: 4_500_00, sign: 1, ref: 'dt-jma-1' },
    ],
    deliverables: [
      { label: 'Social post (1)', dueISO: new Date(Date.now() + 5 * 24 * 3600e3).toISOString(), done: false },
    ],
  },

  // ② Nike — disclosed/submitted, payment in CSC review, IG Reel due ~71h
  {
    dealId: 'dt-nike-1',
    brand: 'Nike',
    title: 'Campus Activation · Summer',
    amountCents: 2_400_00,
    paymentEvents: [
      { kind: 'expected', atISO: NIKE_EXECUTED_ISO, source: 'contract' },
      { kind: 'in-review', atISO: new Date(Date.now() - 2 * 24 * 3600e3).toISOString(), source: 'csc-attested' },
    ],
    clearance: { state: 'submitted', source: 'csc-portal' },
    executedAtISO: NIKE_EXECUTED_ISO,
    ledger: [
      { id: 'lg-nike-credit', atISO: NIKE_EXECUTED_ISO, kind: 'deal-credit', amountCents: 2_400_00, sign: 1, ref: 'dt-nike-1' },
    ],
    deliverables: [
      { label: 'IG Reel', dueISO: NIKE_REEL_DUE_ISO, done: false },
      { label: 'Recap Post', dueISO: new Date(Date.now() - 2 * 24 * 3600e3).toISOString(), done: true },
    ],
  },

  // ③ Legacy Athletics — CSC cleared, payment expected (authorized, not settled)
  {
    dealId: 'dt-legacy-1',
    brand: 'Legacy Athletics',
    title: 'Apparel Deal · FY26',
    amountCents: 1_800_00,
    paymentEvents: [
      { kind: 'expected', atISO: LEGACY_EXECUTED_ISO, source: 'contract' },
      { kind: 'in-review', atISO: new Date(Date.now() - 12 * 24 * 3600e3).toISOString(), source: 'csc-attested' },
      { kind: 'cleared', atISO: new Date(Date.now() - 10 * 24 * 3600e3).toISOString(), source: 'csc-attested' },
    ],
    clearance: {
      state: 'cleared',
      attestedAtISO: new Date(Date.now() - 10 * 24 * 3600e3).toISOString(),
      source: 'csc-portal',
    },
    executedAtISO: LEGACY_EXECUTED_ISO,
    ledger: [
      { id: 'lg-legacy-credit', atISO: LEGACY_EXECUTED_ISO, kind: 'deal-credit', amountCents: 1_800_00, sign: 1, ref: 'dt-legacy-1' },
    ],
    deliverables: [
      { label: 'Product shoot', dueISO: new Date(Date.now() + 10 * 24 * 3600e3).toISOString(), done: false },
    ],
  },

  // ④ Gatorade — paid 8 days ago, 24% tax set-aside ($768 of $3,200)
  {
    dealId: 'dt-gatorade-1',
    brand: 'Gatorade',
    title: 'Performance Partnership',
    amountCents: 3_200_00,
    paymentEvents: [
      { kind: 'expected', atISO: GATORADE_EXECUTED_ISO, source: 'contract' },
      { kind: 'in-review', atISO: new Date(Date.now() - 22 * 24 * 3600e3).toISOString(), source: 'csc-attested' },
      { kind: 'cleared', atISO: new Date(Date.now() - 18 * 24 * 3600e3).toISOString(), source: 'csc-attested' },
      { kind: 'paid', atISO: GATORADE_PAID_ISO, source: 'plaid:settled', reversibleUntilISO: GATORADE_REVERSIBLE_UNTIL_ISO },
    ],
    clearance: {
      state: 'cleared',
      attestedAtISO: new Date(Date.now() - 18 * 24 * 3600e3).toISOString(),
      source: 'csc-portal',
    },
    executedAtISO: GATORADE_EXECUTED_ISO,
    ledger: [
      { id: 'lg-gat-credit', atISO: GATORADE_PAID_ISO, kind: 'deal-credit', amountCents: 3_200_00, sign: 1, ref: 'dt-gatorade-1' },
      { id: 'lg-gat-tax', atISO: GATORADE_PAID_ISO, kind: 'tax-set-aside', amountCents: 768_00, sign: -1, ref: 'dt-gatorade-1' }, // 24% of $3,200
    ],
    deliverables: [
      { label: 'Product video', dueISO: new Date(Date.now() - 15 * 24 * 3600e3).toISOString(), done: true },
      { label: 'Story series', dueISO: new Date(Date.now() - 10 * 24 * 3600e3).toISOString(), done: true },
    ],
  },
];

/** Display-shape fixture — DERIVED from the canonical records above. */
export const DEAL_TRUTH_FIXTURE: DealTruth[] = CANONICAL_DEALS.map(toDealTruth);

/** Empty fixture — selectors must be total functions over this. */
export const EMPTY_DEAL_TRUTH: DealTruth[] = [];
