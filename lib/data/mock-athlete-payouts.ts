// ── MOCK ATHLETE PAYOUT FIXTURE ──────────────────────────
// W31 (PLAN §5 P1) — hand-authored payout breakdown for athlete `a-1`
// (Kiyan Anthony, Syracuse) for FY 2025-26 H1. Every row tagged
// `synthetic` per `mock-rev-share.ts` / `mock-deal-comps.ts` precedent.
//
// DEMO RECONCILIATION: Kiyan's items mirror the canonical
// DEAL_TRUTH_FIXTURE deals (Gatorade paid $3,200 + JMA/Nike/Legacy in
// flight) so the payout breakdown's `paidYtd` ($3,200) and gross booked
// ($11,900) match Home "paid this season", Wallet YTD, and the Deals
// "YTD DEAL VALUE" exactly. The aggregate `taxSetAside` line is a 24%
// SUGGESTION across all booked income (clearly labeled "estimate, not tax
// advice") — distinct from the $768 actual set-aside Home shows on the one
// settled Gatorade deal; both are 24% and neither contradicts the other.
//
// Suggested tax rate: 2400 bp (24%). The set-aside is a SUGGESTION, not
// enforced withholding. UI surfaces the "estimate, not tax advice"
// caveat next to the total.
//
// Roll-up math (computed at build time, not eyeballed):
//   gross         = sum(items where category !== 'tax-withhold-reserve')
//   taxSetAside   = round(gross * suggestedTaxRateBp / 10_000)
//   net           = gross - taxSetAside
//   pendingPayout = sum(items where status in ['pending', 'projected'])
//   paidYtd       = sum(items where status === 'paid')

import type { ComparableDealSourceRef } from '@/lib/types/comparable-deal.types';
import type {
  AthletePayoutItem,
  AthletePayoutSummary,
  AthletePayoutTotals,
} from '@/lib/types/athlete-payout.types';

const NOW_ISO = '2026-05-10T00:00:00.000Z';
const PERIOD_ID = 'period:a1-fy2026-h1';
const PERIOD_LABEL = 'FY 2025-26 H1';
const ATHLETE_ID = 'a-1';
const SUGGESTED_TAX_RATE_BP = 2400;

// Per-athlete period IDs for the expanded roster.
function periodIdFor(athleteId: string): string {
  return `period:${athleteId}-fy2026-h1`;
}

const CAP_CONTEXT_NOTE =
  'Athlete payout is your money. Set aside taxes. Verify with your accountant.';

function syntheticSource(
  id: string,
  label: string,
  freshnessDays = 0,
): ComparableDealSourceRef {
  return {
    id,
    label,
    kind: 'synthetic',
    retrievedAt: NOW_ISO,
    freshnessDays,
    caveat: 'Hand-authored payout row for demo; replace with disbursement export.',
  };
}

function makeItem(args: {
  id: string;
  dealId?: string;
  brandId?: string;
  brandLabel: string;
  category: AthletePayoutItem['category'];
  amountCents: number;
  status: AthletePayoutItem['status'];
  date: string;
  note?: string;
  sourceLabel: string;
  freshnessDays?: number;
}): AthletePayoutItem {
  return {
    id: args.id,
    periodId: PERIOD_ID,
    dealId: args.dealId,
    brandId: args.brandId,
    brandLabel: args.brandLabel,
    category: args.category,
    amountCents: { cents: args.amountCents, currency: 'USD' },
    status: args.status,
    date: args.date,
    note: args.note,
    source: syntheticSource(`src-${args.id}`, args.sourceLabel, args.freshnessDays ?? 0),
  };
}

// ── Items mirror the canonical DEAL_TRUTH_FIXTURE deals so the payout
// breakdown tells the SAME money story as Home / Deals / Wallet: one paid
// deal (Gatorade $3,200) and three in-flight (JMA $4,500 expected, Nike
// $2,400 in CSC review, Legacy $1,800 cleared-awaiting-settlement).
//
//   gross (booked)  = 3,200 + 4,500 + 2,400 + 1,800 = $11,900   (== Deals YTD)
//   paidYtd         = 3,200                                       (== Home + Wallet YTD)
//   pendingPayout   = 4,500 + 2,400 + 1,800        = $8,700       (everything not yet paid)
//
const ITEMS: AthletePayoutItem[] = [
  // ── Gatorade — Performance Partnership, PAID (24% tax set aside) ──
  makeItem({
    id: 'ap-001',
    dealId: 'dt-gatorade-1',
    brandId: 'brand:gatorade',
    brandLabel: 'Gatorade',
    category: 'guaranteed',
    amountCents: 3_200_00,
    status: 'paid',
    date: '2026-05-02T00:00:00.000Z',
    note: 'Performance Partnership settled; $768 set aside for taxes (24%).',
    sourceLabel: 'Gatorade · Performance Partnership disbursement',
  }),
  // ── JMA Wireless — Brand Ambassador Q3, executed, payment expected ──
  makeItem({
    id: 'ap-002',
    dealId: 'dt-jma-1',
    brandId: 'brand:jma-wireless',
    brandLabel: 'JMA Wireless',
    category: 'guaranteed',
    amountCents: 4_500_00,
    status: 'projected',
    date: '2026-06-15T00:00:00.000Z',
    note: 'Brand Ambassador · Q3 — executed, awaiting disclosure + disbursement.',
    sourceLabel: 'JMA Wireless · Q3 ambassador base projected',
  }),
  // ── Nike — Campus Activation, payment in CSC review ──
  makeItem({
    id: 'ap-003',
    dealId: 'dt-nike-1',
    brandId: 'brand:nike',
    brandLabel: 'Nike',
    category: 'guaranteed',
    amountCents: 2_400_00,
    status: 'pending',
    date: '2026-05-20T00:00:00.000Z',
    note: 'Campus Activation · Summer — in CSC review, release on clearance.',
    sourceLabel: 'Nike · Campus Activation pending CSC clearance',
  }),
  // ── Legacy Athletics — Apparel Deal, cleared, awaiting settlement ──
  makeItem({
    id: 'ap-004',
    dealId: 'dt-legacy-1',
    brandId: 'brand:legacy-athletics',
    brandLabel: 'Legacy Athletics',
    category: 'guaranteed',
    amountCents: 1_800_00,
    status: 'pending',
    date: '2026-05-25T00:00:00.000Z',
    note: 'Apparel Deal · FY26 — cleared, in disbursement queue.',
    sourceLabel: 'Legacy Athletics · FY26 apparel cleared, queued',
  }),
];

function rollTotals(
  items: AthletePayoutItem[],
  taxRateBp: number,
): AthletePayoutTotals {
  const grossCents = items.reduce(
    (acc, item) =>
      item.category === 'tax-withhold-reserve' ? acc : acc + item.amountCents.cents,
    0,
  );
  const taxSetAsideCents = Math.round((grossCents * taxRateBp) / 10_000);
  const netCents = grossCents - taxSetAsideCents;
  const pendingCents = items.reduce(
    (acc, item) =>
      item.status === 'pending' || item.status === 'projected'
        ? acc + item.amountCents.cents
        : acc,
    0,
  );
  const paidYtdCents = items.reduce(
    (acc, item) => (item.status === 'paid' ? acc + item.amountCents.cents : acc),
    0,
  );

  return {
    gross: { cents: grossCents, currency: 'USD' },
    net: { cents: netCents, currency: 'USD' },
    taxSetAside: { cents: taxSetAsideCents, currency: 'USD' },
    pendingPayout: { cents: pendingCents, currency: 'USD' },
    paidYtd: { cents: paidYtdCents, currency: 'USD' },
  };
}

const KIYAN_PAYOUT_SUMMARY: AthletePayoutSummary = {
  athleteId: ATHLETE_ID,
  period: { id: PERIOD_ID, label: PERIOD_LABEL },
  totals: rollTotals(ITEMS, SUGGESTED_TAX_RATE_BP),
  suggestedTaxRateBp: SUGGESTED_TAX_RATE_BP,
  items: ITEMS,
  updatedAt: NOW_ISO,
  capContextNote: CAP_CONTEXT_NOTE,
};

// ── Compact helper for the expanded roster ─────────────────
function makeItemFor(
  athleteId: string,
  args: {
    id: string;
    dealId?: string;
    brandLabel: string;
    category: AthletePayoutItem['category'];
    amountCents: number;
    status: AthletePayoutItem['status'];
    date: string;
    note?: string;
    sourceLabel: string;
    freshnessDays?: number;
  },
): AthletePayoutItem {
  return {
    id: args.id,
    periodId: periodIdFor(athleteId),
    dealId: args.dealId,
    brandLabel: args.brandLabel,
    category: args.category,
    amountCents: { cents: args.amountCents, currency: 'USD' },
    status: args.status,
    date: args.date,
    note: args.note,
    source: syntheticSource(`src-${args.id}`, args.sourceLabel, args.freshnessDays ?? 0),
  };
}

function buildSummary(
  athleteId: string,
  items: AthletePayoutItem[],
): AthletePayoutSummary {
  return {
    athleteId,
    period: { id: periodIdFor(athleteId), label: PERIOD_LABEL },
    totals: rollTotals(items, SUGGESTED_TAX_RATE_BP),
    suggestedTaxRateBp: SUGGESTED_TAX_RATE_BP,
    items,
    updatedAt: NOW_ISO,
    capContextNote: CAP_CONTEXT_NOTE,
  };
}

// ── Cooper Flagg (a-3) ────────────────────────────────────
const FLAGG_ITEMS: AthletePayoutItem[] = [
  makeItemFor('a-3', { id: 'ap-a3-1', dealId: 'd-6', brandLabel: 'Nike', category: 'guaranteed', amountCents: 200_000_00, status: 'paid', date: '2025-08-22T00:00:00.000Z', sourceLabel: 'Nike · d-6 base disbursement Q1' }),
  makeItemFor('a-3', { id: 'ap-a3-2', dealId: 'd-6', brandLabel: 'Nike', category: 'performance', amountCents: 35_000_00, status: 'paid', date: '2025-12-15T00:00:00.000Z', sourceLabel: 'Nike · NCAA Bracket appearance bonus', note: 'Triggered by Final Four bid.' }),
  makeItemFor('a-3', { id: 'ap-a3-3', dealId: 'd-7', brandLabel: 'Buffalo Wild Wings', category: 'guaranteed', amountCents: 48_000_00, status: 'paid', date: '2026-04-22T00:00:00.000Z', sourceLabel: 'BWW · ambassador signature disbursement' }),
  makeItemFor('a-3', { id: 'ap-a3-4', dealId: 'd-6', brandLabel: 'Nike', category: 'royalty', amountCents: 14_500_00, status: 'pending', date: '2026-05-30T00:00:00.000Z', sourceLabel: 'Nike · co-branded apparel royalty Q1', note: 'Awaiting Q1 royalty close.' }),
  makeItemFor('a-3', { id: 'ap-a3-5', dealId: 'd-7', brandLabel: 'Buffalo Wild Wings', category: 'appearance', amountCents: 47_000_00, status: 'projected', date: '2026-08-15T00:00:00.000Z', sourceLabel: 'BWW · campus event final report payout' }),
];

// ── AJ Dybantsa (a-8) ────────────────────────────────────
const DYBANTSA_ITEMS: AthletePayoutItem[] = [
  makeItemFor('a-8', { id: 'ap-a8-1', dealId: 'd-9', brandLabel: 'Nike', category: 'guaranteed', amountCents: 168_000_00, status: 'paid', date: '2026-04-30T00:00:00.000Z', sourceLabel: 'Nike · d-9 signature disbursement' }),
  makeItemFor('a-8', { id: 'ap-a8-2', dealId: 'd-9', brandLabel: 'Nike', category: 'guaranteed', amountCents: 240_000_00, status: 'projected', date: '2026-09-15T00:00:00.000Z', sourceLabel: 'Nike · content-proof milestone Q1', note: 'Triggers on pre-season launch.' }),
  makeItemFor('a-8', { id: 'ap-a8-3', dealId: 'd-9', brandLabel: 'Nike', category: 'usage-rights', amountCents: 22_000_00, status: 'pending', date: '2026-05-25T00:00:00.000Z', sourceLabel: 'Nike · BYU campus content usage Q1' }),
];

// ── Kon Knueppel (a-9) ───────────────────────────────────
const KNUEPPEL_ITEMS: AthletePayoutItem[] = [
  makeItemFor('a-9', { id: 'ap-a9-1', dealId: 'd-10', brandLabel: 'Nike', category: 'guaranteed', amountCents: 124_000_00, status: 'paid', date: '2026-03-22T00:00:00.000Z', sourceLabel: 'Nike · d-10 signature disbursement' }),
  makeItemFor('a-9', { id: 'ap-a9-2', dealId: 'd-10', brandLabel: 'Nike', category: 'performance', amountCents: 18_000_00, status: 'pending', date: '2026-04-18T00:00:00.000Z', sourceLabel: 'Nike · ACC tournament bonus pool' }),
  makeItemFor('a-9', { id: 'ap-a9-3', dealId: 'd-10', brandLabel: 'Nike', category: 'usage-rights', amountCents: 12_500_00, status: 'paid', date: '2026-04-02T00:00:00.000Z', sourceLabel: 'Nike · sneaker-cat. boost settlement' }),
];

// ── Donnie Freeman (a-10) ────────────────────────────────
const FREEMAN_ITEMS: AthletePayoutItem[] = [
  makeItemFor('a-10', { id: 'ap-a10-1', dealId: 'd-15', brandLabel: 'Nike', category: 'guaranteed', amountCents: 47_500_00, status: 'projected', date: '2026-06-01T00:00:00.000Z', sourceLabel: 'Nike · d-15 signature on counter-sign' }),
];

// ── RJ Davis (a-12) ──────────────────────────────────────
const DAVIS_ITEMS: AthletePayoutItem[] = [
  makeItemFor('a-12', { id: 'ap-a12-1', dealId: 'd-14', brandLabel: 'Nike', category: 'guaranteed', amountCents: 72_000_00, status: 'paid', date: '2026-03-10T00:00:00.000Z', sourceLabel: 'Nike · d-14 signature disbursement' }),
  makeItemFor('a-12', { id: 'ap-a12-2', dealId: 'd-14', brandLabel: 'Nike', category: 'guaranteed', amountCents: 60_000_00, status: 'paid', date: '2026-04-15T00:00:00.000Z', sourceLabel: 'Nike · d-14 content-proof Q1' }),
  makeItemFor('a-12', { id: 'ap-a12-3', dealId: 'd-14', brandLabel: 'Nike', category: 'performance', amountCents: 12_000_00, status: 'pending', date: '2026-04-30T00:00:00.000Z', sourceLabel: 'Nike · ACC tournament bonus' }),
];

// ── JuJu Watkins (a-15) ──────────────────────────────────
const JUJU_ITEMS: AthletePayoutItem[] = [
  makeItemFor('a-15', { id: 'ap-a15-1', dealId: 'd-11', brandLabel: 'Nike', category: 'guaranteed', amountCents: 250_000_00, status: 'paid', date: '2026-03-01T00:00:00.000Z', sourceLabel: 'Nike · d-11 flagship signature disbursement' }),
  makeItemFor('a-15', { id: 'ap-a15-2', dealId: 'd-11', brandLabel: 'Nike', category: 'guaranteed', amountCents: 150_000_00, status: 'paid', date: '2026-04-18T00:00:00.000Z', sourceLabel: 'Nike · d-11 launch milestone Q1' }),
  makeItemFor('a-15', { id: 'ap-a15-3', dealId: 'd-11', brandLabel: 'Nike', category: 'performance', amountCents: 45_000_00, status: 'paid', date: '2026-04-30T00:00:00.000Z', sourceLabel: 'Nike · Final Four MVP bonus' }),
  makeItemFor('a-15', { id: 'ap-a15-4', dealId: 'd-11', brandLabel: 'Nike', category: 'royalty', amountCents: 28_500_00, status: 'pending', date: '2026-06-01T00:00:00.000Z', sourceLabel: 'Nike · JW signature line royalty Q1' }),
  makeItemFor('a-15', { id: 'ap-a15-5', dealId: 'd-11', brandLabel: 'Nike', category: 'usage-rights', amountCents: 36_000_00, status: 'paid', date: '2026-04-08T00:00:00.000Z', sourceLabel: 'Nike · global usage settlement Q1' }),
];

// ── Hannah Hidalgo (a-16) ────────────────────────────────
const HIDALGO_ITEMS: AthletePayoutItem[] = [
  makeItemFor('a-16', { id: 'ap-a16-1', dealId: 'd-12', brandLabel: 'Nike', category: 'guaranteed', amountCents: 126_000_00, status: 'paid', date: '2026-04-26T00:00:00.000Z', sourceLabel: 'Nike · d-12 signature disbursement' }),
  makeItemFor('a-16', { id: 'ap-a16-2', dealId: 'd-12', brandLabel: 'Nike', category: 'guaranteed', amountCents: 210_000_00, status: 'projected', date: '2026-09-22T00:00:00.000Z', sourceLabel: 'Nike · d-12 content-proof Q1' }),
  makeItemFor('a-16', { id: 'ap-a16-3', dealId: 'd-12', brandLabel: 'Nike', category: 'performance', amountCents: 18_000_00, status: 'paid', date: '2026-04-30T00:00:00.000Z', sourceLabel: 'Nike · ACC tournament W bonus' }),
];

// ── Ryan Williams (a-18) ─────────────────────────────────
const WILLIAMS_ITEMS: AthletePayoutItem[] = [
  makeItemFor('a-18', { id: 'ap-a18-1', dealId: 'd-13', brandLabel: 'Nike', category: 'guaranteed', amountCents: 156_000_00, status: 'pending', date: '2026-05-12T00:00:00.000Z', sourceLabel: 'Nike · d-13 signature disbursement (queued)' }),
  makeItemFor('a-18', { id: 'ap-a18-2', dealId: 'd-13', brandLabel: 'Nike', category: 'guaranteed', amountCents: 156_000_00, status: 'projected', date: '2026-10-01T00:00:00.000Z', sourceLabel: 'Nike · d-13 content-proof pre-season' }),
];

// ── Jordan Miles (a-2) ───────────────────────────────────
const MILES_ITEMS: AthletePayoutItem[] = [
  makeItemFor('a-2', { id: 'ap-a2-1', dealId: 'd-5', brandLabel: 'Nike', category: 'guaranteed', amountCents: 60_000_00, status: 'paid', date: '2026-02-06T00:00:00.000Z', sourceLabel: 'Nike · d-5 signature disbursement' }),
  makeItemFor('a-2', { id: 'ap-a2-2', dealId: 'd-5', brandLabel: 'Nike', category: 'guaranteed', amountCents: 60_000_00, status: 'paid', date: '2026-04-22T00:00:00.000Z', sourceLabel: 'Nike · d-5 content-proof Q1' }),
  makeItemFor('a-2', { id: 'ap-a2-3', dealId: 'd-5', brandLabel: 'Nike', category: 'performance', amountCents: 12_000_00, status: 'pending', date: '2026-05-25T00:00:00.000Z', sourceLabel: 'Nike · EYBL appearance bonus pool' }),
];

// ── JJ Starling (a-4) ────────────────────────────────────
const STARLING_ITEMS: AthletePayoutItem[] = [
  makeItemFor('a-4', { id: 'ap-a4-1', brandLabel: 'Nike', category: 'guaranteed', amountCents: 42_500_00, status: 'paid', date: '2026-02-22T00:00:00.000Z', sourceLabel: 'Nike · ambassador slot Q1' }),
  makeItemFor('a-4', { id: 'ap-a4-2', brandLabel: 'Nike', category: 'usage-rights', amountCents: 8_500_00, status: 'paid', date: '2026-04-02T00:00:00.000Z', sourceLabel: 'Nike · campus content settlement' }),
];

export const MOCK_ATHLETE_PAYOUT_SUMMARIES: Record<string, AthletePayoutSummary> = {
  [ATHLETE_ID]: KIYAN_PAYOUT_SUMMARY,
  'a-2': buildSummary('a-2', MILES_ITEMS),
  'a-3': buildSummary('a-3', FLAGG_ITEMS),
  'a-4': buildSummary('a-4', STARLING_ITEMS),
  'a-8': buildSummary('a-8', DYBANTSA_ITEMS),
  'a-9': buildSummary('a-9', KNUEPPEL_ITEMS),
  'a-10': buildSummary('a-10', FREEMAN_ITEMS),
  'a-12': buildSummary('a-12', DAVIS_ITEMS),
  'a-15': buildSummary('a-15', JUJU_ITEMS),
  'a-16': buildSummary('a-16', HIDALGO_ITEMS),
  'a-18': buildSummary('a-18', WILLIAMS_ITEMS),
};

export function getMockAthletePayoutSummary(
  athleteId: string,
  _periodId?: string,
): AthletePayoutSummary | null {
  return MOCK_ATHLETE_PAYOUT_SUMMARIES[athleteId] ?? null;
}
