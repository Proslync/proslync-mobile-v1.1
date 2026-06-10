// ── MOCK AD REVENUE-SHARE LEDGER FIXTURE ─────────────────
// Hand-authored Sprint 3.1 fixture for `school:syracuse`, FY 2025-26 H1.
// Every row tagged `synthetic` per `mock-deal-comps.ts` / `mock-risk-report.ts`
// precedent. Replace with reviewer-approved sources before any external use.
//
// CLEAR SEPARATION DISCIPLINE (PLAN P3 / P4):
//   - `platformFeeCents`        Proslync ↔ AD (NOT House-capped)
//   - `schoolDisbursementCents` AD's retained slice (NOT House-capped)
//   - `athletePayoutCents`      School ↔ athlete pass-through (IS capped)
//
// Money is integer cents (USD). House-v.-NCAA reference cap mirrors the
// Sprint-3.10 risk-report fixture so the AD cockpit reads from a
// single cap source-of-truth.

import type { ComparableDealSourceRef } from '@/lib/types/comparable-deal.types';
import type {
  PlatformFeeStructure,
  RevShareLedger,
  RevShareLedgerEntry,
  RevShareLedgerTotals,
} from '@/lib/types/rev-share.types';

const NOW_ISO = '2026-05-10T00:00:00.000Z';
const PERIOD_ID = 'period:syr-fy2026-h1';
const SCHOOL_ID = 'school:syracuse';
const BRAND_PUMA = 'brand:puma-hoops';
const BRAND_GATORADE = 'brand:gatorade';
const BRAND_DICKS = 'brand:dicks-sporting-goods';
const BRAND_BEATS = 'brand:beats-by-dre';
const BRAND_HOFFMAN_AUTO = 'brand:hoffman-auto';

function syntheticSource(
  id: string,
  label: string,
  freshnessDays = 0,
  caveat?: string,
): ComparableDealSourceRef {
  return {
    id,
    label,
    kind: 'synthetic',
    retrievedAt: NOW_ISO,
    freshnessDays,
    caveat,
  };
}

// Tiered platform fee:
//   0     – 250K   → 7.00% (700 bp)
//   250K  – 1M     → 5.00% (500 bp)
//   1M+            → 4.00% (400 bp)
//
// Headline rate quoted to the AD: "tiered · 4-7%". This is the
// **Proslync ↔ AD commercial term** and is independent of the
// House-v.-NCAA cap (PLAN P4).
const SYRACUSE_FEE_STRUCTURE: PlatformFeeStructure = {
  tier: 'tiered',
  percentageBp: 500, // headline mid-band rate shown on the card
  brackets: [
    { thresholdCents: 0, rateBp: 700 },
    { thresholdCents: 250_000_00, rateBp: 500 },
    { thresholdCents: 1_000_000_00, rateBp: 400 },
  ],
  negotiatedRateNote: 'Tiered 4-7% per Syracuse Athletics master agreement v1.2.',
};

/** Returns the basis-points rate that applies to the gross-deal amount. */
function tieredRateBp(grossCents: number): number {
  const brackets = SYRACUSE_FEE_STRUCTURE.brackets ?? [];
  let applicable = brackets[0]?.rateBp ?? 500;
  for (const bracket of brackets) {
    if (grossCents >= bracket.thresholdCents) {
      applicable = bracket.rateBp;
    }
  }
  return applicable;
}

function makeEntry(args: {
  id: string;
  dealId: string;
  brandId: string;
  athleteId: string;
  grossCents: number;
  /** Share of gross going to the athlete (basis points). */
  athletePayoutBp: number;
  recordedAt: string;
  status: RevShareLedgerEntry['status'];
  sourceLabel: string;
  freshnessDays?: number;
  note?: string;
}): RevShareLedgerEntry {
  const platformRateBp = tieredRateBp(args.grossCents);
  const platformFeeCents = Math.round((args.grossCents * platformRateBp) / 10_000);
  const athletePayoutCents = Math.round(
    (args.grossCents * args.athletePayoutBp) / 10_000,
  );
  const schoolDisbursementCents =
    args.grossCents - platformFeeCents - athletePayoutCents;
  return {
    id: args.id,
    periodId: PERIOD_ID,
    dealId: args.dealId,
    brandId: args.brandId,
    athleteId: args.athleteId,
    grossDealCents: { cents: args.grossCents, currency: 'USD' },
    platformFeeCents: { cents: platformFeeCents, currency: 'USD' },
    schoolDisbursementCents: { cents: schoolDisbursementCents, currency: 'USD' },
    athletePayoutCents: { cents: athletePayoutCents, currency: 'USD' },
    recordedAt: args.recordedAt,
    status: args.status,
    source: syntheticSource(
      `src-${args.id}`,
      args.sourceLabel,
      args.freshnessDays ?? 0,
      'Hand-authored ledger row for demo; replace with disbursement export.',
    ),
    note: args.note,
  };
}

const ENTRIES: RevShareLedgerEntry[] = [
  makeEntry({
    id: 'rs-001',
    dealId: 'd-4',
    brandId: BRAND_PUMA,
    athleteId: 'a-1', // Kiyan Anthony · Syracuse
    grossCents: 660_000_00,
    athletePayoutBp: 8500, // 85% pass-through
    recordedAt: '2025-09-12T00:00:00.000Z',
    status: 'disbursed',
    sourceLabel: 'Nike · Kiyan Anthony master deal disbursement export',
  }),
  makeEntry({
    id: 'rs-002',
    dealId: 'd-syr-201',
    brandId: BRAND_GATORADE,
    athleteId: 'a-1',
    grossCents: 145_000_00,
    athletePayoutBp: 8300,
    recordedAt: '2025-10-04T00:00:00.000Z',
    status: 'disbursed',
    sourceLabel: 'Gatorade · in-arena appearance series settled batch',
  }),
  makeEntry({
    id: 'rs-003',
    dealId: 'd-syr-202',
    brandId: BRAND_DICKS,
    athleteId: 'a-4', // JJ Starling · Syracuse
    grossCents: 85_000_00,
    athletePayoutBp: 8400,
    recordedAt: '2025-10-22T00:00:00.000Z',
    status: 'disbursed',
    sourceLabel: 'Dick\'s · campus retail activation settled',
  }),
  makeEntry({
    id: 'rs-004',
    dealId: 'd-syr-203',
    brandId: BRAND_BEATS,
    athleteId: 'a-1',
    grossCents: 220_000_00,
    athletePayoutBp: 8200,
    recordedAt: '2025-11-18T00:00:00.000Z',
    status: 'recorded',
    sourceLabel: 'Beats · launch reel content packet recorded',
    note: 'Awaiting Q4 disbursement window — slated 2026-01-15.',
  }),
  makeEntry({
    id: 'rs-005',
    dealId: 'd-syr-204',
    brandId: BRAND_HOFFMAN_AUTO,
    athleteId: 'a-4',
    grossCents: 42_000_00,
    athletePayoutBp: 8000,
    recordedAt: '2025-11-30T00:00:00.000Z',
    status: 'recorded',
    sourceLabel: 'Hoffman Auto · local-market activation recorded',
  }),
  makeEntry({
    id: 'rs-006',
    dealId: 'd-syr-205',
    brandId: BRAND_PUMA,
    athleteId: 'a-1',
    grossCents: 80_000_00,
    athletePayoutBp: 8500,
    recordedAt: '2025-12-05T00:00:00.000Z',
    status: 'disbursed',
    sourceLabel: 'Nike · holiday content batch settled',
  }),
  makeEntry({
    id: 'rs-007',
    dealId: 'd-syr-206',
    brandId: BRAND_GATORADE,
    athleteId: 'a-4',
    grossCents: 36_000_00,
    athletePayoutBp: 8300,
    recordedAt: '2025-12-15T00:00:00.000Z',
    status: 'disputed',
    sourceLabel: 'Gatorade · contested usage-rights overage',
    note: 'Brand contesting overage on usage-rights window; on hold.',
  }),
  makeEntry({
    id: 'rs-008',
    dealId: 'd-syr-207',
    brandId: BRAND_DICKS,
    athleteId: 'a-1',
    grossCents: 60_000_00,
    athletePayoutBp: 8400,
    recordedAt: '2025-12-22T00:00:00.000Z',
    status: 'disbursed',
    sourceLabel: 'Dick\'s · January refresh batch settled',
  }),
  makeEntry({
    id: 'rs-009',
    dealId: 'd-syr-208',
    brandId: BRAND_BEATS,
    athleteId: 'a-4',
    grossCents: 28_000_00,
    athletePayoutBp: 8000,
    recordedAt: '2026-04-18T00:00:00.000Z',
    status: 'projected',
    sourceLabel: 'Beats · spring-roster projected (not yet signed)',
    note: 'Projected for FY-end close; brand committed but not yet recorded.',
  }),
  makeEntry({
    id: 'rs-010',
    dealId: 'd-syr-209',
    brandId: BRAND_PUMA,
    athleteId: 'a-1',
    grossCents: 175_000_00,
    athletePayoutBp: 8500,
    recordedAt: '2026-04-30T00:00:00.000Z',
    status: 'projected',
    sourceLabel: 'Nike · summer creator-camp projected',
    note: 'Projected for FY 25-26 close; signature window open.',
  }),
  // ── Phase C: Syracuse ledger 11–25 ───────────────────────
  makeEntry({
    id: 'rs-011',
    dealId: 'd-syr-211',
    brandId: BRAND_PUMA,
    athleteId: 'a-4', // JJ Starling
    grossCents: 56_000_00,
    athletePayoutBp: 8200,
    recordedAt: '2025-09-30T00:00:00.000Z',
    status: 'disbursed',
    sourceLabel: 'Nike · campus content settled',
  }),
  makeEntry({
    id: 'rs-012',
    dealId: 'd-syr-212',
    brandId: BRAND_PUMA,
    athleteId: 'a-10', // Donnie Freeman
    grossCents: 38_000_00,
    athletePayoutBp: 8000,
    recordedAt: '2026-03-12T00:00:00.000Z',
    status: 'recorded',
    sourceLabel: 'Nike · rookie ambassador packet recorded',
  }),
  makeEntry({
    id: 'rs-013',
    dealId: 'd-syr-213',
    brandId: BRAND_GATORADE,
    athleteId: 'a-1',
    grossCents: 95_000_00,
    athletePayoutBp: 8300,
    recordedAt: '2026-02-04T00:00:00.000Z',
    status: 'disbursed',
    sourceLabel: 'Gatorade · post-season appearance batch settled',
  }),
  makeEntry({
    id: 'rs-014',
    dealId: 'd-syr-214',
    brandId: BRAND_DICKS,
    athleteId: 'a-13', // Eddie Lampkin Jr.
    grossCents: 18_500_00,
    athletePayoutBp: 8200,
    recordedAt: '2026-01-22T00:00:00.000Z',
    status: 'disbursed',
    sourceLabel: 'Dick\'s · upperclassman activation Q4',
  }),
  makeEntry({
    id: 'rs-015',
    dealId: 'd-syr-215',
    brandId: BRAND_BEATS,
    athleteId: 'a-1',
    grossCents: 210_000_00,
    athletePayoutBp: 8200,
    recordedAt: '2026-05-04T00:00:00.000Z',
    status: 'recorded',
    sourceLabel: 'Beats · add-on packet recorded (flagged for review)',
    note: 'Linked to dr-008 — flagged for category overlap.',
  }),
  makeEntry({
    id: 'rs-016',
    dealId: 'd-syr-216',
    brandId: BRAND_HOFFMAN_AUTO,
    athleteId: 'a-1',
    grossCents: 24_500_00,
    athletePayoutBp: 8000,
    recordedAt: '2026-05-06T00:00:00.000Z',
    status: 'disbursed',
    sourceLabel: 'Hoffman Auto · amended local activation settled',
  }),
  makeEntry({
    id: 'rs-017',
    dealId: 'd-syr-217',
    brandId: BRAND_PUMA,
    athleteId: 'a-10',
    grossCents: 95_000_00,
    athletePayoutBp: 8000,
    recordedAt: '2026-05-08T00:00:00.000Z',
    status: 'projected',
    sourceLabel: 'Nike · d-15 rookie deal projected',
    note: 'd-15 awaiting counter-sign; gross projected on standard terms.',
  }),
  makeEntry({
    id: 'rs-018',
    dealId: 'd-syr-218',
    brandId: BRAND_GATORADE,
    athleteId: 'a-13',
    grossCents: 22_000_00,
    athletePayoutBp: 8200,
    recordedAt: '2025-11-09T00:00:00.000Z',
    status: 'disbursed',
    sourceLabel: 'Gatorade · upperclassman appearance batch settled',
  }),
  makeEntry({
    id: 'rs-019',
    dealId: 'd-syr-219',
    brandId: BRAND_PUMA,
    athleteId: 'a-4',
    grossCents: 42_500_00,
    athletePayoutBp: 8200,
    recordedAt: '2026-02-25T00:00:00.000Z',
    status: 'disbursed',
    sourceLabel: 'Nike · campus ambassador Q2 batch',
  }),
  makeEntry({
    id: 'rs-020',
    dealId: 'd-syr-220',
    brandId: BRAND_BEATS,
    athleteId: 'a-13',
    grossCents: 14_000_00,
    athletePayoutBp: 8000,
    recordedAt: '2026-03-08T00:00:00.000Z',
    status: 'disputed',
    sourceLabel: 'Beats · contested deliverable count',
    note: 'Brand contesting deliverable count on Q1 packet.',
  }),
  makeEntry({
    id: 'rs-021',
    dealId: 'd-syr-221',
    brandId: BRAND_PUMA,
    athleteId: 'a-1',
    grossCents: 38_000_00,
    athletePayoutBp: 8500,
    recordedAt: '2026-04-18T00:00:00.000Z',
    status: 'disbursed',
    sourceLabel: 'Nike · spring royalty roll-up',
  }),
  makeEntry({
    id: 'rs-022',
    dealId: 'd-syr-222',
    brandId: BRAND_GATORADE,
    athleteId: 'a-10',
    grossCents: 16_500_00,
    athletePayoutBp: 8000,
    recordedAt: '2026-04-30T00:00:00.000Z',
    status: 'recorded',
    sourceLabel: 'Gatorade · rookie appearance batch recorded',
  }),
  makeEntry({
    id: 'rs-023',
    dealId: 'd-syr-223',
    brandId: BRAND_DICKS,
    athleteId: 'a-4',
    grossCents: 12_500_00,
    athletePayoutBp: 8200,
    recordedAt: '2026-05-02T00:00:00.000Z',
    status: 'projected',
    sourceLabel: 'Dick\'s · spring refresh projected',
  }),
  makeEntry({
    id: 'rs-024',
    dealId: 'd-syr-224',
    brandId: BRAND_PUMA,
    athleteId: 'a-13',
    grossCents: 28_500_00,
    athletePayoutBp: 8200,
    recordedAt: '2026-05-04T00:00:00.000Z',
    status: 'recorded',
    sourceLabel: 'Nike · upperclassman ambassador recorded',
  }),
  makeEntry({
    id: 'rs-025',
    dealId: 'd-syr-225',
    brandId: BRAND_HOFFMAN_AUTO,
    athleteId: 'a-4',
    grossCents: 9_500_00,
    athletePayoutBp: 8000,
    recordedAt: '2026-05-08T00:00:00.000Z',
    status: 'recorded',
    sourceLabel: 'Hoffman Auto · local appearance recorded',
  }),
];

function rollTotals(entries: RevShareLedgerEntry[]): RevShareLedgerTotals {
  return entries.reduce<RevShareLedgerTotals>(
    (totals, entry) => ({
      grossCents: {
        cents: totals.grossCents.cents + entry.grossDealCents.cents,
        currency: 'USD',
      },
      platformFeeCents: {
        cents: totals.platformFeeCents.cents + entry.platformFeeCents.cents,
        currency: 'USD',
      },
      schoolDisbursementCents: {
        cents:
          totals.schoolDisbursementCents.cents + entry.schoolDisbursementCents.cents,
        currency: 'USD',
      },
      athletePayoutCents: {
        cents: totals.athletePayoutCents.cents + entry.athletePayoutCents.cents,
        currency: 'USD',
      },
    }),
    {
      grossCents: { cents: 0, currency: 'USD' },
      platformFeeCents: { cents: 0, currency: 'USD' },
      schoolDisbursementCents: { cents: 0, currency: 'USD' },
      athletePayoutCents: { cents: 0, currency: 'USD' },
    },
  );
}

const SYRACUSE_LEDGER: RevShareLedger = {
  schoolId: SCHOOL_ID,
  period: {
    id: PERIOD_ID,
    label: 'FY 2025-26 H1',
    startDate: '2025-07-01',
    endDate: '2026-01-01',
    fiscalYear: 'FY 2025-26',
  },
  feeStructure: SYRACUSE_FEE_STRUCTURE,
  entries: ENTRIES,
  totals: rollTotals(ENTRIES),
  capContext: {
    fiscalYear: 'FY 2025-26',
    annualCap: { cents: 20_500_000_00, currency: 'USD' },
    capUsed: { cents: 15_780_000_00, currency: 'USD' },
    capRemaining: { cents: 4_720_000_00, currency: 'USD' },
    caveat:
      'Reference display only. The school is source-of-truth for cap usage; Proslync does not reconcile House-v.-NCAA disbursements.',
  },
  updatedAt: NOW_ISO,
};

// ── Duke ledger — alongside Syracuse for cross-school comparison ─
const DUKE_PERIOD_ID = 'period:duke-fy2026-h1';
const DUKE_SCHOOL_ID = 'school:duke';
const BRAND_BWW = 'brand:bww-marketing';

const DUKE_FEE_STRUCTURE: PlatformFeeStructure = {
  tier: 'tiered',
  percentageBp: 525,
  brackets: [
    { thresholdCents: 0, rateBp: 700 },
    { thresholdCents: 250_000_00, rateBp: 525 },
    { thresholdCents: 1_000_000_00, rateBp: 425 },
  ],
  negotiatedRateNote: 'Tiered 4.25-7% per Duke Athletics master agreement v2.0.',
};

function dukeTieredRateBp(grossCents: number): number {
  const brackets = DUKE_FEE_STRUCTURE.brackets ?? [];
  let applicable = brackets[0]?.rateBp ?? 525;
  for (const bracket of brackets) {
    if (grossCents >= bracket.thresholdCents) {
      applicable = bracket.rateBp;
    }
  }
  return applicable;
}

function makeDukeEntry(args: {
  id: string;
  dealId: string;
  brandId: string;
  athleteId: string;
  grossCents: number;
  athletePayoutBp: number;
  recordedAt: string;
  status: RevShareLedgerEntry['status'];
  sourceLabel: string;
  note?: string;
}): RevShareLedgerEntry {
  const platformRateBp = dukeTieredRateBp(args.grossCents);
  const platformFeeCents = Math.round((args.grossCents * platformRateBp) / 10_000);
  const athletePayoutCents = Math.round(
    (args.grossCents * args.athletePayoutBp) / 10_000,
  );
  const schoolDisbursementCents =
    args.grossCents - platformFeeCents - athletePayoutCents;
  return {
    id: args.id,
    periodId: DUKE_PERIOD_ID,
    dealId: args.dealId,
    brandId: args.brandId,
    athleteId: args.athleteId,
    grossDealCents: { cents: args.grossCents, currency: 'USD' },
    platformFeeCents: { cents: platformFeeCents, currency: 'USD' },
    schoolDisbursementCents: { cents: schoolDisbursementCents, currency: 'USD' },
    athletePayoutCents: { cents: athletePayoutCents, currency: 'USD' },
    recordedAt: args.recordedAt,
    status: args.status,
    source: syntheticSource(`src-${args.id}`, args.sourceLabel, 0, 'Hand-authored Duke ledger row.'),
    note: args.note,
  };
}

const DUKE_ENTRIES: RevShareLedgerEntry[] = [
  makeDukeEntry({ id: 'rd-001', dealId: 'd-6', brandId: BRAND_PUMA, athleteId: 'a-3', grossCents: 520_000_00, athletePayoutBp: 8500, recordedAt: '2025-08-22T00:00:00.000Z', status: 'disbursed', sourceLabel: 'Nike · Cooper Flagg base disbursement Q1' }),
  makeDukeEntry({ id: 'rd-002', dealId: 'd-6', brandId: BRAND_PUMA, athleteId: 'a-3', grossCents: 90_000_00, athletePayoutBp: 8300, recordedAt: '2025-11-15T00:00:00.000Z', status: 'disbursed', sourceLabel: 'Nike · launch capsule Q2 milestone' }),
  makeDukeEntry({ id: 'rd-003', dealId: 'd-6', brandId: BRAND_PUMA, athleteId: 'a-3', grossCents: 65_000_00, athletePayoutBp: 8500, recordedAt: '2025-12-20T00:00:00.000Z', status: 'disbursed', sourceLabel: 'Nike · Final Four bonus pool' }),
  makeDukeEntry({ id: 'rd-004', dealId: 'd-7', brandId: BRAND_BWW, athleteId: 'a-3', grossCents: 95_000_00, athletePayoutBp: 8100, recordedAt: '2026-04-22T00:00:00.000Z', status: 'disbursed', sourceLabel: 'BWW · ambassador signature disbursement' }),
  makeDukeEntry({ id: 'rd-005', dealId: 'd-10', brandId: BRAND_PUMA, athleteId: 'a-9', grossCents: 310_000_00, athletePayoutBp: 8300, recordedAt: '2026-03-22T00:00:00.000Z', status: 'disbursed', sourceLabel: 'Nike · Knueppel signature Q1' }),
  makeDukeEntry({ id: 'rd-006', dealId: 'd-10', brandId: BRAND_PUMA, athleteId: 'a-9', grossCents: 18_500_00, athletePayoutBp: 8300, recordedAt: '2026-04-08T00:00:00.000Z', status: 'disbursed', sourceLabel: 'Nike · ACC tournament bonus' }),
  makeDukeEntry({ id: 'rd-007', dealId: 'd-duke-201', brandId: BRAND_GATORADE, athleteId: 'a-3', grossCents: 78_000_00, athletePayoutBp: 8300, recordedAt: '2025-10-04T00:00:00.000Z', status: 'disbursed', sourceLabel: 'Gatorade · in-arena appearance batch settled' }),
  makeDukeEntry({ id: 'rd-008', dealId: 'd-duke-202', brandId: BRAND_DICKS, athleteId: 'a-9', grossCents: 24_000_00, athletePayoutBp: 8200, recordedAt: '2026-02-14T00:00:00.000Z', status: 'disbursed', sourceLabel: 'Dick\'s · campus retail activation Duke' }),
  makeDukeEntry({ id: 'rd-009', dealId: 'd-duke-203', brandId: BRAND_BEATS, athleteId: 'a-3', grossCents: 48_000_00, athletePayoutBp: 8200, recordedAt: '2025-11-30T00:00:00.000Z', status: 'disbursed', sourceLabel: 'Beats · launch capsule content packet' }),
  makeDukeEntry({ id: 'rd-010', dealId: 'd-duke-204', brandId: BRAND_PUMA, athleteId: 'a-9', grossCents: 35_000_00, athletePayoutBp: 8300, recordedAt: '2026-04-30T00:00:00.000Z', status: 'recorded', sourceLabel: 'Nike · spring royalty roll-up' }),
  makeDukeEntry({ id: 'rd-011', dealId: 'd-duke-205', brandId: BRAND_GATORADE, athleteId: 'a-9', grossCents: 16_500_00, athletePayoutBp: 8000, recordedAt: '2026-05-02T00:00:00.000Z', status: 'recorded', sourceLabel: 'Gatorade · spring appearance recorded' }),
  makeDukeEntry({ id: 'rd-012', dealId: 'd-duke-206', brandId: BRAND_PUMA, athleteId: 'a-20', grossCents: 18_000_00, athletePayoutBp: 8000, recordedAt: '2026-04-18T00:00:00.000Z', status: 'recorded', sourceLabel: 'Nike · women\'s soccer ambassador packet' }),
  makeDukeEntry({ id: 'rd-013', dealId: 'd-duke-207', brandId: BRAND_DICKS, athleteId: 'a-3', grossCents: 42_000_00, athletePayoutBp: 8400, recordedAt: '2026-01-22T00:00:00.000Z', status: 'disbursed', sourceLabel: 'Dick\'s · January refresh Duke batch settled' }),
  makeDukeEntry({ id: 'rd-014', dealId: 'd-duke-208', brandId: BRAND_BEATS, athleteId: 'a-9', grossCents: 24_000_00, athletePayoutBp: 8000, recordedAt: '2026-02-28T00:00:00.000Z', status: 'disbursed', sourceLabel: 'Beats · sneaker-cat. boost settlement' }),
  makeDukeEntry({ id: 'rd-015', dealId: 'd-duke-209', brandId: BRAND_PUMA, athleteId: 'a-3', grossCents: 105_000_00, athletePayoutBp: 8500, recordedAt: '2026-05-04T00:00:00.000Z', status: 'projected', sourceLabel: 'Nike · summer creator-camp projected (Duke side)' }),
  makeDukeEntry({ id: 'rd-016', dealId: 'd-duke-210', brandId: BRAND_GATORADE, athleteId: 'a-20', grossCents: 8_500_00, athletePayoutBp: 8000, recordedAt: '2026-04-25T00:00:00.000Z', status: 'recorded', sourceLabel: 'Gatorade · women\'s soccer appearance recorded' }),
  makeDukeEntry({ id: 'rd-017', dealId: 'd-duke-211', brandId: BRAND_PUMA, athleteId: 'a-9', grossCents: 48_000_00, athletePayoutBp: 8200, recordedAt: '2026-05-05T00:00:00.000Z', status: 'projected', sourceLabel: 'Nike · spring capsule projected' }),
  makeDukeEntry({ id: 'rd-018', dealId: 'd-duke-212', brandId: BRAND_HOFFMAN_AUTO, athleteId: 'a-3', grossCents: 22_500_00, athletePayoutBp: 8000, recordedAt: '2026-05-08T00:00:00.000Z', status: 'disputed', sourceLabel: 'Hoffman Auto · contested usage-rights overage', note: 'Brand contesting deliverable count on Q1 packet.' }),
];

const DUKE_LEDGER: RevShareLedger = {
  schoolId: DUKE_SCHOOL_ID,
  period: {
    id: DUKE_PERIOD_ID,
    label: 'FY 2025-26 H1',
    startDate: '2025-07-01',
    endDate: '2026-01-01',
    fiscalYear: 'FY 2025-26',
  },
  feeStructure: DUKE_FEE_STRUCTURE,
  entries: DUKE_ENTRIES,
  totals: rollTotals(DUKE_ENTRIES),
  capContext: {
    fiscalYear: 'FY 2025-26',
    annualCap: { cents: 20_500_000_00, currency: 'USD' },
    capUsed: { cents: 17_240_000_00, currency: 'USD' },
    capRemaining: { cents: 3_260_000_00, currency: 'USD' },
    caveat:
      'Reference display only. The school is source-of-truth for cap usage; Proslync does not reconcile House-v.-NCAA disbursements.',
  },
  updatedAt: NOW_ISO,
};

export const MOCK_REV_SHARE_LEDGERS: Record<string, RevShareLedger> = {
  [SCHOOL_ID]: SYRACUSE_LEDGER,
  [DUKE_SCHOOL_ID]: DUKE_LEDGER,
};

export function getMockRevShareLedger(
  schoolId: string,
  _periodId?: string,
): RevShareLedger | null {
  return MOCK_REV_SHARE_LEDGERS[schoolId] ?? null;
}
