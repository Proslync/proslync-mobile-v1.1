// ── MOCK APPROVAL QUEUE FIXTURE ───────────────────────────
// Sprint 3.9 governance primitive (PLAN.md §3.9). Hand-authored
// Syracuse fixture spanning every `ApprovalQueueItemKind`, with
// state mixed across pending / approved / rejected / blocked /
// expired.
//
// Cross-refs (do not invent new ids — anchor to live fixtures):
//   - OpenDeal applicants → `mock-open-deals.ts`
//       (e.g. `app-od-1-a-1`, `app-od-2-a-2`)
//   - Brand deals → `mock-brand-data.ts` BRAND_DEALS
//       (`d-1` … `d-6`)
//   - Comp evidence rows → `mock-deal-comps.ts` (`cmp-d1-001`, …)
//
// Trust posture re-uses `AiTrustMeta` from `lib/api/ai-review.ts`
// — `provider: 'mock'`, confidence varies, `reviewerState`
// tracks the queue state.
//
// Every row carries a `synthetic`-tagged `ComparableDealSourceRef`
// per the precedent in `mock-deal-comps.ts`.

import type { AiTrustMeta } from '@/lib/api/ai-review';
import type { ComparableDealSourceRef } from '@/lib/types/comparable-deal.types';
import type {
  ApprovalQueue,
  ApprovalQueueCounts,
  ApprovalQueueItem,
  ApprovalQueueItemState,
} from '@/lib/types/approval-queue.types';

const SCHOOL_ID = 'school:syracuse';
const NOW_ISO = '2026-05-10T00:00:00.000Z';

const SYNTHETIC_CAVEAT =
  'Synthetic queue row hand-authored for the Proslync demo. Replace with reviewer-approved data before any external use.';

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
    caveat: SYNTHETIC_CAVEAT,
  };
}

function isoMinusHours(hours: number): string {
  return new Date(Date.parse(NOW_ISO) - hours * 60 * 60 * 1000).toISOString();
}

function isoPlusHours(hours: number): string {
  return new Date(Date.parse(NOW_ISO) + hours * 60 * 60 * 1000).toISOString();
}

/**
 * Build an `AiTrustMeta` whose `reviewerState` tracks the queue
 * state. Mock provider is always `'mock'` until Q13 clears.
 */
function trustFor(
  state: ApprovalQueueItemState,
  confidence: AiTrustMeta['confidence'],
  rationale: string[],
  caveats: string[] = [SYNTHETIC_CAVEAT],
): AiTrustMeta {
  const reviewerState: AiTrustMeta['reviewerState'] =
    state === 'approved'
      ? 'approved'
      : state === 'rejected'
        ? 'rejected'
        : state === 'pending' || state === 'blocked' || state === 'expired'
          ? 'pending-review'
          : 'auto-suggested';
  return {
    provider: 'mock',
    confidence,
    rationale,
    caveats,
    reviewerState,
  };
}

const ITEMS: ApprovalQueueItem[] = [
  // ── Pending (5) ────────────────────────────────────────
  {
    id: 'aq-001',
    kind: 'ai-applicant-rank',
    title: 'AI applicant ranking — Lead Guard Spotlight',
    summary:
      'Mock ranking of 6 applicants for OpenDeal od-1. Top-3 surfaced for reviewer approval before brand outreach.',
    subjectRef: {
      kind: 'open-deal',
      id: 'od-1',
      label: 'Nike · Signature Capsule — Lead Guard Spotlight',
    },
    priority: 'high',
    state: 'pending',
    submittedBy: { actor: 'AI Assistant', role: 'brand' },
    submittedAt: isoMinusHours(3),
    dueBy: isoPlusHours(36),
    blockers: [],
    trustMeta: trustFor('pending', 'medium', [
      'Mock heuristic sorted on surfaced fitScore + audience reach.',
      'No external evidence consulted.',
    ]),
    source: syntheticSource('aq-src-001', 'Synthetic · AI ranking output v0'),
  },
  {
    id: 'aq-002',
    kind: 'compliance-review',
    title: '3-track compliance review — Cooper Flagg renewal',
    summary:
      'Renewal at $520K crosses the high-value band. NCAA/School/Ethics tracks awaiting reviewer decision before re-publish.',
    subjectRef: {
      kind: 'deal',
      id: 'd-6',
      label: 'Cooper Flagg · Duke — $520K renewal',
    },
    priority: 'urgent',
    state: 'pending',
    submittedBy: { actor: 'Tosan E.', role: 'brand' },
    submittedAt: isoMinusHours(5),
    dueBy: isoPlusHours(12),
    blockers: [],
    trustMeta: trustFor('pending', 'high', [
      'Amount-band heuristic flags high-value endorsement renewals.',
      'Verify Bylaw 22 threshold + payor association status.',
    ]),
    source: syntheticSource('aq-src-002', 'Synthetic · AI compliance v0', 1),
  },
  {
    id: 'aq-003',
    kind: 'external-send',
    title: 'Outbound offer letter — Dylan Harper',
    summary:
      'Brand admin requested send of negotiation offer letter to athlete agent. Reviewer gate before SMTP delivery.',
    subjectRef: {
      kind: 'deal',
      id: 'd-1',
      label: 'Dylan Harper · Rutgers — $380K negotiation',
    },
    priority: 'high',
    state: 'pending',
    submittedBy: { actor: 'Maya L.', role: 'brand' },
    submittedAt: isoMinusHours(7),
    dueBy: isoPlusHours(24),
    blockers: [],
    source: syntheticSource('aq-src-003', 'Synthetic · outbound queue v0', 0),
  },
  {
    id: 'aq-004',
    kind: 'deal-change',
    title: 'Deal stage change — Ace Bailey to negotiation',
    summary:
      'Brand requested stage move from `sent` → `negotiation` for d-2 with revised term. Reviewer must confirm before lifecycle update.',
    subjectRef: {
      kind: 'deal',
      id: 'd-2',
      label: 'Ace Bailey · Rutgers — $290K · 2yr exclusive',
    },
    priority: 'normal',
    state: 'pending',
    submittedBy: { actor: 'Maya L.', role: 'brand' },
    submittedAt: isoMinusHours(14),
    blockers: [],
    source: syntheticSource('aq-src-004', 'Synthetic · stage-change v0', 0),
  },
  {
    id: 'aq-005',
    kind: 'disclosure-submission',
    title: 'NIL Go disclosure submission — Jordan Miles',
    summary:
      'Athlete-submitted disclosure packet for d-5. Awaiting school compliance attestation before NIL Go transmit.',
    subjectRef: {
      kind: 'disclosure',
      id: 'disc-d5-001',
      label: 'Jordan Miles · Paul VI — d-5 disclosure',
    },
    priority: 'normal',
    state: 'pending',
    submittedBy: { actor: 'Jordan Miles', role: 'player' },
    submittedAt: isoMinusHours(20),
    dueBy: isoPlusHours(72),
    blockers: [],
    source: syntheticSource(
      'aq-src-005',
      'Synthetic · NIL-Go-shaped disclosure v0',
      1,
    ),
  },

  // ── Approved (3) ───────────────────────────────────────
  {
    id: 'aq-006',
    kind: 'compliance-review',
    title: 'Comparable evidence cleared — d-1 cmp packet',
    summary:
      'Comparable rows for Dylan Harper d-1 reviewed and approved for orientation use. Not yet cleared for external attribution.',
    subjectRef: {
      kind: 'deal',
      id: 'd-1',
      label: 'Dylan Harper · Rutgers — comp evidence',
    },
    priority: 'normal',
    state: 'approved',
    submittedBy: { actor: 'AI Assistant', role: 'school' },
    submittedAt: isoMinusHours(40),
    blockers: [],
    trustMeta: trustFor('approved', 'medium', [
      'Two reviewer-approved comp rows clustering at $36-46K.',
      'Synthetic source still — orientation only.',
    ]),
    source: syntheticSource('aq-src-006', 'Synthetic · comp evidence cmp-d1-001', 2),
    reviewerNote: 'Approved for internal orientation only. Replace before external use.',
    resolvedBy: {
      actor: 'Mrs. Wilson',
      role: 'school',
      at: isoMinusHours(28),
    },
  },
  {
    id: 'aq-007',
    kind: 'ai-applicant-rank',
    title: 'AI ranking approved — EYBL Weekend Affiliate Push',
    summary:
      '4 applicants ranked for od-2; top-2 (a-2, a-4) cleared for brand outreach.',
    subjectRef: {
      kind: 'open-deal',
      id: 'od-2',
      label: 'Nike · EYBL Weekend Affiliate Push',
    },
    priority: 'normal',
    state: 'approved',
    submittedBy: { actor: 'AI Assistant', role: 'brand' },
    submittedAt: isoMinusHours(56),
    blockers: [],
    trustMeta: trustFor('approved', 'medium', [
      'Reviewer accepted the surfaced fit + audience reach ordering.',
    ]),
    source: syntheticSource('aq-src-007', 'Synthetic · AI ranking output v0', 2),
    reviewerNote: 'Top-2 cleared for outreach; bottom-2 deferred.',
    resolvedBy: {
      actor: 'Mrs. Wilson',
      role: 'school',
      at: isoMinusHours(48),
    },
  },
  {
    id: 'aq-008',
    kind: 'external-send',
    title: 'Outbound press packet — Kiyan Anthony renewal',
    summary:
      'Press packet for d-4 signed-renewal cleared and dispatched to brand comms.',
    subjectRef: {
      kind: 'deal',
      id: 'd-4',
      label: 'Kiyan Anthony · Syracuse — $660K renewal packet',
    },
    priority: 'low',
    state: 'approved',
    submittedBy: { actor: 'Tosan E.', role: 'brand' },
    submittedAt: isoMinusHours(72),
    blockers: [],
    source: syntheticSource('aq-src-008', 'Synthetic · outbound queue v0', 3),
    reviewerNote: 'Approved — press packet matches signed terms.',
    resolvedBy: {
      actor: 'Mrs. Wilson',
      role: 'school',
      at: isoMinusHours(64),
    },
  },

  // ── Rejected (1) ───────────────────────────────────────
  {
    id: 'aq-009',
    kind: 'ai-applicant-rank',
    title: 'AI ranking rejected — Naithan George shortlist',
    summary:
      'AI shortlist for d-3 did not surface enough rationale; reviewer rejected pending refresh after compliance + consent confirmation.',
    subjectRef: {
      kind: 'applicant',
      id: 'app-od-1-a-7',
      label: 'Naithan George · GT — od-1 applicant',
    },
    priority: 'normal',
    state: 'rejected',
    submittedBy: { actor: 'AI Assistant', role: 'brand' },
    submittedAt: isoMinusHours(30),
    blockers: [],
    trustMeta: trustFor('rejected', 'low', [
      'Insufficient rationale surfaced for off-tier athlete.',
      'Audience-match heuristic alone is not enough.',
    ]),
    source: syntheticSource('aq-src-009', 'Synthetic · AI ranking output v0', 1),
    reviewerNote: 'Refresh ranking once compliance + consent confirmed; resubmit then.',
    resolvedBy: {
      actor: 'Mrs. Wilson',
      role: 'school',
      at: isoMinusHours(22),
    },
  },

  // ── Blocked (1) ────────────────────────────────────────
  {
    id: 'aq-010',
    kind: 'financial-action',
    title: 'Rev-share disbursement — FY25-26 Q1 reconciliation',
    summary:
      'Quarterly platform fee reconciliation for Proslync ↔ AD rev-share. Blocked pending finance attestation + cap-context reference signature.',
    subjectRef: {
      kind: 'rev-share-entry',
      id: 'rev-syr-fy26-q1',
      label: 'Syracuse — FY25-26 Q1 platform-fee reconciliation',
    },
    priority: 'high',
    state: 'blocked',
    submittedBy: { actor: 'AD Finance Ops', role: 'school' },
    submittedAt: isoMinusHours(48),
    dueBy: isoPlusHours(96),
    blockers: [
      'Finance attestation not yet on file.',
      'House-v.-NCAA cap-context reference signature pending.',
    ],
    trustMeta: trustFor('blocked', 'medium', [
      'Platform-fee math derived from synthetic ledger entries.',
      'Separate from House-v.-NCAA cap (PLAN P4).',
    ]),
    source: syntheticSource('aq-src-010', 'Synthetic · rev-share ledger v0', 4),
  },

  // ── Expired (1) ────────────────────────────────────────
  {
    id: 'aq-011',
    kind: 'disclosure-submission',
    title: 'NIL Go disclosure — expired window',
    summary:
      'Athlete-submitted disclosure packet for d-3 window closed before reviewer decision. Resubmission required.',
    subjectRef: {
      kind: 'disclosure',
      id: 'disc-d3-001',
      label: 'Naithan George · GT — d-3 disclosure',
    },
    priority: 'normal',
    state: 'expired',
    submittedBy: { actor: 'Naithan George', role: 'player' },
    submittedAt: isoMinusHours(140),
    dueBy: isoMinusHours(20),
    blockers: ['Window closed before attestation landed.'],
    source: syntheticSource(
      'aq-src-011',
      'Synthetic · NIL-Go-shaped disclosure v0',
      6,
    ),
    reviewerNote: 'Expired — resubmit with refreshed attachments.',
  },

  // ── Extra pending (deal-change, low priority) ──────────
  {
    id: 'aq-012',
    kind: 'deal-change',
    title: 'Term sheet update — Marcus Reid affiliate slot',
    summary:
      'Brand requested workload-window flex on od-2 application from a-4. Reviewer must confirm before applicant notification.',
    subjectRef: {
      kind: 'applicant',
      id: 'app-od-2-a-4',
      label: 'JJ Starling · Syracuse — od-2 applicant',
    },
    priority: 'low',
    state: 'pending',
    submittedBy: { actor: 'Tosan E.', role: 'brand' },
    submittedAt: isoMinusHours(28),
    blockers: [],
    source: syntheticSource('aq-src-012', 'Synthetic · stage-change v0', 1),
  },

  // ── Phase-C expansion — pending (deal-graph activity) ───
  {
    id: 'aq-013',
    kind: 'compliance-review',
    title: 'Beats add-on category overlap — Kiyan Anthony',
    summary:
      'Audio-category add-on (d-8) flagged against the Nike Hoops master agreement. Carve-out memo missing — blocks activation.',
    subjectRef: { kind: 'deal', id: 'd-8', label: 'Kiyan Anthony · Syracuse — $210K Beats add-on' },
    priority: 'urgent',
    state: 'pending',
    submittedBy: { actor: 'Tosan E.', role: 'brand' },
    submittedAt: isoMinusHours(4),
    dueBy: isoPlusHours(48),
    blockers: ['Nike master-agreement carve-out memo missing.'],
    trustMeta: trustFor('pending', 'high', [
      'Master-agreement category overlap auto-detected by mock reviewer.',
      'Carve-out memo must be attached before activation.',
    ]),
    source: syntheticSource('aq-src-013', 'Synthetic · master-agreement check v0', 0),
  },
  {
    id: 'aq-014',
    kind: 'external-send',
    title: 'BWW ambassador press packet — Cooper Flagg',
    summary:
      'Press packet for d-7 cleared by Duke AD; awaiting brand-comms sign-off before SMTP delivery.',
    subjectRef: { kind: 'deal', id: 'd-7', label: 'Cooper Flagg · Duke — $95K BWW ambassador' },
    priority: 'normal',
    state: 'pending',
    submittedBy: { actor: 'Maya L.', role: 'brand' },
    submittedAt: isoMinusHours(12),
    dueBy: isoPlusHours(36),
    blockers: [],
    source: syntheticSource('aq-src-014', 'Synthetic · outbound queue v0', 1),
  },
  {
    id: 'aq-015',
    kind: 'disclosure-submission',
    title: 'NIL Go disclosure — AJ Dybantsa first signature',
    summary:
      'BYU NIL desk has attestation; awaiting final reviewer flip before transmit.',
    subjectRef: { kind: 'disclosure', id: 'dr-009', label: 'AJ Dybantsa · BYU — d-9 disclosure' },
    priority: 'normal',
    state: 'pending',
    submittedBy: { actor: 'AJ Dybantsa', role: 'player' },
    submittedAt: isoMinusHours(16),
    dueBy: isoPlusHours(54),
    blockers: [],
    source: syntheticSource('aq-src-015', 'Synthetic · NIL-Go-shaped disclosure v0', 0),
  },
  {
    id: 'aq-016',
    kind: 'compliance-review',
    title: 'JuJu Watkins flagship — signature line royalty schedule',
    summary:
      'Royalty schedule for d-11 multi-year flagship awaits AD reviewer signoff.',
    subjectRef: { kind: 'deal', id: 'd-11', label: 'JuJu Watkins · USC — $700K flagship' },
    priority: 'high',
    state: 'pending',
    submittedBy: { actor: 'Tosan E.', role: 'brand' },
    submittedAt: isoMinusHours(9),
    dueBy: isoPlusHours(48),
    blockers: [],
    trustMeta: trustFor('pending', 'high', [
      'Royalty schedule is non-standard — escalated to AD.',
    ]),
    source: syntheticSource('aq-src-016', 'Synthetic · royalty review v0', 0),
  },
  {
    id: 'aq-017',
    kind: 'deal-change',
    title: 'Term update — Hannah Hidalgo two-year extension',
    summary:
      'Brand requested two-year extension on d-12. Routed to ND NIL desk for compliance confirmation.',
    subjectRef: { kind: 'deal', id: 'd-12', label: 'Hannah Hidalgo · Notre Dame — $420K · 2yr' },
    priority: 'normal',
    state: 'pending',
    submittedBy: { actor: 'Maya L.', role: 'brand' },
    submittedAt: isoMinusHours(18),
    blockers: [],
    source: syntheticSource('aq-src-017', 'Synthetic · stage-change v0', 0),
  },
  {
    id: 'aq-018',
    kind: 'external-send',
    title: 'Outbound offer letter — Ryan Williams football',
    summary:
      'Submitted offer letter for d-13 awaiting reviewer sign-off before SMTP delivery to athlete agent.',
    subjectRef: { kind: 'deal', id: 'd-13', label: 'Ryan Williams · Alabama — $390K football' },
    priority: 'high',
    state: 'pending',
    submittedBy: { actor: 'Tosan E.', role: 'brand' },
    submittedAt: isoMinusHours(10),
    dueBy: isoPlusHours(24),
    blockers: [],
    source: syntheticSource('aq-src-018', 'Synthetic · outbound queue v0', 0),
  },
  // ── Phase-C expansion — approved ────────────────────────
  {
    id: 'aq-019',
    kind: 'compliance-review',
    title: 'Comparable evidence cleared — d-9 cmp packet (AJ Dybantsa)',
    summary:
      'Comparable rows for AJ Dybantsa d-9 reviewed and approved for orientation use.',
    subjectRef: { kind: 'deal', id: 'd-9', label: 'AJ Dybantsa · BYU — comp evidence' },
    priority: 'normal',
    state: 'approved',
    submittedBy: { actor: 'AI Assistant', role: 'school' },
    submittedAt: isoMinusHours(34),
    blockers: [],
    trustMeta: trustFor('approved', 'medium', ['Single reviewer-approved comp row at $52K anchor.']),
    source: syntheticSource('aq-src-019', 'Synthetic · comp evidence cmp-d9-001', 1),
    reviewerNote: 'Approved for internal orientation. Replace before external use.',
    resolvedBy: { actor: 'BYU NIL desk', role: 'school', at: isoMinusHours(26) },
  },
  {
    id: 'aq-020',
    kind: 'compliance-review',
    title: '3-track compliance — Kon Knueppel ambassador',
    summary:
      'Three-track review for d-10 cleared by Duke AD desk; activation now live.',
    subjectRef: { kind: 'deal', id: 'd-10', label: 'Kon Knueppel · Duke — $310K ambassador' },
    priority: 'normal',
    state: 'approved',
    submittedBy: { actor: 'Tosan E.', role: 'brand' },
    submittedAt: isoMinusHours(56),
    blockers: [],
    trustMeta: trustFor('approved', 'high', ['Duke AD signed off; no master-agreement conflict.']),
    source: syntheticSource('aq-src-020', 'Synthetic · 3-track review v0', 2),
    reviewerNote: 'Activation cleared.',
    resolvedBy: { actor: 'D. Roach', role: 'school', at: isoMinusHours(40) },
  },
  {
    id: 'aq-021',
    kind: 'external-send',
    title: 'Press packet cleared — Cooper Flagg d-7 BWW',
    summary:
      'BWW ambassador press packet for d-7 dispatched to brand comms after AD signoff.',
    subjectRef: { kind: 'deal', id: 'd-7', label: 'Cooper Flagg · Duke — BWW press packet' },
    priority: 'low',
    state: 'approved',
    submittedBy: { actor: 'Maya L.', role: 'brand' },
    submittedAt: isoMinusHours(80),
    blockers: [],
    source: syntheticSource('aq-src-021', 'Synthetic · outbound queue v0', 3),
    reviewerNote: 'Approved — packet matches d-7 signed terms.',
    resolvedBy: { actor: 'D. Roach', role: 'school', at: isoMinusHours(72) },
  },
  // ── Phase-C expansion — rejected ────────────────────────
  {
    id: 'aq-022',
    kind: 'ai-applicant-rank',
    title: 'AI shortlist rejected — football-side outreach',
    summary:
      'AI shortlist for football-side outreach surfaced too few rationale tokens; reviewer rejected pending refresh.',
    subjectRef: { kind: 'applicant', id: 'app-od-3-a-19', label: 'Jalen Ortiz · Michigan — od-3 applicant' },
    priority: 'normal',
    state: 'rejected',
    submittedBy: { actor: 'AI Assistant', role: 'brand' },
    submittedAt: isoMinusHours(28),
    blockers: [],
    trustMeta: trustFor('rejected', 'low', ['Audience-match heuristic alone is not enough for football side.']),
    source: syntheticSource('aq-src-022', 'Synthetic · AI ranking output v0', 1),
    reviewerNote: 'Refresh ranking once social-reach sync runs.',
    resolvedBy: { actor: 'Mrs. Wilson', role: 'school', at: isoMinusHours(20) },
  },
  // ── Phase-C expansion — blocked ─────────────────────────
  {
    id: 'aq-023',
    kind: 'financial-action',
    title: 'Duke rev-share Q1 reconciliation',
    summary:
      'Duke ledger rev-share Q1 reconciliation pending House-v.-NCAA cap-context signature.',
    subjectRef: { kind: 'rev-share-entry', id: 'rev-duke-fy26-q1', label: 'Duke — FY25-26 Q1 platform-fee reconciliation' },
    priority: 'high',
    state: 'blocked',
    submittedBy: { actor: 'Duke Finance Ops', role: 'school' },
    submittedAt: isoMinusHours(54),
    dueBy: isoPlusHours(96),
    blockers: ['Cap-context reference signature pending.'],
    trustMeta: trustFor('blocked', 'medium', ['Platform-fee math derived from synthetic Duke ledger.']),
    source: syntheticSource('aq-src-023', 'Synthetic · Duke rev-share ledger v0', 3),
  },
  // ── Phase-C expansion — expired ─────────────────────────
  {
    id: 'aq-024',
    kind: 'disclosure-submission',
    title: 'Donnie Freeman draft disclosure — expired',
    summary:
      'Draft disclosure for d-15 was never submitted; window expired before submission. Resubmission required.',
    subjectRef: { kind: 'disclosure', id: 'dr-015', label: 'Donnie Freeman · Syracuse — d-15 draft' },
    priority: 'low',
    state: 'expired',
    submittedBy: { actor: 'Donnie Freeman', role: 'player' },
    submittedAt: isoMinusHours(160),
    dueBy: isoMinusHours(40),
    blockers: ['Submission window closed before attestation landed.'],
    source: syntheticSource('aq-src-024', 'Synthetic · NIL-Go-shaped disclosure v0', 7),
    reviewerNote: 'Expired — resubmit with refreshed attachments.',
  },
  // ── Phase-C expansion — pending ─────────────────────────
  {
    id: 'aq-025',
    kind: 'compliance-review',
    title: 'RJ Davis live activation receipt review',
    summary:
      'd-14 live activation receipts uploaded; awaiting reviewer flip for full close-out.',
    subjectRef: { kind: 'deal', id: 'd-14', label: 'RJ Davis · UNC — $240K · live' },
    priority: 'low',
    state: 'pending',
    submittedBy: { actor: 'Maya L.', role: 'brand' },
    submittedAt: isoMinusHours(22),
    blockers: [],
    source: syntheticSource('aq-src-025', 'Synthetic · activation receipt v0', 0),
  },
  {
    id: 'aq-026',
    kind: 'disclosure-submission',
    title: 'NIL Go disclosure — Hannah Hidalgo',
    summary:
      'ND-side review queue: d-12 disclosure cleared school-acknowledged. Awaiting AD signoff.',
    subjectRef: { kind: 'disclosure', id: 'dr-012', label: 'Hannah Hidalgo · Notre Dame — d-12 disclosure' },
    priority: 'normal',
    state: 'pending',
    submittedBy: { actor: 'Hannah Hidalgo', role: 'player' },
    submittedAt: isoMinusHours(36),
    dueBy: isoPlusHours(36),
    blockers: [],
    source: syntheticSource('aq-src-026', 'Synthetic · NIL-Go-shaped disclosure v0', 1),
  },
  {
    id: 'aq-027',
    kind: 'compliance-review',
    title: 'Naithan George flagged — Bylaw 22 receipts pending',
    summary:
      'GT collective disclosure (dr-005) flagged because payor association status unverified. Awaiting receipts.',
    subjectRef: { kind: 'disclosure', id: 'dr-005', label: 'Naithan George · GT — flagged collective' },
    priority: 'high',
    state: 'pending',
    submittedBy: { actor: 'Naithan George', role: 'player' },
    submittedAt: isoMinusHours(60),
    dueBy: isoPlusHours(24),
    blockers: ['Bylaw 22 payor questionnaire receipts missing.'],
    trustMeta: trustFor('pending', 'medium', ['Auto-flagged on payor-association unknown state.']),
    source: syntheticSource('aq-src-027', 'Synthetic · payor-association reviewer v0', 2),
  },
  {
    id: 'aq-028',
    kind: 'external-send',
    title: 'Outbound press packet — JuJu Watkins flagship reveal',
    summary:
      'Press packet for d-11 flagship reveal awaiting reviewer signoff before dispatch.',
    subjectRef: { kind: 'deal', id: 'd-11', label: 'JuJu Watkins · USC — flagship press' },
    priority: 'normal',
    state: 'pending',
    submittedBy: { actor: 'Tosan E.', role: 'brand' },
    submittedAt: isoMinusHours(14),
    blockers: [],
    source: syntheticSource('aq-src-028', 'Synthetic · outbound queue v0', 0),
  },
  {
    id: 'aq-029',
    kind: 'compliance-review',
    title: 'Kiyan loaner-vehicle amendment — post-review',
    summary:
      'dr-006 amendment uploaded with disclosed loaner non-cash value. Reviewer signoff required for compliance close.',
    subjectRef: { kind: 'disclosure', id: 'dr-006', label: 'Kiyan Anthony · Syracuse — amended local deal' },
    priority: 'low',
    state: 'approved',
    submittedBy: { actor: 'Kiyan Anthony', role: 'player' },
    submittedAt: isoMinusHours(72),
    blockers: [],
    trustMeta: trustFor('approved', 'high', ['Amendment includes disclosed non-cash value.']),
    source: syntheticSource('aq-src-029', 'Synthetic · amendment receipt v0', 3),
    reviewerNote: 'Amendment accepted; compliance close-out registered.',
    resolvedBy: { actor: 'L. Whitcombe', role: 'school', at: isoMinusHours(60) },
  },
  {
    id: 'aq-030',
    kind: 'deal-change',
    title: 'Stage change — Donnie Freeman draft → sent',
    summary:
      'Brand requested move from `draft` → `sent` on d-15. Reviewer must confirm before lifecycle update.',
    subjectRef: { kind: 'deal', id: 'd-15', label: 'Donnie Freeman · Syracuse — $95K rookie' },
    priority: 'low',
    state: 'pending',
    submittedBy: { actor: 'Tosan E.', role: 'brand' },
    submittedAt: isoMinusHours(8),
    blockers: [],
    source: syntheticSource('aq-src-030', 'Synthetic · stage-change v0', 0),
  },
];

function tallyCounts(items: ApprovalQueueItem[]): ApprovalQueueCounts {
  const counts: ApprovalQueueCounts = {
    pending: 0,
    approved: 0,
    rejected: 0,
    blocked: 0,
    expired: 0,
  };
  for (const item of items) {
    counts[item.state] += 1;
  }
  return counts;
}

const SYRACUSE_APPROVAL_QUEUE: ApprovalQueue = {
  schoolId: SCHOOL_ID,
  period: {
    id: 'period-syr-w-2026-05-10',
    label: 'Week of 2026-05-10',
  },
  items: ITEMS,
  counts: tallyCounts(ITEMS),
  updatedAt: NOW_ISO,
};

export const MOCK_APPROVAL_QUEUES: Record<string, ApprovalQueue> = {
  [SCHOOL_ID]: SYRACUSE_APPROVAL_QUEUE,
};

export function getMockApprovalQueue(
  schoolId: string,
): ApprovalQueue | null {
  const queue = MOCK_APPROVAL_QUEUES[schoolId];
  if (!queue) return null;
  // Clone shell + items array so React Query sees a fresh reference on
  // every fetch (mutating the underlying ITEMS array in place via
  // `recordMockDecision` doesn't change the queue object identity).
  return { ...queue, items: [...queue.items], counts: { ...queue.counts } };
}

export function getMockApprovalQueueItem(
  id: string,
): ApprovalQueueItem | null {
  for (const queue of Object.values(MOCK_APPROVAL_QUEUES)) {
    const found = queue.items.find((item) => item.id === id);
    if (found) return found;
  }
  return null;
}

// ── DEMO DECISION RECORDER ───────────────────────────────
// Fallback path for the AD walk "approve one deal" gate test when the
// backend has no seeded approval_queue rows. Mutates the fixture in
// place — refreshed cache reads after the mutation see the new state.
//
// The backend path (POST /api/approval-queue/:id/decide) is preferred
// and authoritative when seeded; this exists so the demo doesn't dead-
// end on an empty backend.

export function recordMockDecision(
  id: string,
  decision: {
    status: Extract<ApprovalQueueItemState, 'approved' | 'rejected'>;
    decidedBy: string;
    decisionNote?: string;
  },
): ApprovalQueueItem | null {
  if (__DEV__) console.log('[recordMockDecision] enter id=' + id, decision);
  for (const queue of Object.values(MOCK_APPROVAL_QUEUES)) {
    const idx = queue.items.findIndex((item) => item.id === id);
    if (__DEV__)
      console.log(
        '[recordMockDecision] queue=' + queue.schoolId + ' idx=' + idx,
      );
    if (idx === -1) continue;
    const prev = queue.items[idx];
    if (__DEV__)
      console.log(
        '[recordMockDecision] prev.state=' + prev.state + ' id=' + prev.id,
      );
    if (prev.state !== 'pending' && prev.state !== 'blocked') {
      if (__DEV__) console.log('[recordMockDecision] state-gate rejected');
      return prev;
    }
    const now = new Date().toISOString();
    const next: ApprovalQueueItem = {
      ...prev,
      state: decision.status,
      reviewerNote: decision.decisionNote ?? prev.reviewerNote,
      resolvedBy: {
        actor: decision.decidedBy,
        role: 'school',
        at: now,
      },
    };
    queue.items[idx] = next;
    queue.counts = tallyCounts(queue.items);
    queue.updatedAt = now;
    return next;
  }
  return null;
}
