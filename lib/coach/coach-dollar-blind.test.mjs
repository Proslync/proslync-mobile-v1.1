// lib/coach/coach-dollar-blind.test.mjs
// Mechanically enforces the coach dollar-blind wall: a projected coach NIL-watch
// row must carry the deal STAGE + a binary cleared flag, and NEVER a dollar
// amount or a payment id — even though the SOURCE deal (incl. the hero d-4 Nike
// Hoops × Kiyan $660K) is loud with money. Run: node --test.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  formatDealStageLabel,
  findMoneyLeak,
} from './coach-dollar-blind.mjs';

// Money-loud SOURCE deals (mirror BRAND_DEALS shape, incl. value + payment id).
// The hero a-1 → d-4 (Nike Hoops, $660K, signed) is the case that matters most.
const SOURCE_DEALS = [
  { id: 'd-4', athleteId: 'a-1', athlete: 'Kiyan Anthony · Syracuse', stage: 'signed', value: '$660K', term: '3 yrs · exclusive · renewed', paymentId: 'txn-d-4-001' },
  { id: 'd-1', athleteId: 'a-5', athlete: 'Dylan Harper · Rutgers', stage: 'negotiation', value: '$380K', term: '2 yrs', paymentId: 'ap-001' },
  { id: 'd-6', athleteId: 'a-3', athlete: 'Cooper Flagg · Duke', stage: 'live', value: '$520K renewal', term: '2 yrs', paymentId: 'lg-x' },
];

const ROSTER = [
  { athleteId: 'a-1', athleteName: 'Kiyan Anthony', initials: 'KA', school: 'Syracuse', position: 'PG', classYear: 'Fr', jerseyNumber: 23, nilStatus: 'active' },
  { athleteId: 'a-3', athleteName: 'Cooper Flagg', initials: 'CF', school: 'Duke', position: 'F', classYear: 'Fr', jerseyNumber: 32, nilStatus: 'active' },
  { athleteId: 'a-5', athleteName: 'Dylan Harper', initials: 'DH', school: 'Rutgers', position: 'PG', classYear: 'Fr', jerseyNumber: 7, nilStatus: 'flagged' },
];

// Reproduce the coach NIL-watch row projection (the dollar-blind lens): join by
// athleteId, surface ONLY the stage label + a binary cleared flag.
function projectCoachRow(entry, deals) {
  let latest = null;
  for (const d of deals) if (d.athleteId === entry.athleteId) latest = d;
  return {
    athleteId: entry.athleteId,
    athleteName: entry.athleteName,
    initials: entry.initials,
    school: entry.school,
    position: entry.position,
    classYear: entry.classYear,
    jerseyNumber: entry.jerseyNumber,
    nilStatus: entry.nilStatus,
    lastDealStatus: latest ? formatDealStageLabel(latest.stage) : null,
    lastDisclosureState: latest ? 'school-review' : null,
    cleared: entry.nilStatus === 'cleared',
  };
}

test('coach row: hero a-1 joins to d-4 and shows the stage label only', () => {
  const row = projectCoachRow(ROSTER[0], SOURCE_DEALS);
  assert.equal(row.athleteId, 'a-1');
  assert.equal(row.lastDealStatus, 'Signed'); // d-4 is signed
});

test('coach row: NO dollar amount, NO payment id (dollar-blind wall)', () => {
  for (const entry of ROSTER) {
    const row = projectCoachRow(entry, SOURCE_DEALS);
    const leak = findMoneyLeak(row);
    assert.equal(
      leak.ok,
      true,
      `coach row for ${entry.athleteId} leaked money/payment id at ${leak.offendingPath}: ${JSON.stringify(leak.offendingValue)}`,
    );
  }
});

test('findMoneyLeak: catches a $ amount if one ever leaks into a coach row', () => {
  const bad = { athleteId: 'a-1', lastDealStatus: 'Signed', dealValue: '$660K' };
  const leak = findMoneyLeak(bad);
  assert.equal(leak.ok, false);
  assert.equal(leak.offendingValue, '$660K');
});

test('findMoneyLeak: catches a payment id if one ever leaks into a coach row', () => {
  const bad = { athleteId: 'a-1', lastDealStatus: 'Signed', ref: 'txn-d-4-001' };
  const leak = findMoneyLeak(bad);
  assert.equal(leak.ok, false);
});

test('findMoneyLeak: catches a money-shaped KEY (amountCents) too', () => {
  const bad = { athleteId: 'a-1', amountCents: 660_000_00 };
  const leak = findMoneyLeak(bad);
  assert.equal(leak.ok, false);
  assert.equal(leak.offendingPath, '$.amountCents');
});

test('formatDealStageLabel: every stage maps to a dollar-free label', () => {
  for (const [stage, label] of [
    ['draft', 'Drafting'],
    ['sent', 'Offer sent'],
    ['negotiation', 'In negotiation'],
    ['signed', 'Signed'],
    ['live', 'Active'],
  ]) {
    const out = formatDealStageLabel(stage);
    assert.equal(out, label);
    assert.equal(findMoneyLeak(out).ok, true);
  }
});
