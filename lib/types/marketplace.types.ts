import type {
  DealRightsLiteracy,
  DealTransferPolicy,
  DisclosureMode,
  FundingSourceKind,
  NilActivationRequirement,
  NilCategory,
  PaymentConfidence,
} from './activation.types';

export type MarketplaceRole = 'brand' | 'athlete' | 'agent' | 'school' | 'nilManager';

export type CampaignObjective =
  | 'awareness'
  | 'conversion'
  | 'launch'
  | 'community'
  | 'retention';

export type CampaignLifecycleStage =
  | 'brief'
  | 'matching'
  | 'negotiation'
  | 'contracting'
  | 'live'
  | 'reporting';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type EntityRef = {
  id: string;
  type: MarketplaceRole | 'campaign';
  name: string;
};

export type AudienceSignal = {
  label: string;
  value: string;
  weight: number;
};

export type AthleteMarketplaceProfile = {
  id: string;
  name: string;
  sport: string;
  school: string;
  position: string;
  classYear: string;
  market: string;
  followers: number;
  engagementRate: number;
  audienceMarkets: string[];
  contentLanes: string[];
  brandSafety: number;
  availability: 'open' | 'limited' | 'exclusive';
  minDealValue: number;
};

export type BrandCampaignProfile = {
  id: string;
  name: string;
  brand: EntityRef;
  objective: CampaignObjective;
  stage: CampaignLifecycleStage;
  category: string;
  markets: string[];
  contentLanes: string[];
  budget: number;
  targetAthleteCount: number;
  launchWindow: string;
  requiredDeliverables: string[];
  activationRequirements?: NilActivationRequirement[];
  /* ─── 7-field activation/category spine (Sprint 2 closeout) ────────── */
  /* Co-displayed in Brand HQ campaign card + deal detail + disclosure   */
  /* review. Optional; campaigns that pre-date the spine remain valid.   */
  nilCategory?: NilCategory;
  fundingSource?: FundingSourceKind;
  paymentConfidence?: PaymentConfidence;
  transferPolicy?: DealTransferPolicy;
  rightsLiteracy?: DealRightsLiteracy;
  disclosureModes?: DisclosureMode[];
};

export type MarketplaceMatch = {
  id: string;
  campaign: EntityRef;
  athlete: EntityRef;
  score: number;
  confidence: ConfidenceLevel;
  projectedReach: string;
  projectedCpm: string;
  estimatedDealValue: string;
  reasons: string[];
  risks: string[];
  nextBestAction: string;
};

export type CampaignPlan = {
  id: string;
  campaignId: string;
  title: string;
  stage: CampaignLifecycleStage;
  status: 'ready' | 'needs_review' | 'blocked';
  owner: string;
  steps: {
    id: string;
    label: string;
    status: 'done' | 'active' | 'queued' | 'blocked';
  }[];
};

export type AIAction = {
  id: string;
  label: string;
  description: string;
  appliesTo: EntityRef[];
  priority: 'low' | 'medium' | 'high';
};

export type IntelligenceBrief = {
  id: string;
  title: string;
  summary: string;
  signals: AudienceSignal[];
  actions: AIAction[];
};

/* ─── Sprint 2 / Sprint 3 transactional barrel ─────────────────────────── */
/* See PLAN.md §6 (Schema migration) and the schema-candidates/ stubs.    */

export type {
  ActivationEligibility,
  ActivationPerformanceSnapshot,
  AffiliateTerms,
  DealRightsLiteracy,
  DealTransferPolicy,
  DisclosureMode,
  FundingSourceKind,
  NilActivationPlatform,
  NilActivationRequirement,
  NilCategory,
  PaymentConfidence,
  ShortVideoContentType,
} from './activation.types';

export type {
  DealStage,
  DealReviewStatus,
  DealReviewTrack,
  NilDeliverableRef,
  NilDeal,
} from './nil-deal.types';

export type {
  BrandTier,
  CompanyStage,
  BrandLocation,
  BrandNewsItem,
  BrandMemberRole,
  BrandMember,
  BrandComplianceIndicator,
  BrandRosterEntry,
  BrandCalendarKind,
  BrandCalendarEntry,
  BrandChecklistCategory,
  BrandChecklistItem,
  Brand,
} from './brand.types';

export type {
  OpenDealStatus,
  ApplicationStatus,
  OpenDealSelectionPolicy,
  OpenDealDesiredAttributes,
  OpenDeal,
  AIRankingSnapshot,
  OpenDealApplication,
} from './open-deal.types';

// Sprint 3.1 — the canonical AD platform-fee ledger primitives.
// `PlatformFeeTier` here is the Sprint-3.1 string union ('flat' |
// 'tiered' | 'negotiated'); `PlatformFeeStructure` carries the
// per-school agreement metadata. `RevShareLedger` / `RevShareLedgerEntry`
// expose the explicit Proslync↔AD / AD↔retained / school↔athlete
// splits (PLAN P3/P4).
export type {
  PlatformFeeTier,
  PlatformFeeStructure,
  RevShareLedgerEntry,
  RevShareLedgerEntryStatus,
  RevShareLedgerPeriod,
  RevShareLedgerTotals,
  RevShareLedger,
} from './rev-share.types';

// Pre-Sprint-3.1 schema-candidate shapes — kept under their original
// public names for back-compat. New code should consume the
// Sprint-3.1 types above.
export type {
  PlatformFeeShape,
  LedgerEntryKind,
  PlatformFeeBand,
  PlatformFeeAgreement,
  RevShareLegacyEntry,
  SchoolDisbursementStatus,
  SchoolDisbursement,
  RevShareLegacyLedger,
  HouseVNcaaCapSource,
  HouseVNcaaCap,
} from './rev-share.types';

export type {
  DisclosurePacketStatus,
  ReviewTrackKind,
  ReviewStatus,
  ReviewTrack,
  PaymentSource,
  ComplianceDisclosure,
  DisclosurePacketSummary,
} from './compliance.types';

export type {
  GrantSubjectKind,
  GrantSubject,
  CoarseScope,
  CoarseConsentGrant,
  FieldGrantPolicy,
  FineConsentGrant,
  ConsentGrant,
} from './consent.types';
