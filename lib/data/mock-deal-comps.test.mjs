// lib/data/mock-deal-comps.test.mjs
// node:test regression guard for the NIL comparable-deal fixture magnitudes.
// Run: node --test lib/data/mock-deal-comps.test.mjs
//
// THE REGRESSION: every `cents` literal in mock-deal-comps.ts was authored
// 10x too small. They were written as `<dollars>_00` (e.g. `38_500_00`,
// intended to read "$385,000.00") but that literal is only 3,850,000 cents =
// $38,500 — a missing trailing zero. The deal-detail Comparable Deals card
// (components/deal/deal-detail-spine.tsx) and the athlete "Your Market" /
// "Market Comps" tiles (components/athlete/athlete-today.tsx) render these
// straight through `cents / 100`, so a $380K deal (d-1) showed a comparable
// band of "$31–47K" — 10x too cheap, and self-contradicting the fixture's own
// prose summary ("$310K and $465K") sitting right beside it.
//
// This guard asserts the bands sit in the realistic high-five-/six-figure NIL
// range and that the bridged deals bracket their headline deal value, so a
// future edit that drops a zero again fails loudly.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MOCK_DEAL_COMPS, getMockDealComparables } from './mock-deal-comps.ts';

// Headline deal totals from lib/data/mock-brand-data.ts (the ground-truth deal
// value each comparable band is meant to contextualize). Kept inline so this
// test stays free of `@/` path-alias imports that node:test cannot resolve.
const DEAL_HEADLINE_DOLLARS = {
  'd-1': 380_000,
  'd-2': 290_000,
  'd-3': 85_000,
  'd-4': 660_000,
  'd-5': 140_000,
  'd-6': 520_000,
};

test('every comp money literal is at least $50K (catches the 10x-too-small regression)', () => {
  for (const [dealId, evidence] of Object.entries(MOCK_DEAL_COMPS)) {
    const { estimate, range } = evidence.summary;
    if (estimate) {
      assert.ok(
        estimate.cents / 100 >= 50_000,
        `${dealId} estimate is $${estimate.cents / 100} — below the realistic NIL floor (regression: cents authored 10x too small)`,
      );
    }
    if (range) {
      assert.ok(range.low.cents / 100 >= 50_000, `${dealId} range.low too small: $${range.low.cents / 100}`);
      assert.ok(range.high.cents >= range.low.cents, `${dealId} range.high < range.low`);
    }
    for (const row of evidence.rows) {
      assert.ok(
        row.amount.cents / 100 >= 50_000,
        `${dealId} row ${row.id} amount $${row.amount.cents / 100} below NIL floor`,
      );
    }
  }
});

test('bridged comp bands bracket their headline deal value', () => {
  for (const [dealId, headline] of Object.entries(DEAL_HEADLINE_DOLLARS)) {
    const evidence = getMockDealComparables(dealId);
    assert.ok(evidence, `missing comps for ${dealId}`);
    const range = evidence.summary.range;
    assert.ok(range, `${dealId} has no range`);
    const low = range.low.cents / 100;
    const high = range.high.cents / 100;
    // A meaningful comparable band must be in the same order of magnitude as
    // the deal it contextualizes — within 0.5x..2x of the headline value.
    assert.ok(
      headline >= low * 0.5 && headline <= high * 2,
      `${dealId} headline $${headline} is not bracketed by comp band $${low}–$${high} (order-of-magnitude mismatch)`,
    );
  }
});

test('d-1 estimate matches its prose band ($310K–$465K, midpoint ~$385K)', () => {
  const d1 = getMockDealComparables('d-1');
  assert.equal(d1.summary.estimate.cents, 385_000_00);
  assert.equal(d1.summary.range.low.cents, 310_000_00);
  assert.equal(d1.summary.range.high.cents, 465_000_00);
});
