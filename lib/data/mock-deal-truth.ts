// lib/data/mock-deal-truth.ts
// ── ATHLETE DEAL TRUTH FIXTURE ─────────────────────────────────────────
// Four deals that tell the spec §7 demo story:
//   (1) JMA Wireless — executed yesterday, UNDISCLOSED, 3 biz-day deadline
//   (2) Nike — disclosed, payment IN-REVIEW (CSC), IG Reel deliverable due ~71h
//   (3) Legacy Athletics — CLEARED, payment expected
//   (4) Gatorade — PAID 8 days ago, tax set-aside 24%
//
// All deadlines are computed relative to Date.now() at module load so
// the fixture never expires. Export EMPTY_DEAL_TRUTH for empty-state testing.

import { addBusinessDays } from '@/lib/athlete/truth.mjs';
import type { DealTruth } from '@/lib/athlete/truth';

// ── JMA Wireless: executed yesterday, UNDISCLOSED, NIL Go deadline ~3 biz days out ──
const JMA_EXECUTED = new Date(Date.now() - 24 * 3600e3); // yesterday

// Deadline is 3 business days from now for demo purposes (the full 5-day
// window started yesterday; 2 days have elapsed so 3 remain).
const JMA_DEADLINE_ISO = addBusinessDays(new Date(Date.now()), 3).toISOString();

// ── Nike: disclosed, payment in-review ──
const NIKE_REEL_DUE_ISO = new Date(Date.now() + 71 * 3600e3).toISOString(); // ~71h → amber

// ── Gatorade: paid 8 days ago ──
const GATORADE_PAID_ISO = new Date(Date.now() - 8 * 24 * 3600e3).toISOString();

export const DEAL_TRUTH_FIXTURE: DealTruth[] = [
  // ① JMA Wireless — deal executed, NIL Go clock running, UNDISCLOSED
  {
    dealId: 'dt-jma-1',
    brand: 'JMA Wireless',
    title: 'Brand Ambassador · Q3',
    amountCents: 4_500_00,
    paymentState: 'expected',
    disclosure: {
      state: 'undisclosed',
      executedAtISO: JMA_EXECUTED.toISOString(),
      deadlineISO: JMA_DEADLINE_ISO,
    },
    deliverables: [
      {
        label: 'Social post (1)',
        dueISO: new Date(Date.now() + 5 * 24 * 3600e3).toISOString(),
        done: false,
      },
    ],
  },

  // ② Nike — disclosed, payment in CSC review, IG Reel due ~71h
  {
    dealId: 'dt-nike-1',
    brand: 'Nike',
    title: 'Campus Activation · Summer',
    amountCents: 2_400_00,
    paymentState: 'in-review',
    disclosure: {
      state: 'submitted',
      executedAtISO: new Date(Date.now() - 7 * 24 * 3600e3).toISOString(),
    },
    deliverables: [
      {
        label: 'IG Reel',
        dueISO: NIKE_REEL_DUE_ISO,
        done: false,
      },
      {
        label: 'Recap Post',
        dueISO: new Date(Date.now() - 2 * 24 * 3600e3).toISOString(),
        done: true,
      },
    ],
  },

  // ③ Legacy Athletics — CSC cleared, payment expected
  {
    dealId: 'dt-legacy-1',
    brand: 'Legacy Athletics',
    title: 'Apparel Deal · FY26',
    amountCents: 1_800_00,
    paymentState: 'cleared',
    disclosure: {
      state: 'cleared',
      executedAtISO: new Date(Date.now() - 14 * 24 * 3600e3).toISOString(),
    },
    deliverables: [
      {
        label: 'Product shoot',
        dueISO: new Date(Date.now() + 10 * 24 * 3600e3).toISOString(),
        done: false,
      },
    ],
  },

  // ④ Gatorade — paid 8 days ago, 24% tax set-aside ($768 of $3,200)
  {
    dealId: 'dt-gatorade-1',
    brand: 'Gatorade',
    title: 'Performance Partnership',
    amountCents: 3_200_00,
    paymentState: 'paid',
    paidAtISO: GATORADE_PAID_ISO,
    taxSetAsideCents: 768_00, // 24% of $3,200
    disclosure: {
      state: 'cleared',
      executedAtISO: new Date(Date.now() - 30 * 24 * 3600e3).toISOString(),
    },
    deliverables: [
      {
        label: 'Product video',
        dueISO: new Date(Date.now() - 15 * 24 * 3600e3).toISOString(),
        done: true,
      },
      {
        label: 'Story series',
        dueISO: new Date(Date.now() - 10 * 24 * 3600e3).toISOString(),
        done: true,
      },
    ],
  },
];

/** Empty fixture — selectors must be total functions over this. */
export const EMPTY_DEAL_TRUTH: DealTruth[] = [];
