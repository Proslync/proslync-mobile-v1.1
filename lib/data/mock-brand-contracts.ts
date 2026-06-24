// ── MOCK BRAND ATHLETE CONTRACTS (Sprint 2.5 · W33) ──────
// Hand-authored fixtures keyed by `<brandId>:<athleteId>` so the Brand
// roster surface can drill into a full per-athlete contract record.
// Tagged `synthetic` per PLAN §5b — never present as a signed fact.
//
// All amounts use integer cents (USD) — matches `MoneyAmount`.

import type {
  BrandContractTerm,
} from '@/lib/types/brand-contract.types';
import type { ComparableDealSourceRef } from '@/lib/types/comparable-deal.types';

/** Default brand id used by the BRAND_ATHLETES roster (Nike Hoops). */
export const DEFAULT_BRAND_ID = 'puma-hoops';

const NOW_ISO = '2026-05-10T00:00:00.000Z';

const SYNTHETIC_SOURCE: ComparableDealSourceRef = {
  id: 'source:synthetic-brand-contract',
  label: 'Proslync contract registry',
  kind: 'synthetic',
  retrievedAt: NOW_ISO,
  freshnessDays: 0,
  caveat:
    'Hand-authored fixture — not a signed contract. Swap with reviewer-approved data before any external sharing.',
};

function syntheticClauseSource(label: string): ComparableDealSourceRef {
  return {
    ...SYNTHETIC_SOURCE,
    id: `source:synthetic-clause:${label.toLowerCase().replace(/\s+/g, '-')}`,
    label,
  };
}

function contractKey(brandId: string, athleteId: string): string {
  return `${brandId}:${athleteId}`;
}

const CONTRACTS: BrandContractTerm[] = [
  // a-1 — Kiyan Anthony · Syracuse — 3-yr · $660K renewed.
  {
    id: 'bc-a1',
    athleteId: 'a-1',
    brandId: DEFAULT_BRAND_ID,
    status: 'live',
    startDate: '2025-08-01',
    endDate: '2028-07-31',
    durationDays: 1095,
    renewable: true,
    exclusivityScope: 'Footwear · NCAA D1 basketball · global',
    rightsGranted: [
      'Paid amplification · 30d',
      'Signature colorway co-creation',
      'Approved B-roll re-use',
      'Camp + clinic appearance license',
    ],
    cap: {
      totalCents: { cents: 66_000_000, currency: 'USD' },
      structure: 'tiered',
    },
    deliverables: [
      {
        id: 'bc-a1-d1',
        title: 'Two disclosed launch reels',
        due: '2025-09-15',
        status: 'done',
        proofType: 'video',
        ownerLabel: 'Athlete + creative producer',
      },
      {
        id: 'bc-a1-d2',
        title: 'ACC season campaign anchor post',
        due: '2026-01-20',
        status: 'done',
        proofType: 'screenshot',
        ownerLabel: 'Athlete + brand social',
      },
      {
        id: 'bc-a1-d3',
        title: 'Colorway reveal short-form package',
        due: '2026-06-15',
        status: 'active',
        proofType: 'video',
        ownerLabel: 'Athlete + creative producer',
      },
      {
        id: 'bc-a1-d4',
        title: 'Year-1 metrics attestation',
        due: '2026-08-15',
        status: 'queued',
        proofType: 'metrics-report',
        ownerLabel: 'Brand analytics + athlete rep',
      },
    ],
    payoutSchedule: [
      {
        id: 'bc-a1-p1',
        amountCents: { cents: 22_000_000, currency: 'USD' },
        due: '2025-08-01',
        trigger: 'signature',
        status: 'paid',
        note: 'Year-1 guaranteed stipend, paid in full at signature.',
      },
      {
        id: 'bc-a1-p2',
        amountCents: { cents: 22_000_000, currency: 'USD' },
        due: '2026-08-01',
        trigger: 'cadence',
        status: 'projected',
        note: 'Year-2 anniversary stipend, contingent on disclosure receipts.',
      },
      {
        id: 'bc-a1-p3',
        amountCents: { cents: 9_000_000, currency: 'USD' },
        due: '2026-07-01',
        trigger: 'milestone',
        status: 'projected',
        note: 'Signature colorway launch milestone.',
      },
      {
        id: 'bc-a1-p4',
        amountCents: { cents: 6_000_000, currency: 'USD' },
        due: '2026-08-15',
        trigger: 'completion',
        status: 'projected',
        note: 'Year-1 metrics attestation completion bonus.',
      },
    ],
    clauses: [
      {
        id: 'bc-a1-c1',
        label: 'Exclusivity · Footwear category',
        kind: 'exclusivity',
        summary:
          'Athlete will not endorse, wear in paid content, or post about a competing footwear brand for the contract term.',
        sourceRef: syntheticClauseSource('Exclusivity · Footwear'),
      },
      {
        id: 'bc-a1-c2',
        label: 'Morality · Conduct standard',
        kind: 'morality',
        summary:
          'Material adverse off-field conduct grants the brand a 30-day cure window before suspension or termination.',
        sourceRef: syntheticClauseSource('Morality · Conduct'),
      },
      {
        id: 'bc-a1-c3',
        label: 'Usage rights · 30-day paid window',
        kind: 'usage-rights',
        summary:
          'Brand may amplify approved cutdowns as paid media for 30 days post-publish; longer windows require fresh approval.',
        sourceRef: syntheticClauseSource('Usage rights'),
      },
      {
        id: 'bc-a1-c4',
        label: 'Termination · Eligibility loss',
        kind: 'termination',
        summary:
          'Loss of NCAA eligibility or transfer outside the agreed conference triggers a renegotiation window before termination.',
        sourceRef: syntheticClauseSource('Termination'),
      },
      {
        id: 'bc-a1-c5',
        label: 'Audit · Annual attestation',
        kind: 'audit',
        summary:
          'Brand may audit disclosure receipts and metric reports once per contract year on 14-day notice.',
        sourceRef: syntheticClauseSource('Audit'),
      },
    ],
    trustMeta: {
      lastVerifiedAt: NOW_ISO,
      sourceRef: SYNTHETIC_SOURCE,
    },
  },

  // a-2 — Jordan Miles · Paul VI HS — 2-yr · $140K.
  {
    id: 'bc-a2',
    athleteId: 'a-2',
    brandId: DEFAULT_BRAND_ID,
    status: 'live',
    startDate: '2025-09-01',
    endDate: '2027-08-31',
    durationDays: 730,
    renewable: false,
    exclusivityScope: 'Footwear · HS national circuit · domestic',
    rightsGranted: [
      'Organic repost only',
      'Approved paid boost ≤14 days',
      'Camp guest appearance license',
    ],
    cap: {
      totalCents: { cents: 14_000_000, currency: 'USD' },
      structure: 'flat',
    },
    deliverables: [
      {
        id: 'bc-a2-d1',
        title: 'Signing announcement reel',
        due: '2025-09-15',
        status: 'done',
        proofType: 'video',
        ownerLabel: 'Athlete + brand social',
      },
      {
        id: 'bc-a2-d2',
        title: 'Two season highlight posts',
        due: '2026-03-30',
        status: 'active',
        proofType: 'screenshot',
        ownerLabel: 'Athlete',
      },
      {
        id: 'bc-a2-d3',
        title: 'EYBL training short-form set',
        due: '2026-07-01',
        status: 'queued',
        proofType: 'video',
        ownerLabel: 'Athlete + creative producer',
      },
      {
        id: 'bc-a2-d4',
        title: 'Final term metrics attestation',
        due: '2027-08-15',
        status: 'queued',
        proofType: 'metrics-report',
        ownerLabel: 'Brand analytics',
      },
    ],
    payoutSchedule: [
      {
        id: 'bc-a2-p1',
        amountCents: { cents: 7_000_000, currency: 'USD' },
        due: '2025-09-01',
        trigger: 'signature',
        status: 'paid',
        note: 'Year-1 guaranteed stipend.',
      },
      {
        id: 'bc-a2-p2',
        amountCents: { cents: 5_000_000, currency: 'USD' },
        due: '2026-09-01',
        trigger: 'cadence',
        status: 'projected',
        note: 'Year-2 anniversary stipend.',
      },
      {
        id: 'bc-a2-p3',
        amountCents: { cents: 2_000_000, currency: 'USD' },
        due: '2027-08-15',
        trigger: 'completion',
        status: 'projected',
        note: 'Completion bonus on full deliverable set.',
      },
    ],
    clauses: [
      {
        id: 'bc-a2-c1',
        label: 'Exclusivity · Footwear (HS circuit)',
        kind: 'exclusivity',
        summary:
          'No competing footwear endorsement during the contract term; collegiate apparel partnerships allowed.',
        sourceRef: syntheticClauseSource('Exclusivity · HS'),
      },
      {
        id: 'bc-a2-c2',
        label: 'Morality · Standard clause',
        kind: 'morality',
        summary:
          'Brand may suspend payments for the duration of any unresolved material conduct investigation.',
        sourceRef: syntheticClauseSource('Morality · HS'),
      },
      {
        id: 'bc-a2-c3',
        label: 'Usage rights · Limited paid window',
        kind: 'usage-rights',
        summary:
          'Paid boost capped at 14 days per asset; longer windows require parent / guardian consent for under-18 athletes.',
        sourceRef: syntheticClauseSource('Usage rights · HS'),
      },
      {
        id: 'bc-a2-c4',
        label: 'Tax · 1099 withholding',
        kind: 'tax-withhold',
        summary:
          'Brand issues a 1099-NEC at year end; athlete is responsible for state and federal withholding.',
        sourceRef: syntheticClauseSource('Tax · Withhold'),
      },
    ],
    trustMeta: {
      lastVerifiedAt: NOW_ISO,
      sourceRef: SYNTHETIC_SOURCE,
    },
  },

  // a-3 — Cooper Flagg · Duke — 1-yr · $520K · renewing.
  {
    id: 'bc-a3',
    athleteId: 'a-3',
    brandId: DEFAULT_BRAND_ID,
    status: 'renewing',
    startDate: '2025-10-01',
    endDate: '2026-09-30',
    durationDays: 365,
    renewable: true,
    exclusivityScope: 'Footwear + signature line · NCAA D1 + global media',
    rightsGranted: [
      'Signature line co-development',
      'Paid amplification · 45d',
      'Approved long-form cutdowns',
      'Brand event headline appearance · ≤4/yr',
      'Cross-platform retail co-marketing',
    ],
    cap: {
      totalCents: { cents: 52_000_000, currency: 'USD' },
      structure: 'mixed',
    },
    deliverables: [
      {
        id: 'bc-a3-d1',
        title: 'Finals warmup short-form package',
        due: '2026-04-01',
        status: 'done',
        proofType: 'video',
        ownerLabel: 'Athlete + creative producer',
      },
      {
        id: 'bc-a3-d2',
        title: 'Signature capsule reveal shoot',
        due: '2026-05-25',
        status: 'active',
        proofType: 'video',
        ownerLabel: 'Brand creative + athlete',
      },
      {
        id: 'bc-a3-d3',
        title: 'Capsule launch metrics attestation',
        due: '2026-07-15',
        status: 'queued',
        proofType: 'metrics-report',
        ownerLabel: 'Brand analytics',
      },
      {
        id: 'bc-a3-d4',
        title: 'Renewal-window content commitments',
        due: '2026-09-15',
        status: 'blocked',
        proofType: 'attestation',
        ownerLabel: 'Athlete rep + brand owner',
      },
    ],
    payoutSchedule: [
      {
        id: 'bc-a3-p1',
        amountCents: { cents: 26_000_000, currency: 'USD' },
        due: '2025-10-01',
        trigger: 'signature',
        status: 'paid',
        note: 'Year-1 base guarantee.',
      },
      {
        id: 'bc-a3-p2',
        amountCents: { cents: 14_000_000, currency: 'USD' },
        due: '2026-05-30',
        trigger: 'milestone',
        status: 'held',
        note: 'Held pending capsule reveal proof packet.',
      },
      {
        id: 'bc-a3-p3',
        amountCents: { cents: 8_000_000, currency: 'USD' },
        due: '2026-07-30',
        trigger: 'milestone',
        status: 'projected',
        note: 'Capsule sell-through milestone.',
      },
      {
        id: 'bc-a3-p4',
        amountCents: { cents: 4_000_000, currency: 'USD' },
        due: '2026-09-30',
        trigger: 'completion',
        status: 'projected',
        note: 'Term-end completion bonus.',
      },
    ],
    clauses: [
      {
        id: 'bc-a3-c1',
        label: 'Exclusivity · Footwear + signature',
        kind: 'exclusivity',
        summary:
          'Full footwear exclusivity plus first-refusal on any signature line venture during the term and the renewal window.',
        sourceRef: syntheticClauseSource('Exclusivity · Signature'),
      },
      {
        id: 'bc-a3-c2',
        label: 'Morality · Heightened standard',
        kind: 'morality',
        summary:
          'Brand may withhold milestone payments pending resolution of any material adverse public conduct event.',
        sourceRef: syntheticClauseSource('Morality · Heightened'),
      },
      {
        id: 'bc-a3-c3',
        label: 'Usage rights · 45-day paid window',
        kind: 'usage-rights',
        summary:
          'Paid amplification permitted up to 45 days per asset; cross-licensing to retailers requires written approval.',
        sourceRef: syntheticClauseSource('Usage rights · 45'),
      },
      {
        id: 'bc-a3-c4',
        label: 'Termination · Capsule failure',
        kind: 'termination',
        summary:
          'Material failure to ship capsule deliverables triggers brand right to terminate after a 30-day cure period.',
        sourceRef: syntheticClauseSource('Termination · Capsule'),
      },
      {
        id: 'bc-a3-c5',
        label: 'Force majeure · Season cancellation',
        kind: 'force-majeure',
        summary:
          'Cancellation of the NCAA season suspends — but does not terminate — milestone obligations.',
        sourceRef: syntheticClauseSource('Force majeure'),
      },
    ],
    trustMeta: {
      lastVerifiedAt: NOW_ISO,
      sourceRef: SYNTHETIC_SOURCE,
    },
  },

  // a-4 — JJ Starling · Syracuse — 1-yr · $85K.
  {
    id: 'bc-a4',
    athleteId: 'a-4',
    brandId: DEFAULT_BRAND_ID,
    status: 'live',
    startDate: '2025-11-01',
    endDate: '2026-10-31',
    durationDays: 365,
    renewable: false,
    exclusivityScope: 'Footwear · ACC season · domestic',
    rightsGranted: [
      'Organic repost only',
      'Approved cutdowns ≤14d',
      'One in-season appearance',
    ],
    cap: {
      totalCents: { cents: 8_500_000, currency: 'USD' },
      structure: 'flat',
    },
    deliverables: [
      {
        id: 'bc-a4-d1',
        title: 'Pre-season unboxing reel',
        due: '2025-11-12',
        status: 'done',
        proofType: 'video',
        ownerLabel: 'Athlete',
      },
      {
        id: 'bc-a4-d2',
        title: 'Conference-play campaign post',
        due: '2026-02-15',
        status: 'done',
        proofType: 'screenshot',
        ownerLabel: 'Athlete + brand social',
      },
      {
        id: 'bc-a4-d3',
        title: 'Season-end appearance attestation',
        due: '2026-04-20',
        status: 'active',
        proofType: 'attestation',
        ownerLabel: 'Brand events',
      },
    ],
    payoutSchedule: [
      {
        id: 'bc-a4-p1',
        amountCents: { cents: 4_500_000, currency: 'USD' },
        due: '2025-11-01',
        trigger: 'signature',
        status: 'paid',
        note: 'Signature payment.',
      },
      {
        id: 'bc-a4-p2',
        amountCents: { cents: 3_000_000, currency: 'USD' },
        due: '2026-04-30',
        trigger: 'milestone',
        status: 'projected',
        note: 'Mid-term content milestone.',
      },
      {
        id: 'bc-a4-p3',
        amountCents: { cents: 1_000_000, currency: 'USD' },
        due: '2026-10-31',
        trigger: 'completion',
        status: 'projected',
        note: 'Term completion bonus.',
      },
    ],
    clauses: [
      {
        id: 'bc-a4-c1',
        label: 'Exclusivity · Footwear only',
        kind: 'exclusivity',
        summary:
          'Limited to footwear; apparel and beverage partnerships allowed for the term.',
        sourceRef: syntheticClauseSource('Exclusivity · Limited'),
      },
      {
        id: 'bc-a4-c2',
        label: 'Morality · Standard clause',
        kind: 'morality',
        summary:
          'Brand may pause payments during an unresolved material conduct investigation.',
        sourceRef: syntheticClauseSource('Morality · Standard'),
      },
      {
        id: 'bc-a4-c3',
        label: 'Usage rights · 14-day paid window',
        kind: 'usage-rights',
        summary:
          'Paid amplification up to 14 days per asset; no third-party licensing.',
        sourceRef: syntheticClauseSource('Usage rights · 14'),
      },
      {
        id: 'bc-a4-c4',
        label: 'Audit · Spot check',
        kind: 'audit',
        summary:
          'Brand may request one disclosure-receipt spot check during the term.',
        sourceRef: syntheticClauseSource('Audit · Spot'),
      },
    ],
    trustMeta: {
      lastVerifiedAt: NOW_ISO,
      sourceRef: SYNTHETIC_SOURCE,
    },
  },
];

export const MOCK_BRAND_CONTRACTS: Record<string, BrandContractTerm> = CONTRACTS.reduce<
  Record<string, BrandContractTerm>
>((acc, term) => {
  acc[contractKey(term.brandId, term.athleteId)] = term;
  return acc;
}, {});

export function getMockBrandContract(
  athleteId: string,
  brandId: string = DEFAULT_BRAND_ID,
): BrandContractTerm | null {
  return MOCK_BRAND_CONTRACTS[contractKey(brandId, athleteId)] ?? null;
}
