// ── MOCK ATHLETE DISCLOSURE FIXTURES (Sprint 3.4) ────────
// Hand-authored NIL Go-shaped `ComplianceDisclosure` records. Every
// fixture is `synthetic`-tagged per `mock-deal-comps.ts` / `mock-risk-report.ts`
// precedent; the UI must NEVER promote these into an external attestation.
//
// Fixture mix covers all six `reviewState` values so the disclosure-form
// screen renders every state in a single demo pass:
//   - dr-001 → draft
//   - dr-002 → submitted
//   - dr-003 → school-review
//   - dr-004 → approved
//   - dr-005 → flagged
//   - dr-006 → amended
//
// Money is integer cents (USD).

import type { ComparableDealSourceRef } from '@/lib/types/comparable-deal.types';
import type {
  ComplianceDisclosure,
  DisclosureActionLogEntry,
} from '@/lib/types/compliance-disclosure.types';

const NOW_ISO = '2026-05-10T00:00:00.000Z';

const CSC_DISCIPLINE_NOTE =
  "Proslync is not an official CSC submitter — this packet is the school's reviewer record.";

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

function actionEntry(
  id: string,
  action: DisclosureActionLogEntry['action'],
  actorKind: DisclosureActionLogEntry['actor']['kind'],
  actorLabel: string,
  at: string,
  note?: string,
): DisclosureActionLogEntry {
  return { id, action, actor: { kind: actorKind, label: actorLabel }, at, note };
}

// ── d-1 / Dylan Harper (DRAFT) ───────────────────────────
const DR_001: ComplianceDisclosure = {
  id: 'dr-001',
  athleteId: 'a-5',
  brandId: 'puma-hoops',
  dealId: 'd-1',
  thresholdState: 'crossed',
  payorAssociationStatus: 'unaffiliated',
  counterparties: {
    athlete: { name: 'Dylan Harper', school: 'Rutgers University' },
    brand: { name: 'Nike Hoops', category: 'Footwear & Apparel' },
    agentOfRecord: { name: 'Aaron Mintz', firm: 'CAA Sports' },
  },
  arrangementTerms: {
    categories: ['endorsement', 'merch-licensing'],
    servicesGranted: [
      'Two Nike Hoops creator shoot days (LA, summer)',
      'Six approved social posts (TikTok + IG Reels)',
      'One regional grassroots clinic appearance',
    ],
    rightsGranted: [
      'Paid social usage (90 days)',
      'In-store window display likeness rights',
    ],
    durationDays: 730,
    renewable: true,
    exclusivityScope: 'Footwear & apparel (NCAA + international), category-exclusive',
  },
  compensation: {
    totalCents: { cents: 380_000_00, currency: 'USD' },
    structure: 'mixed',
    paymentSchedule: {
      atSignature: 150_000_00,
      atContentProof: 180_000_00,
      atFinalReport: 50_000_00,
      otherDescription: 'Final $50K contingent on Q4 performance bonus pool.',
    },
    nonCashItems: [
      { label: 'Nike Hoops product seeding (full season)', estimatedCents: { cents: 8_500_00, currency: 'USD' } },
    ],
  },
  serviceProviders: [
    { name: 'Aaron Mintz', role: 'Agent', compensationCents: { cents: 38_000_00, currency: 'USD' } },
    { name: 'Hilary Cherson', role: 'Tax advisor', compensationCents: { cents: 4_500_00, currency: 'USD' } },
  ],
  attachments: [
    { id: 'att-001-1', label: 'Signed term sheet (countersigned)', state: 'attached' },
    { id: 'att-001-2', label: 'Bylaw 22 payor questionnaire', state: 'pending' },
    { id: 'att-001-3', label: 'Athlete attestation form', state: 'missing' },
  ],
  attestation: {
    athleteSigned: false,
  },
  actionHistory: [
    actionEntry('h-001-1', 'created', 'athlete', 'Dylan Harper', '2026-05-08T18:12:00.000Z'),
    actionEntry('h-001-2', 'edited', 'athlete', 'Dylan Harper', '2026-05-09T14:02:00.000Z', 'Added agent + tax advisor block.'),
  ],
  reviewState: 'draft',
  source: syntheticSource(
    'src-dr-001',
    'Hand-authored draft for Sprint 3.4 demo',
    0,
    'Synthetic — must be replaced before any external submission.',
  ),
  cscNote: CSC_DISCIPLINE_NOTE,
};

// ── d-2 / Ace Bailey (SUBMITTED) ─────────────────────────
const DR_002: ComplianceDisclosure = {
  id: 'dr-002',
  athleteId: 'a-6',
  brandId: 'puma-hoops',
  dealId: 'd-2',
  thresholdState: 'crossed',
  payorAssociationStatus: 'pending-verification',
  counterparties: {
    athlete: { name: 'Ace Bailey', school: 'Rutgers University' },
    brand: { name: 'Nike Hoops', category: 'Footwear & Apparel' },
  },
  arrangementTerms: {
    categories: ['endorsement'],
    servicesGranted: [
      'Four approved social posts (TikTok + IG Reels)',
      'One in-person grassroots appearance',
    ],
    rightsGranted: ['Paid social usage (60 days)'],
    durationDays: 730,
    renewable: true,
    exclusivityScope: 'Footwear & apparel (NCAA only)',
  },
  compensation: {
    totalCents: { cents: 290_000_00, currency: 'USD' },
    structure: 'flat',
    paymentSchedule: {
      atSignature: 100_000_00,
      atContentProof: 150_000_00,
      atFinalReport: 40_000_00,
    },
  },
  serviceProviders: [
    { name: 'Omar Wilkes', role: 'Agent', compensationCents: { cents: 29_000_00, currency: 'USD' } },
  ],
  attachments: [
    { id: 'att-002-1', label: 'Signed term sheet', state: 'attached' },
    { id: 'att-002-2', label: 'Bylaw 22 payor questionnaire', state: 'attached' },
    { id: 'att-002-3', label: 'Athlete attestation form', state: 'attached' },
  ],
  attestation: {
    athleteSigned: true,
    signedAt: '2026-05-04T15:30:00.000Z',
    statementId: 'stmt-2026-rutgers-v1',
  },
  actionHistory: [
    actionEntry('h-002-1', 'created', 'athlete', 'Ace Bailey', '2026-05-02T13:00:00.000Z'),
    actionEntry('h-002-2', 'edited', 'athlete', 'Ace Bailey', '2026-05-03T18:20:00.000Z'),
    actionEntry('h-002-3', 'submitted', 'athlete', 'Ace Bailey', '2026-05-04T15:30:00.000Z', 'Submitted to Rutgers compliance.'),
  ],
  reviewState: 'submitted',
  source: syntheticSource('src-dr-002', 'Hand-authored submission for Sprint 3.4 demo'),
  cscNote: CSC_DISCIPLINE_NOTE,
};

// ── d-4 / Kiyan Anthony (SCHOOL-REVIEW) ──────────────────
const DR_003: ComplianceDisclosure = {
  id: 'dr-003',
  athleteId: 'a-1',
  brandId: 'puma-hoops',
  dealId: 'd-4',
  thresholdState: 'crossed',
  payorAssociationStatus: 'unaffiliated',
  counterparties: {
    athlete: { name: 'Kiyan Anthony', school: 'Syracuse University' },
    brand: { name: 'Nike Hoops', category: 'Footwear & Apparel' },
    agentOfRecord: { name: 'Carmelo Anthony', firm: 'Melo Ventures' },
  },
  arrangementTerms: {
    categories: ['endorsement', 'merch-licensing', 'appearance'],
    servicesGranted: [
      'Signature shoe co-design (Nike MB.04 collab)',
      'Two regional store activations',
      'Twelve approved social posts (TikTok + IG)',
    ],
    rightsGranted: [
      'Paid social usage (180 days)',
      'Likeness rights for in-store window + on-court signage',
      'Co-branded apparel line (limited)',
    ],
    durationDays: 1_095,
    renewable: true,
    exclusivityScope: 'Footwear & apparel — global, category-exclusive',
  },
  compensation: {
    totalCents: { cents: 660_000_00, currency: 'USD' },
    structure: 'mixed',
    paymentSchedule: {
      atSignature: 250_000_00,
      atContentProof: 310_000_00,
      atFinalReport: 100_000_00,
      otherDescription: 'Royalty share on co-branded line settles annually outside this schedule.',
    },
    nonCashItems: [
      { label: 'Co-branded apparel allocation (signing year)', estimatedCents: { cents: 18_000_00, currency: 'USD' } },
    ],
  },
  serviceProviders: [
    { name: 'Carmelo Anthony', role: 'Agent of record', compensationCents: { cents: 66_000_00, currency: 'USD' } },
    { name: 'M. Reed Smith NIL Group', role: 'Legal review', compensationCents: { cents: 12_500_00, currency: 'USD' } },
  ],
  attachments: [
    { id: 'att-003-1', label: 'Countersigned multi-year agreement', state: 'attached' },
    { id: 'att-003-2', label: 'Bylaw 22 payor questionnaire', state: 'attached' },
    { id: 'att-003-3', label: 'Athlete attestation form', state: 'attached' },
    { id: 'att-003-4', label: 'Co-branded line royalty schedule', state: 'attached' },
  ],
  attestation: {
    athleteSigned: true,
    signedAt: '2026-04-22T17:00:00.000Z',
    statementId: 'stmt-2026-syracuse-v3',
  },
  actionHistory: [
    actionEntry('h-003-1', 'created', 'athlete', 'Kiyan Anthony', '2026-04-18T14:00:00.000Z'),
    actionEntry('h-003-2', 'edited', 'athlete', 'Kiyan Anthony', '2026-04-20T15:25:00.000Z'),
    actionEntry('h-003-3', 'submitted', 'athlete', 'Kiyan Anthony', '2026-04-22T17:00:00.000Z'),
    actionEntry('h-003-4', 'school-acknowledged', 'school', 'L. Whitcombe (compliance)', '2026-04-23T09:15:00.000Z', 'Packet received; entered the school-review queue.'),
  ],
  reviewState: 'school-review',
  source: syntheticSource('src-dr-003', 'Hand-authored school-review fixture'),
  cscNote: CSC_DISCIPLINE_NOTE,
};

// ── d-5 / Jordan Miles (APPROVED) ────────────────────────
const DR_004: ComplianceDisclosure = {
  id: 'dr-004',
  athleteId: 'a-2',
  brandId: 'puma-hoops',
  dealId: 'd-5',
  thresholdState: 'crossed',
  payorAssociationStatus: 'unaffiliated',
  counterparties: {
    athlete: { name: 'Jordan Miles', school: 'Paul VI Catholic High School' },
    brand: { name: 'Nike Hoops', category: 'Footwear & Apparel' },
  },
  arrangementTerms: {
    categories: ['endorsement'],
    servicesGranted: ['Three approved social posts per season'],
    rightsGranted: ['Paid social usage (30 days)'],
    durationDays: 730,
    renewable: false,
  },
  compensation: {
    totalCents: { cents: 140_000_00, currency: 'USD' },
    structure: 'flat',
    paymentSchedule: {
      atSignature: 60_000_00,
      atContentProof: 60_000_00,
      atFinalReport: 20_000_00,
    },
  },
  serviceProviders: [
    { name: 'Wasserman Basketball', role: 'Agent', compensationCents: { cents: 14_000_00, currency: 'USD' } },
  ],
  attachments: [
    { id: 'att-004-1', label: 'Signed term sheet', state: 'attached' },
    { id: 'att-004-2', label: 'Bylaw 22 payor questionnaire', state: 'attached' },
    { id: 'att-004-3', label: 'Athlete attestation form', state: 'attached' },
  ],
  attestation: {
    athleteSigned: true,
    signedAt: '2026-02-01T19:45:00.000Z',
    statementId: 'stmt-2026-paulvi-v1',
  },
  actionHistory: [
    actionEntry('h-004-1', 'created', 'athlete', 'Jordan Miles', '2026-01-28T11:00:00.000Z'),
    actionEntry('h-004-2', 'submitted', 'athlete', 'Jordan Miles', '2026-02-01T19:45:00.000Z'),
    actionEntry('h-004-3', 'school-acknowledged', 'school', 'C. Diaz (compliance)', '2026-02-02T09:00:00.000Z'),
    actionEntry('h-004-4', 'reviewed', 'school', 'C. Diaz (compliance)', '2026-02-05T16:30:00.000Z', 'Three-track review cleared.'),
  ],
  reviewState: 'approved',
  source: syntheticSource('src-dr-004', 'Hand-authored approved fixture', 90),
  cscNote: CSC_DISCIPLINE_NOTE,
};

// ── athlete-only / Naithan George (FLAGGED) ──────────────
const DR_005: ComplianceDisclosure = {
  id: 'dr-005',
  athleteId: 'a-7',
  thresholdState: 'aggregating',
  payorAssociationStatus: 'unknown',
  counterparties: {
    athlete: { name: 'Naithan George', school: 'Georgia Tech' },
    brand: { name: 'Atlanta Hoops Collective', category: 'Collective' },
  },
  arrangementTerms: {
    categories: ['collective', 'appearance'],
    servicesGranted: [
      'Two collective-sponsored youth clinic appearances',
      'Quarterly collective fundraiser shoot',
    ],
    rightsGranted: ['Likeness rights for collective fundraising materials'],
    durationDays: 365,
    renewable: true,
  },
  compensation: {
    totalCents: { cents: 38_000_00, currency: 'USD' },
    structure: 'milestone',
    paymentSchedule: {
      atSignature: 0,
      atContentProof: 28_000_00,
      atFinalReport: 10_000_00,
    },
  },
  serviceProviders: [],
  attachments: [
    { id: 'att-005-1', label: 'Collective engagement letter', state: 'attached' },
    { id: 'att-005-2', label: 'Bylaw 22 payor questionnaire', state: 'missing' },
    { id: 'att-005-3', label: 'Athlete attestation form', state: 'pending' },
  ],
  attestation: {
    athleteSigned: false,
  },
  actionHistory: [
    actionEntry('h-005-1', 'created', 'athlete', 'Naithan George', '2026-04-26T10:10:00.000Z'),
    actionEntry('h-005-2', 'submitted', 'athlete', 'Naithan George', '2026-04-28T18:05:00.000Z'),
    actionEntry('h-005-3', 'reviewed', 'school', 'M. Patel (compliance)', '2026-04-30T13:40:00.000Z', 'Payor association status unverified — pending Bylaw 22 receipts.'),
  ],
  reviewState: 'flagged',
  source: syntheticSource(
    'src-dr-005',
    'Hand-authored flagged collective fixture',
    0,
    'Payor association status unverified pending Bylaw 22 receipts.',
  ),
  cscNote: CSC_DISCIPLINE_NOTE,
};

// ── athlete-only / Kiyan secondary (AMENDED) ─────────────
const DR_006: ComplianceDisclosure = {
  id: 'dr-006',
  athleteId: 'a-1',
  thresholdState: 'crossed',
  payorAssociationStatus: 'unaffiliated',
  counterparties: {
    athlete: { name: 'Kiyan Anthony', school: 'Syracuse University' },
    brand: { name: 'Local Honda Dealer Group', category: 'Auto / Local' },
  },
  arrangementTerms: {
    categories: ['endorsement', 'appearance'],
    servicesGranted: [
      'Two dealership-floor appearances',
      'Four approved social posts (IG only)',
    ],
    rightsGranted: ['Local-market broadcast usage (30 days)'],
    durationDays: 180,
    renewable: false,
  },
  compensation: {
    totalCents: { cents: 24_500_00, currency: 'USD' },
    structure: 'flat',
    paymentSchedule: {
      atSignature: 12_000_00,
      atContentProof: 9_000_00,
      atFinalReport: 3_500_00,
    },
    nonCashItems: [
      { label: 'Loaner vehicle (90 days)', estimatedCents: { cents: 4_500_00, currency: 'USD' } },
    ],
  },
  serviceProviders: [
    { name: 'Carmelo Anthony', role: 'Agent of record' },
  ],
  attachments: [
    { id: 'att-006-1', label: 'Signed local-deal letter', state: 'attached' },
    { id: 'att-006-2', label: 'Bylaw 22 payor questionnaire', state: 'attached' },
    { id: 'att-006-3', label: 'Athlete attestation form (amended)', state: 'attached' },
  ],
  attestation: {
    athleteSigned: true,
    signedAt: '2026-05-06T14:00:00.000Z',
    statementId: 'stmt-2026-syracuse-v4',
  },
  actionHistory: [
    actionEntry('h-006-1', 'created', 'athlete', 'Kiyan Anthony', '2026-03-15T11:00:00.000Z'),
    actionEntry('h-006-2', 'submitted', 'athlete', 'Kiyan Anthony', '2026-03-17T15:20:00.000Z'),
    actionEntry('h-006-3', 'reviewed', 'school', 'L. Whitcombe (compliance)', '2026-03-22T10:30:00.000Z', 'Loaner vehicle non-cash value flagged for amendment.'),
    actionEntry('h-006-4', 'amended', 'athlete', 'Kiyan Anthony', '2026-05-06T14:00:00.000Z', 'Re-signed attestation with disclosed loaner-vehicle non-cash value.'),
  ],
  reviewState: 'amended',
  source: syntheticSource('src-dr-006', 'Hand-authored amended fixture'),
  cscNote: CSC_DISCIPLINE_NOTE,
};

// ── d-7 / Cooper Flagg BWW ambassador (APPROVED — narrative arc 2) ─────
const DR_007: ComplianceDisclosure = {
  id: 'dr-007',
  athleteId: 'a-3',
  brandId: 'bww-marketing',
  dealId: 'd-7',
  thresholdState: 'crossed',
  payorAssociationStatus: 'unaffiliated',
  counterparties: {
    athlete: { name: 'Cooper Flagg', school: 'Duke University' },
    brand: { name: 'Buffalo Wild Wings', category: 'QSR / Restaurant' },
    agentOfRecord: { name: 'Rich Paul', firm: 'Klutch Sports Group' },
  },
  arrangementTerms: {
    categories: ['endorsement', 'appearance'],
    servicesGranted: [
      'One BWW campus event during ACC tournament week',
      'Three approved social posts (IG Reels)',
    ],
    rightsGranted: ['Local-market broadcast usage (45 days)'],
    durationDays: 365,
    renewable: false,
    exclusivityScope: 'QSR category, non-exclusive',
  },
  compensation: {
    totalCents: { cents: 95_000_00, currency: 'USD' },
    structure: 'flat',
    paymentSchedule: {
      atSignature: 48_000_00,
      atContentProof: 0,
      atFinalReport: 47_000_00,
    },
  },
  serviceProviders: [
    { name: 'Rich Paul', role: 'Agent of record', compensationCents: { cents: 9_500_00, currency: 'USD' } },
  ],
  attachments: [
    { id: 'att-007-1', label: 'Signed engagement letter', state: 'attached' },
    { id: 'att-007-2', label: 'Bylaw 22 payor questionnaire', state: 'attached' },
    { id: 'att-007-3', label: 'Athlete attestation form', state: 'attached' },
    { id: 'att-007-4', label: 'Duke AD pre-approval memo', state: 'attached' },
  ],
  attestation: {
    athleteSigned: true,
    signedAt: '2026-04-15T16:30:00.000Z',
    statementId: 'stmt-2026-duke-v2',
  },
  actionHistory: [
    actionEntry('h-007-1', 'created', 'athlete', 'Cooper Flagg', '2026-04-10T11:00:00.000Z'),
    actionEntry('h-007-2', 'submitted', 'athlete', 'Cooper Flagg', '2026-04-15T16:30:00.000Z'),
    actionEntry('h-007-3', 'school-acknowledged', 'school', 'D. Roach (compliance)', '2026-04-16T09:00:00.000Z'),
    actionEntry('h-007-4', 'reviewed', 'school', 'D. Roach (compliance)', '2026-04-19T14:00:00.000Z', 'Duke AD cleared; QSR category non-conflicting with Nike exclusive.'),
  ],
  reviewState: 'approved',
  source: syntheticSource('src-dr-007', 'Hand-authored approved fixture — narrative arc 2'),
  cscNote: CSC_DISCIPLINE_NOTE,
};

// ── d-8 / Kiyan Beats add-on (FLAGGED — narrative arc 1) ─────
const DR_008: ComplianceDisclosure = {
  id: 'dr-008',
  athleteId: 'a-1',
  brandId: 'beats',
  dealId: 'd-8',
  thresholdState: 'crossed',
  payorAssociationStatus: 'unaffiliated',
  counterparties: {
    athlete: { name: 'Kiyan Anthony', school: 'Syracuse University' },
    brand: { name: 'Beats by Dre', category: 'Consumer Electronics / Audio' },
    agentOfRecord: { name: 'Carmelo Anthony', firm: 'Melo Ventures' },
  },
  arrangementTerms: {
    categories: ['endorsement'],
    servicesGranted: [
      'Two co-branded short-form deliverables',
      'One product-seeding shoot day',
    ],
    rightsGranted: [
      'Paid social usage (30 days)',
      'Audio-category likeness rights, non-exclusive',
    ],
    durationDays: 365,
    renewable: true,
    exclusivityScope: 'Audio category only — flagged for review against Nike Hoops master agreement.',
  },
  compensation: {
    totalCents: { cents: 210_000_00, currency: 'USD' },
    structure: 'mixed',
    paymentSchedule: {
      atSignature: 84_000_00,
      atContentProof: 100_000_00,
      atFinalReport: 26_000_00,
    },
  },
  serviceProviders: [
    { name: 'Carmelo Anthony', role: 'Agent of record', compensationCents: { cents: 21_000_00, currency: 'USD' } },
  ],
  attachments: [
    { id: 'att-008-1', label: 'Signed add-on letter', state: 'attached' },
    { id: 'att-008-2', label: 'Bylaw 22 payor questionnaire', state: 'attached' },
    { id: 'att-008-3', label: 'Athlete attestation form', state: 'pending' },
    { id: 'att-008-4', label: 'Nike master-agreement carve-out memo', state: 'missing' },
  ],
  attestation: {
    athleteSigned: false,
  },
  actionHistory: [
    actionEntry('h-008-1', 'created', 'athlete', 'Kiyan Anthony', '2026-05-03T13:00:00.000Z'),
    actionEntry('h-008-2', 'submitted', 'athlete', 'Kiyan Anthony', '2026-05-05T17:00:00.000Z'),
    actionEntry('h-008-3', 'reviewed', 'school', 'L. Whitcombe (compliance)', '2026-05-07T11:30:00.000Z', 'Audio category overlap with Nike master agreement requires carve-out memo before clearance.'),
  ],
  reviewState: 'flagged',
  source: syntheticSource(
    'src-dr-008',
    'Hand-authored flagged fixture — narrative arc 1',
    0,
    'Category overlap pending Nike master-agreement carve-out memo.',
  ),
  cscNote: CSC_DISCIPLINE_NOTE,
};

// ── d-9 / AJ Dybantsa first signature (APPROVED) ─────
const DR_009: ComplianceDisclosure = {
  id: 'dr-009',
  athleteId: 'a-8',
  brandId: 'puma-hoops',
  dealId: 'd-9',
  thresholdState: 'crossed',
  payorAssociationStatus: 'unaffiliated',
  counterparties: {
    athlete: { name: 'AJ Dybantsa', school: 'Brigham Young University' },
    brand: { name: 'Nike Hoops', category: 'Footwear & Apparel' },
    agentOfRecord: { name: 'Aaron Mintz', firm: 'CAA Sports' },
  },
  arrangementTerms: {
    categories: ['endorsement', 'merch-licensing'],
    servicesGranted: [
      'Pre-season reveal + 6 launch posts',
      'Two creator shoot days',
    ],
    rightsGranted: ['Paid social usage (90 days)', 'In-store window display likeness rights'],
    durationDays: 730,
    renewable: true,
    exclusivityScope: 'Footwear & apparel — NCAA, category-exclusive',
  },
  compensation: {
    totalCents: { cents: 480_000_00, currency: 'USD' },
    structure: 'mixed',
    paymentSchedule: {
      atSignature: 168_000_00,
      atContentProof: 240_000_00,
      atFinalReport: 72_000_00,
    },
  },
  serviceProviders: [
    { name: 'Aaron Mintz', role: 'Agent of record', compensationCents: { cents: 48_000_00, currency: 'USD' } },
  ],
  attachments: [
    { id: 'att-009-1', label: 'Countersigned multi-year agreement', state: 'attached' },
    { id: 'att-009-2', label: 'Bylaw 22 payor questionnaire', state: 'attached' },
    { id: 'att-009-3', label: 'Athlete attestation form', state: 'attached' },
  ],
  attestation: {
    athleteSigned: true,
    signedAt: '2026-04-28T14:00:00.000Z',
    statementId: 'stmt-2026-byu-v1',
  },
  actionHistory: [
    actionEntry('h-009-1', 'created', 'athlete', 'AJ Dybantsa', '2026-04-22T10:00:00.000Z'),
    actionEntry('h-009-2', 'submitted', 'athlete', 'AJ Dybantsa', '2026-04-28T14:00:00.000Z'),
    actionEntry('h-009-3', 'school-acknowledged', 'school', 'BYU NIL desk', '2026-04-29T08:30:00.000Z'),
    actionEntry('h-009-4', 'reviewed', 'school', 'BYU NIL desk', '2026-05-02T11:00:00.000Z', 'Three-track review cleared.'),
  ],
  reviewState: 'approved',
  source: syntheticSource('src-dr-009', 'Hand-authored approved fixture'),
  cscNote: CSC_DISCIPLINE_NOTE,
};

// ── d-10 / Kon Knueppel ambassador (APPROVED) ─────
const DR_010: ComplianceDisclosure = {
  id: 'dr-010',
  athleteId: 'a-9',
  brandId: 'puma-hoops',
  dealId: 'd-10',
  thresholdState: 'crossed',
  payorAssociationStatus: 'unaffiliated',
  counterparties: {
    athlete: { name: 'Kon Knueppel', school: 'Duke University' },
    brand: { name: 'Nike Hoops', category: 'Footwear & Apparel' },
  },
  arrangementTerms: {
    categories: ['endorsement'],
    servicesGranted: ['Two launch posts + capsule reveal'],
    rightsGranted: ['Paid social usage (90 days)'],
    durationDays: 730,
    renewable: true,
    exclusivityScope: 'Footwear category-exclusive',
  },
  compensation: {
    totalCents: { cents: 310_000_00, currency: 'USD' },
    structure: 'flat',
    paymentSchedule: {
      atSignature: 124_000_00,
      atContentProof: 124_000_00,
      atFinalReport: 62_000_00,
    },
  },
  serviceProviders: [],
  attachments: [
    { id: 'att-010-1', label: 'Signed term sheet', state: 'attached' },
    { id: 'att-010-2', label: 'Bylaw 22 payor questionnaire', state: 'attached' },
    { id: 'att-010-3', label: 'Athlete attestation form', state: 'attached' },
  ],
  attestation: {
    athleteSigned: true,
    signedAt: '2026-03-15T19:00:00.000Z',
    statementId: 'stmt-2026-duke-v3',
  },
  actionHistory: [
    actionEntry('h-010-1', 'created', 'athlete', 'Kon Knueppel', '2026-03-08T11:00:00.000Z'),
    actionEntry('h-010-2', 'submitted', 'athlete', 'Kon Knueppel', '2026-03-15T19:00:00.000Z'),
    actionEntry('h-010-3', 'reviewed', 'school', 'D. Roach (compliance)', '2026-03-18T13:00:00.000Z'),
  ],
  reviewState: 'approved',
  source: syntheticSource('src-dr-010', 'Hand-authored approved fixture'),
  cscNote: CSC_DISCIPLINE_NOTE,
};

// ── d-11 / JuJu Watkins flagship (APPROVED) ─────
const DR_011: ComplianceDisclosure = {
  id: 'dr-011',
  athleteId: 'a-15',
  brandId: 'puma-hoops',
  dealId: 'd-11',
  thresholdState: 'crossed',
  payorAssociationStatus: 'unaffiliated',
  counterparties: {
    athlete: { name: 'JuJu Watkins', school: 'University of Southern California' },
    brand: { name: 'Nike Hoops', category: 'Footwear & Apparel' },
    agentOfRecord: { name: 'Excel Sports Management', firm: 'Excel Sports' },
  },
  arrangementTerms: {
    categories: ['endorsement', 'merch-licensing', 'appearance'],
    servicesGranted: [
      'JW signature line co-design',
      'Five global appearance slots per year',
      'Twelve approved social posts (TikTok + IG)',
    ],
    rightsGranted: [
      'Global paid social usage (180 days)',
      'Co-branded apparel line rights',
    ],
    durationDays: 730,
    renewable: true,
    exclusivityScope: 'Multi-category — footwear, apparel, sportswear (global exclusive)',
  },
  compensation: {
    totalCents: { cents: 700_000_00, currency: 'USD' },
    structure: 'mixed',
    paymentSchedule: {
      atSignature: 250_000_00,
      atContentProof: 350_000_00,
      atFinalReport: 100_000_00,
    },
  },
  serviceProviders: [
    { name: 'Excel Sports Management', role: 'Agent of record', compensationCents: { cents: 70_000_00, currency: 'USD' } },
  ],
  attachments: [
    { id: 'att-011-1', label: 'Countersigned multi-year agreement', state: 'attached' },
    { id: 'att-011-2', label: 'Bylaw 22 payor questionnaire', state: 'attached' },
    { id: 'att-011-3', label: 'Athlete attestation form', state: 'attached' },
    { id: 'att-011-4', label: 'Signature line royalty schedule', state: 'attached' },
  ],
  attestation: {
    athleteSigned: true,
    signedAt: '2026-02-26T15:00:00.000Z',
    statementId: 'stmt-2026-usc-v1',
  },
  actionHistory: [
    actionEntry('h-011-1', 'created', 'athlete', 'JuJu Watkins', '2026-02-12T10:00:00.000Z'),
    actionEntry('h-011-2', 'submitted', 'athlete', 'JuJu Watkins', '2026-02-26T15:00:00.000Z'),
    actionEntry('h-011-3', 'reviewed', 'school', 'USC NIL desk', '2026-03-02T16:00:00.000Z', 'Cleared with global usage carve-out.'),
  ],
  reviewState: 'approved',
  source: syntheticSource('src-dr-011', 'Hand-authored flagship approved fixture'),
  cscNote: CSC_DISCIPLINE_NOTE,
};

// ── d-12 / Hannah Hidalgo (SCHOOL-REVIEW) ─────
const DR_012: ComplianceDisclosure = {
  id: 'dr-012',
  athleteId: 'a-16',
  brandId: 'puma-hoops',
  dealId: 'd-12',
  thresholdState: 'crossed',
  payorAssociationStatus: 'unaffiliated',
  counterparties: {
    athlete: { name: 'Hannah Hidalgo', school: 'University of Notre Dame' },
    brand: { name: 'Nike Hoops', category: 'Footwear & Apparel' },
  },
  arrangementTerms: {
    categories: ['endorsement'],
    servicesGranted: ['Pre-season reveal + 5 launch posts'],
    rightsGranted: ['Paid social usage (90 days)'],
    durationDays: 730,
    renewable: true,
    exclusivityScope: 'Footwear & apparel category-exclusive',
  },
  compensation: {
    totalCents: { cents: 420_000_00, currency: 'USD' },
    structure: 'flat',
    paymentSchedule: {
      atSignature: 126_000_00,
      atContentProof: 210_000_00,
      atFinalReport: 84_000_00,
    },
  },
  serviceProviders: [],
  attachments: [
    { id: 'att-012-1', label: 'Signed term sheet', state: 'attached' },
    { id: 'att-012-2', label: 'Bylaw 22 payor questionnaire', state: 'attached' },
    { id: 'att-012-3', label: 'Athlete attestation form', state: 'attached' },
  ],
  attestation: {
    athleteSigned: true,
    signedAt: '2026-04-26T14:30:00.000Z',
    statementId: 'stmt-2026-nd-v1',
  },
  actionHistory: [
    actionEntry('h-012-1', 'created', 'athlete', 'Hannah Hidalgo', '2026-04-22T09:00:00.000Z'),
    actionEntry('h-012-2', 'submitted', 'athlete', 'Hannah Hidalgo', '2026-04-26T14:30:00.000Z'),
    actionEntry('h-012-3', 'school-acknowledged', 'school', 'ND NIL desk', '2026-04-28T10:00:00.000Z', 'Entered school-review queue.'),
  ],
  reviewState: 'school-review',
  source: syntheticSource('src-dr-012', 'Hand-authored school-review fixture'),
  cscNote: CSC_DISCIPLINE_NOTE,
};

// ── d-13 / Ryan Williams football (SUBMITTED) ─────
const DR_013: ComplianceDisclosure = {
  id: 'dr-013',
  athleteId: 'a-18',
  brandId: 'puma-hoops',
  dealId: 'd-13',
  thresholdState: 'crossed',
  payorAssociationStatus: 'pending-verification',
  counterparties: {
    athlete: { name: 'Ryan Williams', school: 'University of Alabama' },
    brand: { name: 'Nike', category: 'Footwear & Apparel' },
  },
  arrangementTerms: {
    categories: ['endorsement'],
    servicesGranted: ['Two short-video deliverables', 'Pre-season reveal post'],
    rightsGranted: ['SEC market usage, season-long boost'],
    durationDays: 365,
    renewable: true,
    exclusivityScope: 'Footwear/training-shoe category-exclusive',
  },
  compensation: {
    totalCents: { cents: 390_000_00, currency: 'USD' },
    structure: 'flat',
    paymentSchedule: {
      atSignature: 156_000_00,
      atContentProof: 156_000_00,
      atFinalReport: 78_000_00,
    },
  },
  serviceProviders: [],
  attachments: [
    { id: 'att-013-1', label: 'Signed term sheet', state: 'attached' },
    { id: 'att-013-2', label: 'Bylaw 22 payor questionnaire', state: 'pending' },
    { id: 'att-013-3', label: 'Athlete attestation form', state: 'attached' },
  ],
  attestation: {
    athleteSigned: true,
    signedAt: '2026-05-01T13:30:00.000Z',
    statementId: 'stmt-2026-alabama-v1',
  },
  actionHistory: [
    actionEntry('h-013-1', 'created', 'athlete', 'Ryan Williams', '2026-04-25T15:00:00.000Z'),
    actionEntry('h-013-2', 'submitted', 'athlete', 'Ryan Williams', '2026-05-01T13:30:00.000Z'),
  ],
  reviewState: 'submitted',
  source: syntheticSource('src-dr-013', 'Hand-authored submitted football fixture'),
  cscNote: CSC_DISCIPLINE_NOTE,
};

// ── d-14 / RJ Davis senior-year (APPROVED) ─────
const DR_014: ComplianceDisclosure = {
  id: 'dr-014',
  athleteId: 'a-12',
  brandId: 'puma-hoops',
  dealId: 'd-14',
  thresholdState: 'crossed',
  payorAssociationStatus: 'unaffiliated',
  counterparties: {
    athlete: { name: 'RJ Davis', school: 'University of North Carolina' },
    brand: { name: 'Nike Hoops', category: 'Footwear & Apparel' },
  },
  arrangementTerms: {
    categories: ['endorsement'],
    servicesGranted: ['Six in-season posts'],
    rightsGranted: ['ACC market usage, approved cutdowns'],
    durationDays: 365,
    renewable: false,
    exclusivityScope: 'Footwear category-exclusive — senior year only',
  },
  compensation: {
    totalCents: { cents: 240_000_00, currency: 'USD' },
    structure: 'flat',
    paymentSchedule: {
      atSignature: 72_000_00,
      atContentProof: 120_000_00,
      atFinalReport: 48_000_00,
    },
  },
  serviceProviders: [],
  attachments: [
    { id: 'att-014-1', label: 'Signed term sheet', state: 'attached' },
    { id: 'att-014-2', label: 'Bylaw 22 payor questionnaire', state: 'attached' },
    { id: 'att-014-3', label: 'Athlete attestation form', state: 'attached' },
  ],
  attestation: {
    athleteSigned: true,
    signedAt: '2026-03-04T16:00:00.000Z',
    statementId: 'stmt-2026-unc-v1',
  },
  actionHistory: [
    actionEntry('h-014-1', 'created', 'athlete', 'RJ Davis', '2026-02-25T10:00:00.000Z'),
    actionEntry('h-014-2', 'submitted', 'athlete', 'RJ Davis', '2026-03-04T16:00:00.000Z'),
    actionEntry('h-014-3', 'reviewed', 'school', 'UNC NIL desk', '2026-03-08T11:00:00.000Z'),
  ],
  reviewState: 'approved',
  source: syntheticSource('src-dr-014', 'Hand-authored approved fixture'),
  cscNote: CSC_DISCIPLINE_NOTE,
};

// ── d-15 / Donnie Freeman rookie (DRAFT) ─────
const DR_015: ComplianceDisclosure = {
  id: 'dr-015',
  athleteId: 'a-10',
  brandId: 'puma-hoops',
  dealId: 'd-15',
  thresholdState: 'aggregating',
  payorAssociationStatus: 'unaffiliated',
  counterparties: {
    athlete: { name: 'Donnie Freeman', school: 'Syracuse University' },
    brand: { name: 'Nike Hoops', category: 'Footwear & Apparel' },
  },
  arrangementTerms: {
    categories: ['endorsement'],
    servicesGranted: ['Two creator posts with disclosure'],
    rightsGranted: ['Approved cutdowns only'],
    durationDays: 365,
    renewable: true,
  },
  compensation: {
    totalCents: { cents: 95_000_00, currency: 'USD' },
    structure: 'flat',
    paymentSchedule: {
      atSignature: 47_500_00,
      atContentProof: 0,
      atFinalReport: 47_500_00,
    },
  },
  serviceProviders: [],
  attachments: [
    { id: 'att-015-1', label: 'Draft term sheet', state: 'attached' },
    { id: 'att-015-2', label: 'Bylaw 22 payor questionnaire', state: 'pending' },
    { id: 'att-015-3', label: 'Athlete attestation form', state: 'missing' },
  ],
  attestation: {
    athleteSigned: false,
  },
  actionHistory: [
    actionEntry('h-015-1', 'created', 'athlete', 'Donnie Freeman', '2026-05-07T14:00:00.000Z'),
    actionEntry('h-015-2', 'edited', 'athlete', 'Donnie Freeman', '2026-05-08T10:30:00.000Z', 'Drafted initial scope; awaiting agent review before submission.'),
  ],
  reviewState: 'draft',
  source: syntheticSource('src-dr-015', 'Hand-authored draft rookie fixture'),
  cscNote: CSC_DISCIPLINE_NOTE,
};

// ── EXPORTS ──────────────────────────────────────────────

export const MOCK_DISCLOSURES: ComplianceDisclosure[] = [
  DR_001,
  DR_002,
  DR_003,
  DR_004,
  DR_005,
  DR_006,
  DR_007,
  DR_008,
  DR_009,
  DR_010,
  DR_011,
  DR_012,
  DR_013,
  DR_014,
  DR_015,
];

export const MOCK_DISCLOSURES_BY_ID: Record<string, ComplianceDisclosure> =
  MOCK_DISCLOSURES.reduce<Record<string, ComplianceDisclosure>>((acc, d) => {
    acc[d.id] = d;
    return acc;
  }, {});

export function getMockDisclosure(id: string): ComplianceDisclosure | null {
  return MOCK_DISCLOSURES_BY_ID[id] ?? null;
}

export function listMockDisclosuresForAthlete(
  athleteId: string,
): ComplianceDisclosure[] {
  return MOCK_DISCLOSURES.filter((d) => d.athleteId === athleteId);
}
