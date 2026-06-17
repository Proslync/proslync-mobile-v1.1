// lib/utils/currency.test.mjs
// node:test suite for the wallet money formatters.
// Run: node --test lib/utils/currency.test.mjs
//
// Regression guard for formatCentsSigned: withdrawals are stored as NEGATIVE
// amountCents (see lib/data/wallet-mock.ts and lib/providers/wallet-provider.tsx),
// and the wallet activity list (components/wallet/activity-list.tsx) renders them
// with this formatter. A prior bug dropped the minus sign on negatives, so a
// -$50 withdrawal displayed as "$50.00" — visually identical to a +$50 credit
// (the only cue being row color). The sign must be preserved.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { formatCents, formatCentsSigned } from './currency.ts';

// ── formatCentsSigned: sign preservation (the regression) ──────────────────
test('formatCentsSigned: negative amounts keep the minus sign', () => {
  assert.equal(formatCentsSigned(-5000), '-$50.00');
  assert.equal(formatCentsSigned(-2500), '-$25.00');
  assert.equal(formatCentsSigned(-1), '-$0.01');
});

test('formatCentsSigned: positive amounts carry a plus sign', () => {
  assert.equal(formatCentsSigned(5000), '+$50.00');
  assert.equal(formatCentsSigned(1), '+$0.01');
});

test('formatCentsSigned: zero renders as +$0.00 (no minus)', () => {
  assert.equal(formatCentsSigned(0), '+$0.00');
  assert.equal(formatCentsSigned(-0), '+$0.00');
});

test('formatCentsSigned: non-finite values fall back to $0.00', () => {
  assert.equal(formatCentsSigned(NaN), '$0.00');
  assert.equal(formatCentsSigned(Infinity), '$0.00');
});

// ── formatCents: sanity (unsigned) ─────────────────────────────────────────
test('formatCents: sub-$100 keeps two decimals', () => {
  assert.equal(formatCents(5000), '$50.00');
  assert.equal(formatCents(0), '$0.00');
});

test('formatCents: non-finite values fall back to $0.00', () => {
  assert.equal(formatCents(NaN), '$0.00');
});
