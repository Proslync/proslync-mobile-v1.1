// ── COMPLIANCE DISCLOSURE (NIL Go-shaped) ────────────────
// Sprint 3.4 athlete disclosure packet — the "report this NIL deal" object
// the athlete fills out and the school reviews. Anchored on Mrs. Wilson's
// P5 ask: NIL Go (College Sports Commission, https://nilgo.com/) is the
// exemplar; this packet must be at least as simple but must NEVER claim
// to be an official CSC submission unless that integration is approved
// and built. See PLAN.md §3.4 and §5d.
//
// Field set mirrors NIL Go / Bylaw 22 shape: threshold + aggregating-payor
// state, payor association status, counterparties, arrangement terms,
// compensation + payment schedule, professional service providers,
// attachments, attestation, and full action history.
//
// Schema attribution: original to Proslync. Field naming mirrors
// `ComparableDeal*` and `RiskReport*` (single `MoneyAmount`, single
// `ComparableDealSourceRef`) for cross-screen readability. All money in
// integer cents.

import type {
  ComparableDealSourceRef,
  MoneyAmount,
} from './comparable-deal.types';

// ── ENUMS ────────────────────────────────────────────────

/**
 * NIL Go's $600 threshold + aggregating-payor logic. `below-600` is the
 * exempt band; `aggregating` is the cross-payor accumulation state;
 * `crossed` means the disclosure is mandatory.
 */
export type DisclosureThresholdState =
  | 'below-600'
  | 'aggregating'
  | 'crossed'
  | 'unknown';

/**
 * Bylaw 22 payor-association posture. `school-associated` flags the
 * structured-layering / cap-circumvention review path; `pending-verification`
 * is the "we asked, awaiting receipts" middle state.
 */
export type PayorAssociationStatus =
  | 'unaffiliated'
  | 'school-associated'
  | 'unknown'
  | 'pending-verification';

/** Lifecycle events recorded in the disclosure action history. */
export type DisclosureAction =
  | 'created'
  | 'edited'
  | 'submitted'
  | 'school-acknowledged'
  | 'csc-submitted'
  | 'reviewed'
  | 'amended'
  | 'withdrawn';

/**
 * One row in the action-history audit log. The reviewer-facing render
 * uses `actor.label` + `at` to build a chronological story.
 */
export interface DisclosureActionLogEntry {
  id: string;
  action: DisclosureAction;
  actor: {
    kind: 'athlete' | 'school' | 'csc' | 'system';
    label: string;
  };
  /** ISO 8601 timestamp. */
  at: string;
  note?: string;
}

/** Reviewer state — visible in the packet header chip. */
export type DisclosureReviewState =
  | 'draft'
  | 'submitted'
  | 'school-review'
  | 'approved'
  | 'flagged'
  | 'amended';

/** Compensation structure — flat, milestone, royalty, or mixed. */
export type DisclosureCompensationStructure =
  | 'flat'
  | 'milestone'
  | 'royalty'
  | 'mixed';

/** Attachment lifecycle — `missing` blocks submission; `pending` is in-flight. */
export type DisclosureAttachmentState = 'attached' | 'missing' | 'pending';

// ── COUNTERPARTIES ───────────────────────────────────────

export interface DisclosureCounterparties {
  athlete: {
    name: string;
    school: string;
  };
  brand: {
    name: string;
    category: string;
  };
  agentOfRecord?: {
    name: string;
    firm: string;
  };
}

// ── ARRANGEMENT ──────────────────────────────────────────

export interface DisclosureArrangementTerms {
  /** NIL category tags (e.g. "endorsement", "appearance"). */
  categories: string[];
  /** Services granted to the payor (e.g. "two in-person clinics"). */
  servicesGranted: string[];
  /** Rights granted to the payor (e.g. "social posts, paid usage 90 days"). */
  rightsGranted: string[];
  /** Total deal duration in days. */
  durationDays: number;
  /** Whether the deal includes renewal terms. */
  renewable: boolean;
  /** Optional exclusivity carve-out (e.g. "footwear & apparel, NCAA only"). */
  exclusivityScope?: string;
}

// ── COMPENSATION ─────────────────────────────────────────

/**
 * Per-milestone payment schedule. Numbers are integer cents — kept
 * separate from `MoneyAmount` because every field in the trio is the
 * same currency as the parent total and the UI sums them inline.
 */
export interface DisclosurePaymentSchedule {
  /** Paid at signature / contract execution. */
  atSignature: number;
  /** Paid on content proof / deliverable acceptance. */
  atContentProof: number;
  /** Paid on final settlement / final report. */
  atFinalReport: number;
  /** Free-form notes for any unscheduled or unusual installments. */
  otherDescription?: string;
}

export interface DisclosureNonCashItem {
  label: string;
  estimatedCents: MoneyAmount;
}

export interface DisclosureCompensation {
  totalCents: MoneyAmount;
  structure: DisclosureCompensationStructure;
  paymentSchedule: DisclosurePaymentSchedule;
  nonCashItems?: DisclosureNonCashItem[];
}

// ── PROFESSIONAL SERVICE PROVIDERS ───────────────────────

export interface DisclosureServiceProvider {
  name: string;
  /** e.g. "agent", "tax advisor", "creative producer". */
  role: string;
  compensationCents?: MoneyAmount;
}

// ── ATTACHMENTS ──────────────────────────────────────────

export interface DisclosureAttachment {
  id: string;
  label: string;
  state: DisclosureAttachmentState;
}

// ── ATTESTATION ──────────────────────────────────────────

export interface DisclosureAttestation {
  athleteSigned: boolean;
  /** ISO 8601. */
  signedAt?: string;
  /** Optional reference to the canonical attestation statement record. */
  statementId?: string;
}

// ── TOP-LEVEL ────────────────────────────────────────────

/**
 * NIL Go-shaped athlete disclosure packet. Render as a read-only
 * reviewer view first (Sprint 3.4); editable flow lands later.
 *
 * `cscNote` is always present and must be surfaced in the UI — Proslync
 * is NOT an official CSC submitter unless that integration is approved.
 */
export interface ComplianceDisclosure {
  id: string;
  athleteId: string;
  brandId?: string;
  dealId?: string;
  thresholdState: DisclosureThresholdState;
  payorAssociationStatus: PayorAssociationStatus;
  counterparties: DisclosureCounterparties;
  arrangementTerms: DisclosureArrangementTerms;
  compensation: DisclosureCompensation;
  serviceProviders: DisclosureServiceProvider[];
  attachments: DisclosureAttachment[];
  attestation: DisclosureAttestation;
  actionHistory: DisclosureActionLogEntry[];
  reviewState: DisclosureReviewState;
  /** Source-of-record stamp (mock fixtures use `synthetic`). */
  source: ComparableDealSourceRef;
  /**
   * Always: "Proslync is not an official CSC submitter — this packet is
   * the school's reviewer record." Surface in the UI on every render.
   */
  cscNote: string;
}
