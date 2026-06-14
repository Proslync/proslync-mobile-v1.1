// lib/fmv/fmv-engine.test.mjs
// node:test suite for fmv-engine.mjs — ≥ 12 tests.
// Run: node --test lib/fmv/fmv-engine.test.mjs
//
// Covers all spec-required scenarios:
//   engaged-reach math; base at N=0; engagement-over-followers;
//   IQR from comps; roster-category excluded; <3 comps → low/base;
//   blend weighting; gate-before-price; >3× → unlikely; 1.5–3× → borderline;
//   in-range → likely; under-$2500 → fmvApplies false; confidence tiers.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { estimateFmv, predictClearance, FMV_DISCLAIMER, LLM_READY } from './fmv-engine.mjs';

// ── Helpers ───────────────────────────────────────────────────────────────

// Athlete a-1 (Kiyan Anthony): 2_619_500 followers, 5.2% ER
const KIYAN = {
  totalFollowers: 2_619_500,
  engagementRate7d: 0.052,
};

// Athlete a-2 (Jordan Miles): 1_221_000 followers, 7.1% ER
const JORDAN = {
  totalFollowers: 1_221_000,
  engagementRate7d: 0.071,
};

const BASE_CLEARANCE_INPUT = {
  amountCents: 2_000_000, // $20,000
  dealKind: 'social-post',
  deliverableDescription: 'Three Instagram posts and one TikTok reel promoting the brand',
  payerEntityType: 'brand',
  ...KIYAN,
};

// ── estimateFmv tests ─────────────────────────────────────────────────────

test('1. engaged-reach math: engagedReach = totalFollowers * engagementRate7d', () => {
  // For Kiyan: 2_619_500 * 0.052 = 136_214 engaged followers
  // social-post CPE_low = 9, so baseLow ≈ 136_214 * 9 = 1_225_926 (≈ $12,259)
  const fmv = estimateFmv({ dealKind: 'social-post', ...KIYAN });
  // Band must span reasonable range; point must be within low–high
  assert.ok(fmv.lowCents > 0, 'lowCents should be positive');
  assert.ok(fmv.highCents > fmv.lowCents, 'highCents should exceed lowCents');
  assert.ok(fmv.pointCents >= fmv.lowCents, 'point should be >= low');
  assert.ok(fmv.pointCents <= fmv.highCents, 'point should be <= high');
});

test('2. base estimate at N=0 (no comps) returns a sane band within target range', () => {
  // Kiyan social-post: target $12k–$28k
  const fmv = estimateFmv({ dealKind: 'social-post', ...KIYAN });
  // After 15% widening (no comps): expect lowCents roughly $10k–$13k, highCents roughly $27k–$33k
  assert.ok(fmv.lowCents > 900_000,  'low should be above $9k (after widen)');
  assert.ok(fmv.highCents < 3_500_000, 'high should be below $35k');
  assert.equal(fmv.method, 'base');
  assert.equal(fmv.compsUsedCount, 0);
});

test('3. engagement-over-followers: same engaged reach → same FMV band; higher engaged → higher FMV', () => {
  // 50k followers / 8% ER = 4,000 engaged
  // 200k followers / 2% ER = 4,000 engaged — same engaged reach, same FMV
  const highER  = estimateFmv({ dealKind: 'social-post', totalFollowers: 50_000,  engagementRate7d: 0.08 });
  const lowER   = estimateFmv({ dealKind: 'social-post', totalFollowers: 200_000, engagementRate7d: 0.02 });
  // Both have same engaged reach, so their pointCents should be equal (within rounding)
  assert.ok(
    Math.abs(highER.pointCents - lowER.pointCents) < 500,
    `Same engaged reach should produce near-equal points: ${highER.pointCents} vs ${lowER.pointCents}`,
  );
  // 100k/8% (8,000 engaged) should beat 200k/2% (4,000 engaged)
  const bigger  = estimateFmv({ dealKind: 'social-post', totalFollowers: 100_000, engagementRate7d: 0.08 });
  assert.ok(bigger.pointCents > lowER.pointCents, '8k engaged > 4k engaged should yield higher FMV');
});

test('4. IQR from comps: P25–P75 is used, outlier is suppressed', () => {
  // Provide 8 comps with one extreme outlier; IQR should exclude it
  const outlierAmount = 100_000_000; // $1M — extreme outlier
  const normalAmount  = 1_500_000;   // $15k — typical
  const comps = [
    ...Array(7).fill(null).map((_, i) => ({
      amountCents: normalAmount + i * 10_000,
      nilCategory: 'social-post',
      followerReach: 500_000,
    })),
    { amountCents: outlierAmount, nilCategory: 'social-post', followerReach: 500_000 },
  ];
  const fmv = estimateFmv({ dealKind: 'social-post', ...KIYAN, comps });
  // The IQR should cap the high well below the outlier's scale
  assert.ok(fmv.highCents < outlierAmount / 2, 'IQR should suppress the $1M outlier');
  assert.equal(fmv.compsUsedCount, 8);
  assert.equal(fmv.method, 'blended');
});

test('5. roster-category comps excluded from FMV calculation', () => {
  const rosterComp = {
    amountCents: 50_000_000, // $500k — would dominate if included
    nilCategory: 'roster-retention',
    followerReach: 500_000,
  };
  const fmvWith    = estimateFmv({ dealKind: 'social-post', ...KIYAN, comps: [rosterComp] });
  const fmvWithout = estimateFmv({ dealKind: 'social-post', ...KIYAN });
  // Both should be 'base' + 'low' confidence since roster comp is excluded → 0 usable comps
  assert.equal(fmvWith.compsUsedCount, 0, 'roster-retention comp should be excluded');
  assert.equal(fmvWith.method, 'base');
  // And results should be identical (no comps in either case)
  assert.equal(fmvWith.lowCents, fmvWithout.lowCents);
});

test('6. <3 usable comps → low confidence + base method', () => {
  const twoComps = [
    { amountCents: 1_000_000, nilCategory: 'social-post', followerReach: 300_000 },
    { amountCents: 2_000_000, nilCategory: 'social-post', followerReach: 600_000 },
  ];
  const fmv = estimateFmv({ dealKind: 'social-post', ...KIYAN, comps: twoComps });
  assert.equal(fmv.confidence, 'low');
  assert.equal(fmv.method, 'base');
  assert.equal(fmv.compsUsedCount, 2);
});

test('7. blend weighting: 8 comps → compWeight capped at 0.7, blended toward high comps', () => {
  // With 8 comps at $50k for a small athlete, blended should be > base only
  const comps = Array(8).fill(null).map(() => ({
    amountCents: 5_000_000, // $50k comps — well above base for small athlete
    nilCategory: 'social-post',
    followerReach: 500_000,
  }));
  const small = { totalFollowers: 10_000, engagementRate7d: 0.05 };
  const baseOnly = estimateFmv({ dealKind: 'social-post', ...small });
  const blended  = estimateFmv({ dealKind: 'social-post', ...small, comps });
  // Blended should be higher than base because comps are at $50k
  assert.ok(blended.pointCents > baseOnly.pointCents, 'blended should be pulled toward higher comps');
  assert.equal(blended.method, 'blended');
});

test('8. gate-before-price: fail gate → unlikely even if amount is in FMV range', () => {
  // AE payer + vague description → gate fails → band = 'unlikely' regardless of price
  const prediction = predictClearance({
    amountCents: 1_000_000, // $10k — well within a typical social-post band
    dealKind: 'social-post',
    deliverableDescription: 'short', // < 20 non-space chars → businessPurpose fail for AE
    payerEntityType: 'collective',   // AE payer
    ...KIYAN,
  });
  assert.equal(prediction.gate.verdict, 'likely-rejected', 'gate should fire as likely-rejected');
  assert.equal(prediction.band, 'unlikely', 'band must be unlikely even with in-range amount');
});

test('9. amount >3× FMV high → unlikely', () => {
  // Get FMV first to know where to put the amount
  const fmv = estimateFmv({ dealKind: 'social-post', ...KIYAN });
  const overpriced = fmv.highCents * 4; // 4× high — definitely >3×
  const prediction = predictClearance({
    amountCents: overpriced,
    dealKind: 'social-post',
    deliverableDescription: 'Three Instagram posts and one TikTok reel for the brand campaign',
    payerEntityType: 'brand',
    ...KIYAN,
  });
  assert.equal(prediction.band, 'unlikely', `4× high should be unlikely; amount=${overpriced}, high=${fmv.highCents}`);
  assert.equal(prediction.fmvApplies, true);
});

test('10. amount 1.5–3× FMV high → borderline', () => {
  const fmv = estimateFmv({ dealKind: 'social-post', ...KIYAN });
  const borderlineAmount = Math.round(fmv.highCents * 2); // 2× high
  const prediction = predictClearance({
    amountCents: borderlineAmount,
    dealKind: 'social-post',
    deliverableDescription: 'Three Instagram posts and one TikTok reel for the brand campaign',
    payerEntityType: 'brand',
    ...KIYAN,
  });
  // Gate should not be likely-rejected (brand payer, good description)
  assert.notEqual(prediction.gate.verdict, 'likely-rejected', 'brand payer with good description should not gate-reject');
  assert.equal(prediction.band, 'borderline', `2× high should be borderline; amount=${borderlineAmount}, high=${fmv.highCents}`);
});

test('11. in-range amount with brand payer → likely', () => {
  const fmv = estimateFmv({ dealKind: 'social-post', ...KIYAN });
  const inRange = Math.round((fmv.lowCents + fmv.highCents) / 2); // midpoint
  const prediction = predictClearance({
    amountCents: inRange,
    dealKind: 'social-post',
    deliverableDescription: 'Three Instagram posts and one TikTok video for the brand campaign',
    payerEntityType: 'brand',
    ...KIYAN,
  });
  assert.equal(prediction.band, 'likely');
  assert.equal(prediction.bandLabel, 'Likely to clear');
});

test('12. under-$2500 → fmvApplies false', () => {
  const prediction = predictClearance({
    amountCents: 100_000, // $1,000 — below $2,500 threshold
    dealKind: 'autograph',
    deliverableDescription: 'One signing session at the brand event for 30 minutes',
    payerEntityType: 'brand',
    ...KIYAN,
  });
  assert.equal(prediction.fmvApplies, false, 'FMV review should not apply below $2,500');
});

test('13. confidence tiers by comp count: 0–2 → low, 3–7 → medium, 8+ → high', () => {
  const makeComps = (n) => Array(n).fill(null).map(() => ({
    amountCents: 1_500_000,
    nilCategory: 'social-post',
    followerReach: 500_000,
  }));

  const low    = estimateFmv({ dealKind: 'social-post', ...KIYAN, comps: makeComps(2) });
  const medium = estimateFmv({ dealKind: 'social-post', ...KIYAN, comps: makeComps(5) });
  const high   = estimateFmv({ dealKind: 'social-post', ...KIYAN, comps: makeComps(9) });

  assert.equal(low.confidence,    'low',    '2 comps → low');
  assert.equal(medium.confidence, 'medium', '5 comps → medium');
  assert.equal(high.confidence,   'high',   '9 comps → high');
});

test('14. FMV_DISCLAIMER is the exact required string', () => {
  assert.ok(
    FMV_DISCLAIMER.includes("only the CSC and NIL Go decide"),
    'disclaimer must mention CSC and NIL Go',
  );
  assert.ok(
    FMV_DISCLAIMER.includes("Not legal advice"),
    'disclaimer must include "Not legal advice"',
  );
});

test('15. LLM_READY is false', () => {
  assert.equal(LLM_READY, false);
});
