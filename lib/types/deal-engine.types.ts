// lib/types/deal-engine.types.ts
// Type definitions for the NIL Deal Engine — Phase D1.
// Fee model: BRAND-SIDE only; athlete receives 100% of deal amount.

// ── Contract templates ────────────────────────────────────────────────────

export type ContractKind =
  | 'endorsement'
  | 'social-post'
  | 'appearance'
  | 'autograph'
  | 'licensing';

export interface ContractTemplate {
  id: string;
  kind: ContractKind;
  /** Semver-style version string, e.g. "1.0" */
  version: string;
  /** Human-readable title */
  title: string;
  /** Short description shown on the picker card */
  description: string;
  /** Fields the athlete must fill in before signing */
  requiredFields: ContractRequiredField[];
  /**
   * Plain-language summary template.
   * Uses {{variable}} placeholders matching requiredFields keys plus
   * built-in context: {{athleteName}}, {{brandName}}, {{dealId}},
   * {{termStart}}, {{termEnd}}, {{amountDollars}}, {{brandFee}},
   * {{brandTotal}}.
   */
  plainSummary: string;
}

export interface ContractRequiredField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  /** For 'select' fields */
  options?: string[];
  placeholder?: string;
}

// ── Milestones ────────────────────────────────────────────────────────────

export type MilestoneStatus =
  | 'pending'
  | 'submitted'
  | 'approved'
  | 'auto-approved'
  | 'disputed'
  | 'paid';

export type DeliverableType =
  | 'post'
  | 'video'
  | 'appearance'
  | 'asset-delivery'
  | 'other';

export type VerificationMethod = 'self-report' | 'platform' | 'brand-confirm';

export interface EngineMilestone {
  id: string;
  description: string;
  dueISO: string;
  deliverableType: DeliverableType;
  verificationMethod: VerificationMethod;
  amountCents: number;
  status: MilestoneStatus;
  /** Present when status is submitted, approved, auto-approved, disputed, or paid */
  submittedISO?: string;
  /** Present when status is approved or paid */
  approvedISO?: string;
  /** Present when status is disputed */
  disputeReason?: string;
  /** Present when status is paid */
  paidISO?: string;
  /** ISO of the +72h auto-approve deadline (computed from submittedISO) */
  autoApproveAt?: string;
}

// ── Deal events (append-only audit feed) ─────────────────────────────────

export type DealEventKind =
  | 'created'
  | 'template-selected'
  | 'fields-submitted'
  | 'summary-acknowledged'
  | 'signed'
  | 'brand-countersigned'
  | 'escrow-funded'
  | 'milestone-submitted'
  | 'milestone-approved'
  | 'milestone-auto-approved'
  | 'milestone-disputed'
  | 'milestone-paid'
  | 'deal-completed'
  | 'deal-disputed'
  | 'note-added';

export interface DealEvent {
  /** ISO 8601 timestamp */
  at: string;
  /** Actor role: "athlete", "brand", "platform", "system" */
  actor: string;
  kind: DealEventKind;
  note?: string;
  /** IP address logged at signing events */
  ip?: string;
  /** Milestone ID if event is milestone-scoped */
  milestoneId?: string;
}

// ── Escrow ────────────────────────────────────────────────────────────────

export type EscrowState =
  | 'unfunded'
  | 'funded'
  | 'partially-released'
  | 'released';

export interface DealEscrow {
  state: EscrowState;
  /** Total amount funded into escrow in cents */
  fundedCents: number;
  /** Amount released to athlete so far in cents */
  releasedCents: number;
}

// ── Main deal object ──────────────────────────────────────────────────────

export type EngineDealStatus =
  | 'draft'
  | 'awaiting-signature'
  | 'signed'
  | 'escrow-funded'
  | 'active'
  | 'completed'
  | 'disputed';

export type PaymentScheduleKind = 'single' | 'installments' | 'milestone';

export interface EngineDeal {
  dealId: string;
  templateId: string;
  /** Template version at signing — immutable */
  templateVersion: string;

  /** Athlete display name */
  athlete: string;
  /** Brand display name */
  brand: string;

  /** Deal value in cents — athlete receives 100% */
  amountCents: number;
  /** Platform fee rate applied to brand (e.g. 0.10) */
  feeRate: number;

  termStart: string;
  termEnd: string;

  deliverableDescription: string;
  exclusivity: boolean;
  /** Accepted exclusivity scope if exclusivity = true */
  exclusivityScope?: string;

  paymentSchedule: PaymentScheduleKind;

  status: EngineDealStatus;

  milestones: EngineMilestone[];

  /** Append-only audit trail */
  events: DealEvent[];

  escrow: DealEscrow;

  /** Field values entered during creation, keyed by ContractRequiredField.key */
  fieldValues: Record<string, string>;

  /** ISO timestamp when athlete signed */
  athleteSignedAt?: string;
  /** Typed name captured at signing */
  athleteSignedName?: string;
  /** SVG path string of signature drawing */
  athleteSignaturePath?: string;

  /** ISO timestamp when brand countersigned (fixture-set or demo action) */
  brandSignedAt?: string;

  /** Whether this deal was created in the demo flow */
  isDemo?: boolean;

  createdAt: string;
  updatedAt: string;
}
