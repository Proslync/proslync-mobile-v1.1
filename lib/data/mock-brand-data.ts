// Mock data for Brand demo. Swap values here for different demos.

export const BRAND_PROFILE = {
  name: 'Nike Hoops',
  handle: 'nikehoops',
  metaPrimary: 'NIL & Amateur Athletics',
  metaSecondary: 'Beaverton, OR · HQ',
  tagline: 'Just Do It. On-court, in-class, in culture.',
  bio: [
    {
      key: 'mission',
      title: 'Mission',
      body: 'Sign the next generation of on-court talent before they become household names. Our NIL program has onboarded 38 D1-bound athletes since 2023, focused on character fit, community story, and long-horizon partnership value — not just follower counts.',
    },
    {
      key: 'strategy',
      title: '2026 Strategy',
      body: 'Tighter roster, larger stipends. We are trimming from 38 athletes to ~24 for FY26 and reallocating the saved spend to signature shoe deals with the top 6. Target: 2 McDonald\'s All-Americans per class, 1 Jordan Brand Classic invitee, and deeper regional saturation in DMV, ATL, and the Bay.',
    },
    {
      key: 'fit',
      title: 'What we look for',
      body: 'Top-100 ranked or top-5 conference player. Clean social presence. Interview-ready. Hometown or school with real cultural reach. We lean toward lead guards, two-way wings, and unicorn bigs.',
    },
    {
      key: 'team',
      title: 'Team',
      body: 'Led by Tosan Evbuomwan (VP, NIL & Grassroots). 6-person deal team + 4-person creative team based in Beaverton and LA. Legal handled by Reed Smith NIL group.',
    },
  ],
  stats: [
    { label: 'Signed', value: '24' },
    { label: 'FY26 Budget', value: '$3.8M' },
    { label: 'Campaign ROI', value: '4.2×' },
  ],
};

export type Campaign = {
  id: string;
  name: string;
  athlete: string;
  status: 'live' | 'upcoming' | 'wrapped';
  reach: string;
  impressions: string;
  engagement: string;
  budget: string;
  spent: number; // 0-100 percent
  startDate: string;
  endDate: string;
};

export const BRAND_CAMPAIGNS: Campaign[] = [
  {
    id: 'c-1',
    name: 'Future Unleashed · Kiyan Anthony',
    athlete: 'Kiyan Anthony · Syracuse',
    status: 'live',
    reach: '2.4M',
    impressions: '8.1M',
    engagement: '6.8%',
    budget: '$220K',
    spent: 58,
    startDate: 'Feb 10',
    endDate: 'Jun 30',
  },
  {
    id: 'c-2',
    name: 'ACC Takeover · Multi-Athlete',
    athlete: '6 athletes · ACC',
    status: 'live',
    reach: '5.1M',
    impressions: '14.3M',
    engagement: '5.2%',
    budget: '$480K',
    spent: 71,
    startDate: 'Jan 4',
    endDate: 'Apr 30',
  },
  {
    id: 'c-3',
    name: 'Jordan Miles — Signature Capsule',
    athlete: 'Jordan Miles · Paul VI HS',
    status: 'upcoming',
    reach: '—',
    impressions: '—',
    engagement: '—',
    budget: '$140K',
    spent: 0,
    startDate: 'May 15',
    endDate: 'Aug 30',
  },
  {
    id: 'c-4',
    name: 'Back to School · EYBL Weekend',
    athlete: '12 athletes · EYBL',
    status: 'upcoming',
    reach: '—',
    impressions: '—',
    engagement: '—',
    budget: '$310K',
    spent: 0,
    startDate: 'Aug 10',
    endDate: 'Sep 15',
  },
  {
    id: 'c-5',
    name: 'March Madness Mix · Cooper Flagg',
    athlete: 'Cooper Flagg · Duke',
    status: 'wrapped',
    reach: '6.2M',
    impressions: '22.8M',
    engagement: '9.1%',
    budget: '$520K',
    spent: 100,
    startDate: 'Feb 28',
    endDate: 'Apr 8',
  },
  {
    id: 'c-6',
    name: 'Back-to-Brooklyn · Anthony',
    athlete: 'Kiyan Anthony',
    status: 'wrapped',
    reach: '1.8M',
    impressions: '5.4M',
    engagement: '7.3%',
    budget: '$110K',
    spent: 100,
    startDate: 'Oct 14',
    endDate: 'Dec 20',
  },
];

export type Athlete = {
  id: string;
  name: string;
  school: string;
  position: string;
  initials: string;
  rank: string;
  fitScore: number; // 0-100
  followers: string;
  signed: boolean;
  contract?: string;
};

export const BRAND_ATHLETES: Athlete[] = [
  { id: 'a-1', name: 'Kiyan Anthony', school: 'Syracuse · Fr', position: 'PG', initials: 'KA', rank: '#14', fitScore: 94, followers: '1.2M', signed: true, contract: '3-yr · $660K' },
  { id: 'a-2', name: 'Jordan Miles', school: 'Paul VI · Sr', position: 'SG', initials: 'JM', rank: '#22', fitScore: 89, followers: '480K', signed: true, contract: '2-yr · $140K' },
  { id: 'a-3', name: 'Cooper Flagg', school: 'Duke · Fr', position: 'F', initials: 'CF', rank: '#1', fitScore: 92, followers: '3.1M', signed: true, contract: '1-yr · $520K · renewing' },
  { id: 'a-4', name: 'JJ Starling', school: 'Syracuse · So', position: 'SG', initials: 'JS', rank: '#38', fitScore: 78, followers: '290K', signed: true, contract: '1-yr · $85K' },
  { id: 'a-5', name: 'Dylan Harper', school: 'Rutgers · Fr', position: 'PG', initials: 'DH', rank: '#3', fitScore: 91, followers: '910K', signed: false },
  { id: 'a-6', name: 'Ace Bailey', school: 'Rutgers · Fr', position: 'F', initials: 'AB', rank: '#7', fitScore: 86, followers: '720K', signed: false },
  { id: 'a-7', name: 'Naithan George', school: 'Georgia Tech · So', position: 'PG', initials: 'NG', rank: '#52', fitScore: 74, followers: '180K', signed: false },
];

export type Deal = {
  id: string;
  athlete: string;
  stage: 'draft' | 'sent' | 'negotiation' | 'signed' | 'live';
  value: string;
  term: string;
  lastTouched: string;
  owner: string;
};

export const BRAND_DEALS: Deal[] = [
  { id: 'd-1', athlete: 'Dylan Harper · Rutgers', stage: 'negotiation', value: '$380K', term: '2 yrs · exclusive', lastTouched: '2h ago · Tosan', owner: 'Tosan E.' },
  { id: 'd-2', athlete: 'Ace Bailey · Rutgers', stage: 'sent', value: '$290K', term: '2 yrs · exclusive', lastTouched: 'Yesterday · Maya', owner: 'Maya L.' },
  { id: 'd-3', athlete: 'Naithan George · GT', stage: 'draft', value: '$85K', term: '1 yr · non-exclusive', lastTouched: 'Apr 18 · Tosan', owner: 'Tosan E.' },
  { id: 'd-4', athlete: 'Kiyan Anthony · Syracuse', stage: 'signed', value: '$660K', term: '3 yrs · exclusive · renewed', lastTouched: 'Apr 12 · Tosan', owner: 'Tosan E.' },
  { id: 'd-5', athlete: 'Jordan Miles · Paul VI', stage: 'live', value: '$140K', term: '2 yrs · exclusive', lastTouched: 'Feb 6', owner: 'Maya L.' },
  { id: 'd-6', athlete: 'Cooper Flagg · Duke', stage: 'negotiation', value: '$520K renewal', term: '2 yrs · exclusive + signature line', lastTouched: '4h ago · Tosan', owner: 'Tosan E.' },
];

// ── DEAL DETAIL CONTRACT ──────────────────────────────────────────────────
// Rich, per-deal packet consumed by `app/deal/[id].tsx` through the lens
// engine (`components/deal/deal-detail-model.ts`) and the spine
// (`components/deal/deal-detail-spine.tsx`). Also read by the compliance
// export builder, the athlete-calendar builder, and the athlete comparables
// screen. Every field below is referenced by at least one of those consumers
// — keep the shape in lock-step with them.

/** Reviewer state vocabulary used by `reviewTone()` for AI/compliance tracks. */
export type BrandDealReviewStatus = 'cleared' | 'review' | 'flagged';

/** Commitment lifecycle vocabulary used by `commitmentTone()` + the calendar. */
export type BrandDealCommitmentStatus = 'done' | 'active' | 'queued' | 'blocked';

/** Attachment / source attachment state. `formatDealStatus` title-cases these. */
export type BrandDealAttachmentState = 'attached' | 'requested' | 'missing';

export type BrandDealStage = {
  /** Must be one of the spine's STAGE_ORDER keys (mirrors `Deal['stage']`). */
  key: Deal['stage'];
  label: string;
  description: string;
};

export type BrandDealCompanyOverview = {
  name: string;
  summary: string;
  headquarters: string;
  founded: string;
  category: string;
};

export type BrandDealMoneyRow = {
  label: string;
  value: string;
  note: string;
};

export type BrandDealMoney = {
  total: string;
  guaranteed: string;
  performance: string;
  usageRights: string;
  paymentTiming: string;
  breakdown: BrandDealMoneyRow[];
};

export type BrandDealCommitment = {
  id: string;
  title: string;
  due: string;
  owner: string;
  proof: string;
  status: BrandDealCommitmentStatus;
};

export type BrandDealContact = {
  id: string;
  name: string;
  role: string;
  organization: string;
  context: string;
};

export type BrandDealReviewTrack = {
  label: string;
  status: BrandDealReviewStatus;
  note: string;
};

export type BrandDealAiCompliance = {
  status: BrandDealReviewStatus;
  summary: string;
  tracks: BrandDealReviewTrack[];
  caveats: string[];
};

export type BrandDealEvidenceAttachment = {
  label: string;
  state: BrandDealAttachmentState;
};

export type BrandDealEvidenceSource = {
  id: string;
  label: string;
  state: BrandDealAttachmentState;
  freshness: string;
  note: string;
};

export type BrandDealEvidence = {
  packetTitle: string;
  matchScore: string;
  confidence: 'high' | 'medium' | 'low';
  rationale: string[];
  attachments: BrandDealEvidenceAttachment[];
  sources: BrandDealEvidenceSource[];
};

export type BrandDealDetail = {
  /** Stable detail id; mirrors the parent `Deal.id` (d-1…d-6). */
  id: string;
  deal: Deal;
  companyOverview: BrandDealCompanyOverview;
  stage: BrandDealStage;
  money: BrandDealMoney;
  commitments: BrandDealCommitment[];
  contacts: BrandDealContact[];
  aiCompliance: BrandDealAiCompliance;
  evidence: BrandDealEvidence;
};

const STAGE_PRESETS: Record<Deal['stage'], { label: string; description: string }> = {
  draft: {
    label: 'Draft',
    description: 'Terms are being shaped internally; nothing has gone out to the athlete side yet.',
  },
  sent: {
    label: 'Sent',
    description: 'Offer packet is with the counterparty awaiting first response.',
  },
  negotiation: {
    label: 'Negotiate',
    description: 'Both sides are trading redlines on economics, exclusivity, and usage scope.',
  },
  signed: {
    label: 'Signed',
    description: 'Executed by both parties; obligations and disclosure clocks are now live.',
  },
  live: {
    label: 'Live',
    description: 'Deal is in market — deliverables are flowing and spend is tracking against budget.',
  },
};

function stageFor(deal: Deal): BrandDealStage {
  const preset = STAGE_PRESETS[deal.stage];
  return { key: deal.stage, label: preset.label, description: preset.description };
}

export const BRAND_DEAL_DETAILS: Record<string, BrandDealDetail> = {
  // ① Dylan Harper × Nike — lead-guard signature push, in active negotiation
  'd-1': {
    id: 'd-1',
    deal: BRAND_DEALS[0],
    companyOverview: {
      name: 'Nike Hoops',
      summary:
        'Nike Hoops runs Nike Basketball’s grassroots-to-college NIL program — signing the next wave of on-court talent ahead of the draft and building signature-line equity early.',
      headquarters: 'Beaverton, OR',
      founded: '1971',
      category: 'National · Footwear & Apparel',
    },
    stage: stageFor(BRAND_DEALS[0]),
    money: {
      total: '$380K',
      guaranteed: '$300K guaranteed',
      performance: '$80K performance + signature-line escalators',
      usageRights: 'Category-exclusive (footwear/apparel) · 2 yrs',
      paymentTiming: 'Signing 40% · midterm 30% · completion 30%',
      breakdown: [
        { label: 'Base guarantee', value: '$300K', note: 'Paid across the 2-year term regardless of output.' },
        { label: 'Performance pool', value: '$60K', note: 'Unlocks on engagement + appearance thresholds.' },
        { label: 'Signature escalator', value: '$20K', note: 'Triggers if a colorway capsule ships in year 2.' },
      ],
    },
    commitments: [
      { id: 'd-1-c1', title: '6 social activations / yr', due: 'Rolling · quarterly', owner: 'Dylan Harper', proof: 'Posts auto-captured via connected IG + TikTok handles.', status: 'active' },
      { id: 'd-1-c2', title: 'On-court footwear exclusivity', due: 'Full term', owner: 'Agent — Klutch', proof: 'Game-footage spot-checks; flagged if non-Nike PEs appear.', status: 'queued' },
      { id: 'd-1-c3', title: 'Signature capsule design session', due: 'Q1 yr 2', owner: 'Nike creative', proof: 'Studio call recap + concept deck attached to packet.', status: 'queued' },
      { id: 'd-1-c4', title: 'School disclosure receipt', due: 'Within 5 biz days of signing', owner: 'Tosan E.', proof: 'Awaiting Rutgers compliance portal confirmation.', status: 'blocked' },
    ],
    contacts: [
      { id: 'd-1-k1', name: 'Rich Paul', role: 'Agent of record', organization: 'Klutch Sports', context: 'Driving the signature-line escalator language.' },
      { id: 'd-1-k2', name: 'Rutgers Compliance', role: 'School review', organization: 'Rutgers Athletics', context: 'Disclosure receipt still outstanding.' },
    ],
    aiCompliance: {
      status: 'review',
      summary:
        'AI pre-check is advisory only. Economics sit inside the comparable band for a top-5 lead guard, but the school disclosure receipt is not yet attached, which holds the packet in review.',
      tracks: [
        { label: 'FMV band', status: 'cleared', note: 'Offer is within the modeled fair-market range for the cohort.' },
        { label: 'School compliance', status: 'review', note: 'Rutgers disclosure receipt requested; not yet returned.' },
        { label: 'Exclusivity scope', status: 'review', note: 'Category exclusivity wording needs a human read before send.' },
      ],
      caveats: [
        'AI review is advisory only — a human approver must sign off before any outbound step.',
        'Reviewer state stays visible to the AD and NIL Manager regardless of athlete consent scope.',
      ],
    },
    evidence: {
      packetTitle: 'Nike × Harper — signature-track evidence packet',
      matchScore: '88',
      confidence: 'high',
      rationale: [
        'Three reviewer-approved comparables for top-5 lead guards',
        'Engagement + reach metrics pulled from connected handles',
        'Signature-line escalator benchmarked against prior Nike PEs',
      ],
      attachments: [
        { label: 'Offer term sheet (v3)', state: 'attached' },
        { label: 'Comparable-deal export', state: 'attached' },
        { label: 'School disclosure receipt', state: 'requested' },
      ],
      sources: [
        { id: 'source:comparable-deals', label: 'Comparable NIL deals', state: 'attached', freshness: 'refreshed 3d ago', note: 'Reviewer-tagged comps for top-5 lead guards.' },
        { id: 'source:school-compliance-precheck', label: 'School disclosure precheck', state: 'requested', freshness: 'pending', note: 'Rutgers compliance receipt not yet uploaded.' },
      ],
    },
  },

  // ② Ace Bailey × Beats — wing creator play, offer sent, awaiting response
  'd-2': {
    id: 'd-2',
    deal: BRAND_DEALS[1],
    companyOverview: {
      name: 'Beats by Dre',
      summary:
        'Beats by Dre partners with culturally resonant young athletes to seed audio products through highlight content and tunnel-walk moments.',
      headquarters: 'Culver City, CA',
      founded: '2006',
      category: 'National · Consumer Audio',
    },
    stage: stageFor(BRAND_DEALS[1]),
    money: {
      total: '$290K',
      guaranteed: '$230K guaranteed',
      performance: '$60K content-performance pool',
      usageRights: 'Category-exclusive (audio) · 2 yrs',
      paymentTiming: 'On-signing 50% · two milestone tranches of 25%',
      breakdown: [
        { label: 'Base guarantee', value: '$230K', note: 'Two equal annual installments.' },
        { label: 'Content pool', value: '$45K', note: 'Tied to reel completion + view thresholds.' },
        { label: 'Tunnel-walk bonus', value: '$15K', note: 'Per nationally televised tunnel feature wearing product.' },
      ],
    },
    commitments: [
      { id: 'd-2-c1', title: '8 tunnel-walk features / yr', due: 'Game-day rolling', owner: 'Ace Bailey', proof: 'Broadcast clips + product-visible stills attached per game.', status: 'queued' },
      { id: 'd-2-c2', title: '4 highlight reels with product', due: 'Quarterly', owner: 'Beats creative', proof: 'Edits delivered to brand for approval before posting.', status: 'queued' },
      { id: 'd-2-c3', title: 'Counter-sign offer packet', due: 'Open — awaiting athlete', owner: 'Agent — Excel', proof: 'Signature block pending on sent term sheet.', status: 'active' },
    ],
    contacts: [
      { id: 'd-2-k1', name: 'Jeff Schwartz', role: 'Agent of record', organization: 'Excel Sports', context: 'Reviewing the audio-exclusivity carve-outs.' },
      { id: 'd-2-k2', name: 'Maya L.', role: 'Brand deal owner', organization: 'Nike Hoops', context: 'Owns the outbound packet and follow-up cadence.' },
    ],
    aiCompliance: {
      status: 'review',
      summary:
        'Packet is sent and awaiting counter-signature. AI flags the content-performance pool wording as needing a human read; economics otherwise sit in-band.',
      tracks: [
        { label: 'FMV band', status: 'cleared', note: 'Within modeled range for a top-10 two-way wing.' },
        { label: 'School compliance', status: 'review', note: 'Disclosure not yet triggered — fires on counter-signature.' },
        { label: 'Performance pool clarity', status: 'review', note: 'Threshold definitions need human confirmation pre-execution.' },
      ],
      caveats: [
        'AI review is advisory only — a human approver must sign off before any outbound step.',
        'Reviewer state stays visible to the AD and NIL Manager regardless of athlete consent scope.',
      ],
    },
    evidence: {
      packetTitle: 'Beats × Bailey — wing-creator evidence packet',
      matchScore: '81',
      confidence: 'medium',
      rationale: [
        'Two reviewer-approved audio-category comparables',
        'Tunnel-walk reach modeled from prior broadcast appearances',
        'Engagement rate sampled across connected handles',
      ],
      attachments: [
        { label: 'Sent term sheet (v1)', state: 'attached' },
        { label: 'Comparable-deal export', state: 'attached' },
        { label: 'Performance-pool definitions', state: 'missing' },
      ],
      sources: [
        { id: 'source:comparable-deals', label: 'Comparable NIL deals', state: 'attached', freshness: 'refreshed 6d ago', note: 'Reviewer-tagged audio-category comps.' },
        { id: 'source:school-compliance-precheck', label: 'School disclosure precheck', state: 'missing', freshness: 'not started', note: 'Disclosure fires only once the athlete counter-signs.' },
      ],
    },
  },

  // ③ Naithan George × Zaxby's — regional draft, early stage
  'd-3': {
    id: 'd-3',
    deal: BRAND_DEALS[2],
    companyOverview: {
      name: "Zaxby's Southeast",
      summary:
        "Zaxby's runs a regional NIL roster across the Southeast, pairing affordable local activations with in-restaurant appearances and store-traffic promos.",
      headquarters: 'Athens, GA',
      founded: '1990',
      category: 'Local · QSR / Restaurant',
    },
    stage: stageFor(BRAND_DEALS[2]),
    money: {
      total: '$85K',
      guaranteed: '$60K guaranteed',
      performance: '$25K store-traffic + appearance pool',
      usageRights: 'Non-exclusive · regional · 1 yr',
      paymentTiming: 'Quarterly flat draws + per-appearance stipends',
      breakdown: [
        { label: 'Base guarantee', value: '$60K', note: 'Four equal quarterly draws.' },
        { label: 'Appearance stipends', value: '$15K', note: '$2.5K per in-restaurant appearance, up to 6.' },
        { label: 'Traffic bonus', value: '$10K', note: 'Promo-code redemption thresholds at participating stores.' },
      ],
    },
    commitments: [
      { id: 'd-3-c1', title: '6 in-restaurant appearances', due: 'Spread across term', owner: 'Naithan George', proof: 'Event photos + store manager sign-off per appearance.', status: 'queued' },
      { id: 'd-3-c2', title: '12 regional social posts', due: 'Monthly', owner: 'Naithan George', proof: 'Geo-tagged posts auto-captured from connected handle.', status: 'queued' },
      { id: 'd-3-c3', title: 'Finalize draft terms', due: 'Internal — pre-send', owner: 'Tosan E.', proof: 'Draft still in internal review; not sent to athlete.', status: 'active' },
    ],
    contacts: [
      { id: 'd-3-k1', name: 'Naithan George', role: 'Athlete', organization: 'Georgia Tech', context: 'Self-represented; comms run through the GT NIL office.' },
      { id: 'd-3-k2', name: 'GT NIL Office', role: 'NIL manager', organization: 'Georgia Tech Athletics', context: 'Coordinates appearance scheduling + disclosure.' },
    ],
    aiCompliance: {
      status: 'cleared',
      summary:
        'Low-value regional deal sits comfortably inside the comparable band. AI pre-check is clean; the only open item is finalizing internal draft terms before sending.',
      tracks: [
        { label: 'FMV band', status: 'cleared', note: 'Well within range for a mid-major regional QSR deal.' },
        { label: 'School compliance', status: 'cleared', note: 'GT NIL office pre-cleared the regional template.' },
        { label: 'Exclusivity scope', status: 'cleared', note: 'Non-exclusive; no category conflicts detected.' },
      ],
      caveats: [
        'AI review is advisory only — a human approver must sign off before any outbound step.',
        'Reviewer state stays visible to the AD and NIL Manager regardless of athlete consent scope.',
      ],
    },
    evidence: {
      packetTitle: "Zaxby's × George — regional evidence packet",
      matchScore: '92',
      confidence: 'high',
      rationale: [
        'Four reviewer-approved regional QSR comparables',
        'Store-traffic model calibrated to local market size',
        'Appearance stipends benchmarked to conference peers',
      ],
      attachments: [
        { label: 'Regional deal template', state: 'attached' },
        { label: 'Comparable-deal export', state: 'attached' },
        { label: 'School disclosure receipt', state: 'attached' },
      ],
      sources: [
        { id: 'source:comparable-deals', label: 'Comparable NIL deals', state: 'attached', freshness: 'refreshed 9d ago', note: 'Reviewer-tagged regional QSR comps.' },
        { id: 'source:school-compliance-precheck', label: 'School disclosure precheck', state: 'attached', freshness: 'cleared', note: 'GT NIL office pre-cleared the regional template.' },
      ],
    },
  },

  // ④ Kiyan Anthony × Nike Hoops — HERO DEAL: flagship multi-year renewal,
  // signed with payments scheduled/in-progress (NOT fully paid). This is the
  // single canonical packet every role resolves d-4 through (brand/athlete/
  // ad/agent/collective lenses + dr-003 hinge). $660K economics kept verbatim;
  // only the brand identity is Nike Hoops (matches BRAND_PROFILE + dr-003).
  'd-4': {
    id: 'd-4',
    deal: BRAND_DEALS[3],
    companyOverview: {
      name: 'Nike Hoops',
      summary:
        'Nike Hoops anchors its NIL roster around marquee on-court talent, pairing signature-line co-design with national campaign placements and long-horizon partnership value.',
      headquarters: 'Beaverton, OR',
      founded: '1964',
      category: 'National · Basketball Footwear & Apparel',
    },
    stage: stageFor(BRAND_DEALS[3]),
    money: {
      total: '$660K',
      guaranteed: '$540K guaranteed',
      performance: '$120K national-campaign + milestone pool',
      usageRights: 'Category-exclusive (footwear/apparel) · 3 yrs',
      paymentTiming: 'Signed — guarantees + milestone tranches scheduled (mostly future)',
      breakdown: [
        { label: 'Base guarantee', value: '$540K', note: 'Three annual installments of $180K.' },
        { label: 'Campaign pool', value: '$90K', note: 'Per national campaign Kiyan headlines.' },
        { label: 'Renewal bonus', value: '$30K', note: 'Paid on the executed 3-year renewal.' },
      ],
    },
    commitments: [
      { id: 'd-4-c1', title: '2 national campaigns / yr', due: 'Per campaign calendar', owner: 'Nike Hoops brand', proof: 'Shoot deliverables + usage logs filed per campaign.', status: 'active' },
      { id: 'd-4-c2', title: 'Signature-line co-design series', due: 'Quarterly', owner: 'Kiyan Anthony', proof: 'Co-design milestones archived in the evidence packet.', status: 'done' },
      { id: 'd-4-c3', title: 'Exclusivity upkeep', due: 'Full term', owner: 'Agent — CAA', proof: 'No competing footwear/apparel brands across owned channels.', status: 'active' },
      { id: 'd-4-c4', title: 'Renewal disclosure receipt', due: 'Filed Apr 12', owner: 'Tosan E.', proof: 'Syracuse compliance receipt attached.', status: 'done' },
    ],
    contacts: [
      { id: 'd-4-k1', name: 'CAA Sports', role: 'Agent of record', organization: 'CAA', context: 'Negotiated the 3-year renewal + campaign pool.' },
      { id: 'd-4-k2', name: 'Syracuse Compliance', role: 'School review', organization: 'Syracuse Athletics', context: 'Renewal disclosure receipt on file.' },
    ],
    aiCompliance: {
      status: 'cleared',
      summary:
        'Flagship Nike Hoops deal is signed and renewed with a clean compliance posture. All disclosure receipts are attached and the renewal sits within the comparable band for a national marquee partner.',
      tracks: [
        { label: 'FMV band', status: 'cleared', note: 'Within modeled range for a national flagship marquee deal.' },
        { label: 'School compliance', status: 'cleared', note: 'Syracuse renewal disclosure receipt attached.' },
        { label: 'Exclusivity scope', status: 'cleared', note: 'Category exclusivity confirmed; no conflicts on owned channels.' },
      ],
      caveats: [
        'AI review is advisory only — a human approver must sign off before any outbound step.',
        'Reviewer state stays visible to the AD and NIL Manager regardless of athlete consent scope.',
      ],
    },
    evidence: {
      packetTitle: 'Nike Hoops × Anthony — flagship renewal packet',
      matchScore: '95',
      confidence: 'high',
      rationale: [
        'Five reviewer-approved national-marquee comparables',
        'Campaign reach validated against prior Nike Hoops flights',
        'Renewal escalator benchmarked to category leaders',
      ],
      attachments: [
        { label: 'Executed renewal agreement', state: 'attached' },
        { label: 'Comparable-deal export', state: 'attached' },
        { label: 'School disclosure receipt', state: 'attached' },
      ],
      sources: [
        { id: 'source:comparable-deals', label: 'Comparable NIL deals', state: 'attached', freshness: 'refreshed 2d ago', note: 'Reviewer-tagged national-marquee comps.' },
        { id: 'source:school-compliance-precheck', label: 'School disclosure precheck', state: 'attached', freshness: 'cleared', note: 'Syracuse renewal disclosure receipt attached.' },
      ],
    },
  },

  // ⑤ Jordan Miles × CarMax — local prep deal, live in market
  'd-5': {
    id: 'd-5',
    deal: BRAND_DEALS[4],
    companyOverview: {
      name: 'CarMax Syracuse',
      summary:
        'CarMax runs hyper-local NIL deals that tie a rising hometown athlete to dealership-traffic campaigns, first-car storytelling, and community-event appearances.',
      headquarters: 'Richmond, VA',
      founded: '1993',
      category: 'Local · Automotive Retail',
    },
    stage: stageFor(BRAND_DEALS[4]),
    money: {
      total: '$140K',
      guaranteed: '$110K guaranteed',
      performance: '$30K traffic + appearance pool',
      usageRights: 'Category-exclusive (auto retail) · regional · 2 yrs',
      paymentTiming: 'Monthly draws + per-event appearance fees',
      breakdown: [
        { label: 'Base guarantee', value: '$110K', note: 'Monthly draws across the 2-year term.' },
        { label: 'Appearance pool', value: '$20K', note: 'Community + dealership-event appearances.' },
        { label: 'Traffic bonus', value: '$10K', note: 'Lead-form attribution from campaign creative.' },
      ],
    },
    commitments: [
      { id: 'd-5-c1', title: 'First-car content series', due: 'Live · monthly', owner: 'Jordan Miles', proof: 'Episodes posting on schedule; auto-captured from handle.', status: 'active' },
      { id: 'd-5-c2', title: '4 dealership appearances / yr', due: 'Quarterly', owner: 'Jordan Miles', proof: 'Event recaps + manager sign-off attached per visit.', status: 'active' },
      { id: 'd-5-c3', title: 'Regional billboard usage', due: 'Active flight', owner: 'CarMax creative', proof: 'Usage-rights window logged; assets in market.', status: 'done' },
    ],
    contacts: [
      { id: 'd-5-k1', name: 'Jordan Miles', role: 'Athlete', organization: 'Paul VI HS', context: 'HS senior; guardian co-signs per state NIL rules.' },
      { id: 'd-5-k2', name: 'Maya L.', role: 'Brand deal owner', organization: 'Nike Hoops', context: 'Manages the live-campaign cadence + appearance booking.' },
    ],
    aiCompliance: {
      status: 'cleared',
      summary:
        'Deal is live and tracking well. Compliance is clean for a regional HS-eligible activation, with guardian co-signature and disclosure receipts on file.',
      tracks: [
        { label: 'FMV band', status: 'cleared', note: 'Within range for a top-25 prep prospect regional deal.' },
        { label: 'School compliance', status: 'cleared', note: 'State HS NIL disclosure + guardian co-sign on file.' },
        { label: 'Usage rights', status: 'cleared', note: 'Billboard + content usage windows logged and current.' },
      ],
      caveats: [
        'AI review is advisory only — a human approver must sign off before any outbound step.',
        'Reviewer state stays visible to the AD and NIL Manager regardless of athlete consent scope.',
      ],
    },
    evidence: {
      packetTitle: 'CarMax × Miles — live regional packet',
      matchScore: '90',
      confidence: 'high',
      rationale: [
        'Three reviewer-approved regional automotive comparables',
        'Traffic attribution modeled from prior dealership flights',
        'Guardian co-signature verified for HS eligibility',
      ],
      attachments: [
        { label: 'Executed agreement + guardian co-sign', state: 'attached' },
        { label: 'Comparable-deal export', state: 'attached' },
        { label: 'Usage-rights window log', state: 'attached' },
      ],
      sources: [
        { id: 'source:comparable-deals', label: 'Comparable NIL deals', state: 'attached', freshness: 'refreshed 5d ago', note: 'Reviewer-tagged regional automotive comps.' },
        { id: 'source:school-compliance-precheck', label: 'School disclosure precheck', state: 'attached', freshness: 'cleared', note: 'State HS NIL disclosure + guardian co-sign on file.' },
      ],
    },
  },

  // ⑥ Cooper Flagg × Nike — signature renewal, flagged in negotiation
  'd-6': {
    id: 'd-6',
    deal: BRAND_DEALS[5],
    companyOverview: {
      name: 'Nike Hoops',
      summary:
        'Nike Hoops is negotiating a signature-line renewal with its top-ranked talent — the most strategically important deal on the FY26 board.',
      headquarters: 'Beaverton, OR',
      founded: '1971',
      category: 'National · Footwear & Apparel',
    },
    stage: stageFor(BRAND_DEALS[5]),
    money: {
      total: '$520K renewal',
      guaranteed: '$400K guaranteed',
      performance: '$120K signature-line + milestone pool',
      usageRights: 'Category-exclusive (footwear/apparel) + signature line · 2 yrs',
      paymentTiming: 'Annual guarantees + signature-capsule royalties',
      breakdown: [
        { label: 'Base guarantee', value: '$400K', note: 'Two annual installments of $200K.' },
        { label: 'Signature pool', value: '$80K', note: 'Royalty advance against the signature capsule.' },
        { label: 'Milestone pool', value: '$40K', note: 'Draft-position + award milestone bonuses.' },
      ],
    },
    commitments: [
      { id: 'd-6-c1', title: 'Signature-line co-design', due: 'Per capsule calendar', owner: 'Cooper Flagg', proof: 'Design sessions + concept decks attached to packet.', status: 'active' },
      { id: 'd-6-c2', title: 'On-court exclusivity', due: 'Full term', owner: 'Agent — Wasserman', proof: 'Game-footage spot-checks for non-Nike PEs.', status: 'queued' },
      { id: 'd-6-c3', title: 'Royalty-structure agreement', due: 'Open — in negotiation', owner: 'Tosan E.', proof: 'Royalty split is the active redline blocking signature.', status: 'blocked' },
      { id: 'd-6-c4', title: 'Renewal disclosure receipt', due: 'On execution', owner: 'Duke Compliance', proof: 'Fires once the renewal is signed; not yet triggered.', status: 'queued' },
    ],
    contacts: [
      { id: 'd-6-k1', name: 'Wasserman', role: 'Agent of record', organization: 'Wasserman', context: 'Holding firm on the signature-capsule royalty split.' },
      { id: 'd-6-k2', name: 'Duke Compliance', role: 'School review', organization: 'Duke Athletics', context: 'Renewal disclosure pending execution.' },
    ],
    aiCompliance: {
      status: 'flagged',
      summary:
        'Strategically critical renewal flagged for human attention: the signature-line royalty structure pushes total value above the standard comparable band and the redline is unresolved. Escalate before any outbound move.',
      tracks: [
        { label: 'FMV band', status: 'flagged', note: 'Royalty advance pushes total value above the standard comparable band — needs an exception sign-off.' },
        { label: 'School compliance', status: 'review', note: 'Duke renewal disclosure fires only on execution.' },
        { label: 'Royalty structure', status: 'flagged', note: 'Active redline on the capsule royalty split blocks signature.' },
      ],
      caveats: [
        'AI review is advisory only — a human approver must sign off before any outbound step.',
        'Reviewer state stays visible to the AD and NIL Manager regardless of athlete consent scope.',
      ],
    },
    evidence: {
      packetTitle: 'Nike × Flagg — signature renewal packet',
      matchScore: '76',
      confidence: 'medium',
      rationale: [
        'Two reviewer-approved signature-line comparables',
        'Royalty advance benchmarked against league-leading PEs',
        'Milestone pool tied to projected draft position',
      ],
      attachments: [
        { label: 'Renewal term sheet (v4)', state: 'attached' },
        { label: 'Comparable-deal export', state: 'attached' },
        { label: 'Royalty-structure redline', state: 'requested' },
        { label: 'School disclosure receipt', state: 'missing' },
      ],
      sources: [
        { id: 'source:comparable-deals', label: 'Comparable NIL deals', state: 'attached', freshness: 'refreshed 1d ago', note: 'Reviewer-tagged signature-line comps; thin sample.' },
        { id: 'source:school-compliance-precheck', label: 'School disclosure precheck', state: 'missing', freshness: 'not started', note: 'Duke disclosure fires only on execution of the renewal.' },
      ],
    },
  },
};

export function getBrandDealDetail(id: string): BrandDealDetail | undefined {
  return BRAND_DEAL_DETAILS[id];
}

export const BRAND_INSIGHTS = {
  kpis: [
    { label: 'Total reach · 30d', value: '11.2M', delta: '+18%', positive: true },
    { label: 'Impressions · 30d', value: '42.7M', delta: '+24%', positive: true },
    { label: 'Engagement rate', value: '6.4%', delta: '+0.9pp', positive: true },
    { label: 'CPM', value: '$8.10', delta: '-12%', positive: true },
    { label: 'Cost per sign', value: '$14.2K', delta: '+3%', positive: false },
    { label: 'Conversion (brand → site)', value: '3.8%', delta: '+0.4pp', positive: true },
  ],
  topContent: [
    { id: 'tc-1', title: 'KA7 ACC Debut · Instagram Reel', athlete: 'Kiyan Anthony', metric: '2.1M views', note: '18% of campaign reach' },
    { id: 'tc-2', title: 'Cooper Flagg · Finals Warmup', athlete: 'Cooper Flagg', metric: '1.8M views', note: 'TikTok · 31% ER' },
    { id: 'tc-3', title: 'Paul VI vs DeMatha · Jordan Miles highlights', athlete: 'Jordan Miles', metric: '940K views', note: 'YouTube · sub-60 watch time' },
    { id: 'tc-4', title: 'Behind the Seams · Kiyan colorway reveal', athlete: 'Kiyan Anthony', metric: '720K views', note: 'IG Story series · 84% completion' },
  ],
  breakdown: [
    { label: 'Instagram', pct: 46, color: '#E1306C' },
    { label: 'TikTok', pct: 31, color: '#25F4EE' },
    { label: 'YouTube', pct: 14, color: '#FF0000' },
    { label: 'X', pct: 6, color: '#FFFFFF' },
    { label: 'Other', pct: 3, color: '#888' },
  ],
};
