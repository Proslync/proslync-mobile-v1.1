// ── MOCK NIL COMPARABLE DEAL FIXTURES ────────────────────
// Hand-authored fixtures keyed to deal ids from `mock-brand-data.ts`.
// Per PLAN §5b: public scraped sources (ESPN/On3) are blocked pending
// ToS/legal review, so this fixture file labels every row as
// `synthetic` and `MIT NILComp schema`. Once Q17 in PLAN §9 clears
// (allowed comp sources for demo), this module will be swapped for the
// real backend `/api/nil-comps/:dealId` endpoint.
//
// All amounts are integer cents (USD) — match `MoneyAmount`.

import type { ComparableDealEvidence } from '@/lib/types/comparable-deal.types';

const NOW_ISO = '2026-05-10T00:00:00.000Z';

const SYNTHETIC_NOTE =
  'Synthetic comparable rows hand-authored for the Proslync demo. Replace with reviewer-approved comps before any external presentation. Schema attributed to NILComp (MIT).';

export const MOCK_DEAL_COMPS: Record<string, ComparableDealEvidence> = {
  'd-1': {
    summary: {
      inputDealId: 'd-1',
      estimate: { cents: 38_500_00, currency: 'USD' },
      range: {
        low: { cents: 31_000_00, currency: 'USD' },
        high: { cents: 46_500_00, currency: 'USD' },
      },
      confidence: 'medium',
      summary:
        'Two-year exclusive PG endorsements for top-10 Class of 2026 recruits cluster between $310K and $465K with regional outliers.',
      perRoleCaveats: {
        brand:
          'Pricing reflects pre-disclosure rumored ranges; refuse to anchor an offer letter on synthetic rows.',
        school:
          'Synthetic — do not enter into audit-defense exports until the reviewer-state column flips to approved.',
      },
    },
    rows: [
      {
        id: 'cmp-d1-001',
        inputDealId: 'd-1',
        athlete: {
          id: 'cmp-athlete-001',
          displayName: 'Class-of-2025 top-10 PG (anonymized)',
          sport: 'Basketball',
          schoolOrTeam: 'Big-East program',
          followerReach: 850_000,
          classYearOrPro: 'Fr (2025)',
        },
        brand: {
          id: 'cmp-brand-001',
          displayName: 'National athletic-wear label',
          category: 'Apparel',
          headquarters: 'Pacific Northwest',
        },
        amount: { cents: 36_000_00, currency: 'USD' },
        nilCategory: 'endorsement',
        dealReportedAt: '2025-09-04',
        rationale:
          'Same sport, same recruiting tier, same contract length, exclusive in apparel category.',
        caveats: [
          'Reported via aggregator; original disclosure packet not yet retrieved.',
        ],
        source: {
          id: 'src-cmp-001',
          label: 'Synthetic seed v0',
          kind: 'synthetic',
          retrievedAt: NOW_ISO,
          freshnessDays: 0,
          caveat: 'Hand-authored for demo; replace before external use.',
        },
        reviewerState: 'auto-suggested',
      },
      {
        id: 'cmp-d1-002',
        inputDealId: 'd-1',
        athlete: {
          id: 'cmp-athlete-002',
          displayName: 'Power-5 PG (anonymized)',
          sport: 'Basketball',
          schoolOrTeam: 'ACC program',
          followerReach: 1_200_000,
          classYearOrPro: 'Fr (2024)',
        },
        brand: {
          id: 'cmp-brand-002',
          displayName: 'Regional collective',
          category: 'Collective',
        },
        amount: { cents: 41_000_00, currency: 'USD' },
        nilCategory: 'roster-retention',
        dealReportedAt: '2024-12-18',
        rationale:
          'Comparable athlete profile and contract scope; collective deal with similar exclusivity scope.',
        caveats: [
          'Collective economics differ from brand endorsement — use directionally only.',
        ],
        source: {
          id: 'src-cmp-002',
          label: 'Synthetic seed v0',
          kind: 'synthetic',
          retrievedAt: NOW_ISO,
          freshnessDays: 0,
        },
        reviewerState: 'auto-suggested',
      },
      {
        id: 'cmp-d1-003',
        inputDealId: 'd-1',
        athlete: {
          id: 'cmp-athlete-003',
          displayName: 'Top-25 PG (anonymized)',
          sport: 'Basketball',
          schoolOrTeam: 'Big-12 program',
          followerReach: 510_000,
          classYearOrPro: 'Fr (2025)',
        },
        brand: {
          id: 'cmp-brand-003',
          displayName: 'DTC nutrition brand',
          category: 'Nutrition / supplements',
        },
        amount: { cents: 31_500_00, currency: 'USD' },
        nilCategory: 'endorsement',
        dealReportedAt: '2025-10-22',
        rationale: 'Same recruit tier, smaller audience, shorter exclusivity window.',
        caveats: [
          'Lower follower reach — anchors the low end of the range.',
        ],
        source: {
          id: 'src-cmp-003',
          label: 'Synthetic seed v0',
          kind: 'synthetic',
          retrievedAt: NOW_ISO,
          freshnessDays: 0,
        },
        reviewerState: 'pending-review',
        reviewerNote: 'Awaiting NIL Manager sign-off on amount band.',
      },
    ],
    attribution: {
      schemaSource: 'NILComp',
      schemaLicense: 'MIT',
      note: SYNTHETIC_NOTE,
    },
    updatedAt: NOW_ISO,
  },
  'd-2': {
    summary: {
      inputDealId: 'd-2',
      estimate: { cents: 27_500_00, currency: 'USD' },
      range: {
        low: { cents: 22_000_00, currency: 'USD' },
        high: { cents: 34_000_00, currency: 'USD' },
      },
      confidence: 'low',
      summary:
        'Limited public comps for the wing-forward tier at this audience size; estimate is directional.',
    },
    rows: [
      {
        id: 'cmp-d2-001',
        inputDealId: 'd-2',
        athlete: {
          id: 'cmp-athlete-004',
          displayName: 'Top-15 wing (anonymized)',
          sport: 'Basketball',
          schoolOrTeam: 'SEC program',
          followerReach: 640_000,
          classYearOrPro: 'Fr (2025)',
        },
        brand: {
          id: 'cmp-brand-004',
          displayName: 'Lifestyle apparel',
          category: 'Apparel',
        },
        amount: { cents: 28_500_00, currency: 'USD' },
        nilCategory: 'endorsement',
        dealReportedAt: '2025-11-09',
        rationale:
          'Similar audience and class year; lifestyle apparel category and two-year exclusive scope.',
        caveats: ['Different region — local activation premium not normalized.'],
        source: {
          id: 'src-cmp-004',
          label: 'Synthetic seed v0',
          kind: 'synthetic',
          retrievedAt: NOW_ISO,
          freshnessDays: 0,
        },
        reviewerState: 'auto-suggested',
      },
    ],
    attribution: {
      schemaSource: 'NILComp',
      schemaLicense: 'MIT',
      note: SYNTHETIC_NOTE,
    },
    updatedAt: NOW_ISO,
  },
  'd-3': {
    summary: {
      inputDealId: 'd-3',
      estimate: { cents: 8_800_00, currency: 'USD' },
      range: {
        low: { cents: 6_500_00, currency: 'USD' },
        high: { cents: 11_000_00, currency: 'USD' },
      },
      confidence: 'low',
      summary:
        'Mid-tier collective endorsements at this audience size cluster between $65K and $110K. Limited public comps.',
    },
    rows: [
      {
        id: 'cmp-d3-001',
        inputDealId: 'd-3',
        athlete: {
          id: 'cmp-athlete-007',
          displayName: 'Mid-tier ACC PG (anonymized)',
          sport: 'Basketball',
          schoolOrTeam: 'ACC program',
          followerReach: 195_000,
          classYearOrPro: 'So (2025)',
        },
        brand: {
          id: 'cmp-brand-007',
          displayName: 'Regional QSR chain',
          category: 'Quick-serve restaurant',
        },
        amount: { cents: 9_500_00, currency: 'USD' },
        nilCategory: 'endorsement',
        dealReportedAt: '2025-10-04',
        rationale: 'Same recruit tier, non-exclusive scope, similar audience reach.',
        caveats: ['Different sport-region overlap — local activation premium not normalized.'],
        source: {
          id: 'src-cmp-007',
          label: 'Synthetic seed v0',
          kind: 'synthetic',
          retrievedAt: NOW_ISO,
          freshnessDays: 0,
        },
        reviewerState: 'auto-suggested',
      },
    ],
    attribution: {
      schemaSource: 'NILComp',
      schemaLicense: 'MIT',
      note: SYNTHETIC_NOTE,
    },
    updatedAt: NOW_ISO,
  },
  'd-4': {
    summary: {
      inputDealId: 'd-4',
      estimate: { cents: 67_000_00, currency: 'USD' },
      range: {
        low: { cents: 58_000_00, currency: 'USD' },
        high: { cents: 78_500_00, currency: 'USD' },
      },
      confidence: 'high',
      summary:
        'Three-year exclusive renewals for top-15 Power-5 PGs with 1M+ reach disclose in a tight band.',
    },
    rows: [
      {
        id: 'cmp-d4-001',
        inputDealId: 'd-4',
        athlete: {
          id: 'cmp-athlete-005',
          displayName: 'Top-10 PG (anonymized)',
          sport: 'Basketball',
          schoolOrTeam: 'Big-East program',
          followerReach: 1_400_000,
          classYearOrPro: 'So (2025)',
        },
        brand: {
          id: 'cmp-brand-005',
          displayName: 'Global beverage brand',
          category: 'Beverage',
        },
        amount: { cents: 71_000_00, currency: 'USD' },
        nilCategory: 'endorsement',
        dealReportedAt: '2025-08-11',
        rationale: 'Same audience tier, same contract length, same exclusivity.',
        caveats: ['Beverage category may carry higher activation expectations.'],
        source: {
          id: 'src-cmp-005',
          label: 'Synthetic seed v0',
          kind: 'synthetic',
          retrievedAt: NOW_ISO,
          freshnessDays: 0,
        },
        reviewerState: 'approved',
        reviewerNote: 'Approved by AD review 2026-04-30 as a fair top-band anchor.',
      },
      {
        id: 'cmp-d4-002',
        inputDealId: 'd-4',
        athlete: {
          id: 'cmp-athlete-006',
          displayName: 'Top-20 PG (anonymized)',
          sport: 'Basketball',
          schoolOrTeam: 'ACC program',
          followerReach: 980_000,
          classYearOrPro: 'Fr (2025)',
        },
        brand: {
          id: 'cmp-brand-006',
          displayName: 'Athletic-wear startup',
          category: 'Apparel',
        },
        amount: { cents: 63_500_00, currency: 'USD' },
        nilCategory: 'endorsement',
        dealReportedAt: '2025-07-02',
        rationale: 'Similar tier; non-renewed contract may price slightly under.',
        caveats: ['Non-renewed baseline — renewal premium not included.'],
        source: {
          id: 'src-cmp-006',
          label: 'Synthetic seed v0',
          kind: 'synthetic',
          retrievedAt: NOW_ISO,
          freshnessDays: 0,
        },
        reviewerState: 'approved',
      },
    ],
    attribution: {
      schemaSource: 'NILComp',
      schemaLicense: 'MIT',
      note: SYNTHETIC_NOTE,
    },
    updatedAt: NOW_ISO,
  },
  'd-5': {
    summary: {
      inputDealId: 'd-5',
      estimate: { cents: 14_500_00, currency: 'USD' },
      range: {
        low: { cents: 11_000_00, currency: 'USD' },
        high: { cents: 18_000_00, currency: 'USD' },
      },
      confidence: 'medium',
      summary:
        'HS-senior endorsements at this audience tier disclose in a $110K–$180K band.',
    },
    rows: [
      {
        id: 'cmp-d5-001',
        inputDealId: 'd-5',
        athlete: {
          id: 'cmp-athlete-008',
          displayName: 'Top-25 HS senior (anonymized)',
          sport: 'Basketball',
          schoolOrTeam: 'Mid-Atlantic prep program',
          followerReach: 520_000,
          classYearOrPro: 'HS Sr (2025)',
        },
        brand: { id: 'cmp-brand-008', displayName: 'National athletic-wear label', category: 'Apparel' },
        amount: { cents: 13_500_00, currency: 'USD' },
        nilCategory: 'endorsement',
        dealReportedAt: '2025-09-22',
        rationale: 'Same HS-senior tier, comparable two-year exclusive scope.',
        caveats: ['HS NIL economics are less transparent than collegiate.'],
        source: { id: 'src-cmp-008', label: 'Synthetic seed v0', kind: 'synthetic', retrievedAt: NOW_ISO, freshnessDays: 0 },
        reviewerState: 'auto-suggested',
      },
    ],
    attribution: { schemaSource: 'NILComp', schemaLicense: 'MIT', note: SYNTHETIC_NOTE },
    updatedAt: NOW_ISO,
  },
  'd-6': {
    summary: {
      inputDealId: 'd-6',
      estimate: { cents: 52_500_00, currency: 'USD' },
      range: {
        low: { cents: 44_000_00, currency: 'USD' },
        high: { cents: 62_000_00, currency: 'USD' },
      },
      confidence: 'high',
      summary:
        'Top-1 recruit renewals with signature-line scope disclose in a $440K–$620K band; Cooper Flagg fits the upper third.',
      perRoleCaveats: {
        brand: 'Synthetic. Anchor renewal terms on this band only after AD review attaches a reviewer-state.',
        school: 'Synthetic — fixture is for AD orientation only.',
      },
    },
    rows: [
      {
        id: 'cmp-d6-001',
        inputDealId: 'd-6',
        athlete: {
          id: 'cmp-athlete-009',
          displayName: 'Class-of-2024 top-1 wing (anonymized)',
          sport: 'Basketball',
          schoolOrTeam: 'ACC program',
          followerReach: 2_800_000,
          classYearOrPro: 'So (2025)',
        },
        brand: { id: 'cmp-brand-009', displayName: 'Global footwear brand', category: 'Footwear' },
        amount: { cents: 58_000_00, currency: 'USD' },
        nilCategory: 'endorsement',
        dealReportedAt: '2025-06-15',
        rationale: 'Same recruit tier, signature-line scope, two-year renewal cadence.',
        caveats: ['Anonymized comp; original packet not yet retrieved.'],
        source: { id: 'src-cmp-009', label: 'Synthetic seed v0', kind: 'synthetic', retrievedAt: NOW_ISO, freshnessDays: 0 },
        reviewerState: 'approved',
        reviewerNote: 'Duke AD signed off as upper anchor for d-6 renewal band.',
      },
      {
        id: 'cmp-d6-002',
        inputDealId: 'd-6',
        athlete: {
          id: 'cmp-athlete-010',
          displayName: 'Top-3 forward (anonymized)',
          sport: 'Basketball',
          schoolOrTeam: 'SEC program',
          followerReach: 2_100_000,
          classYearOrPro: 'Fr (2025)',
        },
        brand: { id: 'cmp-brand-010', displayName: 'National sportswear brand', category: 'Apparel' },
        amount: { cents: 48_500_00, currency: 'USD' },
        nilCategory: 'endorsement',
        dealReportedAt: '2025-08-30',
        rationale: 'Similar recruit tier and signature-line scope; smaller co-branded apparel rights.',
        caveats: ['Smaller rights scope than d-6 — anchors the lower band.'],
        source: { id: 'src-cmp-010', label: 'Synthetic seed v0', kind: 'synthetic', retrievedAt: NOW_ISO, freshnessDays: 0 },
        reviewerState: 'approved',
      },
    ],
    attribution: { schemaSource: 'NILComp', schemaLicense: 'MIT', note: SYNTHETIC_NOTE },
    updatedAt: NOW_ISO,
  },
  'd-7': {
    summary: {
      inputDealId: 'd-7',
      estimate: { cents: 9_200_00, currency: 'USD' },
      range: { low: { cents: 7_500_00, currency: 'USD' }, high: { cents: 11_000_00, currency: 'USD' } },
      confidence: 'medium',
      summary: 'QSR ambassador deals for marquee men\'s basketball recruits cluster $75K–$110K.',
    },
    rows: [
      {
        id: 'cmp-d7-001',
        inputDealId: 'd-7',
        athlete: { id: 'cmp-athlete-011', displayName: 'Top-5 wing (anonymized)', sport: 'Basketball', schoolOrTeam: 'Big Ten program', followerReach: 1_900_000, classYearOrPro: 'Fr (2024)' },
        brand: { id: 'cmp-brand-011', displayName: 'National QSR chain', category: 'Quick-serve restaurant' },
        amount: { cents: 10_500_00, currency: 'USD' },
        nilCategory: 'endorsement',
        dealReportedAt: '2025-03-05',
        rationale: 'Comparable QSR non-exclusive ambassador scope and one-year term.',
        caveats: ['Different region — local market premium varies.'],
        source: { id: 'src-cmp-011', label: 'Synthetic seed v0', kind: 'synthetic', retrievedAt: NOW_ISO, freshnessDays: 0 },
        reviewerState: 'auto-suggested',
      },
    ],
    attribution: { schemaSource: 'NILComp', schemaLicense: 'MIT', note: SYNTHETIC_NOTE },
    updatedAt: NOW_ISO,
  },
  'd-8': {
    summary: {
      inputDealId: 'd-8',
      estimate: { cents: 19_000_00, currency: 'USD' },
      range: { low: { cents: 14_500_00, currency: 'USD' }, high: { cents: 24_000_00, currency: 'USD' } },
      confidence: 'medium',
      summary: 'Audio-category add-ons for footwear-exclusive athletes disclose in a $145K–$240K band, but most carve-outs require master-agreement review.',
      perRoleCaveats: {
        brand: 'Audio add-on must respect Nike master-agreement category carve-outs.',
        school: 'Synthetic — for orientation only.',
      },
    },
    rows: [
      {
        id: 'cmp-d8-001',
        inputDealId: 'd-8',
        athlete: { id: 'cmp-athlete-012', displayName: 'Top-15 wing (anonymized)', sport: 'Basketball', schoolOrTeam: 'Big East program', followerReach: 1_400_000, classYearOrPro: 'So (2025)' },
        brand: { id: 'cmp-brand-012', displayName: 'Consumer audio brand', category: 'Consumer electronics / audio' },
        amount: { cents: 19_500_00, currency: 'USD' },
        nilCategory: 'endorsement',
        dealReportedAt: '2025-11-12',
        rationale: 'Comparable audio-category add-on with master-agreement carve-out.',
        caveats: ['Audio category overlaps with sponsor master agreement — carve-out memo required.'],
        source: { id: 'src-cmp-012', label: 'Synthetic seed v0', kind: 'synthetic', retrievedAt: NOW_ISO, freshnessDays: 0 },
        reviewerState: 'pending-review',
        reviewerNote: 'Awaiting carve-out memo before flipping to approved.',
      },
    ],
    attribution: { schemaSource: 'NILComp', schemaLicense: 'MIT', note: SYNTHETIC_NOTE },
    updatedAt: NOW_ISO,
  },
  'd-9': {
    summary: {
      inputDealId: 'd-9',
      estimate: { cents: 48_500_00, currency: 'USD' },
      range: { low: { cents: 40_000_00, currency: 'USD' }, high: { cents: 58_000_00, currency: 'USD' } },
      confidence: 'high',
      summary: 'Two-year exclusive footwear deals for top-3 recruits cluster $400K–$580K.',
    },
    rows: [
      {
        id: 'cmp-d9-001',
        inputDealId: 'd-9',
        athlete: { id: 'cmp-athlete-013', displayName: 'Top-3 forward (anonymized)', sport: 'Basketball', schoolOrTeam: 'Big 12 program', followerReach: 1_500_000, classYearOrPro: 'Fr (2025)' },
        brand: { id: 'cmp-brand-013', displayName: 'Global footwear brand', category: 'Footwear & apparel' },
        amount: { cents: 52_000_00, currency: 'USD' },
        nilCategory: 'endorsement',
        dealReportedAt: '2025-07-18',
        rationale: 'Same tier, two-year exclusive scope, category-exclusive footwear.',
        caveats: ['Anonymized; original packet not yet retrieved.'],
        source: { id: 'src-cmp-013', label: 'Synthetic seed v0', kind: 'synthetic', retrievedAt: NOW_ISO, freshnessDays: 0 },
        reviewerState: 'auto-suggested',
      },
    ],
    attribution: { schemaSource: 'NILComp', schemaLicense: 'MIT', note: SYNTHETIC_NOTE },
    updatedAt: NOW_ISO,
  },
  'd-10': {
    summary: {
      inputDealId: 'd-10',
      estimate: { cents: 31_500_00, currency: 'USD' },
      range: { low: { cents: 26_000_00, currency: 'USD' }, high: { cents: 38_000_00, currency: 'USD' } },
      confidence: 'medium',
      summary: 'Second-year wing endorsements with category-exclusive scope cluster $260K–$380K.',
    },
    rows: [
      {
        id: 'cmp-d10-001',
        inputDealId: 'd-10',
        athlete: { id: 'cmp-athlete-014', displayName: 'Top-12 wing (anonymized)', sport: 'Basketball', schoolOrTeam: 'ACC program', followerReach: 600_000, classYearOrPro: 'Fr (2025)' },
        brand: { id: 'cmp-brand-014', displayName: 'Global footwear brand', category: 'Footwear' },
        amount: { cents: 33_000_00, currency: 'USD' },
        nilCategory: 'endorsement',
        dealReportedAt: '2025-09-08',
        rationale: 'Same recruit tier, two-year exclusive footwear scope.',
        caveats: [],
        source: { id: 'src-cmp-014', label: 'Synthetic seed v0', kind: 'synthetic', retrievedAt: NOW_ISO, freshnessDays: 0 },
        reviewerState: 'auto-suggested',
      },
    ],
    attribution: { schemaSource: 'NILComp', schemaLicense: 'MIT', note: SYNTHETIC_NOTE },
    updatedAt: NOW_ISO,
  },
  'd-11': {
    summary: {
      inputDealId: 'd-11',
      estimate: { cents: 72_000_00, currency: 'USD' },
      range: { low: { cents: 60_000_00, currency: 'USD' }, high: { cents: 86_000_00, currency: 'USD' } },
      confidence: 'high',
      summary: 'Flagship women\'s multi-category deals for top-3 recruits cluster $600K–$860K with global-usage premiums.',
    },
    rows: [
      {
        id: 'cmp-d11-001',
        inputDealId: 'd-11',
        athlete: { id: 'cmp-athlete-015', displayName: 'Top-3 W guard (anonymized)', sport: 'Basketball', schoolOrTeam: 'SEC program', followerReach: 2_100_000, classYearOrPro: 'So (2025)' },
        brand: { id: 'cmp-brand-015', displayName: 'Global footwear brand', category: 'Footwear & apparel' },
        amount: { cents: 78_500_00, currency: 'USD' },
        nilCategory: 'endorsement',
        dealReportedAt: '2025-08-21',
        rationale: 'Same recruit tier, multi-category exclusive, two-year term with global usage.',
        caveats: [],
        source: { id: 'src-cmp-015', label: 'Synthetic seed v0', kind: 'synthetic', retrievedAt: NOW_ISO, freshnessDays: 0 },
        reviewerState: 'approved',
      },
    ],
    attribution: { schemaSource: 'NILComp', schemaLicense: 'MIT', note: SYNTHETIC_NOTE },
    updatedAt: NOW_ISO,
  },
  'd-12': {
    summary: {
      inputDealId: 'd-12',
      estimate: { cents: 42_000_00, currency: 'USD' },
      range: { low: { cents: 34_000_00, currency: 'USD' }, high: { cents: 51_000_00, currency: 'USD' } },
      confidence: 'medium',
      summary: 'Sophomore-year women\'s basketball exclusive deals cluster $340K–$510K.',
    },
    rows: [
      {
        id: 'cmp-d12-001',
        inputDealId: 'd-12',
        athlete: { id: 'cmp-athlete-016', displayName: 'Top-6 W guard (anonymized)', sport: 'Basketball', schoolOrTeam: 'ACC program', followerReach: 920_000, classYearOrPro: 'So (2025)' },
        brand: { id: 'cmp-brand-016', displayName: 'Global footwear brand', category: 'Footwear & apparel' },
        amount: { cents: 44_500_00, currency: 'USD' },
        nilCategory: 'endorsement',
        dealReportedAt: '2025-10-30',
        rationale: 'Same tier, two-year exclusive scope.',
        caveats: [],
        source: { id: 'src-cmp-016', label: 'Synthetic seed v0', kind: 'synthetic', retrievedAt: NOW_ISO, freshnessDays: 0 },
        reviewerState: 'auto-suggested',
      },
    ],
    attribution: { schemaSource: 'NILComp', schemaLicense: 'MIT', note: SYNTHETIC_NOTE },
    updatedAt: NOW_ISO,
  },
  'd-13': {
    summary: {
      inputDealId: 'd-13',
      estimate: { cents: 40_500_00, currency: 'USD' },
      range: { low: { cents: 32_000_00, currency: 'USD' }, high: { cents: 49_000_00, currency: 'USD' } },
      confidence: 'medium',
      summary: 'SEC football wide-receiver exclusive deals cluster $320K–$490K depending on Heisman trajectory.',
    },
    rows: [
      {
        id: 'cmp-d13-001',
        inputDealId: 'd-13',
        athlete: { id: 'cmp-athlete-017', displayName: 'Top-10 WR (anonymized)', sport: 'Football', schoolOrTeam: 'SEC program', followerReach: 1_200_000, classYearOrPro: 'So (2025)' },
        brand: { id: 'cmp-brand-017', displayName: 'Global footwear brand', category: 'Footwear & training' },
        amount: { cents: 38_500_00, currency: 'USD' },
        nilCategory: 'endorsement',
        dealReportedAt: '2025-07-25',
        rationale: 'Same recruit profile, one-year exclusive scope, similar audience.',
        caveats: [],
        source: { id: 'src-cmp-017', label: 'Synthetic seed v0', kind: 'synthetic', retrievedAt: NOW_ISO, freshnessDays: 0 },
        reviewerState: 'auto-suggested',
      },
    ],
    attribution: { schemaSource: 'NILComp', schemaLicense: 'MIT', note: SYNTHETIC_NOTE },
    updatedAt: NOW_ISO,
  },
  'd-14': {
    summary: {
      inputDealId: 'd-14',
      estimate: { cents: 24_500_00, currency: 'USD' },
      range: { low: { cents: 20_000_00, currency: 'USD' }, high: { cents: 30_000_00, currency: 'USD' } },
      confidence: 'medium',
      summary: 'Senior-year exclusive footwear deals for ACC veterans cluster $200K–$300K.',
    },
    rows: [
      {
        id: 'cmp-d14-001',
        inputDealId: 'd-14',
        athlete: { id: 'cmp-athlete-018', displayName: 'Top-25 senior PG (anonymized)', sport: 'Basketball', schoolOrTeam: 'ACC program', followerReach: 720_000, classYearOrPro: 'Sr (2025)' },
        brand: { id: 'cmp-brand-018', displayName: 'Global footwear brand', category: 'Footwear' },
        amount: { cents: 25_500_00, currency: 'USD' },
        nilCategory: 'endorsement',
        dealReportedAt: '2025-06-10',
        rationale: 'Same conference, senior-year scope, similar audience reach.',
        caveats: [],
        source: { id: 'src-cmp-018', label: 'Synthetic seed v0', kind: 'synthetic', retrievedAt: NOW_ISO, freshnessDays: 0 },
        reviewerState: 'auto-suggested',
      },
    ],
    attribution: { schemaSource: 'NILComp', schemaLicense: 'MIT', note: SYNTHETIC_NOTE },
    updatedAt: NOW_ISO,
  },
  'd-15': {
    summary: {
      inputDealId: 'd-15',
      estimate: { cents: 9_800_00, currency: 'USD' },
      range: { low: { cents: 7_500_00, currency: 'USD' }, high: { cents: 12_500_00, currency: 'USD' } },
      confidence: 'low',
      summary: 'Freshman-year non-exclusive deals at this audience tier cluster $75K–$125K.',
    },
    rows: [
      {
        id: 'cmp-d15-001',
        inputDealId: 'd-15',
        athlete: { id: 'cmp-athlete-019', displayName: 'Top-30 freshman (anonymized)', sport: 'Basketball', schoolOrTeam: 'ACC program', followerReach: 230_000, classYearOrPro: 'Fr (2025)' },
        brand: { id: 'cmp-brand-019', displayName: 'National footwear brand', category: 'Footwear' },
        amount: { cents: 9_500_00, currency: 'USD' },
        nilCategory: 'endorsement',
        dealReportedAt: '2025-12-01',
        rationale: 'Similar recruit tier, one-year non-exclusive scope.',
        caveats: ['Lower audience reach — directional only.'],
        source: { id: 'src-cmp-019', label: 'Synthetic seed v0', kind: 'synthetic', retrievedAt: NOW_ISO, freshnessDays: 0 },
        reviewerState: 'auto-suggested',
      },
    ],
    attribution: { schemaSource: 'NILComp', schemaLicense: 'MIT', note: SYNTHETIC_NOTE },
    updatedAt: NOW_ISO,
  },
};

export function getMockDealComparables(
  dealId: string,
): ComparableDealEvidence | null {
  return MOCK_DEAL_COMPS[dealId] ?? null;
}
