// lib/deal-engine/engine.test.mjs
// Tests for the NIL Deal Engine pure logic.
// Run: node --test lib/deal-engine/engine.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  generateDealId,
  computeFees,
  milestoneAutoApproveAt,
  isAutoApproved,
  escrowCoverage,
} from './engine.mjs';

// ── generateDealId ────────────────────────────────────────────────────────

test('generateDealId: formats as PSY-YYYY-XXXXXXXX', () => {
  const id = generateDealId(2026, () => 'A3B7CX19');
  assert.equal(id, 'PSY-2026-A3B7CX19');
});

test('generateDealId: uses injected rand — deterministic in tests', () => {
  const id1 = generateDealId(2026, () => 'AAAAAAAA');
  const id2 = generateDealId(2026, () => 'ZZZZZZZZ');
  assert.equal(id1, 'PSY-2026-AAAAAAAA');
  assert.equal(id2, 'PSY-2026-ZZZZZZZZ');
});

test('generateDealId: year is embedded correctly', () => {
  const id = generateDealId(2030, () => '12345678');
  assert.equal(id, 'PSY-2030-12345678');
});

// ── computeFees ───────────────────────────────────────────────────────────

test('computeFees: athlete keeps 100% of deal amount', () => {
  const result = computeFees(100_00); // $100
  assert.equal(result.athleteCents, 100_00);
});

test('computeFees: default 10% fee goes to brand total', () => {
  const result = computeFees(100_00); // $100
  assert.equal(result.brandFeeCents, 10_00); // $10 fee
  assert.equal(result.brandTotalCents, 110_00); // $110 brand pays
});

test('computeFees: custom fee rate respected', () => {
  const result = computeFees(200_00, 0.05); // $200 at 5%
  assert.equal(result.brandFeeCents, 10_00); // $10
  assert.equal(result.brandTotalCents, 210_00); // $210
});

test('computeFees: fee rounds to nearest cent', () => {
  const result = computeFees(333, 0.10); // $3.33 * 10% = $0.333 → rounds to $0.33
  assert.equal(result.brandFeeCents, 33);
  assert.equal(result.brandTotalCents, 366);
  assert.equal(result.athleteCents, 333);
});

// ── milestoneAutoApproveAt ────────────────────────────────────────────────

test('milestoneAutoApproveAt: returns +72h from submission', () => {
  const submitted = '2026-06-10T12:00:00.000Z';
  const autoAt = milestoneAutoApproveAt(submitted);
  const expected = new Date('2026-06-10T12:00:00.000Z');
  expected.setTime(expected.getTime() + 72 * 60 * 60 * 1000);
  assert.equal(autoAt, expected.toISOString());
});

// ── isAutoApproved ────────────────────────────────────────────────────────

test('isAutoApproved: returns false before 72h window', () => {
  const submitted = '2026-06-10T12:00:00.000Z';
  const now = '2026-06-11T12:00:00.000Z'; // only 24h later
  assert.equal(isAutoApproved(submitted, now), false);
});

test('isAutoApproved: returns false at exactly 71h59m59s', () => {
  const submitted = '2026-06-10T12:00:00.000Z';
  const now = '2026-06-13T11:59:59.000Z'; // 71h59m59s later
  assert.equal(isAutoApproved(submitted, now), false);
});

test('isAutoApproved: returns true at exactly 72h', () => {
  const submitted = '2026-06-10T12:00:00.000Z';
  const now = '2026-06-13T12:00:00.000Z'; // exactly 72h later
  assert.equal(isAutoApproved(submitted, now), true);
});

test('isAutoApproved: returns true after 72h window passes', () => {
  const submitted = '2026-06-10T12:00:00.000Z';
  const now = '2026-06-15T00:00:00.000Z'; // well past 72h
  assert.equal(isAutoApproved(submitted, now), true);
});

// ── escrowCoverage ────────────────────────────────────────────────────────

test('escrowCoverage: fully funded — isCovered=true, shortfall=0', () => {
  const milestones = [
    { amountCents: 50_00 },
    { amountCents: 50_00 },
    { amountCents: 50_00 },
  ];
  const result = escrowCoverage(milestones, 150_00);
  assert.equal(result.totalMilestoneCents, 150_00);
  assert.equal(result.fundedCents, 150_00);
  assert.equal(result.shortfallCents, 0);
  assert.equal(result.isCovered, true);
});

test('escrowCoverage: underfunded — shortfall computed correctly', () => {
  const milestones = [
    { amountCents: 100_00 },
    { amountCents: 100_00 },
  ];
  const result = escrowCoverage(milestones, 150_00);
  assert.equal(result.totalMilestoneCents, 200_00);
  assert.equal(result.shortfallCents, 50_00);
  assert.equal(result.isCovered, false);
});

test('escrowCoverage: overfunded — shortfall=0, isCovered=true', () => {
  const milestones = [{ amountCents: 100_00 }];
  const result = escrowCoverage(milestones, 200_00);
  assert.equal(result.shortfallCents, 0);
  assert.equal(result.isCovered, true);
});

test('escrowCoverage: empty milestones — always covered', () => {
  const result = escrowCoverage([], 0);
  assert.equal(result.totalMilestoneCents, 0);
  assert.equal(result.isCovered, true);
});
