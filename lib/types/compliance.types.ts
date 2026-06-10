/**
 * Compliance disclosure — NIL-Go-style athlete-issued disclosure packet.
 *
 * Anchors:
 *   - P5: NIL Go exemplar (https://nilgo.com/, College Sports Commission).
 *         Athlete report-this-deal flow should match.
 *   - P2: Be fully NCAA-aligned, including House v. NCAA settlement.
 *
 * Spec: research-plane/cross-pollinators/schema-candidates/compliance-disclosure.md
 *
 * Reuse: pairs with `nil-deal.types.ts:DealReviewTrack`. Same shape today;
 *        consolidation pending Q8 in PLAN.md §9.
 */

import type {
  DisclosureMode,
  NilActivationPlatform,
  NilCategory,
} from './activation.types';

export type DisclosurePacketStatus =
  | 'draft'
  | 'submitted'
  | 'returned'
  | 'approved'
  | 'rejected'
  | 'voided';

export type ReviewTrackKind = 'ncaa' | 'school' | 'ethics';

export type ReviewStatus =
  | 'pending'
  | 'cleared'
  | 'flagged'
  | 'rejected';

/**
 * One review track on a disclosure packet. The canonical packet carries an
 * array of these (typically 3: ncaa / school / ethics) — array form lets
 * future tracks be added without changing the shape.
 */
export interface ReviewTrack {
  kind: ReviewTrackKind;
  status: ReviewStatus;
  reviewer?: string;
  note?: string;
  /** ISO 8601 timestamp. */
  reviewedAt?: string;
}

export type PaymentSource =
  | 'brand-direct'
  | 'collective'
  | 'agency'
  | 'other';

/**
 * Athlete-issued disclosure packet, modeled after NIL Go's report-this-deal
 * flow.
 */
export interface ComplianceDisclosure {
  id: string;
  athleteId: string;
  /** Optional: disclosures can pre-date deal record. */
  dealId?: string;
  brandName: string;
  brandHandle?: string;
  nilCategory?: NilCategory;
  activationPlatform?: NilActivationPlatform;
  amountCents: number;
  paymentSource: PaymentSource;
  exclusivity: string;
  /** ISO 8601 date. */
  startDate: string;
  /** ISO 8601 date. */
  endDate?: string;
  /** 1–2 sentences. */
  deliverableSummary: string;
  requiredDisclosureModes?: DisclosureMode[];
  contentProofUrls?: string[];
  /** File URLs (contracts, screenshots). */
  attachments: string[];
  status: DisclosurePacketStatus;
  /** Typically 3 entries: ncaa / school / ethics. */
  reviewTracks: ReviewTrack[];
  /** ISO 8601 timestamp. */
  submittedAt?: string;
  /** ISO 8601 timestamp. */
  decidedAt?: string;
  notes?: string;
}

/**
 * What's surfaced on the school / NIL-Manager review queue. Derived from
 * `ComplianceDisclosure` plus cross-cutting flags.
 */
export interface DisclosurePacketSummary {
  disclosureId: string;
  athleteId: string;
  athleteName: string;
  brandName: string;
  amountCents: number;
  status: DisclosurePacketStatus;
  oldestPendingTrack?: ReviewTrackKind;
  daysSinceSubmitted?: number;
  /** Joins to existing `ComplianceFlag` stack. */
  hasOpenFlags: boolean;
}
