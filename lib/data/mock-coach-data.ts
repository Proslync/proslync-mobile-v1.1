// Hardcoded demo data for the Coach View. Swap values here for different
// investor / coach demos — no backend wiring required.

export type AIInsight = {
  id: string;
  icon: string;
  text: string;
  confidence: number;
  category: 'Matchup' | 'Shooting' | 'Fatigue' | 'Opponent Tell' | 'Pace' | 'Defense';
  urgency: 'high' | 'medium' | 'low';
};

export const LIVE_GAME = {
  homeTeam: 'Paul VI',
  awayTeam: "St. John's",
  homeScore: 47,
  awayScore: 43,
  quarter: 'Q3',
  clock: '4:22',
  possession: 'home' as 'home' | 'away',
  homeFouls: 4,
  awayFouls: 6,
  timeoutsHome: 2,
  timeoutsAway: 1,
};

// Rotating insights feed — the hero "wow" moment. Cycles every 8-12 seconds.
export const ROTATING_INSIGHTS: AIInsight[] = [
  {
    id: 'ri-1',
    icon: '⚠️',
    text: "Their #11 has 14 pts and no one's been assigned to him in 4 minutes",
    confidence: 94,
    category: 'Matchup',
    urgency: 'high',
  },
  {
    id: 'ri-2',
    icon: '📊',
    text: "Your team's eFG% drops 14% when possessions last >14 seconds — push pace",
    confidence: 87,
    category: 'Pace',
    urgency: 'medium',
  },
  {
    id: 'ri-3',
    icon: '🎯',
    text: 'Opponent has run Horns out of timeouts 3/3 times — expect it again',
    confidence: 91,
    category: 'Opponent Tell',
    urgency: 'high',
  },
  {
    id: 'ri-4',
    icon: '⏱️',
    text: 'Your PG is fatiguing — closeout speed down 18% since Q2',
    confidence: 81,
    category: 'Fatigue',
    urgency: 'medium',
  },
  {
    id: 'ri-5',
    icon: '🔥',
    text: "#23 is 4/4 from the left wing — get him another look there",
    confidence: 96,
    category: 'Shooting',
    urgency: 'high',
  },
  {
    id: 'ri-6',
    icon: '🛡️',
    text: "Switch everything 1-4 when they run flare screens — they've scored 0.38 PPP vs switches",
    confidence: 78,
    category: 'Defense',
    urgency: 'medium',
  },
  {
    id: 'ri-7',
    icon: '⚡',
    text: 'Opponent bench is +7 in last 3 games. Stagger your rotation to stay ahead',
    confidence: 73,
    category: 'Pace',
    urgency: 'low',
  },
  {
    id: 'ri-8',
    icon: '🎯',
    text: "#4 has 3 fouls — attack him in the post. He's guarded 2 straight without help",
    confidence: 89,
    category: 'Matchup',
    urgency: 'high',
  },
  {
    id: 'ri-9',
    icon: '📉',
    text: 'Your team is 1/6 from 3 in Q3. Run a set to get #23 an open look',
    confidence: 84,
    category: 'Shooting',
    urgency: 'medium',
  },
  {
    id: 'ri-10',
    icon: '🧠',
    text: "Opponent calls timeout after 2 straight baskets 84% of the time — next score, they stop play",
    confidence: 82,
    category: 'Opponent Tell',
    urgency: 'low',
  },
];

// ---------- Tab 2: Patterns ----------

export type Pattern = {
  id: string;
  category: 'Timing' | 'Fatigue' | 'Matchup' | 'Shot Quality' | 'Behavioral' | 'Opponent Tell';
  headline: string;
  evidence: string;
  observedGames: number;
  totalGames: number;
  pValue: string;
  clipCount: number;
};

export const PATTERNS: Pattern[] = [
  {
    id: 'pat-1',
    category: 'Behavioral',
    headline: "Your point guard's turnover rate triples on possessions immediately after an opponent made 3-pointer.",
    evidence: 'Observed in 47 of 63 possessions',
    observedGames: 9,
    totalGames: 10,
    pValue: 'p < 0.02',
    clipCount: 5,
  },
  {
    id: 'pat-2',
    category: 'Shot Quality',
    headline: 'Team scores 1.24 PPP when center catches below the free-throw line, 0.78 PPP when above.',
    evidence: '112 vs 89 possessions across last 10 games',
    observedGames: 10,
    totalGames: 10,
    pValue: 'p < 0.001',
    clipCount: 7,
  },
  {
    id: 'pat-3',
    category: 'Fatigue',
    headline: "Opponent center's defensive closeout slows 18% after 6 minutes of continuous play.",
    evidence: 'Measured via film tracking · 14 of 16 stints',
    observedGames: 4,
    totalGames: 4,
    pValue: 'p < 0.01',
    clipCount: 6,
  },
  {
    id: 'pat-4',
    category: 'Matchup',
    headline: 'Your starting lineup is +12 net rating when opposing 4-man has 2+ fouls.',
    evidence: '+12.3 net rating over 74 possessions',
    observedGames: 8,
    totalGames: 10,
    pValue: 'p < 0.03',
    clipCount: 4,
  },
  {
    id: 'pat-5',
    category: 'Fatigue',
    headline: "Jordan's vertical jump drops 3 inches in the last 4 minutes of each half.",
    evidence: 'Avg jump 28.1\" → 25.0\" in final 4 min',
    observedGames: 9,
    totalGames: 10,
    pValue: 'p < 0.005',
    clipCount: 8,
  },
  {
    id: 'pat-6',
    category: 'Behavioral',
    headline: 'When your PG holds ball >2 seconds, correct pass decisions drop from 91% to 62%.',
    evidence: '91% vs 62% across 208 read-and-react reps',
    observedGames: 10,
    totalGames: 10,
    pValue: 'p < 0.001',
    clipCount: 6,
  },
  {
    id: 'pat-7',
    category: 'Timing',
    headline: 'First possession after a timeout scores 1.38 PPP — 34% higher than game average.',
    evidence: 'Sample: 38 post-TO possessions',
    observedGames: 10,
    totalGames: 10,
    pValue: 'p < 0.04',
    clipCount: 5,
  },
  {
    id: 'pat-8',
    category: 'Opponent Tell',
    headline: "Opponents run their 'fist-down' ball-screen action on 4 of 5 out-of-bounds plays in Q4.",
    evidence: '12 of 15 observed inbound sets',
    observedGames: 6,
    totalGames: 10,
    pValue: 'p < 0.02',
    clipCount: 7,
  },
];

// ---------- Tab 3: Opponent Scout ----------

export const OPPONENT = {
  name: 'Gonzaga College HS',
  city: 'Washington, D.C.',
  record: '22-3',
  rank: '#4 WCAC',
  nextGameDate: 'Fri · Apr 24 · 7:30 PM',
  venue: 'Carmel Hall · McLean, VA',
  logoInitial: 'G',
  tendencies: [
    {
      id: 'ten-1',
      title: 'Horns sets out of timeouts',
      detail: 'They run Horns 64% of timeouts, scoring 1.31 PPP — defend the elbow pick-and-pop first.',
      clipLabel: 'HORNS · 14 clips',
    },
    {
      id: 'ten-2',
      title: 'Pack-line defense against drives',
      detail: 'They help one-pass-away aggressively. Skip passes to the weak-side corner generate 47% catch-and-shoot 3s.',
      clipLabel: 'DEFENSE · 22 clips',
    },
    {
      id: 'ten-3',
      title: 'Secondary break with trailing 5',
      detail: 'Their 5-man trails on 78% of makes, sets high ball-screen — deny or blitz first action.',
      clipLabel: 'TRANSITION · 9 clips',
    },
  ],
  keyPlayer: {
    name: 'Jalen Haralson',
    number: 11,
    position: '6\'7" F',
    stats: '21.4 PPG · 6.2 RPG · 3.8 APG',
    tendencies: [
      'Drives left 81% of the time — force right, show early help.',
      'Prefers catch-and-shoot 3s above the break (38%).',
      'Free-throw shooter: 64% — foul late when needed.',
      'Slows down on step-throughs when bodied early in the shot clock.',
    ],
  },
  predictedPlays: [
    { name: 'Horns Flare', likelihood: 68 },
    { name: 'Chicago (Floppy → PnR)', likelihood: 54 },
    { name: 'Pistol', likelihood: 41 },
    { name: 'Zipper Back-Cut', likelihood: 33 },
    { name: 'Box-and-1 on late clock', likelihood: 22 },
  ],
  adjustments: [
    'Top-lock #11 on all wing catches — deny the left-hand drive.',
    "Switch 1-4 on everything except their 5-man's ball-screens.",
    'Run early offense to beat their pack-line setup before it loads.',
  ],
};

// ---------- Tab 4: Player Trends ----------

export type PlayerTrend = {
  id: string;
  name: string;
  number: number;
  position: string;
  avatarInitial: string;
  chartTitle: string;
  chartSubtitle: string;
  // Values should be 0-100. 10 data points for last 10 games.
  data: number[];
  trendDirection: 'up' | 'down' | 'flat';
  headline: string;
  insights: string[];
};

export const PLAYER_TRENDS: PlayerTrend[] = [
  {
    id: 'pt-1',
    name: 'Jordan Miles',
    number: 23,
    position: 'SG · Jr',
    avatarInitial: 'JM',
    chartTitle: 'Effective FG%',
    chartSubtitle: 'Last 10 games · league avg 49%',
    data: [58, 62, 55, 60, 57, 54, 52, 48, 46, 44],
    trendDirection: 'down',
    headline: 'Shooting regression — likely fatigue-driven',
    insights: [
      'eFG% dropped from 58% → 44% over 10 games despite shot profile staying constant.',
      'Assisted-3 rate unchanged — looks are there, legs are not.',
      'Recommend a rest day on Thursday; film-only session.',
    ],
  },
  {
    id: 'pt-2',
    name: 'Marcus Reid',
    number: 4,
    position: 'PG · Sr',
    avatarInitial: 'MR',
    chartTitle: 'Assist-to-TO ratio',
    chartSubtitle: 'Rolling 3-game · team target 2.0',
    data: [1.4, 1.6, 1.7, 1.9, 2.1, 2.2, 2.4, 2.6, 2.9, 3.1],
    trendDirection: 'up',
    headline: 'Decision-making trending up — give him the ball in crunch',
    insights: [
      'A/TO ratio up 121% over 10 games, now 3.1 (league P90).',
      "Shot selection improved — he's taking 38% fewer off-dribble mid-range pull-ups.",
      'Coach-in-the-huddle tone has shifted from direct to delegated.',
    ],
  },
  {
    id: 'pt-3',
    name: 'Tyrese Alston',
    number: 5,
    position: 'C · So',
    avatarInitial: 'TA',
    chartTitle: 'Minutes played',
    chartSubtitle: 'Watch for overuse · cap 32 MPG',
    data: [24, 26, 28, 29, 32, 33, 34, 35, 36, 37],
    trendDirection: 'up',
    headline: 'Usage climbing fast — risk of late-season burnout',
    insights: [
      'Averaging 37 MPG last 3 games — well above the 32-minute target.',
      'Plus-minus drops from +9 in first 20 min to -4 in minutes 28-36.',
      'Consider staggering with backup center in Q2 to cap total load at 32.',
    ],
  },
];

// ---------- Demo flags ----------

export const DEMO_META = {
  generatedBy: 'Generated by Proslync AI from 10 games of film',
  lastSyncLabel: 'Updated 14 min ago',
  team: 'Paul VI Catholic',
  season: '2025-26',
};

// ---------- My Roster ----------

export type RosterPlayer = {
  id: string;
  name: string;
  number: number;
  position: string;
  classYear: 'Fr' | 'So' | 'Jr' | 'Sr';
  height: string;
  initials: string;
  color: string; // jersey/avatar accent
  // Season stats
  ppg: number;
  rpg: number;
  apg: number;
  fgPct: number;
  threePct: number;
  ftPct: number;
  mpg: number;
  // Trend signal — 'up' | 'down' | 'flat'
  trend: 'up' | 'down' | 'flat';
  status: 'active' | 'questionable' | 'out';
  statusNote?: string;
  // Practice shot tracking (last 7 days) — mock until partner integration
  practice: {
    totalShots: number;
    makesPct: number;
    threeAttempts: number;
    threeMakes: number;
    midAttempts: number;
    midMakes: number;
    rimAttempts: number;
    rimMakes: number;
  };
};

export const MY_TEAM_SUMMARY = {
  name: 'Paul VI Catholic',
  record: '18-4',
  conferenceRecord: '9-1 WCAC',
  rank: '#7 USA Today',
  nextGame: 'vs Gonzaga · Sat 7:00p',
};

export const MY_ROSTER: RosterPlayer[] = [
  {
    id: 'pl-4', name: 'Marcus Reid', number: 4, position: 'PG', classYear: 'Sr', height: "6'2\"",
    initials: 'MR', color: '#FF6F3C',
    ppg: 18.4, rpg: 4.1, apg: 7.2, fgPct: 47.8, threePct: 38.2, ftPct: 84.5, mpg: 33.6,
    trend: 'up', status: 'active',
    practice: { totalShots: 412, makesPct: 51.7, threeAttempts: 168, threeMakes: 67, midAttempts: 124, midMakes: 58, rimAttempts: 120, rimMakes: 88 },
  },
  {
    id: 'pl-5', name: 'Tyrese Alston', number: 5, position: 'C', classYear: 'So', height: "6'10\"",
    initials: 'TA', color: '#7BAFD4',
    ppg: 14.1, rpg: 9.8, apg: 1.4, fgPct: 58.4, threePct: 0, ftPct: 64.2, mpg: 31.8,
    trend: 'up', status: 'questionable', statusNote: 'Lower-back stiffness — re-eval Friday',
    practice: { totalShots: 287, makesPct: 64.1, threeAttempts: 0, threeMakes: 0, midAttempts: 78, midMakes: 41, rimAttempts: 209, rimMakes: 143 },
  },
  {
    id: 'pl-7', name: 'Devon Banks', number: 7, position: 'SF', classYear: 'Sr', height: "6'7\"",
    initials: 'DB', color: '#34C759',
    ppg: 13.8, rpg: 6.4, apg: 2.9, fgPct: 49.1, threePct: 36.7, ftPct: 78.0, mpg: 30.2,
    trend: 'flat', status: 'active',
    practice: { totalShots: 348, makesPct: 49.4, threeAttempts: 142, threeMakes: 53, midAttempts: 96, midMakes: 44, rimAttempts: 110, rimMakes: 75 },
  },
  {
    id: 'pl-11', name: 'Andre Pollard', number: 11, position: 'PF', classYear: 'Jr', height: "6'8\"",
    initials: 'AP', color: '#A855F7',
    ppg: 11.2, rpg: 7.1, apg: 1.6, fgPct: 53.6, threePct: 22.2, ftPct: 71.4, mpg: 27.4,
    trend: 'up', status: 'active',
    practice: { totalShots: 264, makesPct: 55.3, threeAttempts: 36, threeMakes: 8, midAttempts: 88, midMakes: 47, rimAttempts: 140, rimMakes: 91 },
  },
  {
    id: 'pl-23', name: 'Jordan Miles', number: 23, position: 'SG', classYear: 'Jr', height: "6'4\"",
    initials: 'JM', color: '#FFD60A',
    ppg: 16.7, rpg: 3.8, apg: 2.1, fgPct: 44.0, threePct: 33.5, ftPct: 81.2, mpg: 31.0,
    trend: 'down', status: 'active', statusNote: 'Watch — fatigue-driven shooting dip',
    practice: { totalShots: 446, makesPct: 44.2, threeAttempts: 198, threeMakes: 64, midAttempts: 132, midMakes: 51, rimAttempts: 116, rimMakes: 82 },
  },
  {
    id: 'pl-12', name: 'Eli Vargas', number: 12, position: 'PG', classYear: 'Fr', height: "6'1\"",
    initials: 'EV', color: '#3B82F6',
    ppg: 6.4, rpg: 1.9, apg: 3.1, fgPct: 41.2, threePct: 30.8, ftPct: 76.5, mpg: 14.8,
    trend: 'up', status: 'active',
    practice: { totalShots: 198, makesPct: 42.4, threeAttempts: 88, threeMakes: 28, midAttempts: 60, midMakes: 22, rimAttempts: 50, rimMakes: 34 },
  },
  {
    id: 'pl-15', name: 'Cam Whitfield', number: 15, position: 'SG', classYear: 'Fr', height: "6'3\"",
    initials: 'CW', color: '#14B8A6',
    ppg: 5.2, rpg: 1.6, apg: 1.0, fgPct: 38.9, threePct: 27.3, ftPct: 72.1, mpg: 12.3,
    trend: 'flat', status: 'active',
    practice: { totalShots: 164, makesPct: 39.6, threeAttempts: 80, threeMakes: 22, midAttempts: 48, midMakes: 18, rimAttempts: 36, rimMakes: 25 },
  },
  {
    id: 'pl-22', name: 'Khalid Brooks', number: 22, position: 'SF', classYear: 'So', height: "6'6\"",
    initials: 'KB', color: '#E03A3E',
    ppg: 8.6, rpg: 4.2, apg: 1.4, fgPct: 46.5, threePct: 31.4, ftPct: 70.0, mpg: 19.5,
    trend: 'flat', status: 'out', statusNote: 'Ankle sprain — out 2-3 weeks',
    practice: { totalShots: 0, makesPct: 0, threeAttempts: 0, threeMakes: 0, midAttempts: 0, midMakes: 0, rimAttempts: 0, rimMakes: 0 },
  },
  {
    id: 'pl-32', name: "Roman O'Neal", number: 32, position: 'PF', classYear: 'Sr', height: "6'9\"",
    initials: 'RO', color: '#FF8C00',
    ppg: 9.1, rpg: 6.8, apg: 0.9, fgPct: 51.7, threePct: 0, ftPct: 67.0, mpg: 21.6,
    trend: 'flat', status: 'active',
    practice: { totalShots: 232, makesPct: 53.0, threeAttempts: 14, threeMakes: 3, midAttempts: 76, midMakes: 38, rimAttempts: 142, rimMakes: 82 },
  },
  {
    id: 'pl-44', name: 'Quincy Diaz', number: 44, position: 'C', classYear: 'Fr', height: "6'11\"",
    initials: 'QD', color: '#06B6D4',
    ppg: 4.8, rpg: 5.4, apg: 0.6, fgPct: 60.2, threePct: 0, ftPct: 58.8, mpg: 12.0,
    trend: 'up', status: 'active',
    practice: { totalShots: 184, makesPct: 60.3, threeAttempts: 0, threeMakes: 0, midAttempts: 42, midMakes: 19, rimAttempts: 142, rimMakes: 92 },
  },
];

export const PRACTICE_TRACKING_PROVIDER = {
  // Placeholder until partnership lands. Top contenders in the space:
  status: 'not_connected' as const,
  candidateProviders: [
    { name: 'Noah Basketball', detail: 'Optical tracking — shot arc, depth, % by zone' },
    { name: 'HomeCourt', detail: 'iPhone-camera vision tracking, shot logs' },
    { name: 'RSPCT', detail: 'Sensor + camera — shot accuracy + form' },
    { name: 'Shot Tracker', detail: 'Wearable + ball sensor — practice & game' },
    { name: '94Fifty', detail: 'Smart-ball sensor — shot velocity & arc' },
  ],
  note: 'Mock numbers shown until a partner is selected and integrated.',
};
