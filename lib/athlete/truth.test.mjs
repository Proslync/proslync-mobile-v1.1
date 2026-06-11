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

test('addBusinessDays: +5 from Friday skips weekend (lands Friday)', () => {
  // Friday 2026-06-06
  const fri = new Date('2026-06-06T09:00:00Z');
  const result = addBusinessDays(fri, 5);
  // Sat/Sun skipped: Mon(1), Tue(2), Wed(3), Thu(4), Fri(5) → 2026-06-12
  assert.equal(result.toISOString().slice(0, 10), '2026-06-12');
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
