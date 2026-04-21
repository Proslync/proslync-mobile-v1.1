// Mock data for Fan demo. Swap values here for different demos.

export const FAN_PROFILE = {
  firstName: 'Marcus',
  lastName: 'Delgado',
  username: 'marcdelgado',
  metaPrimary: 'Day-one Syracuse fan',
  metaSecondary: 'Brooklyn, New York',
  tagline: 'Been watching the Orange since the Boeheim era. Kiyan is going to run the Big Apple.',
  bio: [
    {
      key: 'origin',
      title: 'Fan Origin',
      body: "Grew up five blocks from Madison Square Garden. Dad took me to the 2003 title game in New Orleans — I was 11 and Carmelo basically ruined me for every other team. Been bleeding orange since.",
    },
    {
      key: 'season',
      title: 'This Season',
      body: 'Attended 6 home games so far · 2 road trips (DC, Miami) · streaming every away game. Front row for the Duke home game in February — yelled myself hoarse.',
    },
    {
      key: 'teams',
      title: 'Teams & Athletes',
      body: 'Syracuse Men\'s Basketball (ride-or-die). Brooklyn Nets (for the city). Following Kiyan Anthony, JJ Starling, Donnie Freeman, and Cooper Flagg because the ACC story is too good to miss.',
    },
    {
      key: 'pickem',
      title: 'Pick\'em Record',
      body: '2025 Tournament: 42 of 63 correct (67%). All-time accuracy on Syracuse games: 74%. Undefeated when picking against UNC in the last four matchups.',
    },
  ],
  stats: [
    { label: 'Following', value: '12' },
    { label: 'Games watched', value: '47' },
    { label: 'Fan Score', value: '892' },
  ],
  superfanTier: 'Platinum',
  superfanPoints: 8920,
  nextTier: 'Diamond',
  pointsToNext: 1080,
};

export type FollowingAthlete = {
  id: string;
  name: string;
  school: string;
  initials: string;
  lastUpdate: string;
  avatarColor: string;
  isLive?: boolean;
};

export const FAN_FOLLOWING: FollowingAthlete[] = [
  { id: 'f-1', name: 'Kiyan Anthony', school: 'Syracuse · #7', initials: 'KA', lastUpdate: 'Live now · Syracuse vs Duke · 14 PTS', avatarColor: '#FF6F3C', isLive: true },
  { id: 'f-2', name: 'JJ Starling', school: 'Syracuse · #2', initials: 'JS', lastUpdate: 'Posted an IG reel · 18 min ago', avatarColor: '#FF6F3C' },
  { id: 'f-3', name: 'Cooper Flagg', school: 'Duke · #2', initials: 'CF', lastUpdate: 'ACC Player of the Week announcement', avatarColor: '#003087' },
  { id: 'f-4', name: 'Jordan Miles', school: 'Paul VI HS · #23', initials: 'JM', lastUpdate: 'New workout video posted', avatarColor: '#A855F7' },
  { id: 'f-5', name: 'Donnie Freeman', school: 'Syracuse · #22', initials: 'DF', lastUpdate: '3 hrs ago · practice report', avatarColor: '#FF6F3C' },
  { id: 'f-6', name: 'Dylan Harper', school: 'Rutgers · #7', initials: 'DH', lastUpdate: 'Yesterday · preseason AP interview', avatarColor: '#CC0033' },
  { id: 'f-7', name: 'Ace Bailey', school: 'Rutgers · #4', initials: 'AB', lastUpdate: '2 days ago · training camp drop', avatarColor: '#CC0033' },
];

export type FeedItem = {
  id: string;
  athleteName: string;
  athleteInitials: string;
  athleteColor: string;
  type: 'highlight' | 'post' | 'announcement' | 'milestone';
  content: string;
  timeAgo: string;
  reactions: { likes: number; comments: number };
};

export const FAN_FEED: FeedItem[] = [
  {
    id: 'feed-1',
    athleteName: 'Kiyan Anthony',
    athleteInitials: 'KA',
    athleteColor: '#FF6F3C',
    type: 'highlight',
    content: '🔥 Kiyan just dropped a deep 3 from the top of the key to cut the Duke lead to 2. Dome is shaking.',
    timeAgo: 'Just now',
    reactions: { likes: 3247, comments: 482 },
  },
  {
    id: 'feed-2',
    athleteName: 'JJ Starling',
    athleteInitials: 'JS',
    athleteColor: '#FF6F3C',
    type: 'post',
    content: 'Another day, another grind. Locked in for tonight 🍊 #CuseLockdown',
    timeAgo: '18 min',
    reactions: { likes: 1820, comments: 143 },
  },
  {
    id: 'feed-3',
    athleteName: 'Cooper Flagg',
    athleteInitials: 'CF',
    athleteColor: '#003087',
    type: 'announcement',
    content: '🏆 Named ACC Player of the Week for the third time this season. Historic freshman campaign continues.',
    timeAgo: '1 hr',
    reactions: { likes: 18400, comments: 2104 },
  },
  {
    id: 'feed-4',
    athleteName: 'Kiyan Anthony',
    athleteInitials: 'KA',
    athleteColor: '#FF6F3C',
    type: 'milestone',
    content: '🎯 1,000 career points at Syracuse — first freshman to hit the mark before February since Gerry McNamara.',
    timeAgo: '3 hrs',
    reactions: { likes: 9241, comments: 814 },
  },
  {
    id: 'feed-5',
    athleteName: 'Jordan Miles',
    athleteInitials: 'JM',
    athleteColor: '#A855F7',
    type: 'post',
    content: 'New workout drop with Coach Diggs 🎥 Shooting off movement, tight curls, deep threes. Link in bio.',
    timeAgo: '5 hrs',
    reactions: { likes: 624, comments: 58 },
  },
  {
    id: 'feed-6',
    athleteName: 'Donnie Freeman',
    athleteInitials: 'DF',
    athleteColor: '#FF6F3C',
    type: 'post',
    content: 'Cleared at practice today after the ankle scare 🙏 Ready to roll for the tournament.',
    timeAgo: 'Yesterday',
    reactions: { likes: 2180, comments: 221 },
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
  },
];

export type Prediction = {
  id: string;
  label: string;
  options: { id: string; text: string; pct: number }[];
  deadline: string;
  locked: boolean;
  myPick?: string;
  potPoints: number;
};

export const FAN_PREDICTIONS: Prediction[] = [
  {
    id: 'pred-1',
    label: 'Does Kiyan score 20+ tonight?',
    options: [
      { id: 'yes', text: 'Yes · 20+ points', pct: 64 },
      { id: 'no', text: 'No · under 20', pct: 36 },
    ],
    deadline: 'Closes 7:25 PM',
    locked: false,
    myPick: 'yes',
    potPoints: 150,
  },
  {
    id: 'pred-2',
    label: 'Margin of victory · Syracuse vs Duke',
    options: [
      { id: 'm1', text: 'Duke wins', pct: 48 },
      { id: 'm2', text: 'Cuse by 1-5', pct: 28 },
      { id: 'm3', text: 'Cuse by 6+', pct: 24 },
    ],
    deadline: 'LOCKED at tipoff',
    locked: true,
    myPick: 'm2',
    potPoints: 300,
  },
  {
    id: 'pred-3',
    label: 'Paul VI vs Gonzaga HS · WCAC final',
    options: [
      { id: 'pv', text: 'Paul VI wins', pct: 58 },
      { id: 'gz', text: 'Gonzaga wins', pct: 42 },
    ],
    deadline: 'Closes Fri 7:20 PM',
    locked: false,
    potPoints: 200,
  },
  {
    id: 'pred-4',
    label: 'ACC Player of the Year',
    options: [
      { id: 'cf', text: 'Cooper Flagg', pct: 71 },
      { id: 'ka', text: 'Kiyan Anthony', pct: 17 },
      { id: 'dh', text: 'Field', pct: 12 },
    ],
    deadline: 'Closes season-end',
    locked: false,
    myPick: 'ka',
    potPoints: 1000,
  },
];

export type Perk = {
  id: string;
  type: 'tickets' | 'merch' | 'experience' | 'meet';
  title: string;
  athlete: string;
  cost: number;
  tier: 'Gold' | 'Platinum' | 'Diamond';
  claimed: boolean;
  description: string;
};

export const FAN_PERKS: Perk[] = [
  {
    id: 'perk-1',
    type: 'tickets',
    title: '2 floor-row tickets · Syracuse vs UNC',
    athlete: 'JMA Wireless Dome',
    cost: 6000,
    tier: 'Platinum',
    claimed: false,
    description: 'Section A · Row 1 · Complimentary parking included',
  },
  {
    id: 'perk-2',
    type: 'meet',
    title: 'Meet & greet with Kiyan Anthony',
    athlete: 'Post-game · Dome tunnel',
    cost: 12000,
    tier: 'Diamond',
    claimed: false,
    description: 'Signed jersey + 5-minute photo op · April 28',
  },
  {
    id: 'perk-3',
    type: 'merch',
    title: 'KA7 Orange Crush hoodie — pre-release',
    athlete: 'Kiyan Anthony · capsule drop',
    cost: 3200,
    tier: 'Gold',
    claimed: true,
    description: 'Limited to 500 · shipped before public launch',
  },
  {
    id: 'perk-4',
    type: 'experience',
    title: 'Shoot-around pass · Practice Day',
    athlete: 'Syracuse Men\'s Basketball',
    cost: 8500,
    tier: 'Platinum',
    claimed: false,
    description: 'Watch practice from courtside · no meet, silent observe',
  },
  {
    id: 'perk-5',
    type: 'tickets',
    title: 'Road-trip package · Duke @ Cameron',
    athlete: 'Duke vs Syracuse',
    cost: 15000,
    tier: 'Diamond',
    claimed: false,
    description: 'Flight + hotel + 2 tickets · Cameron Crazies section',
  },
  {
    id: 'perk-6',
    type: 'merch',
    title: 'Game-worn Kiyan warmup jacket',
    athlete: 'Auction · bid with points',
    cost: 22000,
    tier: 'Diamond',
    claimed: false,
    description: 'Worn vs Duke · size M · authenticated',
  },
];
