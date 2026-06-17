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

test('addBusinessDays: Saturday start +5 lands on the same Friday as a Friday start', () => {
  // Start day is never counted; the first weekend is skipped, so Sat 6/13 and
  // Fri 6/12 both resolve to Fri 6/19.
  const sat = new Date('2026-06-13T09:00:00Z');
  const sun = new Date('2026-06-14T09:00:00Z');
  assert.equal(addBusinessDays(sat, 5).toISOString().slice(0, 10), '2026-06-19');
  assert.equal(addBusinessDays(sun, 5).toISOString().slice(0, 10), '2026-06-19');
});

test('addBusinessDays: negative count is a no-op (loop guard, returns start date)', () => {
  const d = new Date('2026-06-15T12:00:00Z');
  assert.equal(addBusinessDays(d, -3).toISOString().slice(0, 10), '2026-06-15');
});

test('addBusinessDays: result never lands on a UTC weekend (timezone-independent)', () => {
  // Regression: the weekend-skip used local getDay()/setDate() while every
  // caller serializes via .toISOString() (UTC). In a negative-UTC-offset zone
  // (all US timezones) a Monday-00:00Z execution would resolve to a Saturday
  // UTC date. UTC math makes the result depend only on the instant, so the
  // serialized deadline is always a weekday.
  for (let h = 0; h < 24 * 9; h++) {
    const start = new Date(Date.parse('2026-06-08T00:00:00.000Z') + h * 3600e3);
    const out = addBusinessDays(start, 5);
    const dow = out.getUTCDay();
    assert.ok(
      dow !== 0 && dow !== 6,
      `+5 business days from ${start.toISOString()} landed on UTC weekday ${dow} (${out.toISOString()})`,
    );
  }
});

test('addBusinessDays: Monday-00:00Z + 5 business days is the next Monday in UTC', () => {
  // Mon 2026-06-08T00:00Z → Mon 2026-06-15 regardless of the host timezone.
  // Previously, in US timezones this serialized to Sat 2026-06-13.
  const mon = new Date('2026-06-08T00:00:00.000Z');
  assert.equal(addBusinessDays(mon, 5).toISOString().slice(0, 10), '2026-06-15');
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

test('thresholdForHours: exact boundaries — 24 is amber, 72 is green', () => {
  // Thresholds are strict-less-than: <24 red, <72 amber, else green.
  assert.equal(thresholdForHours(23.999), 'red');
  assert.equal(thresholdForHours(24), 'amber', 'exactly 24h is amber, not red');
  assert.equal(thresholdForHours(71.999), 'amber');
  assert.equal(thresholdForHours(72), 'green', 'exactly 72h is green, not amber');
});

test('thresholdForHours: negative hours (overdue) → red', () => {
  // A negative value means the deadline is in the past → most urgent.
  assert.equal(thresholdForHours(-5), 'red');
  assert.equal(thresholdForHours(0), 'red');
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

test('truthSummary: cleared deals count toward expectedCents alongside expected', () => {
  const deals = [
    { dealId: 'c1', amountCents: 100_00, paymentState: 'cleared',
      disclosure: { state: 'cleared' }, deliverables: [] },
    { dealId: 'e1', amountCents: 250_00, paymentState: 'expected',
      disclosure: { state: 'cleared' }, deliverables: [] },
  ];
  const s = truthSummary(deals);
  assert.equal(s.expectedCents, 350_00, 'cleared + expected both accrue to expectedCents');
});

test('truthSummary: lastPaid keeps the strictly-latest paidAtISO (ties keep the first seen)', () => {
  // Two paid deals at the SAME timestamp — the strict `>` comparison keeps the
  // first one encountered, not the second.
  const deals = [
    { dealId: 'p1', amountCents: 100_00, paymentState: 'paid', paidAtISO: '2026-06-02T00:00:00Z',
      disclosure: { state: 'cleared' }, deliverables: [] },
    { dealId: 'p2', amountCents: 999_00, paymentState: 'paid', paidAtISO: '2026-06-02T00:00:00Z',
      disclosure: { state: 'cleared' }, deliverables: [] },
    { dealId: 'p3', amountCents: 500_00, paymentState: 'paid', paidAtISO: '2026-06-01T00:00:00Z',
      disclosure: { state: 'cleared' }, deliverables: [] },
  ];
  const s = truthSummary(deals);
  assert.equal(s.lastPaid.dateISO, '2026-06-02T00:00:00Z');
  assert.equal(s.lastPaid.amountCents, 100_00, 'first of the tied-latest is retained');
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

test('nextDisclosureDeadline: an OVERDUE disclosure outranks an approaching one', () => {
  // Regression: hoursUntilISO clamps past deadlines to null. The old sort did
  // `?? Infinity`, burying the overdue (most eligibility-critical) deal behind
  // a future-deadline one. The signed-delta sort must put overdue first.
  const overdue = new Date(Date.now() - 6 * 3600e3).toISOString();   // 6h past
  const soon    = new Date(Date.now() + 8 * 3600e3).toISOString();   // 8h out
  const deals = [
    {
      dealId: 'soon', brand: 'Soon', title: 'T', amountCents: 100_00,
      paymentState: 'expected',
      disclosure: { state: 'undisclosed', executedAtISO: '2026-06-01T00:00:00Z', deadlineISO: soon },
      deliverables: [],
    },
    {
      dealId: 'overdue', brand: 'Overdue', title: 'T', amountCents: 100_00,
      paymentState: 'expected',
      disclosure: { state: 'undisclosed', executedAtISO: '2026-06-01T00:00:00Z', deadlineISO: overdue },
      deliverables: [],
    },
  ];
  const nd = nextDisclosureDeadline(deals);
  assert.ok(nd, 'should return a deal');
  assert.equal(nd.dealId, 'overdue', 'overdue disclosure is the most urgent');
});

test('nextDisclosureDeadline: the MORE overdue of two past deadlines wins', () => {
  const lessOverdue = new Date(Date.now() - 2 * 3600e3).toISOString();  // 2h past
  const moreOverdue = new Date(Date.now() - 30 * 3600e3).toISOString(); // 30h past
  const deals = [
    {
      dealId: 'less', brand: 'Less', title: 'T', amountCents: 100_00,
      paymentState: 'expected',
      disclosure: { state: 'undisclosed', executedAtISO: '2026-06-01T00:00:00Z', deadlineISO: lessOverdue },
      deliverables: [],
    },
    {
      dealId: 'more', brand: 'More', title: 'T', amountCents: 100_00,
      paymentState: 'expected',
      disclosure: { state: 'undisclosed', executedAtISO: '2026-06-01T00:00:00Z', deadlineISO: moreOverdue },
      deliverables: [],
    },
  ];
  assert.equal(nextDisclosureDeadline(deals).dealId, 'more');
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
