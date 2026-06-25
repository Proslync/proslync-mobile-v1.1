// lib/brand/brand-reliability.test.mjs
// The brand PAYMENT RELIABILITY card is a PURE projection over the athlete
// payment ledger — not hand-typed literals. Run: node --test.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildBrandReliability } from './brand-reliability.mjs';

test('derives deals-fully-paid as paid/total over the ledger', () => {
  const r = buildBrandReliability([
    { dealId: 'd-a', brandLabel: 'X', amountCents: 100, status: 'paid', executedAtISO: '2026-01-01T00:00:00Z', paidAtISO: '2026-01-07T00:00:00Z' },
    { dealId: 'd-b', brandLabel: 'X', amountCents: 100, status: 'in-review' },
    { dealId: 'd-c', brandLabel: 'X', amountCents: 100, status: 'projected' },
  ]);
  assert.equal(r.dealsFullyPaid, 1);
  assert.equal(r.dealsTotal, 3);
  assert.equal(r.dealsFullyPaidLabel, '1 / 3');
});

test('median days-to-pay computes from executed→paid events', () => {
  const r = buildBrandReliability([
    { dealId: '1', brandLabel: 'X', amountCents: 1, status: 'paid', executedAtISO: '2026-01-01T00:00:00Z', paidAtISO: '2026-01-05T00:00:00Z' }, // 4d
    { dealId: '2', brandLabel: 'X', amountCents: 1, status: 'paid', executedAtISO: '2026-01-01T00:00:00Z', paidAtISO: '2026-01-09T00:00:00Z' }, // 8d
    { dealId: '3', brandLabel: 'X', amountCents: 1, status: 'paid', executedAtISO: '2026-01-01T00:00:00Z', paidAtISO: '2026-01-13T00:00:00Z' }, // 12d
  ]);
  assert.equal(r.medianDaysToPay, 8);
  assert.equal(r.medianDaysToPayLabel, '8 days');
});

test('median days-to-pay is null (—) when nothing has settled', () => {
  const r = buildBrandReliability([
    { dealId: '1', brandLabel: 'X', amountCents: 1, status: 'projected' },
  ]);
  assert.equal(r.medianDaysToPay, null);
  assert.equal(r.medianDaysToPayLabel, '—');
});

test('escrow-funded-before-work is a derived percentage', () => {
  const r = buildBrandReliability([
    { dealId: '1', brandLabel: 'X', amountCents: 1, status: 'paid', escrowFundedBeforeWork: true },
    { dealId: '2', brandLabel: 'X', amountCents: 1, status: 'in-review', escrowFundedBeforeWork: false },
  ]);
  assert.equal(r.escrowFundedBeforeWorkPct, 50);
  assert.equal(r.escrowFundedBeforeWorkLabel, '50%');
});

test('empty ledger is total and safe (no NaN/throw)', () => {
  const r = buildBrandReliability([]);
  assert.equal(r.dealsFullyPaidLabel, '0 / 0');
  assert.equal(r.medianDaysToPayLabel, '—');
  assert.equal(r.escrowFundedBeforeWorkPct, 0);
  assert.equal(r.reliable, false);
});
