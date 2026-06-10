/**
 * Open deal — brand-posted deal that athletes apply to.
 *
 * Anchors:
 *   - W24: brands post open deals; athletes apply; brands review and rank;
 *          AI analyzes applicants and recommends best fit
 *   - S1:  AI-Powered Brand Matching Engine (signed MVP)
 *
 * Spec: research-plane/cross-pollinators/schema-candidates/open-deal.md
 *
 * Reuse: cross-refs `comparable-deal` for AI ranking evidence; converts to
 *        `NilDeal` when an applicant is `selected`.
 */

import type {
  DealRightsLiteracy,
  DisclosureMode,
  FundingSourceKind,
  NilActivationRequirement,
  NilCategory,
} from './activation.types';
import type { MoneyAmount } from './comparable-deal.types';
import type { ConfidenceLevel } from './marketplace.types';

/**
 * Open-deal lifecycle.
 *
 * The original three-stage set (`'draft' | 'open' | 'reviewing' |
 * 'closed-filled' | 'closed-cancelled'`) is preserved for backward
 * compatibility with the marketplace barrel and existing backend
 * contract. Sprint 2.3 adds the buyer-facing `'live' | 'awarded' |
 * 'closed'` literals so the iOS Brand HQ surface can render a status
 * pill that maps cleanly to the post → review → award flow without
 * re-encoding the backend-side `closed-filled` / `closed-cancelled`
 * distinction.
 *
 * Convention:
 *   - 'draft'    → not yet visible to athletes
 *   - 'open'     → backend-side "applications accepting" (synonym for 'live')
 *   - 'live'     → buyer-side "applications accepting" (Sprint 2.3 alias)
 *   - 'reviewing'→ applications closed, ranking + decision in flight
 *   - 'awarded'  → applicant selected; conversion to NilDeal pending
 *   - 'closed-filled' / 'closed-cancelled' → backend-side terminal
 *   - 'closed'   → buyer-side terminal (Sprint 2.3 alias)
 */
export type OpenDealStatus =
  | 'draft'
  | 'open'
  | 'live'
  | 'reviewing'
  | 'awarded'
  | 'closed'
  | 'closed-filled'
  | 'closed-cancelled';

export type ApplicationStatus =
  | 'submitted'
  | 'shortlisted'
  | 'rejected'
  | 'selected'
  | 'withdrawn';

export type OpenDealSelectionPolicy =
  /** First applicant fitting threshold gets selected. */
  | 'first-fit'
  /** Brand manually shortlists, then picks. */
  | 'shortlist-then-pick'
  /** AI ranks applicants, brand picks from ranked shortlist. */
  | 'ai-ranked-shortlist';

/**
 * Desired-attributes filter on the open-deal post. All fields optional —
 * empty filter = open to all athletes.
 */
export interface OpenDealDesiredAttributes {
  sports?: string[];
  classYears?: string[];
  minFollowerCount?: number;
  schoolIds?: string[];
  states?: string[];
}

export interface OpenDeal {
  id: string;
  brandId: string;
  title: string;
  /** Matches `Brand.category` vocabulary. */
  category: string;
  /** Canonical NIL category used for reporting, hero copy, and backend joins. */
  nilCategory?: NilCategory;
  briefMarkdown: string;
  budgetMinCents: number;
  budgetMaxCents: number;
  exclusivityRequired: boolean;
  activationRequirements?: NilActivationRequirement[];
  /** ISO 8601 datetime. */
  applicationOpensAt: string;
  /** ISO 8601 datetime. */
  applicationClosesAt: string;
  status: OpenDealStatus;
  selectionPolicy: OpenDealSelectionPolicy;
  desiredAttributes: OpenDealDesiredAttributes;
  /** Denormalized counter — kept fresh by the backend. */
  applicationCount: number;
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** ISO 8601 timestamp. */
  updatedAt: string;
}

/**
 * AI ranking output for one application. Backend-track owns the scoring;
 * front-end surfaces ranks + rationale.
 */
export interface AIRankingSnapshot {
  /** 0–100, higher = better fit. */
  score: number;
  /** Names of the rationale factors driving the score; ordered by weight desc. */
  rationaleTags: string[];
  /** Human-readable AI explanation (~120 chars). */
  rationaleSummary: string;
  confidence: ConfidenceLevel;
  /** ISO 8601 timestamp; redo if stale. */
  generatedAt: string;
  /** Cite-back to ComparableDeal evidence used in scoring. */
  comparableDealIds?: string[];
}

export interface OpenDealApplication {
  id: string;
  openDealId: string;
  athleteId: string;
  status: ApplicationStatus;
  pitchMarkdown: string;
  /** Freeform until tied to NilDeliverable types. */
  proposedDeliverables: string[];
  askCents?: number;
  rightsLiteracy?: DealRightsLiteracy;
  workloadWindow?: string;
  aiRanking?: AIRankingSnapshot;
  /** ISO 8601 timestamp. */
  appliedAt: string;
  /** ISO 8601 timestamp; set when status moves out of 'submitted'/'shortlisted'. */
  decidedAt?: string;
}

// ── Sprint 2.3 buyer-surface additions ──────────────────────
// These shapes live alongside the wire types above. They sit closer to
// the iOS surface — `MoneyAmount`-shaped budget range, denormalized
// brand context, activation hints surfaced on the deal card. The
// canonical persistence shapes (`OpenDeal`, `OpenDealApplication`) stay
// untouched; the buyer-surface fixtures in `lib/data/mock-open-deals.ts`
// adapt to both.

/** Money-shaped budget band. Both bounds in integer cents. */
export interface OpenDealBudget {
  low: MoneyAmount;
  high: MoneyAmount;
}

/**
 * Synthetic / source posture tag for a fixture row. Mirrors
 * `ComparableDealSourceKind` precedent so every mocked OpenDeal carries
 * an honest "synthetic" tag in the UI footer.
 */
export type OpenDealSourceKind =
  | 'synthetic'
  | 'public-disclosure'
  | 'press-release'
  | 'platform-internal';

export interface OpenDealSourceRef {
  kind: OpenDealSourceKind;
  /** Short human label rendered in the card footer. */
  label: string;
  /** Optional caveat — surfaced inline with the badge. */
  caveat?: string;
}

/**
 * Brand-side surface projection of an OpenDeal. Wraps the canonical
 * `OpenDeal` shape with the buyer-surface fields the iOS Brand HQ
 * route renders directly.
 */
export interface OpenDealSurfaceRecord {
  /** Canonical persistence shape. */
  deal: OpenDeal;
  /** Denormalized brand label for the hero — saves a join in the UI. */
  brandLabel: string;
  /** Budget band as `MoneyAmount` pairs (integer cents). */
  budget: OpenDealBudget;
  /** Slots open for award. */
  slots: number;
  /** ISO 8601. Mirrors `OpenDeal.applicationOpensAt` for ease of render. */
  postedAt: string;
  /** ISO 8601. Mirrors `OpenDeal.applicationClosesAt`. */
  deadline: string;
  /** Disclosure modes required for the activation. */
  disclosureModes: DisclosureMode[];
  /** Funding source — drives compliance routing downstream. */
  fundingSource: FundingSourceKind;
  /** Honest provenance tag for the card footer. */
  source: OpenDealSourceRef;
  /** Applicant pool tied to existing `BRAND_ATHLETES` ids. */
  applicants: OpenDealApplication[];
}

/**
 * Brand-side review action surfaced on each applicant row. Visual-only
 * in Sprint 2.3 (no state mutation), but typed so the next slice can
 * promote it to a real reviewer-state transition.
 */
export type OpenDealApplicantReviewAction = 'approve' | 'skip' | 'reject';
