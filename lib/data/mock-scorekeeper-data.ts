// Mock data for Scorekeeper demo. Swap values here for different demos.

export const SK_LIVE_GAME = {
  id: 'sk-game-live',
  homeTeam: 'Paul VI',
  homeShort: 'PV',
  awayTeam: "St. John's",
  awayShort: 'SJ',
  venue: 'Carmel Hall · Fairfax, VA',
  conference: 'WCAC',
  homeScore: 47,
  awayScore: 43,
  quarter: 3,
  clockSeconds: 262, // 4:22
  homeFouls: 4,
  awayFouls: 6,
  timeoutsHome: 2,
  timeoutsAway: 1,
  homeBonus: false,
  awayBonus: true,
  possession: 'home' as 'home' | 'away',
  shotClock: 18,
};

export type PlayLog = {
  id: string;
  time: string; // "Q3 4:22"
  team: 'home' | 'away' | 'official';
  icon: string;
  text: string;
};

export const SK_PLAY_LOG: PlayLog[] = [
  { id: 'pl-1', time: 'Q3 4:22', team: 'home', icon: '🏀', text: 'Miles — made 3PT (28° L wing) · assist Reid' },
  { id: 'pl-2', time: 'Q3 4:41', team: 'away', icon: '🏀', text: 'Haralson — made FT 2/2' },
  { id: 'pl-3', time: 'Q3 4:41', team: 'home', icon: '⚠️', text: 'Personal foul — Alston · 2nd team, 4th personal' },
  { id: 'pl-4', time: 'Q3 5:08', team: 'home', icon: '🏀', text: 'Reid — made layup · assist Miles' },
  { id: 'pl-5', time: 'Q3 5:33', team: 'away', icon: '🛑', text: 'Timeout — St. John\'s · full (1 TO remaining)' },
  { id: 'pl-6', time: 'Q3 5:51', team: 'home', icon: '🏀', text: 'Brooks — made 3PT (top of key)' },
  { id: 'pl-7', time: 'Q3 6:12', team: 'away', icon: '🏀', text: 'Haralson — made 3PT (R wing)' },
  { id: 'pl-8', time: 'Q3 6:30', team: 'official', icon: '👁️', text: 'Review — shot clock violation overturned' },
];

export const SK_ROSTER_HOME = [
  { num: 23, name: 'Jordan Miles', pos: 'SG', pts: 14, reb: 2, ast: 4, fouls: 1, onCourt: true },
  { num: 4, name: 'Marcus Reid', pos: 'PG', pts: 8, reb: 1, ast: 7, fouls: 2, onCourt: true },
  { num: 5, name: 'Tyrese Alston', pos: 'C', pts: 12, reb: 8, ast: 1, fouls: 4, onCourt: true },
  { num: 11, name: 'Aaron Brooks', pos: 'SF', pts: 9, reb: 3, ast: 2, fouls: 1, onCourt: true },
  { num: 14, name: 'Dan McPherson', pos: 'SG', pts: 4, reb: 2, ast: 3, fouls: 2, onCourt: true },
  { num: 2, name: 'Chris Lavallee', pos: 'PG', pts: 0, reb: 0, ast: 1, fouls: 0, onCourt: false },
  { num: 24, name: 'Noah Bennett', pos: 'PF', pts: 0, reb: 1, ast: 0, fouls: 1, onCourt: false },
];

export const SK_ROSTER_AWAY = [
  { num: 11, name: 'Jalen Haralson', pos: 'F', pts: 14, reb: 4, ast: 2, fouls: 2, onCourt: true },
  { num: 3, name: 'Darius Okonkwo', pos: 'G', pts: 12, reb: 2, ast: 5, fouls: 3, onCourt: true },
  { num: 21, name: 'Bryce Heard', pos: 'F', pts: 8, reb: 6, ast: 1, fouls: 2, onCourt: true },
  { num: 7, name: 'Micah Hurst', pos: 'G', pts: 5, reb: 1, ast: 4, fouls: 1, onCourt: true },
  { num: 33, name: 'Kaleb Donnelly', pos: 'C', pts: 4, reb: 5, ast: 0, fouls: 4, onCourt: true },
  { num: 9, name: 'Luis Padilla', pos: 'G', pts: 0, reb: 0, ast: 1, fouls: 1, onCourt: false },
];

export const SK_ASSIGNMENTS = [
  {
    id: 'g-1',
    status: 'live' as const,
    date: 'Tue · Apr 21',
    tipoff: '7:30 PM',
    matchup: "Paul VI vs St. John's",
    venue: 'Carmel Hall',
    role: 'Primary Scorekeeper',
  },
  {
    id: 'g-2',
    status: 'upcoming' as const,
    date: 'Thu · Apr 23',
    tipoff: '6:00 PM',
    matchup: 'Gonzaga vs DeMatha',
    venue: 'Ritchie Coliseum',
    role: 'Primary Scorekeeper',
  },
  {
    id: 'g-3',
    status: 'upcoming' as const,
    date: 'Fri · Apr 24',
    tipoff: '7:30 PM',
    matchup: 'Paul VI vs Gonzaga',
    venue: 'Carmel Hall',
    role: 'Primary · WCAC Finals',
  },
  {
    id: 'g-4',
    status: 'upcoming' as const,
    date: 'Sat · Apr 25',
    tipoff: '2:00 PM',
    matchup: 'Bishop Ireton vs O\'Connell',
    venue: 'Bishop Ireton Gym',
    role: 'Backup',
  },
  {
    id: 'g-5',
    status: 'completed' as const,
    date: 'Sat · Apr 19',
    tipoff: 'Final',
    matchup: 'Paul VI 74 — DeMatha 68',
    venue: 'DeMatha Gym',
    role: 'Primary',
  },
  {
    id: 'g-6',
    status: 'completed' as const,
    date: 'Thu · Apr 17',
    tipoff: 'Final',
    matchup: "Paul VI 82 — Bishop O'Connell 61",
    venue: 'Carmel Hall',
    role: 'Primary',
  },
];

export const SK_STATS = {
  gamesThisSeason: 48,
  careerGames: 312,
  accuracy: 99.7,
  correctionsPerGame: 0.3,
  avgLogEntriesPerGame: 287,
  sanctionsFlagged: 2,
};

export const SK_PROFILE = {
  firstName: 'Alex',
  lastName: 'Carter',
  username: 'alex.scorekeeper',
  metaPrimary: 'WCAC Certified Scorekeeper',
  metaSecondary: 'Arlington, Virginia',
  bio: [
    {
      key: 'role',
      title: 'Role',
      body: 'Primary scorekeeper for the WCAC conference. Assigned to WCAC Tournament games including the 2025 championship at George Mason. Also books select Nike EYBL sessions in DMV during spring.',
    },
    {
      key: 'credentials',
      title: 'Credentials',
      body: 'NFHS-certified since 2019. USA Basketball background-checked. Bookkeeper training through IAABO. FIBA 3x3 secondary.',
    },
    {
      key: 'tools',
      title: 'Tools & Workflow',
      body: 'Proslync Live Scorekeeper (primary) + DakStats backup. Dual-entry book kept in parallel for sanction games. Pre-game roster sync at tip-30.',
    },
    {
      key: 'history',
      title: 'Background',
      body: 'Former D3 assistant coach at Washington College. Ex-CPA — hence the obsession with clean books. Lives in Arlington, one block from the Metro.',
    },
  ],
  credentials: [
    { label: 'Seasons', value: '7' },
    { label: 'Games', value: '312' },
    { label: 'Accuracy', value: '99.7%' },
  ],
};
