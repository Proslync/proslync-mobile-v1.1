// Mock data for Fan demo. Swap values here for different demos.

export const FAN_PROFILE = {
  firstName: 'Marcus',
  lastName: 'Delgado',
  username: 'marcdelgado',
  metaPrimary: 'Multi-sport college fan',
  metaSecondary: 'Brooklyn, New York',
  tagline: 'Tracking the next wave of college stars across basketball, football, volleyball, and gymnastics.',
  bio: [
    {
      key: 'origin',
      title: 'Fan Origin',
      body: "Grew up five blocks from Madison Square Garden. Dad took me to the 2003 title game in New Orleans — I was 11 and Carmelo basically ruined me for every other team. Been bleeding orange since, but college sports pulled me into every corner: Paige at UConn, Travis Hunter at Colorado, Sunisa at Auburn.",
    },
    {
      key: 'season',
      title: 'This Season',
      body: 'Attended 8 games so far — 4 hoops, 2 football, 1 volleyball, 1 gymnastics meet. Streaming every matchup involving athletes I follow. Front row for the Duke home game in February — yelled myself hoarse.',
    },
    {
      key: 'teams',
      title: 'Teams & Athletes',
      body: 'Syracuse Men\'s Basketball (ride-or-die). UConn WBB for Paige Bueckers. Colorado football when Travis Hunter plays both ways. Following Cooper Flagg, Simone Lee at Penn State, and Paul Skenes whenever LSU plays.',
    },
  ],
  // Membership identity only — no Fan Score / points / streaks. Charter (FAN
  // CUT LIST): spend leaderboards + points gamification are the whale-toxicity
  // pattern. The fan's PAYING STATUS (tier name + perks) is the asset, not a
  // score. Tier NAMES are allowed; points/score/leaderboards are not.
  stats: [
    { label: 'Following', value: '12' },
    { label: 'Games watched', value: '47' },
    { label: 'Supporting', value: '4' },
  ],
  superfanTier: 'Platinum',
  supporterSince: 'Oct 2023',
};

export type FollowingAthlete = {
  id: string;
  name: string;
  school: string;
  initials: string;
  lastUpdate: string;
  avatarColor: string;
  isLive?: boolean;
  /** Optional headshot; AthleteAvatar falls back to initials when omitted. */
  headshotUrl?: string;
  /**
   * ID bridge → `lib/data/demo-roster.ts` `DEMO_ATHLETES`. Lets fan-side UIs
   * (e.g. AthleteDetailSheet) hydrate rich athlete data (sport/school/class/
   * accent) and, where the id maps, social-reach fixtures via
   * `getMockAthleteSocialReach`. Stable so taps always resolve a real athlete.
   */
  rosterId: string;
  /**
   * Optional social-reach fixture id (`lib/data/mock-social-reach.ts`). Only a
   * handful of athletes have hand-authored reach packets; the sheet renders a
   * clean empty state when this is omitted or unmapped.
   */
  reachId?: string;
};

export const FAN_FOLLOWING: FollowingAthlete[] = [
  { id: 'f-1', name: 'Paige Bueckers', school: 'UConn · #5', initials: 'PB', lastUpdate: 'Live now · UConn vs South Carolina · 22 PTS', avatarColor: '#000E2F', isLive: true, rosterId: 'paige-bueckers' },
  { id: 'f-2', name: 'Cooper Flagg', school: 'Duke · #2', initials: 'CF', lastUpdate: 'ACC Player of the Week announced · 1 hr ago', avatarColor: '#001A57', isLive: true, rosterId: 'cooper-flagg', reachId: 'a-3' },
  { id: 'f-3', name: 'Kiyan Anthony', school: 'Syracuse · #7', initials: 'KA', lastUpdate: 'Posted an IG reel · 18 min ago', avatarColor: '#F76900', rosterId: 'kiyan-anthony', reachId: 'a-1' },
  { id: 'f-4', name: 'Travis Hunter', school: 'Colorado · #12', initials: 'TH', lastUpdate: 'Heisman finalist announced · 3 hrs ago', avatarColor: '#CFB87C', rosterId: 'travis-hunter' },
  { id: 'f-5', name: 'Simone Lee', school: 'Penn St · #10', initials: 'SL', lastUpdate: 'Big Ten Volleyball Player of Week', avatarColor: '#041E42', rosterId: 'simone-lee' },
  { id: 'f-6', name: 'Paul Skenes', school: 'LSU · #20', initials: 'PS', lastUpdate: 'Yesterday · 14 K no-hitter vs Ole Miss', avatarColor: '#461D7C', rosterId: 'paul-skenes' },
  { id: 'f-7', name: 'Sunisa Lee', school: 'Auburn · Gymnastics', initials: 'SL', lastUpdate: '2 days ago · SEC all-around title', avatarColor: '#0C2340', rosterId: 'suni-lee' },
];

export type FeedItem = {
  id: string;
  athleteName: string;
  athleteInitials: string;
  athleteColor: string;
  /** Optional headshot; feed-card falls back to getHeadshotUrl when omitted. */
  athleteHeadshotUrl?: string;
  type: 'highlight' | 'post' | 'announcement' | 'milestone';
  content: string;
  timeAgo: string;
  reactions: { likes: number; comments: number };
};

export const FAN_FEED: FeedItem[] = [
  {
    id: 'feed-1',
    athleteName: 'Paige Bueckers',
    athleteInitials: 'PB',
    athleteColor: '#000E2F',
    type: 'highlight',
    content: 'Paige with 22 points on 9-of-14 shooting through three quarters — UConn leads South Carolina by 8. Geno calling her the best he has ever coached.',
    timeAgo: 'Just now',
    reactions: { likes: 28400, comments: 3812 },
  },
  {
    id: 'feed-2',
    athleteName: 'Cooper Flagg',
    athleteInitials: 'CF',
    athleteColor: '#001A57',
    type: 'announcement',
    content: 'Named ACC Player of the Week for the fourth time this season. Historic freshman campaign — 22.4 PPG, 9.6 RPG, leading Duke into the top-5.',
    timeAgo: '1 hr',
    reactions: { likes: 18400, comments: 2104 },
  },
  {
    id: 'feed-3',
    athleteName: 'Travis Hunter',
    athleteInitials: 'TH',
    athleteColor: '#CFB87C',
    type: 'milestone',
    content: 'Travis Hunter officially named Heisman Trophy finalist — the first player ever to earn the honor as both a WR and CB in the same season. Colorado making history.',
    timeAgo: '3 hrs',
    reactions: { likes: 41200, comments: 5830 },
  },
  {
    id: 'feed-4',
    athleteName: 'Kiyan Anthony',
    athleteInitials: 'KA',
    athleteColor: '#F76900',
    type: 'milestone',
    content: '1,000 career points at Syracuse — first freshman to hit the mark before February since Gerry McNamara. The Dome is going crazy.',
    timeAgo: '5 hrs',
    reactions: { likes: 9241, comments: 814 },
  },
  {
    id: 'feed-5',
    athleteName: 'Paul Skenes',
    athleteInitials: 'PS',
    athleteColor: '#461D7C',
    type: 'highlight',
    content: '14 strikeouts through 8 innings against Ole Miss — no-hit bid broken up with one out to go. Skenes sits 101-104 mph all night. LSU wins 3-0.',
    timeAgo: 'Yesterday',
    reactions: { likes: 7640, comments: 924 },
  },
  {
    id: 'feed-6',
    athleteName: 'Simone Lee',
    athleteInitials: 'SL',
    athleteColor: '#041E42',
    type: 'announcement',
    content: 'Big Ten Volleyball Player of the Week — 24 kills, 8 digs against Nebraska in a five-set classic. Penn State back in the national conversation.',
    timeAgo: '2 days ago',
    reactions: { likes: 3180, comments: 241 },
  },
];

export type LiveGame = {
  id: string;
  status: 'live' | 'upcoming' | 'final';
  home: string;
  away: string;
  homeScore?: number;
  awayScore?: number;
  quarter?: string;
  clock?: string;
  tipoff?: string;
  venue: string;
  hasFollowedAthlete: boolean;
  watchedBy: number;
  /**
   * ID bridge → `lib/data/mock-games.ts` `getGame(id)`. Every entry maps to a
   * real game id so a fan game card routes to `/game/[id]`. `getGame` never
   * returns null — hand-authored ids (ncaab-1/7/9/10) get rich data, any other
   * id is deterministically synthesized — so all of these resolve safely.
   */
  gameId: string;
};

export const FAN_GAMES: LiveGame[] = [
  {
    id: 'g-live-1',
    status: 'live',
    home: 'Syracuse',
    away: 'Duke',
    homeScore: 47,
    awayScore: 43,
    quarter: 'Q3',
    clock: '4:22',
    venue: 'JMA Wireless Dome',
    hasFollowedAthlete: true,
    watchedBy: 12400,
    gameId: 'ncaab-1', // hand-authored Duke @ Cuse
  },
  {
    id: 'g-live-2',
    status: 'live',
    home: 'Rutgers',
    away: 'Maryland',
    homeScore: 52,
    awayScore: 58,
    quarter: 'Q3',
    clock: '2:10',
    venue: 'Jersey Mike\'s Arena',
    hasFollowedAthlete: true,
    watchedBy: 4280,
    gameId: 'ncaab-9', // hand-authored
  },
  {
    id: 'g-up-1',
    status: 'upcoming',
    home: 'Paul VI',
    away: 'Gonzaga HS',
    tipoff: '7:30 PM',
    venue: 'Carmel Hall',
    hasFollowedAthlete: true,
    watchedBy: 0,
    gameId: 'ncaab-7', // hand-authored
  },
  {
    id: 'g-up-2',
    status: 'upcoming',
    home: 'UNC',
    away: 'NC State',
    tipoff: '9:00 PM',
    venue: 'Dean Smith Center',
    hasFollowedAthlete: false,
    watchedBy: 0,
    gameId: 'ncaab-10', // hand-authored
  },
  {
    id: 'g-final-1',
    status: 'final',
    home: 'Syracuse',
    away: 'Miami',
    homeScore: 72,
    awayScore: 69,
    venue: 'JMA Wireless Dome',
    hasFollowedAthlete: true,
    watchedBy: 15800,
    gameId: 'ncaab-1',
  },
  {
    id: 'g-final-2',
    status: 'final',
    home: 'Duke',
    away: 'UNC',
    homeScore: 81,
    awayScore: 77,
    venue: 'Cameron Indoor',
    hasFollowedAthlete: true,
    watchedBy: 22100,
    gameId: 'ncaab-1',
  },
];

// REMOVED (charter FAN CUT LIST): the performance-contingent pick'em.
// The `Prediction` type + `FAN_PREDICTIONS` (incl. "Does Kiyan score 20+
// tonight?" with a points pot) were deleted outright — "ANYTHING performance-
// contingent (win bonuses/predictions) = pay-for-play; fans buy content +
// perks, never outcomes." Nothing imports them anymore.

export type Perk = {
  id: string;
  type: 'tickets' | 'merch' | 'experience' | 'meet';
  title: string;
  athlete: string;
  // No `cost` (points) — perks are tier-gated membership benefits, not a
  // points-store currency (charter FAN CUT LIST: no points gamification).
  tier: 'Gold' | 'Platinum' | 'Diamond';
  claimed: boolean;
  description: string;
  /** Optional hero image; rendered by perks-section when present. */
  imageUrl?: string;
};

export const FAN_PERKS: Perk[] = [
  {
    id: 'perk-1',
    type: 'tickets',
    title: '2 floor-row tickets · Syracuse vs UNC',
    athlete: 'JMA Wireless Dome',
    tier: 'Platinum',
    claimed: true,
    description: 'Section A · Row 1 · Complimentary parking included',
  },
  {
    id: 'perk-2',
    type: 'meet',
    title: 'Meet & greet with Kiyan Anthony',
    athlete: 'Post-game · Dome tunnel',
    tier: 'Diamond',
    claimed: false,
    description: 'Signed jersey + 5-minute photo op · April 28',
  },
  {
    id: 'perk-3',
    type: 'merch',
    title: 'KA7 Orange Crush hoodie — pre-release',
    athlete: 'Kiyan Anthony · capsule drop',
    tier: 'Gold',
    claimed: true,
    description: 'Limited to 500 · shipped before public launch',
  },
  {
    id: 'perk-4',
    type: 'experience',
    title: 'Shoot-around pass · Practice Day',
    athlete: 'Syracuse Men\'s Basketball',
    tier: 'Platinum',
    claimed: true,
    description: 'Watch practice from courtside · no meet, silent observe',
  },
  {
    id: 'perk-5',
    type: 'tickets',
    title: 'Road-trip package · Duke @ Cameron',
    athlete: 'Duke vs Syracuse',
    tier: 'Diamond',
    claimed: false,
    description: 'Flight + hotel + 2 tickets · Cameron Crazies section',
  },
  {
    id: 'perk-6',
    type: 'merch',
    title: 'Game-worn Kiyan warmup jacket',
    athlete: 'Auction · bid with points',
    tier: 'Diamond',
    claimed: false,
    description: 'Worn vs Duke · size M · authenticated',
  },
];
