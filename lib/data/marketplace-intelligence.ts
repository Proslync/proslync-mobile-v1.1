import type {
  AIAction,
  AthleteMarketplaceProfile,
  BrandCampaignProfile,
  CampaignPlan,
  IntelligenceBrief,
  MarketplaceMatch,
} from '@/lib/types/marketplace.types';

const currency = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
  style: 'currency',
  currency: 'USD',
});

export const MARKETPLACE_ATHLETES: AthleteMarketplaceProfile[] = [
  {
    id: 'ath-kiyan-anthony',
    name: 'Kiyan Anthony',
    sport: 'Men\'s Basketball',
    school: 'Syracuse',
    position: 'PG',
    classYear: 'Freshman',
    market: 'NYC / Syracuse',
    followers: 1200000,
    engagementRate: 7.8,
    audienceMarkets: ['NYC', 'Syracuse', 'DMV'],
    contentLanes: ['tunnel fit', 'family legacy', 'game day', 'training'],
    brandSafety: 96,
    availability: 'limited',
    minDealValue: 120000,
  },
  {
    id: 'ath-dylan-harper',
    name: 'Dylan Harper',
    sport: 'Men\'s Basketball',
    school: 'Rutgers',
    position: 'PG',
    classYear: 'Freshman',
    market: 'New Jersey',
    followers: 910000,
    engagementRate: 8.4,
    audienceMarkets: ['New Jersey', 'NYC', 'Philadelphia'],
    contentLanes: ['launch', 'training', 'community', 'sneaker culture'],
    brandSafety: 92,
    availability: 'open',
    minDealValue: 180000,
  },
  {
    id: 'ath-ace-bailey',
    name: 'Ace Bailey',
    sport: 'Men\'s Basketball',
    school: 'Rutgers',
    position: 'F',
    classYear: 'Freshman',
    market: 'New Jersey / Atlanta',
    followers: 720000,
    engagementRate: 7.1,
    audienceMarkets: ['New Jersey', 'Atlanta', 'NYC'],
    contentLanes: ['highlights', 'training', 'fashion', 'campus'],
    brandSafety: 88,
    availability: 'open',
    minDealValue: 150000,
  },
  {
    id: 'ath-jordan-miles',
    name: 'Jordan Miles',
    sport: 'Boys Basketball',
    school: 'Paul VI',
    position: 'SG',
    classYear: 'Senior',
    market: 'DMV',
    followers: 480000,
    engagementRate: 9.6,
    audienceMarkets: ['DMV', 'Baltimore', 'Philadelphia'],
    contentLanes: ['EYBL', 'launch', 'community', 'sneaker culture'],
    brandSafety: 94,
    availability: 'limited',
    minDealValue: 70000,
  },
];

export const MARKETPLACE_CAMPAIGNS: BrandCampaignProfile[] = [
  {
    id: 'camp-future-unleashed',
    name: 'Future Unleashed',
    brand: { id: 'brand-puma-hoops', type: 'brand', name: 'Nike Hoops' },
    objective: 'launch',
    stage: 'matching',
    category: 'Footwear',
    markets: ['NYC', 'Syracuse', 'DMV', 'New Jersey'],
    contentLanes: ['launch', 'sneaker culture', 'training', 'game day'],
    budget: 660000,
    targetAthleteCount: 4,
    launchWindow: 'May - August',
    requiredDeliverables: ['2 launch reels', '1 tunnel fit cut', '1 community appearance'],
    nilCategory: 'endorsement',
    fundingSource: 'brand-direct',
    paymentConfidence: 'contracted',
    transferPolicy: 'continues',
    disclosureModes: ['on-screen', 'verbal', 'caption'],
    rightsLiteracy: {
      contentOwnership: 'Athlete owns master; brand boosts approved cutdowns 30 days post-approval.',
      exclusivityScope: 'Footwear category exclusive within college basketball, May–Aug.',
      durationSummary: '4-month flight; usage rights extend 30 days after final approval.',
      representativeFeeSummary: 'Slot value $66K; agent rep capped at 20%.',
      workloadWindow: '6–8 hours / shoot day; max 2 capture days per athlete.',
      valuesFitRationale: 'Family-legacy + sneaker-culture lanes match Nike Hoops launch posture.',
      caveat: 'School disclosure pre-check required before any outbound offer is sent.',
    },
    activationRequirements: [
      {
        id: 'act-future-unleashed-launch-reels',
        platform: 'tiktok',
        nilCategory: 'endorsement',
        contentType: 'short-video',
        deliverableLabel: 'Two launch reels with on-screen product use and verbal disclosure',
        requiredDisclosureModes: ['on-screen', 'verbal', 'caption'],
        eligibility: {
          platform: 'tiktok',
          accountInGoodStanding: true,
          creatorMarketplaceEligible: true,
          evidenceSourceIds: ['source:tiktok-creator-marketplace', 'source:ftc-disclosures'],
        },
        usageRights: 'Brand may boost approved cutdowns for 30 days after athlete approval.',
        proofRequired: true,
        performanceSnapshotRequired: true,
      },
    ],
  },
  {
    id: 'camp-acc-takeover',
    name: 'ACC Takeover',
    brand: { id: 'brand-puma-hoops', type: 'brand', name: 'Nike Hoops' },
    objective: 'awareness',
    stage: 'live',
    category: 'Basketball',
    markets: ['Syracuse', 'DMV', 'Atlanta', 'Bay Area'],
    contentLanes: ['game day', 'highlights', 'campus', 'training'],
    budget: 480000,
    targetAthleteCount: 6,
    launchWindow: 'In season',
    requiredDeliverables: ['weekly reels', 'story sets', 'postgame creator cuts'],
    nilCategory: 'endorsement',
    fundingSource: 'brand-direct',
    paymentConfidence: 'represented',
    transferPolicy: 'renegotiates',
    disclosureModes: ['on-screen', 'caption'],
    rightsLiteracy: {
      contentOwnership: 'Athlete owns posts; brand requires 7-day organic exclusivity post-publish.',
      exclusivityScope: 'No competing footwear/apparel category within ACC season window.',
      durationSummary: 'In-season activation; rolling 30-day usage windows per cleared cutdown.',
      representativeFeeSummary: 'Per-deliverable rate; slot value $80K average.',
      workloadWindow: '~3 hours weekly capture across 6 athletes.',
      valuesFitRationale: 'Game-day + campus content lanes overlap conference-takeover narrative.',
      caveat: 'Athlete portability note: deals renegotiate if athlete transfers conferences.',
    },
    activationRequirements: [
      {
        id: 'act-acc-takeover-weekly-reels',
        platform: 'instagram-reels',
        nilCategory: 'endorsement',
        contentType: 'short-video',
        deliverableLabel: 'Weekly Reels package with school compliance pre-check',
        requiredDisclosureModes: ['on-screen', 'caption'],
        eligibility: {
          platform: 'instagram-reels',
          accountInGoodStanding: true,
          evidenceSourceIds: ['source:school-compliance-precheck'],
        },
        usageRights: 'Organic reposting only until rights are cleared in the deal packet.',
        proofRequired: true,
        performanceSnapshotRequired: true,
      },
    ],
  },
];

function overlapScore(left: string[], right: string[]) {
  const rightSet = new Set(right.map((item) => item.toLowerCase()));
  const hits = left.filter((item) => rightSet.has(item.toLowerCase())).length;
  return left.length === 0 ? 0 : hits / left.length;
}

function formatCompact(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return String(value);
}

export function scoreCampaignMatch(
  campaign: BrandCampaignProfile,
  athlete: AthleteMarketplaceProfile
): MarketplaceMatch {
  const marketFit = overlapScore(campaign.markets, athlete.audienceMarkets);
  const laneFit = overlapScore(campaign.contentLanes, athlete.contentLanes);
  const economicsFit = athlete.minDealValue <= campaign.budget / campaign.targetAthleteCount ? 1 : 0.55;
  const reachFit = Math.min(athlete.followers / 1200000, 1);

  const score = Math.round(
    marketFit * 30 +
      laneFit * 24 +
      economicsFit * 16 +
      reachFit * 14 +
      (athlete.engagementRate / 10) * 10 +
      (athlete.brandSafety / 100) * 6
  );

  const estimatedDeal = Math.max(
    athlete.minDealValue,
    Math.round((campaign.budget / campaign.targetAthleteCount) * (score / 100))
  );

  const risks = [
    athlete.availability === 'limited' ? 'Calendar needs clearance before offer.' : null,
    economicsFit < 1 ? 'Likely above target slot budget.' : null,
    athlete.brandSafety < 90 ? 'Manual brand-safety review recommended.' : null,
  ].filter(Boolean) as string[];

  return {
    id: `${campaign.id}-${athlete.id}`,
    campaign: { id: campaign.id, type: 'campaign', name: campaign.name },
    athlete: { id: athlete.id, type: 'athlete', name: athlete.name },
    score,
    confidence: score >= 88 ? 'high' : score >= 75 ? 'medium' : 'low',
    projectedReach: formatCompact(Math.round(athlete.followers * 1.8)),
    projectedCpm: `$${Math.max(6, Math.round(18 - athlete.engagementRate)).toFixed(0)}`,
    estimatedDealValue: currency.format(estimatedDeal),
    reasons: [
      `${Math.round(marketFit * 100)}% market overlap`,
      `${Math.round(laneFit * 100)}% content-lane overlap`,
      `${athlete.engagementRate.toFixed(1)}% engagement rate`,
    ],
    risks,
    nextBestAction:
      score >= 88
        ? 'Generate offer brief and route to legal.'
        : score >= 75
          ? 'Ask AI to produce a narrower content concept.'
          : 'Keep in watchlist until audience fit improves.',
  };
}

export const PUMA_MATCHES = MARKETPLACE_ATHLETES
  .map((athlete) => scoreCampaignMatch(MARKETPLACE_CAMPAIGNS[0], athlete))
  .sort((a, b) => b.score - a.score);

export const CAMPAIGN_PLANS: CampaignPlan[] = [
  {
    id: 'plan-future-unleashed',
    campaignId: 'camp-future-unleashed',
    title: 'Future Unleashed launch cockpit',
    stage: 'matching',
    status: 'needs_review',
    owner: 'Tosan E.',
    steps: [
      { id: 'brief', label: 'Campaign brief normalized', status: 'done' },
      { id: 'matches', label: '4 athlete matches scored', status: 'active' },
      { id: 'compliance', label: 'School disclosure pre-check', status: 'queued' },
      { id: 'offer', label: 'Offer packet generation', status: 'queued' },
    ],
  },
];

const recommendedActions: AIAction[] = [
  {
    id: 'action-offer-brief',
    label: 'Draft offer brief',
    description: 'Create a one-page deal packet with value, deliverables, usage rights, and compliance notes.',
    priority: 'high',
    appliesTo: [
      { id: 'camp-future-unleashed', type: 'campaign', name: 'Future Unleashed' },
      { id: 'ath-dylan-harper', type: 'athlete', name: 'Dylan Harper' },
    ],
  },
  {
    id: 'action-content-angles',
    label: 'Generate content angles',
    description: 'Turn the campaign brief into three athlete-specific creative concepts.',
    priority: 'medium',
    appliesTo: [
      { id: 'camp-future-unleashed', type: 'campaign', name: 'Future Unleashed' },
    ],
  },
  {
    id: 'action-school-check',
    label: 'Run compliance pre-check',
    description: 'Flag disclosure needs, category conflicts, usage-rights risk, and school approval timing.',
    priority: 'high',
    appliesTo: [
      { id: 'camp-future-unleashed', type: 'campaign', name: 'Future Unleashed' },
    ],
  },
];

export const MARKETPLACE_BRIEF: IntelligenceBrief = {
  id: 'brief-puma-marketplace',
  title: 'Proslync AI Marketplace Brief',
  summary:
    'Nike should move first on Rutgers guards/wings before summer camps. The strongest opportunities combine New Jersey reach, sneaker-culture content, and clean launch economics.',
  signals: [
    { label: 'Matched pipeline', value: '$610K', weight: 0.9 },
    { label: 'Best fit', value: 'Dylan Harper', weight: 0.95 },
    { label: 'Avg confidence', value: 'High', weight: 0.82 },
  ],
  actions: recommendedActions,
};
