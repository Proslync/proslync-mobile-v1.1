// Mock data for the agent role: NIL agent representing college athletes.

export type AthleteAudience = {
  score: number;
  totalFollowers: number;
  followersDelta: number;
  followersTopPct: number;
  engagementRate: number;
  engagementDelta: number;
  engagementTopPct: number;
  locations: { city: string; state: string; followers: number; pct: number }[];
  ageGender: { bucket: string; male: number; female: number }[];
};

export type AgentAthlete = {
  id: string;
  name: string;
  initials: string;
  color: string;
  sport: string;
  school: string;
  classYear: string;
  status: 'signed' | 'prospect' | 'pending';
  totalDealValue: string; // '$248k YTD'
  activeDeals: number;
  followers: string;
  /** Optional headshot; the avatar falls back to initials when omitted. */
  headshotUrl?: string;
};

export type AgentDeal = {
  id: string;
  athleteId: string;
  athleteName: string;
  athleteInitial: string;
  athleteColor: string;
  brand: string;
  brandInitial: string;
  brandColor: string;
  stage: 'draft' | 'sent' | 'negotiation' | 'signed' | 'live' | 'wrapped';
  value: string; // '$85k + 4% royalty'
  category: string;
  due: string; // 'Counter due Friday'
};

export type AgentOffer = {
  id: string;
  athleteName: string;
  athleteInitial: string;
  athleteColor: string;
  brand: string;
  brandInitial: string;
  brandColor: string;
  summary: string;
  amount: string;
  received: string;
  matchScore: number;
};

export type AgentBio = {
  key: string;
  title: string;
  body: string;
};

export const AGENT_PROFILE = {
  firstName: 'Daniel',
  lastName: 'Hayes',
  username: 'danielhayes',
  metaPrimary: 'Founder · Hayes Sports Group',
  metaSecondary: 'Los Angeles, California',
  tagline:
    'Athlete-first NIL representation. Built around clear communication and contracts that compound over a career.',
  stats: [
    { label: 'Athletes signed', value: '14' },
    { label: 'Avg deal size', value: '$74k' },
    { label: 'YTD volume', value: '$3.4M' },
  ],
  bio: [
    {
      key: 'mission',
      title: 'Mission',
      body: "We represent the next generation of basketball, football, and Olympic-sport athletes. Our work is contracts, brand strategy, and post-eligibility planning — done quietly, on the athlete's terms, with full transparency.",
    },
    {
      key: 'background',
      title: 'Background',
      body: 'Before founding Hayes Sports Group in 2024, Daniel led NIL strategy for two top-25 D1 collectives and spent four seasons at WME Sports working with NCAA basketball clients. UPenn Wharton MBA, 2018.',
    },
    {
      key: 'philosophy',
      title: 'How we work',
      body: 'Athletes get a real strategist, not a salesperson. We turn down 8 of every 10 inbound offers in favor of long-term brand fit. Every deal includes performance bonuses tied to social engagement and on-court production.',
    },
  ] satisfies AgentBio[],
  career: [
    { year: '2024', title: 'Founded Hayes Sports Group', detail: '14 athletes signed in first 9 months' },
    { year: '2022', title: 'Head of NIL Strategy · Carolina Pulse Collective', detail: '$8.2M in deal flow' },
    { year: '2020', title: 'Manager · WME Sports NIL Practice', detail: '6 NCAA Tournament Most Outstanding Players' },
    { year: '2018', title: 'MBA · The Wharton School', detail: 'Major: Business Analytics' },
  ],
  network: [
    { name: 'Bryan Sissoko', role: 'Senior Counsel · Skadden NIL Practice' },
    { name: 'Maya Stillwell', role: 'CMO · Athletic Brewing' },
    { name: 'Rashid Lin', role: 'Head of Talent · Buchwald Sports Marketing' },
    { name: 'Petra Coelho', role: 'Director · Klutch Sports Group' },
  ],
};

// ── AGENT ROSTER (de-forked from the spine) ──────────────────────────────
// Every entry is either a REAL spine athlete (same id = same person as
// BRAND_ATHLETES) or an agent-only client with a DISTINCT non-colliding id
// (`ag-*`). Previously a-2..a-5 reused spine ids for DIFFERENT people
// (agent a-3 = Maya Chen vs spine a-3 = Cooper Flagg), which made a cross-role
// id join name the wrong athlete. Fixed mapping:
//   a-1  Kiyan Anthony  — REAL spine athlete (the hero; owns d-4)
//   a-4  JJ Starling    — REAL spine athlete (was wrongly id'd a-2)
//   a-6  Ace Bailey     — REAL spine athlete (was wrongly id'd a-5)
//   ag-3 Maya Chen      — agent-only client, distinct id (no spine collision)
//   ag-4 Jalen Ortiz    — agent-only client, distinct id (no spine collision)
export const AGENT_ATHLETES: AgentAthlete[] = [
  {
    id: 'a-1',
    name: 'Kiyan Anthony',
    initials: 'KA',
    color: '#F76900',
    sport: 'Basketball',
    school: 'Syracuse',
    classYear: 'Freshman',
    status: 'signed',
    totalDealValue: '$248k YTD',
    activeDeals: 3,
    followers: '412K',
  },
  {
    id: 'a-4',
    name: 'JJ Starling',
    initials: 'JS',
    color: '#F76900',
    sport: 'Basketball',
    school: 'Syracuse',
    classYear: 'Junior',
    status: 'signed',
    totalDealValue: '$158k YTD',
    activeDeals: 2,
    followers: '244K',
  },
  {
    id: 'ag-3',
    name: 'Maya Chen',
    initials: 'MC',
    color: '#2774AE',
    sport: 'Soccer',
    school: 'UCLA',
    classYear: 'Senior',
    status: 'signed',
    totalDealValue: '$94k YTD',
    activeDeals: 4,
    followers: '318K',
  },
  {
    id: 'ag-4',
    name: 'Jalen Ortiz',
    initials: 'JO',
    color: '#00274C',
    sport: 'Football',
    school: 'Michigan',
    classYear: 'Junior',
    status: 'signed',
    totalDealValue: '$402k YTD',
    activeDeals: 5,
    followers: '1.1M',
  },
  {
    id: 'a-6',
    name: 'Ace Bailey',
    initials: 'AB',
    color: '#CC0033',
    sport: 'Basketball',
    school: 'Rutgers',
    classYear: 'Senior',
    status: 'pending',
    totalDealValue: '—',
    activeDeals: 0,
    followers: '640K',
  },
];

// ── AGENT DEALS (de-forked) ──────────────────────────────────────────────
// The Kiyan × Nike Hoops entry is re-pointed to the canonical hero deal d-4
// ($660K, signed) so opening it from any agent surface resolves to the same
// Nike Hoops packet (getBrandDealDetail('d-4')) every other role sees — no
// more an $85k-in-negotiation phantom that contradicts the $660K-signed spine.
// All OTHER agent deals carry distinct `ag-d-*` ids so they can't collide with
// the spine's d-1..d-6 packets, and reference the de-forked athlete ids.
export const AGENT_DEALS: AgentDeal[] = [
  {
    id: 'd-4',
    athleteId: 'a-1',
    athleteName: 'Kiyan Anthony',
    athleteInitial: 'K',
    athleteColor: '#F76900',
    brand: 'Nike Hoops',
    brandInitial: 'N',
    brandColor: '#111111',
    stage: 'signed',
    value: '$660K · 3 yrs',
    category: 'Footwear · Apparel',
    due: 'Signed — payments scheduled',
  },
  {
    id: 'ag-d-2',
    athleteId: 'a-1',
    athleteName: 'Kiyan Anthony',
    athleteInitial: 'K',
    athleteColor: '#F76900',
    brand: 'BODYARMOR',
    brandInitial: 'B',
    brandColor: '#0A2342',
    stage: 'signed',
    value: '$22k flat',
    category: 'Sports Drink',
    due: 'Activations begin May 3',
  },
  {
    id: 'ag-d-3',
    athleteId: 'ag-4',
    athleteName: 'Jalen Ortiz',
    athleteInitial: 'J',
    athleteColor: '#00274C',
    brand: 'Beats by Dre',
    brandInitial: 'B',
    brandColor: '#E52321',
    stage: 'live',
    value: '$120k + product',
    category: 'Audio',
    due: 'Mid-cycle review Tuesday',
  },
  {
    id: 'ag-d-4',
    athleteId: 'ag-3',
    athleteName: 'Maya Chen',
    athleteInitial: 'M',
    athleteColor: '#2774AE',
    brand: 'Athletic Brewing',
    brandInitial: 'A',
    brandColor: '#073E2C',
    stage: 'sent',
    value: '$18k flat',
    category: 'Beverage',
    due: 'Awaiting brand response',
  },
  {
    id: 'ag-d-5',
    athleteId: 'a-4',
    athleteName: 'JJ Starling',
    athleteInitial: 'J',
    athleteColor: '#F76900',
    brand: 'Adidas Basketball',
    brandInitial: 'A',
    brandColor: '#000000',
    stage: 'draft',
    value: '$35k + signature line',
    category: 'Footwear',
    due: 'Drafting initial proposal',
  },
];

export const AGENT_OFFERS: AgentOffer[] = [
  {
    id: 'o-1',
    athleteName: 'Kiyan Anthony',
    athleteInitial: 'K',
    athleteColor: '#F76900',
    brand: 'Celsius',
    brandInitial: 'C',
    brandColor: '#00C2A8',
    summary: 'Gameday Series · 3 posts + tunnel cut',
    amount: '$12k – $18k',
    received: '2h ago',
    matchScore: 92,
  },
  {
    id: 'o-2',
    athleteName: 'Jalen Ortiz',
    athleteInitial: 'J',
    athleteColor: '#00274C',
    brand: 'Lululemon',
    brandInitial: 'L',
    brandColor: '#E22330',
    summary: 'Lifestyle campaign · 6-month',
    amount: '$45k flat',
    received: 'Yesterday',
    matchScore: 87,
  },
  {
    id: 'o-3',
    athleteName: 'Maya Chen',
    athleteInitial: 'M',
    athleteColor: '#2774AE',
    brand: 'Nike Soccer',
    brandInitial: 'N',
    brandColor: '#111111',
    summary: 'Boot launch · 2 reels + appearance',
    amount: '$28k + product',
    received: '2 days ago',
    matchScore: 95,
  },
];

export const AGENT_INSIGHTS = {
  totalVolume: '$3.4M',
  totalVolumeDelta: '+18% MoM',
  topAthlete: { name: 'Jalen Ortiz', value: '$402k YTD' },
  pipelineValue: '$612k',
  conversionRate: '34%',
  topCategory: 'Footwear & Apparel',
};

// Per-athlete audience analytics — keyed by AgentAthlete.id (de-forked ids).
export const AGENT_ATHLETE_AUDIENCE: Record<string, AthleteAudience> = {
  'a-1': {
    score: 78,
    totalFollowers: 412338,
    followersDelta: 6.42,
    followersTopPct: 22,
    engagementRate: 8.34,
    engagementDelta: 1.18,
    engagementTopPct: 31,
    locations: [
      { city: 'Syracuse', state: 'NY', followers: 84212, pct: 20.42 },
      { city: 'Brooklyn', state: 'NY', followers: 51894, pct: 12.59 },
      { city: 'Newark', state: 'NJ', followers: 28107, pct: 6.81 },
    ],
    ageGender: [
      { bucket: '13-17', male: 11, female: 14 },
      { bucket: '18-24', male: 42, female: 38 },
      { bucket: '25-34', male: 28, female: 22 },
      { bucket: '35-44', male: 9, female: 5 },
      { bucket: '45-64', male: 3, female: 1 },
      { bucket: '65+', male: 0, female: 0 },
    ],
  },
  'a-4': {
    score: 64,
    totalFollowers: 244018,
    followersDelta: 3.11,
    followersTopPct: 38,
    engagementRate: 6.02,
    engagementDelta: 0.42,
    engagementTopPct: 49,
    locations: [
      { city: 'Syracuse', state: 'NY', followers: 39842, pct: 16.33 },
      { city: 'Buffalo', state: 'NY', followers: 18204, pct: 7.46 },
      { city: 'Rochester', state: 'NY', followers: 11098, pct: 4.55 },
    ],
    ageGender: [
      { bucket: '13-17', male: 9, female: 11 },
      { bucket: '18-24', male: 38, female: 31 },
      { bucket: '25-34', male: 30, female: 24 },
      { bucket: '35-44', male: 12, female: 7 },
      { bucket: '45-64', male: 4, female: 1 },
      { bucket: '65+', male: 1, female: 0 },
    ],
  },
  'ag-3': {
    score: 71,
    totalFollowers: 318441,
    followersDelta: 4.86,
    followersTopPct: 28,
    engagementRate: 9.18,
    engagementDelta: 1.34,
    engagementTopPct: 19,
    locations: [
      { city: 'Los Angeles', state: 'CA', followers: 64182, pct: 20.16 },
      { city: 'San Diego', state: 'CA', followers: 28930, pct: 9.09 },
      { city: 'Oakland', state: 'CA', followers: 15441, pct: 4.85 },
    ],
    ageGender: [
      { bucket: '13-17', male: 8, female: 14 },
      { bucket: '18-24', male: 34, female: 44 },
      { bucket: '25-34', male: 26, female: 32 },
      { bucket: '35-44', male: 8, female: 9 },
      { bucket: '45-64', male: 2, female: 2 },
      { bucket: '65+', male: 0, female: 1 },
    ],
  },
  'ag-4': {
    score: 84,
    totalFollowers: 1142008,
    followersDelta: 8.21,
    followersTopPct: 9,
    engagementRate: 7.66,
    engagementDelta: 0.84,
    engagementTopPct: 24,
    locations: [
      { city: 'Detroit', state: 'MI', followers: 218942, pct: 19.17 },
      { city: 'Ann Arbor', state: 'MI', followers: 132441, pct: 11.59 },
      { city: 'Cleveland', state: 'OH', followers: 84118, pct: 7.36 },
    ],
    ageGender: [
      { bucket: '13-17', male: 10, female: 9 },
      { bucket: '18-24', male: 44, female: 36 },
      { bucket: '25-34', male: 32, female: 28 },
      { bucket: '35-44', male: 14, female: 8 },
      { bucket: '45-64', male: 5, female: 2 },
      { bucket: '65+', male: 1, female: 0 },
    ],
  },
  'a-6': {
    score: 69,
    totalFollowers: 642189,
    followersDelta: 5.18,
    followersTopPct: 18,
    engagementRate: 7.12,
    engagementDelta: 0.91,
    engagementTopPct: 35,
    locations: [
      { city: 'Newark', state: 'NJ', followers: 118042, pct: 18.38 },
      { city: 'New Brunswick', state: 'NJ', followers: 62110, pct: 9.67 },
      { city: 'Philadelphia', state: 'PA', followers: 41008, pct: 6.39 },
    ],
    ageGender: [
      { bucket: '13-17', male: 12, female: 13 },
      { bucket: '18-24', male: 40, female: 41 },
      { bucket: '25-34', male: 28, female: 26 },
      { bucket: '35-44', male: 10, female: 6 },
      { bucket: '45-64', male: 3, female: 1 },
      { bucket: '65+', male: 0, female: 0 },
    ],
  },
};
