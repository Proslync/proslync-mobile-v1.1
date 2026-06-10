// ── COMPARABLE DEAL EVIDENCE ──────────────────────────────
// NILComp-inspired shape (MIT, attributed) for the Proslync evidence
// packet primitive. Comparable deals are *reviewable* evidence — every
// row carries rationale, freshness, a source reference, and a reviewer
// state so a brand, AD, NIL Manager, or compliance reviewer can audit
// the recommendation rather than trust an opaque AI score.
//
// Source attribution: NILComp (MIT) — shape inspired by its comparable
// schema. No code copied; types redesigned around Proslync's TrustMeta /
// SourceRef policy. See PLAN.md §5b and §6 for donor posture.

import type { ProfileRole } from '@/lib/providers/role-provider';

/** Money amount in integer cents to avoid float drift. */
export interface MoneyAmount {
  cents: number;
  currency: 'USD';
}

/** Source-of-truth tag for a comparable-deal field or evidence row. */
export type ComparableDealSourceKind =
  | 'public-disclosure'      // disclosed via NIL Go / public CSC packet
  | 'press-release'          // brand or athlete press release
  | 'aggregator'             // CalMatters, Knight-Newhouse, EADA, NILComp
  | 'self-reported'          // athlete-reported, not yet verified
  | 'platform-internal'      // anonymized aggregate from Proslync platform
  | 'synthetic';             // hand-authored fixture for demo only

export interface ComparableDealSourceRef {
  id: string;
  label: string;
  kind: ComparableDealSourceKind;
  retrievedAt: string;         // ISO 8601
  freshnessDays: number;       // 0 = today, higher = older
  citationUrl?: string;
  caveat?: string;
}

/** Reviewer lifecycle for a comparable-deal evidence row. */
export type ComparableDealReviewerState =
  | 'auto-suggested'
  | 'pending-review'
  | 'approved'
  | 'rejected';

/** Confidence band for a numeric estimate. */
export type ComparableDealConfidence = 'low' | 'medium' | 'high';

export interface ComparableDealAthleteContext {
  id: string;
  displayName: string;
  sport: string;
  schoolOrTeam: string;
  followerReach?: number;       // aggregate across platforms, optional
  classYearOrPro?: string;
}

export interface ComparableDealBrandContext {
  id: string;
  displayName: string;
  category: string;
  headquarters?: string;
}

export interface ComparableDealRow {
  id: string;
  inputDealId: string;          // anchor: which deal this comp informs
  athlete: ComparableDealAthleteContext;
  brand: ComparableDealBrandContext;
  amount: MoneyAmount;
  /** e.g. "endorsement", "affiliate", "appearance" — matches `NilCategory`. */
  nilCategory: string;
  /** ISO 8601 calendar date the deal was reported as live. */
  dealReportedAt: string;
  /** One-sentence reason this row is a credible comparable. */
  rationale: string;
  /** Optional caveats that should be visible before relying on the row. */
  caveats: string[];
  /** Where the row's numbers and parties come from. */
  source: ComparableDealSourceRef;
  /** Reviewer lifecycle — defaults to 'auto-suggested'. */
  reviewerState: ComparableDealReviewerState;
  /** Optional reviewer note (who decided, when, why). */
  reviewerNote?: string;
}

export interface ComparableDealSummary {
  /** Subject deal id this packet anchors to. */
  inputDealId: string;
  /** Suggested midpoint estimate, when at least one comp has reviewer-approved state. */
  estimate?: MoneyAmount;
  /** Range, expressed as low/high midpoints. */
  range?: { low: MoneyAmount; high: MoneyAmount };
  /** Confidence band on the estimate. */
  confidence: ComparableDealConfidence;
  /** One-sentence summary the UI can render under the score. */
  summary: string;
  /** Per-role caveats — visible to whichever role is viewing. */
  perRoleCaveats?: Partial<Record<ProfileRole, string>>;
}

/** Full evidence packet payload — rows + summary + attribution. */
export interface ComparableDealEvidence {
  summary: ComparableDealSummary;
  rows: ComparableDealRow[];
  attribution: {
    schemaSource: 'NILComp';
    schemaLicense: 'MIT';
    note: string;
  };
  updatedAt: string;
}
