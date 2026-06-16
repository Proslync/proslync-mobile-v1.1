// lib/money/money-machine.test.mjs
// node:test suite for the canonical money state machine.
// Run: node --test lib/money/money-machine.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  canTransition,
  deriveState,
  applyTransition,
  paidEvent,
  derivePayoutHoldState,
  ledgerBalance,
  formatCentsUSD,
} from './money-machine.mjs';

// ── 1. legal transitions allowed ────────────────────────────────────────────

test('legal transitions are allowed', () => {
  assert.equal(canTransition('expected', 'in-review'), true);
  assert.equal(canTransition('expected', 'cleared'), true);
  assert.equal(canTransition('expected', 'paid'), true);
  assert.equal(canTransition('in-review', 'cleared'), true);
  assert.equal(canTransition('in-review', 'paid'), true);
  assert.equal(canTransition('cleared', 'paid'), true);
  assert.equal(canTransition('paid', 'reversed'), true);
});

// ── 2. illegal transitions rejected ─────────────────────────────────────────

test('illegal transitions are rejected', () => {
  assert.equal(canTransition('paid', 'cleared'), false); // backward
  assert.equal(canTransition('cleared', 'in-review'), false); // backward
  assert.equal(canTransition('paid', 'paid'), false); // self-loop
  assert.equal(canTransition('reversed', 'paid'), false); // terminal
  assert.equal(canTransition('expected', 'reversed'), false); // only paid→reversed
  assert.equal(canTransition('in-review', 'expected'), false); // backward
});

test('applyTransition throws on an illegal transition', () => {
  const events = [{ kind: 'expected', atISO: '2026-01-01T00:00:00Z', source: 'contract' }];
  assert.throws(
    () => applyTransition(events, { kind: 'reversed', atISO: '2026-01-02T00:00:00Z', source: 'reversal' }),
    /illegal payment transition: expected → reversed/,
  );
});

test('applyTransition appends immutably on a legal transition', () => {
  const events = [{ kind: 'expected', atISO: '2026-01-01T00:00:00Z', source: 'contract' }];
  const next = applyTransition(events, { kind: 'in-review', atISO: '2026-01-02T00:00:00Z', source: 'csc-attested' });
  assert.equal(events.length, 1, 'original array untouched');
  assert.equal(next.length, 2);
  assert.equal(deriveState(next), 'in-review');
});

// ── 3. derive state from events ─────────────────────────────────────────────

test('deriveState: empty events → expected', () => {
  assert.equal(deriveState([]), 'expected');
});

test('deriveState: returns latest event kind by atISO', () => {
  const events = [
    { kind: 'expected', atISO: '2026-01-01T00:00:00Z', source: 'contract' },
    { kind: 'cleared', atISO: '2026-01-03T00:00:00Z', source: 'csc-attested' },
    { kind: 'in-review', atISO: '2026-01-02T00:00:00Z', source: 'csc-attested' },
  ];
  assert.equal(deriveState(events), 'cleared');
});

// ── 4. reversal after paid ───────────────────────────────────────────────────

test('reversal after paid: full expected→paid→reversed chain is legal', () => {
  let events = [{ kind: 'expected', atISO: '2026-06-01T00:00:00Z', source: 'contract' }];
  events = applyTransition(events, { kind: 'cleared', atISO: '2026-06-02T00:00:00Z', source: 'csc-attested' });
  events = applyTransition(events, paidEvent('2026-06-03T00:00:00Z', 'plaid:settled', 5));
  assert.equal(deriveState(events), 'paid');

  const paid = events[events.length - 1];
  assert.equal(paid.reversibleUntilISO, '2026-06-08T00:00:00.000Z'); // +5 days

  events = applyTransition(events, { kind: 'reversed', atISO: '2026-06-06T00:00:00Z', source: 'reversal' });
  assert.equal(deriveState(events), 'reversed');
  // reversed is terminal
  assert.throws(() => applyTransition(events, paidEvent('2026-06-07T00:00:00Z', 'provider:payout')));
});

// ── 5. ledger sum = balance ──────────────────────────────────────────────────

test('ledgerBalance: Σ amountCents * sign', () => {
  const entries = [
    { id: 'l1', atISO: '2026-06-01T00:00:00Z', kind: 'deal-credit', amountCents: 3_200_00, sign: 1, ref: 'd1' },
    { id: 'l2', atISO: '2026-06-01T00:00:00Z', kind: 'tax-set-aside', amountCents: 768_00, sign: -1, ref: 'd1' },
  ];
  // 3200.00 credit − 768.00 debit = 2432.00
  assert.equal(ledgerBalance(entries), 3_200_00 - 768_00);
  assert.equal(ledgerBalance([]), 0);
});

// ── 6. payout hold-state derivation ─────────────────────────────────────────

test('derivePayoutHoldState: held / partially-released / released', () => {
  assert.equal(derivePayoutHoldState(4_500_00, 0), 'held');
  assert.equal(derivePayoutHoldState(4_500_00, 1_500_00), 'partially-released');
  assert.equal(derivePayoutHoldState(4_500_00, 4_500_00), 'released');
  assert.equal(derivePayoutHoldState(4_500_00, 5_000_00), 'released'); // over-release clamps
});

// ── 7. cents formatting ──────────────────────────────────────────────────────

test('formatCentsUSD: whole dollars, fractional, thousands, negative', () => {
  assert.equal(formatCentsUSD(3_200_00), '$3,200');
  assert.equal(formatCentsUSD(2_400_00), '$2,400');
  assert.equal(formatCentsUSD(768_00), '$768');
  assert.equal(formatCentsUSD(50_00), '$50');
  assert.equal(formatCentsUSD(333), '$3.33');
  assert.equal(formatCentsUSD(0), '$0');
  assert.equal(formatCentsUSD(-768_00), '-$768');
});

// ── Edge-case lock-in: deriveState ordering semantics ───────────────────────

test('deriveState: out-of-order events still resolve to the latest by atISO', () => {
  const events = [
    { kind: 'paid', atISO: '2026-03-10T00:00:00Z', source: 'plaid:settled' },
    { kind: 'expected', atISO: '2026-01-01T00:00:00Z', source: 'contract' },
    { kind: 'cleared', atISO: '2026-02-01T00:00:00Z', source: 'csc-attested' },
  ];
  assert.equal(deriveState(events), 'paid', 'latest timestamp wins regardless of array order');
});

test('deriveState: equal timestamps → last array element wins (stable last-wins)', () => {
  const events = [
    { kind: 'cleared', atISO: '2026-02-01T00:00:00Z', source: 'csc-attested' },
    { kind: 'paid',    atISO: '2026-02-01T00:00:00Z', source: 'plaid:settled' },
  ];
  // Documented contract: ties resolve to the later array element (>= keeps last).
  assert.equal(deriveState(events), 'paid');
});

test('deriveState: non-array input → expected', () => {
  assert.equal(deriveState(undefined), 'expected');
  assert.equal(deriveState(null), 'expected');
});

// ── Edge-case lock-in: paidEvent reversibleUntil + no re-pay after reversal ─

test('paidEvent: reversibleUntilISO is exactly +N calendar days; ref omitted when undefined', () => {
  const ev = paidEvent('2026-06-03T00:00:00.000Z', 'plaid:settled', 5);
  assert.equal(ev.reversibleUntilISO, '2026-06-08T00:00:00.000Z');
  assert.equal('ref' in ev, false, 'ref should be absent when not provided');
  const ev2 = paidEvent('2026-06-03T00:00:00.000Z', 'plaid:settled', 5, 'payout_123');
  assert.equal(ev2.ref, 'payout_123');
});

test('a reversed payment can never be re-paid (reversed is terminal)', () => {
  let events = [{ kind: 'expected', atISO: '2026-06-01T00:00:00Z', source: 'contract' }];
  events = applyTransition(events, paidEvent('2026-06-02T00:00:00Z', 'plaid:settled', 5));
  events = applyTransition(events, { kind: 'reversed', atISO: '2026-06-03T00:00:00Z', source: 'reversal' });
  assert.equal(canTransition('reversed', 'paid'), false);
  assert.throws(
    () => applyTransition(events, paidEvent('2026-06-04T00:00:00Z', 'provider:payout', 5)),
    /illegal payment transition: reversed → paid/,
  );
});

test('reversed is only reachable from paid (not from cleared/in-review/expected)', () => {
  assert.equal(canTransition('expected', 'reversed'), false);
  assert.equal(canTransition('in-review', 'reversed'), false);
  assert.equal(canTransition('cleared', 'reversed'), false);
  assert.equal(canTransition('paid', 'reversed'), true);
});

// ── Edge-case lock-in: ledger mixed signs + formatting extremes ─────────────

test('ledgerBalance: mixed signs sum correctly and can go negative (no float drift)', () => {
  const entries = [
    { amountCents: 100_00, sign: 1 },
    { amountCents: 250_00, sign: -1 },
    { amountCents: 50_00,  sign: 1 },
  ];
  // 100 - 250 + 50 = -100.00
  assert.equal(ledgerBalance(entries), -100_00);
});

test('formatCentsUSD: large value grouping, sub-dollar, and negative fractional', () => {
  assert.equal(formatCentsUSD(1_234_567_89), '$1,234,567.89');
  assert.equal(formatCentsUSD(5), '$0.05');
  assert.equal(formatCentsUSD(99), '$0.99');
  assert.equal(formatCentsUSD(-50_50), '-$50.50');
  assert.equal(formatCentsUSD(-0), '$0', 'negative zero renders as $0, not -$0');
});
