// Mock data for Brand demo. Swap values here for different demos.

export const BRAND_PROFILE = {
  name: 'Nike Hoops',
  handle: 'pumahoops',
  metaPrimary: 'NIL & Amateur Athletics',
  metaSecondary: 'Boston, MA · HQ',
  tagline: 'Forever Faster. On-court, in-class, in culture.',
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
      body: 'Led by Tosan Evbuomwan (VP, NIL & Grassroots). 6-person deal team + 4-person creative team based in Boston and LA. Legal handled by Reed Smith NIL group.',
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
