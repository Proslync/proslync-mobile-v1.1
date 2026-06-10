/**
 * NIL deal — canonical 9-state lifecycle + 3-track compliance review.
 *
 * Anchors:
 *   - W21: NIL Deal Detail page
 *   - S7:  Basic NIL Workflow (signed MVP)
 *   - NILPOC layer-2 state machine (terminal trio)
 *
 * Spec: research-plane/cross-pollinators/schema-candidates/nil-deal.md
 *
 * Reuse: deprecates lib/data/mock-nil-manager-data.ts:NilDealCompact
 *        (mock keeps an alias re-export until S2.2 ships consuming this type).
 */

export type DealStage =
  /** Brand published the deal; nobody has engaged yet. */
  | 'open'
  /** Athlete or agent applied. */
  | 'applied'
  /** Brand reviewing applicants. */
  | 'reviewing'
  /** Terms in motion between brand and athlete. */
  | 'negotiating'
  /** Verbal/contract intent locked. */
  | 'committed'
  /** Contract active, deliverables in flight. */
  | 'live'
  /** Deliverables completed by athlete. */
  | 'delivered'
  /** Payment + receipts closed. */
  | 'settled'
  /** Contested; out-of-band review. */
  | 'disputed';

export type DealReviewStatus = 'pending' | 'cleared' | 'flagged' | 'rejected';

/**
 * One review track on a deal. A canonical Proslync deal carries three
 * independent review tracks (NCAA / school / ethics) — see `NilDeal.ncaaReview`,
 * `schoolReview`, `ethicsReview`.
 *
 * The `compliance.types.ts` `ReviewTrack` is a sibling shape; consolidation
 * pending Q8 in PLAN.md §9.
 */
export interface DealReviewTrack {
  status: DealReviewStatus;
  reviewer?: string;
  note?: string;
  /** ISO 8601 timestamp. */
  reviewedAt?: string;
}

export interface NilDeliverableRef {
  id: string;
}

/**
 * Canonical NIL deal record.
 *
 * Currency convention: all amounts are integer cents (`amountCents`) to
 * avoid float drift. UI converts on display.
 */
import type {
  DealRightsLiteracy,
  DealTransferPolicy,
  FundingSourceKind,
  NilActivationRequirement,
  NilCategory,
  PaymentConfidence,
} from './activation.types';

export interface NilDeal {
  id: string;
  athleteId: string;
  brandId: string;
  stage: DealStage;
  nilCategory?: NilCategory;
  amountCents: number;
  fundingSource?: FundingSourceKind;
  paymentConfidence?: PaymentConfidence;
  transferPolicy?: DealTransferPolicy;
  rightsLiteracy?: DealRightsLiteracy;
  /** ISO 8601 (date or datetime). */
  startDate?: string;
  /** ISO 8601 (date or datetime). */
  endDate?: string;
  exclusivity?: string;
  contractStatus: 'pending' | 'signed' | 'expired';
  ncaaReview: DealReviewTrack;
  schoolReview: DealReviewTrack;
  ethicsReview: DealReviewTrack;
  deliverables: NilDeliverableRef[];
  activationRequirements?: NilActivationRequirement[];
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** ISO 8601 timestamp. */
  updatedAt: string;
}
