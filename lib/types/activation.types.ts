/**
 * NIL activation taxonomy — category, platform, disclosure, affiliate, proof,
 * and trust fields shared by OpenDeal, NilDeal, ComplianceDisclosure, and
 * future Commitment objects.
 *
 * Anchors:
 *   - PLAN.md §0b and §5d TikTok/Reddit hub research
 *   - research-plane/cross-pollinators/hub-cross-pollination-tiktok-reddit-2026-05-10.md
 */

export type NilCategory =
  | 'endorsement'
  | 'collective'
  | 'school-revenue-share'
  | 'affiliate'
  | 'merch-licensing'
  | 'fan-subscription'
  | 'appearance'
  | 'podcast-media'
  | 'cohort-summit'
  | 'other';

export type NilActivationPlatform =
  | 'tiktok'
  | 'instagram-reels'
  | 'youtube-shorts'
  | 'x'
  | 'twitch'
  | 'podcast'
  | 'in-person'
  | 'other';

export type ShortVideoContentType =
  | 'short-video'
  | 'story'
  | 'livestream'
  | 'ugc'
  | 'affiliate-shop-video'
  | 'creator-marketplace-deliverable';

export type DisclosureMode =
  | 'on-screen'
  | 'verbal'
  | 'caption'
  | 'platform-tool'
  | 'contract-only';

export type FundingSourceKind =
  | 'brand-direct'
  | 'collective'
  | 'school-revenue-share'
  | 'affiliate-commission'
  | 'fan-subscription'
  | 'merch-licensing'
  | 'appearance-fee'
  | 'media-rights'
  | 'other';

export type PaymentConfidence =
  | 'unverified'
  | 'represented'
  | 'contracted'
  | 'paid'
  | 'disputed';

export type DealTransferPolicy =
  | 'continues'
  | 'terminates'
  | 'renegotiates'
  | 'unclear';

export interface ActivationEligibility {
  platform: NilActivationPlatform;
  accountHandle?: string;
  accountInGoodStanding?: boolean;
  creatorMarketplaceEligible?: boolean;
  affiliateEligible?: boolean;
  liveEligible?: boolean;
  evidenceSourceIds?: string[];
  caveat?: string;
}

export interface AffiliateTerms {
  commissionBps?: number;
  flatFeeCents?: number;
  productSampleRequired?: boolean;
  sampleValueCents?: number;
  trackingUrlRequired?: boolean;
  usageInAdsAuthorized?: boolean;
}

export interface ActivationPerformanceSnapshot {
  views?: number;
  engagementRateBps?: number;
  clicks?: number;
  conversions?: number;
  salesCents?: number;
  capturedAt: string;
  sourceRefIds?: string[];
}

export interface NilActivationRequirement {
  id: string;
  platform: NilActivationPlatform;
  nilCategory: NilCategory;
  contentType: ShortVideoContentType;
  deliverableLabel: string;
  dueAt?: string;
  requiredDisclosureModes: DisclosureMode[];
  eligibility?: ActivationEligibility;
  affiliateTerms?: AffiliateTerms;
  usageRights?: string;
  proofRequired: boolean;
  performanceSnapshotRequired: boolean;
}

export interface DealRightsLiteracy {
  contentOwnership?: string;
  exclusivityScope?: string;
  durationSummary?: string;
  representativeFeeSummary?: string;
  workloadWindow?: string;
  valuesFitRationale?: string;
  caveat?: string;
}
