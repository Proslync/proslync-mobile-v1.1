/**
 * Brand — full company profile for the brand persona.
 *
 * Anchors:
 *   - W32: Brand company overview (HQ, employees, revenues, products, news)
 *   - W33: Brand roster of athletes with deal drill-down
 *   - W34: Brand calendar
 *   - W35: Brand checklist (events, activities, contractual, renewals)
 *   - W36: Multi-employee logins per brand
 *   - W37: Per-athlete compliance indicator on brand dashboard
 *
 * Spec: research-plane/cross-pollinators/schema-candidates/brand.md
 *
 * Reuse: distinct from `BrandCampaignProfile` in `marketplace.types.ts`,
 *        which is the per-campaign view; this is the company record.
 */

export type BrandTier = 'enterprise' | 'mid' | 'emerging';

export type CompanyStage =
  | 'public'
  | 'private'
  | 'pre-seed'
  | 'seed'
  | 'series-a'
  | 'series-b+';

export interface BrandLocation {
  city: string;
  state: string;
  country: string;
  isHeadquarters: boolean;
}

export interface BrandNewsItem {
  id: string;
  headline: string;
  url: string;
  /** ISO 8601 timestamp. */
  publishedAt: string;
  source: string;
}

export type BrandMemberRole = 'admin' | 'manager' | 'viewer';

/**
 * Multi-employee logins (W36). Final RBAC tenant model pends Q3 in PLAN.md §9.
 */
export interface BrandMember {
  id: string;
  email: string;
  displayName: string;
  role: BrandMemberRole;
  /** ISO 8601 timestamp. */
  joinedAt: string;
}

export type BrandComplianceIndicator = 'green' | 'yellow' | 'red';

/**
 * Denormalized roster rollup (W33). Per-athlete contract drill-down is
 * achieved by querying `NilDeal[]` where `brandId` matches.
 */
export interface BrandRosterEntry {
  athleteId: string;
  liveDealCount: number;
  totalDealValueCents: number;
  /**
   * Derived: 'red' if any deal has flagged ReviewTrack, 'yellow' if any
   * pending, 'green' otherwise. Drives W37 indicator.
   */
  complianceIndicator: BrandComplianceIndicator;
}

export type BrandCalendarKind =
  | 'activation'
  | 'campaign-milestone'
  | 'renewal'
  | 'meeting'
  | 'other';

export interface BrandCalendarEntry {
  id: string;
  title: string;
  /** ISO 8601 datetime. */
  startsAt: string;
  /** ISO 8601 datetime. */
  endsAt?: string;
  kind: BrandCalendarKind;
  /** Optional link to the underlying NIL deal. */
  dealId?: string;
}

export type BrandChecklistCategory =
  | 'event'
  | 'activity'
  | 'contractual'
  | 'renewal';

export interface BrandChecklistItem {
  id: string;
  title: string;
  /** ISO 8601 date. */
  due?: string;
  done: boolean;
  category: BrandChecklistCategory;
}

export interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
  /** Matches the `category` vocabulary on `OpenDeal`. */
  category: string;
  tier: BrandTier;
  stage: CompanyStage;
  hqLocation: BrandLocation;
  locations: BrandLocation[];
  employeeCount?: number;
  annualRevenueCents?: number;
  productsServices: string[];
  recentNews: BrandNewsItem[];
  members: BrandMember[];
  roster: BrandRosterEntry[];
  calendar: BrandCalendarEntry[];
  checklist: BrandChecklistItem[];
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** ISO 8601 timestamp. */
  updatedAt: string;
}
