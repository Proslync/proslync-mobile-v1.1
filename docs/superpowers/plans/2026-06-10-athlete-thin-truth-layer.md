# Athlete Thin Truth Layer v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a compact, always-visible "truth strip" to the existing athlete tabs that surfaces the three facts athletes actually open NIL apps to check: payment state per deal, NIL Go disclosure countdowns, and deliverable deadlines — all backed by a fixture dataset, with zero new animations and copper only on act-now elements.

**Architecture:** Pure-logic selectors live in `lib/athlete/truth.mjs` (JS so `node:test` can run them without TS toolchain) with a companion `truth.d.ts` and a typed TS wrapper `lib/athlete/truth.ts` re-exporting everything. Fixture data lives in `lib/data/mock-deal-truth.ts`. Three UI components mount onto existing tabs: `TruthStrip` at the top of `AthleteStatsSection`; a `PAYMENT TRUTH` section block in `AthleteDealsSection`; a tax set-aside row in `AthleteWalletSection`. No new tabs, no new routes (the disclosure route `app/athlete/disclosures/index.tsx` already exists).

**Tech Stack:** React Native 0.78, Expo SDK 53, TypeScript 5, `node:test` for pure-logic tests, `@expo/vector-icons` Ionicons, existing `useStableRouter` hook, shared `CARD_BG`/`CARD_BORDER`/`TONE_COLOR` tokens from `components/shared/ui-kit/tokens.ts`.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `lib/athlete/truth.mjs` | Pure JS selectors + business-day deadline math (node:test-able) |
| Create | `lib/athlete/truth.d.ts` | TypeScript declarations for truth.mjs exports |
| Create | `lib/athlete/truth.ts` | TS types (PaymentState, DisclosureState, DealTruth) + re-exports truth.mjs selectors |
| Create | `lib/data/mock-deal-truth.ts` | 4-deal fixture array + EMPTY_DEAL_TRUTH |
| Create | `lib/athlete/truth.test.mjs` | ≥5 node:test tests |
| Create | `components/athlete/truth-strip.tsx` | Compact 2-row strip component |
| Modify | `components/athlete/athlete-stats-section.tsx` | Mount TruthStrip at top |
| Modify | `components/athlete/athlete-deals-section.tsx` | Add PAYMENT TRUTH section |
| Modify | `components/athlete/athlete-wallet-section.tsx` | Add tax set-aside row |

---

## Task 1: Pure selectors in `lib/athlete/truth.mjs` (TDD first)

**Files:**
- Create: `lib/athlete/truth.mjs`
- Create: `lib/athlete/truth.test.mjs`

### Step 1.1 — Write the failing tests

- [ ] Create `lib/athlete/truth.test.mjs` with the full test suite:

```js
// lib/athlete/truth.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addBusinessDays,
  hoursUntilISO,
  thresholdForHours,
  truthSummary,
  nextDisclosureDeadline,
  upcomingDeliverables,
} from './truth.mjs';

// ── addBusinessDays ───────────────────────────────────────────────────────

test('addBusinessDays: +5 from Monday lands on next Monday', () => {
  // Monday 2026-06-08
  const mon = new Date('2026-06-08T09:00:00Z');
  const result = addBusinessDays(mon, 5);
  // +5 business days: Tue, Wed, Thu, Fri, Mon → 2026-06-15
  assert.equal(result.toISOString().slice(0, 10), '2026-06-15');
});

test('addBusinessDays: +5 from Friday skips weekend (lands Thursday)', () => {
  // Friday 2026-06-06
  const fri = new Date('2026-06-06T09:00:00Z');
  const result = addBusinessDays(fri, 5);
  // Sat/Sun skipped: Mon, Tue, Wed, Thu, Fri → 2026-06-13
  assert.equal(result.toISOString().slice(0, 10), '2026-06-13');
});

test('addBusinessDays: +0 returns same date', () => {
  const d = new Date('2026-06-10T12:00:00Z');
  const result = addBusinessDays(d, 0);
  assert.equal(result.toISOString().slice(0, 10), '2026-06-10');
});

// ── hoursUntilISO ─────────────────────────────────────────────────────────

test('hoursUntilISO: future ISO returns positive hours', () => {
  const future = new Date(Date.now() + 48 * 3600e3).toISOString();
  const h = hoursUntilISO(future);
  assert.ok(h !== null && h > 47 && h <= 49, `expected ~48h, got ${h}`);
});

test('hoursUntilISO: past ISO returns null', () => {
  const past = new Date(Date.now() - 3600e3).toISOString();
  assert.equal(hoursUntilISO(past), null);
});

test('hoursUntilISO: null input returns null', () => {
  assert.equal(hoursUntilISO(null), null);
});

// ── thresholdForHours ─────────────────────────────────────────────────────

test('thresholdForHours: <24h returns red', () => {
  assert.equal(thresholdForHours(10), 'red');
  assert.equal(thresholdForHours(0.5), 'red');
});

test('thresholdForHours: 24-72h returns amber', () => {
  assert.equal(thresholdForHours(24), 'amber');
  assert.equal(thresholdForHours(71.9), 'amber');
});

test('thresholdForHours: >72h returns green', () => {
  assert.equal(thresholdForHours(73), 'green');
  assert.equal(thresholdForHours(200), 'green');
});

test('thresholdForHours: null returns green (no deadline = calm)', () => {
  assert.equal(thresholdForHours(null), 'green');
});

// ── truthSummary ──────────────────────────────────────────────────────────

test('truthSummary: aggregates correctly across fixture deals', () => {
  // Minimal inline fixture — 2 expected, 1 in-review, 1 paid
  const deals = [
    {
      dealId: 'd1', brand: 'A', title: 'T1', amountCents: 100_00,
      paymentState: 'expected',
      disclosure: { state: 'cleared', executedAtISO: '2026-01-01T00:00:00Z' },
      deliverables: [],
    },
    {
      dealId: 'd2', brand: 'B', title: 'T2', amountCents: 200_00,
      paymentState: 'in-review',
      disclosure: { state: 'cleared', executedAtISO: '2026-01-01T00:00:00Z' },
      deliverables: [],
    },
    {
      dealId: 'd3', brand: 'C', title: 'T3', amountCents: 300_00,
      paymentState: 'paid',
      paidAtISO: '2026-06-02T00:00:00Z',
      taxSetAsideCents: 72_00,
      disclosure: { state: 'cleared', executedAtISO: '2026-01-01T00:00:00Z' },
      deliverables: [],
    },
    {
      dealId: 'd4', brand: 'D', title: 'T4', amountCents: 50_00,
      paymentState: 'expected',
      disclosure: { state: 'cleared', executedAtISO: '2026-01-01T00:00:00Z' },
      deliverables: [],
    },
  ];
  const s = truthSummary(deals);
  assert.equal(s.expectedCents, 150_00); // d1 + d4
  assert.equal(s.inReviewCount, 1); // d2
  assert.ok(s.lastPaid, 'should have lastPaid');
  assert.equal(s.lastPaid.amountCents, 300_00);
  assert.equal(s.lastPaid.dateISO, '2026-06-02T00:00:00Z');
});

test('truthSummary: empty array returns zeros and no lastPaid', () => {
  const s = truthSummary([]);
  assert.equal(s.expectedCents, 0);
  assert.equal(s.inReviewCount, 0);
  assert.equal(s.lastPaid, undefined);
});

// ── nextDisclosureDeadline ────────────────────────────────────────────────

test('nextDisclosureDeadline: picks the most urgent undisclosed deal', () => {
  const sooner = new Date(Date.now() + 10 * 3600e3).toISOString();
  const later  = new Date(Date.now() + 50 * 3600e3).toISOString();
  const deals = [
    {
      dealId: 'x1', brand: 'B1', title: 'T', amountCents: 100_00,
      paymentState: 'expected',
      disclosure: { state: 'undisclosed', executedAtISO: '2026-06-01T00:00:00Z', deadlineISO: later },
      deliverables: [],
    },
    {
      dealId: 'x2', brand: 'B2', title: 'T', amountCents: 100_00,
      paymentState: 'expected',
      disclosure: { state: 'undisclosed', executedAtISO: '2026-06-01T00:00:00Z', deadlineISO: sooner },
      deliverables: [],
    },
  ];
  const nd = nextDisclosureDeadline(deals);
  assert.ok(nd, 'should return a deal');
  assert.equal(nd.dealId, 'x2');
});

test('nextDisclosureDeadline: returns null when no undisclosed deals', () => {
  const deals = [
    {
      dealId: 'y1', brand: 'B', title: 'T', amountCents: 100_00,
      paymentState: 'paid',
      disclosure: { state: 'cleared', executedAtISO: '2026-01-01T00:00:00Z' },
      deliverables: [],
    },
  ];
  assert.equal(nextDisclosureDeadline(deals), null);
});

test('nextDisclosureDeadline: empty array returns null', () => {
  assert.equal(nextDisclosureDeadline([]), null);
});

// ── upcomingDeliverables ──────────────────────────────────────────────────

test('upcomingDeliverables: returns undone items sorted by dueISO, capped at n', () => {
  const d1 = new Date(Date.now() + 24 * 3600e3).toISOString();
  const d2 = new Date(Date.now() + 48 * 3600e3).toISOString();
  const d3 = new Date(Date.now() + 96 * 3600e3).toISOString();
  const deals = [
    {
      dealId: 'z1', brand: 'B', title: 'T', amountCents: 100_00,
      paymentState: 'expected',
      disclosure: { state: 'cleared', executedAtISO: '2026-01-01T00:00:00Z' },
      deliverables: [
        { label: 'IG Reel', dueISO: d2, done: false },
        { label: 'Tweet', dueISO: d3, done: false },
        { label: 'Done post', dueISO: d1, done: true },
      ],
    },
    {
      dealId: 'z2', brand: 'C', title: 'T', amountCents: 50_00,
      paymentState: 'expected',
      disclosure: { state: 'cleared', executedAtISO: '2026-01-01T00:00:00Z' },
      deliverables: [
        { label: 'Banner', dueISO: d1, done: false },
      ],
    },
  ];
  const items = upcomingDeliverables(deals, 2);
  assert.equal(items.length, 2);
  // 'Banner' (d1) then 'IG Reel' (d2)
  assert.equal(items[0].label, 'Banner');
  assert.equal(items[1].label, 'IG Reel');
});

test('upcomingDeliverables: empty fixture returns empty array', () => {
  assert.deepEqual(upcomingDeliverables([], 5), []);
});
```

### Step 1.2 — Run tests to confirm they fail

- [ ] Run: `export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH" && cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && node --test lib/athlete/truth.test.mjs 2>&1 | tail -10`

Expected: errors like `Cannot find module './truth.mjs'` — confirms tests exist and fail correctly.

### Step 1.3 — Implement `lib/athlete/truth.mjs`

- [ ] Create `lib/athlete/truth.mjs`:

```js
// lib/athlete/truth.mjs
// Pure selectors for the athlete "thin truth layer".
// JS (.mjs) so node:test can run without TS toolchain.
// Metro bundles .mjs fine (same as lib/fan/seeded.mjs).

// ── Business-day math ─────────────────────────────────────────────────────

/**
 * Add N business days to a Date. Saturdays (6) and Sundays (0) are skipped.
 * @param {Date} startDate
 * @param {number} businessDays
 * @returns {Date}
 */
export function addBusinessDays(startDate, businessDays) {
  const d = new Date(startDate.getTime());
  let remaining = businessDays;
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) remaining -= 1;
  }
  return d;
}

// ── Hours-until helper ────────────────────────────────────────────────────

/**
 * Hours between now and an ISO deadline string. Returns null if past or no deadline.
 * @param {string|null|undefined} isoString
 * @returns {number|null}
 */
export function hoursUntilISO(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  if (ms <= 0) return null;
  return ms / (1000 * 60 * 60);
}

// ── Threshold resolver ────────────────────────────────────────────────────

/**
 * Returns 'red' (<24h), 'amber' (<72h), or 'green' (else/null).
 * Matches the app-wide urgency thresholds from lib/athlete/urgency.ts.
 * @param {number|null} hours
 * @returns {'red'|'amber'|'green'}
 */
export function thresholdForHours(hours) {
  if (hours === null) return 'green';
  if (hours < 24) return 'red';
  if (hours < 72) return 'amber';
  return 'green';
}

// ── truthSummary ──────────────────────────────────────────────────────────

/**
 * Aggregate summary across all deals.
 * @param {Array} deals — DealTruth[]
 * @returns {{ expectedCents: number, inReviewCount: number, lastPaid?: { dateISO: string, amountCents: number } }}
 */
export function truthSummary(deals) {
  let expectedCents = 0;
  let inReviewCount = 0;
  let lastPaid = undefined;

  for (const d of deals) {
    if (d.paymentState === 'expected' || d.paymentState === 'cleared') {
      expectedCents += d.amountCents;
    }
    if (d.paymentState === 'in-review') {
      inReviewCount += 1;
    }
    if (d.paymentState === 'paid' && d.paidAtISO) {
      if (!lastPaid || d.paidAtISO > lastPaid.dateISO) {
        lastPaid = { dateISO: d.paidAtISO, amountCents: d.amountCents };
      }
    }
  }

  return { expectedCents, inReviewCount, lastPaid };
}

// ── nextDisclosureDeadline ────────────────────────────────────────────────

/**
 * Return the single most urgent undisclosed deal, or null.
 * "Most urgent" = smallest hoursUntilISO(deadlineISO).
 * @param {Array} deals — DealTruth[]
 * @returns {object|null}
 */
export function nextDisclosureDeadline(deals) {
  const undisclosed = deals.filter(
    (d) => d.disclosure.state === 'undisclosed' && d.disclosure.deadlineISO
  );
  if (undisclosed.length === 0) return null;

  undisclosed.sort((a, b) => {
    const ha = hoursUntilISO(a.disclosure.deadlineISO) ?? Infinity;
    const hb = hoursUntilISO(b.disclosure.deadlineISO) ?? Infinity;
    return ha - hb;
  });
  return undisclosed[0];
}

// ── upcomingDeliverables ──────────────────────────────────────────────────

/**
 * Flatten all undone deliverables across deals, sorted by dueISO, capped at n.
 * @param {Array} deals — DealTruth[]
 * @param {number} n
 * @returns {Array<{ dealId: string, brand: string, label: string, dueISO: string }>}
 */
export function upcomingDeliverables(deals, n) {
  const items = [];
  for (const d of deals) {
    for (const del of d.deliverables) {
      if (!del.done) {
        items.push({ dealId: d.dealId, brand: d.brand, label: del.label, dueISO: del.dueISO });
      }
    }
  }
  items.sort((a, b) => a.dueISO.localeCompare(b.dueISO));
  return items.slice(0, n);
}
```

### Step 1.4 — Run tests to confirm they pass

- [ ] Run: `export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH" && cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && node --test lib/athlete/truth.test.mjs 2>&1`

Expected output (all pass, 0 fail):
```
ℹ tests 18
ℹ pass 18
ℹ fail 0
```

### Step 1.5 — Also verify existing test suites still pass

- [ ] Run:
```bash
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH" && cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && \
  node --test lib/fan/seeded.test.mjs 2>&1 | tail -4 && \
  node --test scripts/lib/snapshot-core.test.mjs 2>&1 | tail -4
```

Expected: `ℹ fail 0` for both.

### Step 1.6 — Commit

- [ ] Run:
```bash
cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && \
git add lib/athlete/truth.mjs lib/athlete/truth.test.mjs && \
git commit -m "$(cat <<'EOF'
feat(athlete): deal-truth selectors, business-day deadline math, fixtures (TDD)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: TypeScript types, declarations, and fixture data

**Files:**
- Create: `lib/athlete/truth.d.ts`
- Create: `lib/athlete/truth.ts`
- Create: `lib/data/mock-deal-truth.ts`

### Step 2.1 — Create `lib/athlete/truth.d.ts`

- [ ] Create `lib/athlete/truth.d.ts`:

```ts
// lib/athlete/truth.d.ts
// TypeScript declarations for lib/athlete/truth.mjs.

export declare function addBusinessDays(startDate: Date, businessDays: number): Date;
export declare function hoursUntilISO(isoString: string | null | undefined): number | null;
export declare function thresholdForHours(hours: number | null): 'red' | 'amber' | 'green';

export interface TruthSummaryResult {
  expectedCents: number;
  inReviewCount: number;
  lastPaid?: { dateISO: string; amountCents: number };
}

export declare function truthSummary(deals: import('./truth').DealTruth[]): TruthSummaryResult;
export declare function nextDisclosureDeadline(
  deals: import('./truth').DealTruth[]
): import('./truth').DealTruth | null;
export declare function upcomingDeliverables(
  deals: import('./truth').DealTruth[],
  n: number
): Array<{ dealId: string; brand: string; label: string; dueISO: string }>;
```

### Step 2.2 — Create `lib/athlete/truth.ts`

- [ ] Create `lib/athlete/truth.ts`:

```ts
// lib/athlete/truth.ts
// Types for the athlete thin truth layer.
// Selectors live in truth.mjs (plain JS so node:test can run them).
// This file re-exports the selectors with proper TS types, plus the
// shared type definitions that components import.

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

// Re-export the pure selectors from truth.mjs with TS types applied.
export {
  addBusinessDays,
  hoursUntilISO,
  thresholdForHours,
  truthSummary,
  nextDisclosureDeadline,
  upcomingDeliverables,
  type TruthSummaryResult,
} from './truth.mjs';
```

### Step 2.3 — Create `lib/data/mock-deal-truth.ts`

Note: deadlines are computed at module load from `Date.now()` so the fixture never goes stale. The four deals tell the spec §7 demo story in sequence: execute → disclose → CSC review → cleared → paid.

- [ ] Create `lib/data/mock-deal-truth.ts`:

```ts
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

// ── JMA Wireless: executed yesterday, UNDISCLOSED, NIL Go deadline in ~3 biz days ──
const JMA_EXECUTED = new Date(Date.now() - 24 * 3600e3); // yesterday
const JMA_DEADLINE = addBusinessDays(JMA_EXECUTED, 5);    // 5 biz-days from execution
// We want the deadline to be ~3 biz-days from now (2 already elapsed), so we
// shift it forward 2 biz-days relative to the raw 5-day window for a realistic demo.
// The key invariant: deadline is FUTURE and ~3 days out.
const JMA_DEADLINE_ISO = addBusinessDays(new Date(Date.now()), 3).toISOString();

// ── Nike: disclosed, payment in-review ──
const NIKE_REEL_DUE_ISO = new Date(Date.now() + 71 * 3600e3).toISOString(); // ~71h

// ── Gatorade: paid 8 days ago ──
const GATORADE_PAID_ISO = new Date(Date.now() - 8 * 24 * 3600e3).toISOString();

export const DEAL_TRUTH_FIXTURE: DealTruth[] = [
  // ① JMA Wireless — deal executed, NIL Go clock running
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

  // ④ Gatorade — paid 8 days ago, 24% tax set-aside
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
```

### Step 2.4 — TypeScript check on new files

- [ ] Run: `export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH" && cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && npx tsc --noEmit 2>&1 | grep "truth\|mock-deal" | head -20`

Expected: no errors in `lib/athlete/truth.ts`, `lib/athlete/truth.d.ts`, or `lib/data/mock-deal-truth.ts`.

If TS complains about the `.mjs` import in `truth.ts`: TS requires `allowJs` or `moduleResolution` to handle `.mjs` re-exports. Check `tsconfig.json` — if the seeded pattern (`lib/fan/seeded.mjs`) already works, truth.mjs will too. If there are re-export errors, use a value-level import pattern instead:

```ts
// Alternative if re-export from .mjs fails TS:
// import the functions as values
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
export const upcomingDeliverables = _upcomingDeliverables as (deals: DealTruth[], n: number) => Array<{ dealId: string; brand: string; label: string; dueISO: string }>;

export interface TruthSummaryResult {
  expectedCents: number;
  inReviewCount: number;
  lastPaid?: { dateISO: string; amountCents: number };
}
```

---

## Task 3: `TruthStrip` component + mount in `AthleteStatsSection`

**Files:**
- Create: `components/athlete/truth-strip.tsx`
- Modify: `components/athlete/athlete-stats-section.tsx`

### Step 3.1 — Create `components/athlete/truth-strip.tsx`

The strip has two rows max:
- Row 1 (conditional): copper-bordered countdown chip when `nextDisclosureDeadline` returns a deal. Red text at <24h, amber at <72h, copper border always. Pressable → `/athlete/disclosures`.
- Row 2 (always): muted one-liner with tabular numerals from `truthSummary`. Segments omitted when zero/absent. Empty-everything state: `No active deals — all clear`.

- [ ] Create `components/athlete/truth-strip.tsx`:

```tsx
// components/athlete/truth-strip.tsx
// ── TRUTH STRIP ────────────────────────────────────────────────────────
// Compact always-visible strip at the top of AthleteStatsSection.
// Shows the NIL Go disclosure countdown (Row 1, copper, act-now only) and
// a one-line payment summary (Row 2, always).
//
// Laws:
//   - Money: tabular numerals, never animated.
//   - Copper: countdown chip only (act-now). Not used elsewhere in this component.
//   - Touch targets: ≥44pt on the countdown chip.
//   - No new animations.
//   - Renders sanely with EMPTY_DEAL_TRUTH.
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useStableRouter } from '@/hooks/use-stable-router';
import {
  CARD_BG,
  CARD_BORDER,
} from '@/components/shared/ui-kit/tokens';
import {
  truthSummary,
  nextDisclosureDeadline,
  hoursUntilISO,
  thresholdForHours,
} from '@/lib/athlete/truth';
import { DEAL_TRUTH_FIXTURE } from '@/lib/data/mock-deal-truth';
import type { DealTruth } from '@/lib/athlete/truth';

const COPPER = '#EB621A';
const RED = '#FF3B30';
const AMBER = '#FFD60A';

function formatMoney(cents: number): string {
  // Compact dollar format with tabular numerals: "$8,700"
  return `$${Math.round(cents / 100).toLocaleString('en-US')}`;
}

function formatPaidDate(isoString: string): string {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCountdownLabel(hours: number | null): string {
  if (hours === null) return 'overdue';
  if (hours < 1) return '<1h left';
  if (hours < 24) return `${Math.floor(hours)}h left`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} left`;
}

interface TruthStripProps {
  deals?: DealTruth[];
}

export function TruthStrip({ deals = DEAL_TRUTH_FIXTURE }: TruthStripProps) {
  const router = useStableRouter();

  const urgentDeal = nextDisclosureDeadline(deals);
  const summary = truthSummary(deals);

  // ── Row 1: Disclosure countdown chip (only when an undisclosed deal exists) ──
  let disclosureChip: React.ReactNode = null;
  if (urgentDeal) {
    const hours = hoursUntilISO(urgentDeal.disclosure.deadlineISO ?? null);
    const threshold = thresholdForHours(hours);
    const textColor = threshold === 'red' ? RED : threshold === 'amber' ? AMBER : COPPER;
    const countdownLabel = formatCountdownLabel(hours);

    disclosureChip = (
      <Pressable
        style={styles.disclosureChip}
        onPress={() => router.push('/athlete/disclosures')}
        accessibilityRole="button"
        accessibilityLabel={`Report ${urgentDeal.brand} deal to NIL Go. ${countdownLabel}`}
      >
        <Ionicons name="time-outline" size={13} color={textColor} />
        <Text style={[styles.disclosureText, { color: textColor }]} numberOfLines={1}>
          Report {urgentDeal.brand} deal to NIL Go
          <Text style={styles.disclosureCountdown}>{' · '}{countdownLabel}</Text>
        </Text>
        <Ionicons name="chevron-forward" size={11} color={textColor} style={styles.disclosureChevron} />
      </Pressable>
    );
  }

  // ── Row 2: Payment summary one-liner ──
  const segments: string[] = [];
  if (summary.expectedCents > 0) {
    segments.push(`${formatMoney(summary.expectedCents)} expected`);
  }
  if (summary.inReviewCount > 0) {
    segments.push(`${summary.inReviewCount} in CSC review`);
  }
  if (summary.lastPaid) {
    const dateStr = formatPaidDate(summary.lastPaid.dateISO);
    segments.push(`last paid ${dateStr} ✓`);
  }
  const summaryLine =
    segments.length > 0 ? segments.join(' · ') : 'No active deals — all clear';

  return (
    <View style={styles.strip}>
      {disclosureChip}
      <Text style={styles.summaryLine} numberOfLines={1}>
        {summaryLine}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 7,
  },
  disclosureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    // Copper border on the chip container (only copper element in the strip)
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COPPER,
    backgroundColor: 'rgba(235,98,26,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 10, // ≥44pt touch target handled by hit area
    minHeight: 44,
  },
  disclosureText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  disclosureCountdown: {
    fontWeight: '900',
  },
  disclosureChevron: {
    flexShrink: 0,
  },
  summaryLine: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0,
  },
});
```

### Step 3.2 — Mount `TruthStrip` at the top of `AthleteStatsSection`

- [ ] Edit `components/athlete/athlete-stats-section.tsx`. The current file is 25 lines. Replace it with:

```tsx
// Athlete Stats section — extracted from athlete-view.tsx for the R5 remix.
// The AthleteSocialReachCard moves to AthleteHome (Overview tab); keep this
// surface focused on performance analytics.
//
// Truth strip mounted at top per spec §4 (default tab, compact always-visible).
import * as React from 'react';
import { View } from 'react-native';

import { AthleteCalendarCta } from '@/components/athlete/athlete-calendar-card';
import {
  GameLogAnalytics,
  PeerCompareAnalytics,
  PlayerStatsAnalytics,
} from '@/components/athlete/athlete-stats-analytics';
import { TruthStrip } from '@/components/athlete/truth-strip';

export function AthleteStatsSection() {
  return (
    <View style={{ gap: 16 }}>
      {/* Thin truth layer — NIL Go countdown + payment summary (spec §4) */}
      <TruthStrip />
      {/* W28 + W29 (PLAN.md §5 P1) — auto-populated commitment calendar CTA;
          full view at `/athlete/calendar`. */}
      <AthleteCalendarCta athleteId="a-1" />
      <PlayerStatsAnalytics />
      <GameLogAnalytics />
      <PeerCompareAnalytics />
    </View>
  );
}
```

### Step 3.3 — TypeScript check on touched files

- [ ] Run: `export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH" && cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && npx tsc --noEmit 2>&1 | grep "truth-strip\|athlete-stats-section" | head -20`

Expected: no output (no errors in these files).

---

## Task 4: Payment truth rows in `AthleteDealsSection`

**Files:**
- Modify: `components/athlete/athlete-deals-section.tsx`

### Step 4.1 — Add `PaymentTruthSection` above existing CTAs

Insert a self-contained `PaymentTruthSection` component and mount it as the first element inside the `AthleteDealsSection` return's `<View style={{ gap: 16 }}>`, just above the hero card.

- [ ] In `components/athlete/athlete-deals-section.tsx`, add these imports at the top of the file (after the existing imports):

```tsx
import {
  truthSummary,
  nextDisclosureDeadline,
  hoursUntilISO,
  thresholdForHours,
} from '@/lib/athlete/truth';
import { DEAL_TRUTH_FIXTURE } from '@/lib/data/mock-deal-truth';
import type { DealTruth, PaymentState } from '@/lib/athlete/truth';
```

- [ ] Add the following component definitions before the `AthleteDealsSection` function (after the existing `walletCtaStyles` StyleSheet, before the closing of the file):

```tsx
// ── Payment Truth Section ─────────────────────────────────────────────────
// Spec §4 — per-deal 3-step payment state indicator: EXPECTED → CSC REVIEW → PAID
// One row per deal. Copper for current state, white-30 for pending, green for paid.
// Tapping any row → /athlete/disclosures (v1 deep-link, sufficient for demo).

const COPPER = '#EB621A';
const GREEN_PAID = '#34C759';
const RED_DENIED = '#FF3B30';
const AMBER_DUE = '#FFD60A';

type StepState = 'pending' | 'current' | 'done' | 'denied';

interface PaymentStep {
  label: string;
  state: StepState;
}

function stepsForPaymentState(ps: PaymentState): PaymentStep[] {
  switch (ps) {
    case 'expected':
      return [
        { label: 'EXPECTED', state: 'current' },
        { label: 'CSC REVIEW', state: 'pending' },
        { label: 'PAID', state: 'pending' },
      ];
    case 'in-review':
      return [
        { label: 'EXPECTED', state: 'done' },
        { label: 'CSC REVIEW', state: 'current' },
        { label: 'PAID', state: 'pending' },
      ];
    case 'cleared':
      return [
        { label: 'EXPECTED', state: 'done' },
        { label: 'CSC REVIEW', state: 'done' },
        { label: 'PAID', state: 'current' },
      ];
    case 'paid':
      return [
        { label: 'EXPECTED', state: 'done' },
        { label: 'CSC REVIEW', state: 'done' },
        { label: 'PAID', state: 'done' },
      ];
    default:
      return [
        { label: 'EXPECTED', state: 'pending' },
        { label: 'CSC REVIEW', state: 'pending' },
        { label: 'PAID', state: 'pending' },
      ];
  }
}

function stepDotColor(s: StepState): string {
  if (s === 'done') return GREEN_PAID;
  if (s === 'current') return COPPER;
  if (s === 'denied') return RED_DENIED;
  return 'rgba(255,255,255,0.30)';
}

function PaymentTruthRow({ deal, onPress }: { deal: DealTruth; onPress: () => void }) {
  const router = useStableRouter();
  const steps = stepsForPaymentState(deal.paymentState);

  // Sub-chip: disclosure countdown (if undisclosed)
  let disclosureChip: React.ReactNode = null;
  if (deal.disclosure.state === 'undisclosed' && deal.disclosure.deadlineISO) {
    const hours = hoursUntilISO(deal.disclosure.deadlineISO);
    const threshold = thresholdForHours(hours);
    const chipColor = threshold === 'red' ? RED_DENIED : threshold === 'amber' ? AMBER_DUE : COPPER;
    const label =
      hours === null ? 'overdue'
        : hours < 24 ? `${Math.floor(hours)}h to report`
        : hours < 72 ? `${Math.floor(hours / 24)}d to report`
        : `${Math.floor(hours / 24)}d to report`;
    disclosureChip = (
      <View style={ptStyles.subChip}>
        <Ionicons name="time-outline" size={10} color={chipColor} />
        <Text style={[ptStyles.subChipText, { color: chipColor }]}>{label}</Text>
      </View>
    );
  }

  // Sub-chip: upcoming undone deliverable (amber if <72h)
  let deliverableChip: React.ReactNode = null;
  const nextDel = deal.deliverables
    .filter((d) => !d.done)
    .sort((a, b) => a.dueISO.localeCompare(b.dueISO))[0];
  if (nextDel && !disclosureChip) {
    const hours = hoursUntilISO(nextDel.dueISO);
    const threshold = thresholdForHours(hours);
    if (threshold === 'amber' || threshold === 'red') {
      const chipColor = threshold === 'red' ? RED_DENIED : AMBER_DUE;
      const label = hours !== null && hours < 24
        ? `${Math.floor(hours)}h · ${nextDel.label}`
        : hours !== null ? `${Math.floor(hours / 24)}d · ${nextDel.label}`
        : `overdue · ${nextDel.label}`;
      deliverableChip = (
        <View style={ptStyles.subChip}>
          <Ionicons name="calendar-outline" size={10} color={chipColor} />
          <Text style={[ptStyles.subChipText, { color: chipColor }]}>{label}</Text>
        </View>
      );
    }
  }

  // NUDGE PAYER chip: shown when payment is expected/cleared and no sub-chip (overdue signal)
  const showNudge =
    (deal.paymentState === 'expected' || deal.paymentState === 'cleared') &&
    !disclosureChip &&
    !deliverableChip;

  return (
    <Pressable
      style={ptStyles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${deal.brand} — ${deal.paymentState}`}
    >
      <View style={ptStyles.rowTop}>
        <View style={{ flex: 1 }}>
          <Text style={ptStyles.brandName} numberOfLines={1}>{deal.brand}</Text>
          <Text style={ptStyles.titleLine} numberOfLines={1}>{deal.title}</Text>
        </View>
        <View style={ptStyles.stepsRow}>
          {steps.map((step, i) => (
            <View key={step.label} style={ptStyles.stepCell}>
              <View style={[ptStyles.stepDot, { backgroundColor: stepDotColor(step.state) }]} />
              <Text style={[ptStyles.stepLabel, step.state === 'current' && ptStyles.stepLabelActive]}>
                {step.label}
              </Text>
              {i < steps.length - 1 && (
                <View style={ptStyles.stepConnector} />
              )}
            </View>
          ))}
        </View>
      </View>
      {(disclosureChip || deliverableChip) && (
        <View style={ptStyles.subRow}>
          {disclosureChip}
          {deliverableChip}
        </View>
      )}
      {showNudge && (
        <View style={ptStyles.subRow}>
          <Pressable
            style={ptStyles.nudgeChip}
            onPress={() => router.push('/athlete/disclosures')}
            accessibilityRole="button"
            accessibilityLabel="Nudge payer"
          >
            <Text style={ptStyles.nudgeText}>NUDGE PAYER</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

function PaymentTruthSection() {
  const router = useStableRouter();
  const deals = DEAL_TRUTH_FIXTURE;
  if (deals.length === 0) return null;
  return (
    <View style={ptStyles.section}>
      {/* Lower-third header: 4px copper left bar + caps label */}
      <View style={ptStyles.sectionHeader}>
        <View style={ptStyles.sectionBar} />
        <Text style={ptStyles.sectionLabel}>PAYMENT TRUTH</Text>
      </View>
      <View style={ptStyles.rows}>
        {deals.map((deal) => (
          <PaymentTruthRow
            key={deal.dealId}
            deal={deal}
            onPress={() => router.push('/athlete/disclosures')}
          />
        ))}
      </View>
    </View>
  );
}

const ptStyles = StyleSheet.create({
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionBar: {
    width: 4,
    height: 14,
    borderRadius: 2,
    backgroundColor: COPPER,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: COPPER,
  },
  rows: {
    gap: 8,
  },
  row: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  titleLine: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  stepCell: {
    alignItems: 'center',
    gap: 3,
    position: 'relative',
    paddingHorizontal: 4,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepLabel: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.3,
    color: 'rgba(255,255,255,0.30)',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: COPPER,
  },
  stepConnector: {
    position: 'absolute',
    top: 4,
    right: -4,
    width: 8,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  subRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  subChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  subChipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  nudgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${COPPER}66`,
    backgroundColor: 'rgba(235,98,26,0.08)',
    minHeight: 28,
  },
  nudgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: COPPER,
  },
});
```

- [ ] In `AthleteDealsSection`'s return JSX, add `<PaymentTruthSection />` as the **first child** of the root `<View style={{ gap: 16 }}>`:

```tsx
// Replace the return of AthleteDealsSection:
  return (
    <View style={{ gap: 16 }}>
      {/* Payment Truth — per-deal 3-step state (spec §4 thin truth layer) */}
      <PaymentTruthSection />

      {/* Hero — gradient backdrop with KPI + tile grid */}
      <View style={heroStyles.heroCard}>
```

### Step 4.2 — TypeScript check

- [ ] Run: `export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH" && cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && npx tsc --noEmit 2>&1 | grep "athlete-deals-section" | head -10`

Expected: no output. If there are errors, fix them before proceeding (common issue: `useStableRouter` not imported in the closure — it's already imported at the top of the file).

---

## Task 5: Tax set-aside row in `AthleteWalletSection`

**Files:**
- Modify: `components/athlete/athlete-wallet-section.tsx`

### Step 5.1 — Add `TaxSetAsideRow` component and mount it

The spec says: add ONE clearly-bounded element in the Wallet tab — for the paid fixture deal, show `TAX SET-ASIDE (est.) $768 of $3,200 · Gatorade` with a footnote. Do not restructure the wallet section. Best placement: just before the "UPCOMING INVOICES" section (after Recent Payouts), keeping it in the payment-history area.

- [ ] In `components/athlete/athlete-wallet-section.tsx`, add these imports at the top of the existing imports:

```tsx
import { DEAL_TRUTH_FIXTURE } from '@/lib/data/mock-deal-truth';
```

- [ ] Add the `TaxSetAsideRow` component before `EmptyRow`:

```tsx
// ── Tax Set-Aside Row ────────────────────────────────────────────────────
// One element per spec — shows estimated tax hold on the most recent paid deal.
// Styled conservatively (muted/info tones); one footnote line. Not financial advice.
function TaxSetAsideRow() {
  const paidDeal = DEAL_TRUTH_FIXTURE.find(
    (d) => d.paymentState === 'paid' && d.taxSetAsideCents !== undefined
  );
  if (!paidDeal || paidDeal.taxSetAsideCents === undefined) return null;

  const setAsideDollars = Math.round(paidDeal.taxSetAsideCents / 100);
  const totalDollars = Math.round(paidDeal.amountCents / 100);

  return (
    <View style={taxStyles.container}>
      <View style={taxStyles.row}>
        <View style={taxStyles.iconBubble}>
          <Ionicons name="calculator-outline" size={16} color="rgba(255,255,255,0.55)" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={taxStyles.label}>TAX SET-ASIDE (EST.)</Text>
          <Text style={taxStyles.amount}>
            ${setAsideDollars.toLocaleString('en-US')}
            <Text style={taxStyles.amountOf}> of ${totalDollars.toLocaleString('en-US')}</Text>
            <Text style={taxStyles.brand}> · {paidDeal.brand}</Text>
          </Text>
        </View>
      </View>
      <Text style={taxStyles.footnote}>Conservative 24% estimate — not tax advice.</Text>
    </View>
  );
}

const taxStyles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.09)',
    padding: 12,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.0,
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.80)',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
    marginTop: 2,
  },
  amountOf: {
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
    fontSize: 13,
  },
  brand: {
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
    fontSize: 12,
  },
  footnote: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.38)',
    fontStyle: 'italic',
    lineHeight: 14,
  },
});
```

- [ ] In `AthleteWalletSection`'s return JSX, find the "UPCOMING INVOICES" section block and insert `<TaxSetAsideRow />` **just before** it:

The current structure ends with:
```tsx
      {/* Upcoming invoices ... */}
      <View style={{ gap: 10 }}>
        <Text style={styles.sectionLabel}>UPCOMING INVOICES</Text>
```

Replace that block's preceding line with:
```tsx
      {/* Tax set-aside — paid deal estimate (spec §4, not financial advice) */}
      <TaxSetAsideRow />

      {/* Upcoming invoices ... */}
      <View style={{ gap: 10 }}>
        <Text style={styles.sectionLabel}>UPCOMING INVOICES</Text>
```

### Step 5.2 — TypeScript check

- [ ] Run: `export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH" && cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && npx tsc --noEmit 2>&1 | grep "athlete-wallet-section" | head -10`

Expected: no output.

---

## Task 6: Final verification gates

### Step 6.1 — All truth tests pass

- [ ] Run: `export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH" && cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && node --test lib/athlete/truth.test.mjs 2>&1`

Expected: `ℹ pass 18`, `ℹ fail 0`.

### Step 6.2 — Existing test suites still green

- [ ] Run:
```bash
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH" && cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && \
  node --test lib/fan/seeded.test.mjs 2>&1 | grep -E "pass|fail" && \
  node --test scripts/lib/snapshot-core.test.mjs 2>&1 | grep -E "pass|fail"
```

Expected: both show `ℹ fail 0`.

### Step 6.3 — TypeScript error count ≤ 148, zero in touched files

- [ ] Run:
```bash
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH" && cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && \
  npx tsc --noEmit 2>&1 | grep -c "error TS" || true
```

Expected: number ≤ 148.

- [ ] Verify zero errors in touched files:
```bash
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH" && cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && \
  npx tsc --noEmit 2>&1 | grep -E "truth|mock-deal|truth-strip|athlete-stats-section|athlete-deals-section|athlete-wallet-section"
```

Expected: no output.

### Step 6.4 — Expo bundle check

- [ ] Run:
```bash
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH" && cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && \
  npx expo export --platform ios --output-dir /tmp/truth-check 2>&1 | tail -4
```

Expected: output ends with `.hbc` bundle creation success, no errors.

- [ ] Clean up: `rm -rf /tmp/truth-check`

### Step 6.5 — Second commit (UI components)

- [ ] Stage and commit all UI files:

```bash
cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && \
git add \
  lib/athlete/truth.d.ts \
  lib/athlete/truth.ts \
  lib/data/mock-deal-truth.ts \
  components/athlete/truth-strip.tsx \
  components/athlete/athlete-stats-section.tsx \
  components/athlete/athlete-deals-section.tsx \
  components/athlete/athlete-wallet-section.tsx && \
git commit -m "$(cat <<'EOF'
feat(athlete): thin truth layer — NIL Go countdown strip, payment-truth rows, tax set-aside

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Task covering it |
|---|---|
| §3 Three-State Truth Rule — expected/in-review/paid only | Task 4 `stepsForPaymentState`, no fabricated dates, NUDGE chip for overdue |
| §4 NIL Go countdown chip (copper, red <24h, amber <72h) | Task 3 `TruthStrip` Row 1 |
| §4 Per-deal payment truth row — Deals tab | Task 4 `PaymentTruthSection` |
| §4 Deliverable deadlines in Deals rows | Task 4 `PaymentTruthRow` deliverableChip |
| §4 Tax set-aside in Wallet | Task 5 `TaxSetAsideRow` |
| §4 Strip on Stats (default) tab | Task 3 mount in `AthleteStatsSection` |
| §6 No new animation, no fabricated pay dates | No `withTiming`/`Animated` in any new component; NUDGE replaces dates |
| §6 Tabular numerals on all money | `fontVariant: ['tabular-nums']` on every money Text |
| §6 Copper only on act-now | Strip: chip only. Deals: section header bar + nudge chip. Wallet: none |
| §6 ≥44pt touch targets | `minHeight: 44` on countdown chip; Pressable rows are full-width |
| §6 Empty fixture renders sanely | `TruthStrip` defaults to fixture; selectors handle empty array |
| F Tests ≥5, business-day math covered | 18 tests in Task 1 (addBusinessDays Mon+5, Fri+5, +0; hoursUntilISO; thresholds; truthSummary aggregation + empty; nextDisclosureDeadline picks most-urgent, returns null; upcomingDeliverables sorted/capped/empty) |
| Two commits with Co-Authored-By | Task 1 Step 1.6, Task 6 Step 6.5 |

### Placeholder scan

No TBD/TODO/implement-later present. All code blocks are complete.

### Type consistency

- `DealTruth` defined in `truth.ts`, imported in `mock-deal-truth.ts` and both component files.
- `PaymentState` type used in `stepsForPaymentState` parameter matches `DealTruth.paymentState` union.
- `hoursUntilISO`, `thresholdForHours`, `nextDisclosureDeadline`, `truthSummary` all imported from `@/lib/athlete/truth` (the TS wrapper) in components, not from the .mjs directly.
- `DEAL_TRUTH_FIXTURE` imported from `@/lib/data/mock-deal-truth` in both `truth-strip.tsx` and `athlete-wallet-section.tsx`.
- `STATS_CARD_BG` constant referenced in `ptStyles` within `athlete-deals-section.tsx` — it's already defined at the top of that file as `const STATS_CARD_BG = '#1C1C1E'`. No conflict.
- `useStableRouter` is already imported in `athlete-deals-section.tsx`. The `PaymentTruthRow` component calls `useStableRouter()` inside the component body — this is a valid hook call. `PaymentTruthSection` also calls `useStableRouter()` for the row tap. This is fine since both are React components, not plain functions.
