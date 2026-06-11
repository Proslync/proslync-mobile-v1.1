// lib/compliance/preclearance.test.mjs
// node:test suite for preclearance.mjs — Phase D2.
// Run: node --test lib/compliance/preclearance.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { scorePreclearance, nilGoDeadline } from './preclearance.mjs';

// ── Helpers ───────────────────────────────────────────────────────────────

const BRAND_INPUT = {
  amountCents: 50_000, // $500 — below CSC floor
  dealKind: 'endorsement',
  deliverableDescription: 'Two Instagram posts and one appearance at brand event',
  payerEntityType: 'brand',
  compRange: { lowCents: 30_000, highCents: 80_000 },
};

// ── Tests ─────────────────────────────────────────────────────────────────

test('1. brand payer with concrete deliverable and in-range amount → likely-clear', () => {
  const result = scorePreclearance(BRAND_INPUT);
  assert.equal(result.verdict, 'likely-clear');
  assert.equal(result.tests.businessPurpose, 'pass');
  assert.equal(result.tests.activation, 'pass');
  assert.equal(result.tests.compRange, 'pass');
});

test('2. collective payer with vague deliverable → likely-rejected (businessPurpose fail)', () => {
  const result = scorePreclearance({
    ...BRAND_INPUT,
    payerEntityType: 'collective',
    deliverableDescription: 'general support', // < 20 non-space chars
  });
  assert.equal(result.verdict, 'likely-rejected');
  assert.equal(result.tests.businessPurpose, 'fail');
  assert(result.flags.some((f) => f.kind === 'associated-entity'),
    'should have associated-entity flag');
});

test('3. collective payer with detailed deliverable → needs-review (AE warn)', () => {
  const result = scorePreclearance({
    ...BRAND_INPUT,
    payerEntityType: 'collective',
    deliverableDescription: 'Three promotional social media posts and one in-person signing event',
  });
  assert.equal(result.verdict, 'needs-review');
  assert.equal(result.tests.businessPurpose, 'warn');
  assert.equal(result.tests.activation, 'pass');
});

test('4. booster-llc payer → AE flag always present', () => {
  const result = scorePreclearance({
    ...BRAND_INPUT,
    payerEntityType: 'booster-llc',
    deliverableDescription: 'One promotional video and one signed jersey session',
  });
  assert(result.flags.some((f) => f.kind === 'associated-entity'),
    'booster-llc should always produce AE flag');
});

test('5. amount > 3× comp high → compRange fail → likely-rejected', () => {
  const result = scorePreclearance({
    ...BRAND_INPUT,
    amountCents: 300_000, // 3× comp high of 80_000 = 240_000; 300_000 > 240_000
    compRange: { lowCents: 30_000, highCents: 80_000 },
  });
  assert.equal(result.verdict, 'likely-rejected');
  assert.equal(result.tests.compRange, 'fail');
  assert(result.flags.some((f) => f.kind === 'comp-out-of-range'));
});

test('6. amount between 1.5× and 3× comp high → compRange warn → needs-review', () => {
  const result = scorePreclearance({
    ...BRAND_INPUT,
    amountCents: 150_000, // 1.5× comp high of 80_000 = 120_000; 150_000 > 120_000 but < 240_000
    compRange: { lowCents: 30_000, highCents: 80_000 },
  });
  assert.equal(result.tests.compRange, 'warn');
  assert.equal(result.verdict, 'needs-review');
  assert(result.flags.some((f) => f.kind === 'comp-above-range'));
});

test('7. no activation keywords in description → activation warn → needs-review', () => {
  const result = scorePreclearance({
    ...BRAND_INPUT,
    deliverableDescription: 'Be a representative and ambassador for the brand in all activities',
    // 'ambassador' / 'representative' not in keyword list → warn
  });
  assert.equal(result.tests.activation, 'warn');
  assert.equal(result.verdict, 'needs-review');
});

test('8. no comp data → compRange warn → needs-review', () => {
  const result = scorePreclearance({
    ...BRAND_INPUT,
    compRange: null,
  });
  assert.equal(result.tests.compRange, 'warn');
  assert(result.flags.some((f) => f.kind === 'no-comp-data'));
  assert.equal(result.verdict, 'needs-review');
});

test('9. amount ≥ $600 → csc-report-required flag present', () => {
  const result = scorePreclearance({
    ...BRAND_INPUT,
    amountCents: 60_000, // exactly $600
  });
  assert(result.flags.some((f) => f.kind === 'csc-report-required'),
    'should flag CSC reporting requirement at or above $600');
});

test('10. amount < $600 → no csc-report-required flag', () => {
  const result = scorePreclearance({
    ...BRAND_INPUT,
    amountCents: 59_999, // $599.99
  });
  assert(!result.flags.some((f) => f.kind === 'csc-report-required'),
    'should NOT flag CSC reporting for deals below $600');
});

test('11. mmr-partner payer is treated as associated entity', () => {
  const result = scorePreclearance({
    ...BRAND_INPUT,
    payerEntityType: 'mmr-partner',
    deliverableDescription: 'short', // vague → fail
  });
  assert.equal(result.tests.businessPurpose, 'fail');
  assert(result.flags.some((f) => f.kind === 'associated-entity'));
});

test('12. school-sponsor payer is treated as associated entity', () => {
  const result = scorePreclearance({
    ...BRAND_INPUT,
    payerEntityType: 'school-sponsor',
    deliverableDescription: 'short', // vague → fail
  });
  assert.equal(result.tests.businessPurpose, 'fail');
  assert(result.flags.some((f) => f.kind === 'associated-entity'));
});

test('13. all-pass verdict has no fail or warn in tests', () => {
  const result = scorePreclearance(BRAND_INPUT);
  const values = Object.values(result.tests);
  assert(!values.includes('fail'), 'no test should fail');
  assert(!values.includes('warn'), 'no test should warn');
  assert.equal(result.verdict, 'likely-clear');
});

// ── nilGoDeadline tests ───────────────────────────────────────────────────

test('14. nilGoDeadline: Monday execution → Friday deadline (5 business days)', () => {
  // Monday 2026-06-09 + 5 business days = Monday 2026-06-16
  // Mon→Tue(1)→Wed(2)→Thu(3)→Fri(4)→Mon(5) = Mon Jun 15... let's compute
  // Mon Jun 9 + 5 bdays: Tue 10 (1), Wed 11 (2), Thu 12 (3), Fri 13 (4), Mon 16 (5)
  const deadline = nilGoDeadline('2026-06-09T14:00:00.000Z');
  assert.equal(deadline, '2026-06-16', `expected 2026-06-16, got ${deadline}`);
});

test('15. nilGoDeadline: Friday execution → following Friday deadline (skips weekend)', () => {
  // Fri Jun 12 + 5 bdays: Mon 15 (1), Tue 16 (2), Wed 17 (3), Thu 18 (4), Fri 19 (5)
  const deadline = nilGoDeadline('2026-06-12T10:00:00.000Z');
  assert.equal(deadline, '2026-06-19', `expected 2026-06-19, got ${deadline}`);
});

test('16. nilGoDeadline returns a date string (YYYY-MM-DD)', () => {
  const deadline = nilGoDeadline('2026-01-02T00:00:00.000Z');
  assert.match(deadline, /^\d{4}-\d{2}-\d{2}$/, 'should be date-only string');
});
