// Mock game data layer for the comprehensive game pages (box score / highlights
// / schedule). The header (teams, scores, league, status) is SEEDED from the
// real matchup card the user tapped — `SECTIONS` in app/(tabs)/index.tsx is the
// single source of truth — so the detail can never disagree with the card. The
// deep stats (scoring-by-period, team stats, player box scores, highlights,
// schedule) are synthesized deterministically AROUND those real anchors so they
// sum to the real score. No Math.random at module load — synthesis is seeded
// from the id so the same id always renders identically.

import { SECTIONS } from '@/app/(tabs)/index';
import type { MatchupCard, Section } from '@/lib/home/tiles';

export type GameStatus = 'live' | 'final' | 'upcoming';

export type GamePlayType =
  | 'DUNK'
  | '3PT'
  | 'BLOCK'
  | 'STEAL'
  | 'LAYUP'
  | 'ASSIST';

export type GameTeam = {
  abbr: string;
  name: string;
  color: string;
  record: string;
  rank?: number;
  score: number;
};

export type ScoringRow = {
  /** Column label: 'H1' | 'H2' | 'OT' | 'Q1'… or 'F' for final. */
  label: string;
  away: number;
  home: number;
};

export type TeamStatPair = {
  label: string;
  away: string;
  home: string;
  /** 0–1 proportion for away side of the comparison bar. */
  awayPct: number;
};

export type BoxScoreLine = {
  name: string;
  pos: string;
  starter: boolean;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  fg: string;
  threes: string;
  ft: string;
  stl: number;
  blk: number;
  to: number;
  plusMinus: number;
};

export type BoxScoreTeam = {
  abbr: string;
  players: BoxScoreLine[];
  totals: Omit<BoxScoreLine, 'name' | 'pos' | 'starter' | 'plusMinus'>;
};

export type Highlight = {
  id: string;
  title: string;
  playType: GamePlayType;
  period: string;
  clock: string;
  durationSec: number;
  team: string;
  scorer: string;
};

export type ScheduleEntry = {
  dateISO: string;
  opponentAbbr: string;
  opponentRank?: number;
  homeAway: 'H' | 'A';
  result?: 'W' | 'L';
  teamScore?: number;
  oppScore?: number;
  isCurrent?: boolean;
};

export type GameDetail = {
  id: string;
  league: string;
  status: GameStatus;
  period?: string;
  clock?: string;
  dateISO: string;
  venue: string;
  broadcast: string;
  away: GameTeam;
  home: GameTeam;
  scoring: ScoringRow[];
  teamStats: TeamStatPair[];
  boxScore: { away: BoxScoreTeam; home: BoxScoreTeam };
  highlights: Highlight[];
  schedule: ScheduleEntry[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────

function pct(a: number, b: number): number {
  const t = a + b;
  return t === 0 ? 0.5 : a / t;
}

function statPair(label: string, away: number, home: number, fmt?: (n: number) => string): TeamStatPair {
  const f = fmt ?? ((n: number) => String(n));
  return { label, away: f(away), home: f(home), awayPct: pct(away, home) };
}

function shooting(label: string, am: number, aa: number, hm: number, ha: number): TeamStatPair {
  const apct = aa === 0 ? 0 : Math.round((am / aa) * 1000) / 10;
  const hpct = ha === 0 ? 0 : Math.round((hm / ha) * 1000) / 10;
  return {
    label,
    away: `${am}-${aa} · ${apct}%`,
    home: `${hm}-${ha} · ${hpct}%`,
    awayPct: pct(apct, hpct),
  };
}

function totalsFrom(players: BoxScoreLine[]): BoxScoreTeam['totals'] {
  const add = (sel: (l: BoxScoreLine) => number) => players.reduce((s, l) => s + sel(l), 0);
  const sumPair = (sel: (l: BoxScoreLine) => string) => {
    let m = 0;
    let a = 0;
    for (const l of players) {
      const [pm, pa] = sel(l).split('-').map((x) => parseInt(x, 10) || 0);
      m += pm;
      a += pa;
    }
    return `${m}-${a}`;
  };
  return {
    min: add((l) => l.min),
    pts: add((l) => l.pts),
    reb: add((l) => l.reb),
    ast: add((l) => l.ast),
    fg: sumPair((l) => l.fg),
    threes: sumPair((l) => l.threes),
    ft: sumPair((l) => l.ft),
    stl: add((l) => l.stl),
    blk: add((l) => l.blk),
    to: add((l) => l.to),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Team directory (used by both hand-authored games + synthesizer)
// ─────────────────────────────────────────────────────────────────────────────

type TeamMeta = { name: string; color: string; record: string; rank?: number };

const TEAMS: Record<string, TeamMeta> = {
  DUKE: { name: 'Blue Devils', color: '#001A57', record: '24-6', rank: 6 },
  CUSE: { name: 'Orange', color: '#F76900', record: '19-12' },
  MICH: { name: 'Wolverines', color: '#00274C', record: '22-8', rank: 11 },
  OSU: { name: 'Buckeyes', color: '#BB0000', record: '21-9', rank: 14 },
  KEN: { name: 'Wildcats', color: '#0033A0', record: '23-7', rank: 8 },
  TENN: { name: 'Volunteers', color: '#FF8200', record: '25-5', rank: 4 },
  TX: { name: 'Longhorns', color: '#BF5700', record: '20-10', rank: 18 },
  OU: { name: 'Sooners', color: '#841617', record: '19-11' },
  UNC: { name: 'Tar Heels', color: '#7BAFD4', record: '22-8', rank: 9 },
  KU: { name: 'Jayhawks', color: '#0051BA', record: '24-6', rank: 5 },
  GONZ: { name: 'Bulldogs', color: '#002967', record: '26-4', rank: 7 },
  UCLA: { name: 'Bruins', color: '#2D68C4', record: '21-9', rank: 13 },
  PUR: { name: 'Boilermakers', color: '#CEB888', record: '23-7', rank: 10 },
  BAY: { name: 'Bears', color: '#154734', record: '20-10', rank: 19 },
  ARIZ: { name: 'Wildcats', color: '#CC0033', record: '22-8', rank: 12 },
  HOU: { name: 'Cougars', color: '#C8102E', record: '27-3', rank: 2 },
  UCONN: { name: 'Huskies', color: '#000E2F', record: '25-5', rank: 3 },
  BAMA: { name: 'Crimson Tide', color: '#9E1B32', record: '23-7', rank: 6 },
  AUB: { name: 'Tigers', color: '#0C2340', record: '24-6', rank: 1 },
};

function metaFor(abbr: string): TeamMeta {
  const a = abbr.toUpperCase();
  if (TEAMS[a]) return TEAMS[a];
  // Deterministic synthesized meta from the abbreviation characters.
  const seed = hash(a);
  const colors = ['#1B3A6B', '#7A1F2B', '#1E5631', '#5B3A86', '#B0560F', '#2D2D2D'];
  const wins = 14 + (seed % 12);
  const losses = 30 - wins;
  return {
    name: `${a} Squad`,
    color: colors[seed % colors.length],
    record: `${wins}-${losses}`,
  };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Tiny deterministic PRNG seeded from a string. */
function makeRng(seed: string): () => number {
  let s = hash(seed) || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Box-score authoring helper
// ─────────────────────────────────────────────────────────────────────────────

function line(
  name: string,
  pos: string,
  starter: boolean,
  min: number,
  pts: number,
  reb: number,
  ast: number,
  fg: string,
  threes: string,
  ft: string,
  stl: number,
  blk: number,
  to: number,
  pm: number,
): BoxScoreLine {
  return { name, pos, starter, min, pts, reb, ast, fg, threes, ft, stl, blk, to, plusMinus: pm };
}

// ─────────────────────────────────────────────────────────────────────────────
// Hand-authored games
// ─────────────────────────────────────────────────────────────────────────────

function gameDukeCuse(): GameDetail {
  const awayPlayers = [
    line('Cooper Flagg', 'F', true, 36, 18, 9, 4, '7-15', '1-4', '3-4', 2, 2, 3, -6),
    line('Kon Knueppel', 'G', true, 34, 12, 4, 3, '4-11', '3-7', '1-1', 1, 0, 2, -8),
    line('Tyrese Proctor', 'G', true, 33, 9, 3, 5, '3-9', '2-6', '1-2', 2, 0, 1, -4),
    line('Khaman Maluach', 'C', true, 27, 8, 7, 0, '4-6', '0-0', '0-2', 0, 3, 2, -3),
    line('Sion James', 'G', true, 30, 4, 5, 2, '2-5', '0-2', '0-0', 1, 0, 1, -7),
    line('Maliq Brown', 'F', false, 16, 2, 4, 1, '1-2', '0-0', '0-0', 1, 1, 0, -2),
    line('Caleb Foster', 'G', false, 14, 1, 1, 1, '0-3', '0-2', '1-2', 0, 0, 1, -5),
    line('Mason Gillis', 'F', false, 10, 0, 2, 0, '0-2', '0-2', '0-0', 0, 0, 0, -3),
  ];
  const homePlayers = [
    line('Kiyan Anthony', 'G', true, 35, 24, 5, 4, '9-17', '4-9', '2-2', 2, 0, 2, 9),
    line('JJ Starling', 'G', true, 34, 15, 3, 6, '6-13', '2-5', '1-2', 3, 0, 3, 7),
    line('Eddie Lampkin Jr.', 'C', true, 29, 10, 12, 1, '5-8', '0-0', '0-1', 0, 2, 2, 6),
    line('Chris Bell', 'F', true, 31, 8, 6, 1, '3-7', '2-5', '0-0', 1, 1, 1, 5),
    line('Lucas Taylor', 'G', true, 26, 3, 2, 3, '1-5', '1-3', '0-0', 2, 0, 1, 4),
    line('Donnie Freeman', 'F', false, 18, 2, 4, 0, '1-3', '0-1', '0-0', 0, 1, 1, 2),
    line('Jaquan Carlos', 'G', false, 17, 0, 2, 4, '0-2', '0-1', '0-0', 1, 0, 2, 3),
    line('Naheem McLeod', 'C', false, 8, 0, 3, 0, '0-1', '0-0', '0-0', 0, 1, 0, 1),
  ];
  return {
    id: 'ncaab-1',
    league: 'NCAA Basketball',
    status: 'final',
    dateISO: '2026-06-09T19:00:00Z',
    venue: 'JMA Wireless Dome, Syracuse',
    broadcast: 'ESPN',
    away: { abbr: 'DUKE', name: 'Blue Devils', color: '#001A57', record: '24-6', rank: 6, score: 54 },
    home: { abbr: 'CUSE', name: 'Orange', color: '#F76900', record: '19-12', score: 62 },
    scoring: [
      { label: 'H1', away: 26, home: 30 },
      { label: 'H2', away: 28, home: 32 },
      { label: 'F', away: 54, home: 62 },
    ],
    teamStats: [
      shooting('Field Goals', 21, 53, 25, 54),
      shooting('3-Pointers', 6, 25, 9, 24),
      shooting('Free Throws', 6, 13, 3, 7),
      statPair('Off. Rebounds', 9, 11),
      statPair('Def. Rebounds', 23, 28),
      statPair('Rebounds', 32, 39),
      statPair('Assists', 16, 19),
      statPair('Steals', 7, 9),
      statPair('Blocks', 6, 5),
      statPair('Turnovers', 11, 13),
      statPair('Fouls', 16, 14),
      statPair('Points in Paint', 24, 30),
      statPair('Fast Break Pts', 8, 13),
    ],
    boxScore: {
      away: { abbr: 'DUKE', players: awayPlayers, totals: totalsFrom(awayPlayers) },
      home: { abbr: 'CUSE', players: homePlayers, totals: totalsFrom(homePlayers) },
    },
    highlights: [
      h('h1', 'Kiyan Anthony rises for the slam', 'DUNK', 'H1', '14:22', 12, 'CUSE', 'Kiyan Anthony'),
      h('h2', 'Flagg throws it down in transition', 'DUNK', 'H1', '9:48', 11, 'DUKE', 'Cooper Flagg'),
      h('h3', 'Starling dishes to Lampkin inside', 'ASSIST', 'H1', '5:31', 9, 'CUSE', 'JJ Starling'),
      h('h4', 'Knueppel drains a corner three', '3PT', 'H1', '2:10', 10, 'DUKE', 'Kon Knueppel'),
      h('h5', 'Anthony buries the dagger triple', '3PT', 'H2', '12:05', 13, 'CUSE', 'Kiyan Anthony'),
      h('h6', 'Maluach rejects it at the rim', 'BLOCK', 'H2', '8:44', 8, 'DUKE', 'Khaman Maluach'),
      h('h7', 'Bell picks the pocket and goes coast-to-coast', 'STEAL', 'H2', '4:19', 14, 'CUSE', 'Chris Bell'),
      h('h8', 'Anthony floats in the and-one layup', 'LAYUP', 'H2', '1:02', 11, 'CUSE', 'Kiyan Anthony'),
    ],
    schedule: scheduleFor('CUSE', 'DUKE', 'ncaab-1', '2026-06-09T19:00:00Z'),
  };
}

function gameMichOsu(): GameDetail {
  const awayPlayers = [
    line('Dug McDaniel', 'G', true, 34, 22, 4, 7, '8-16', '4-8', '2-2', 2, 0, 3, 5),
    line('Vladislav Goldin', 'C', true, 31, 16, 11, 1, '7-10', '0-0', '2-3', 0, 2, 2, 3),
    line('Nimari Burnett', 'G', true, 33, 13, 3, 2, '5-12', '3-7', '0-0', 2, 0, 1, 2),
    line('Tarris Reed Jr.', 'F', true, 26, 10, 8, 1, '4-7', '0-0', '2-4', 1, 1, 2, 1),
    line('Will Tschetter', 'F', true, 24, 6, 5, 1, '2-5', '2-4', '0-0', 0, 0, 1, -2),
    line('Tre Donaldson', 'G', false, 19, 5, 2, 3, '2-6', '1-3', '0-0', 1, 0, 1, 0),
    line('Roddy Gayle Jr.', 'G', false, 17, 4, 2, 2, '1-4', '0-1', '2-2', 1, 0, 2, -1),
    line('Justin Pippen', 'G', false, 12, 0, 1, 1, '0-2', '0-1', '0-0', 0, 0, 0, -3),
  ];
  const homePlayers = [
    line('Bruce Thornton', 'G', true, 36, 25, 3, 6, '9-18', '4-9', '3-3', 2, 0, 2, 4),
    line('Devin Royal', 'F', true, 33, 17, 9, 2, '7-13', '1-3', '2-2', 1, 1, 2, 3),
    line('Aaron Bradshaw', 'C', true, 28, 12, 10, 1, '5-9', '0-0', '2-2', 0, 3, 1, 2),
    line('Micah Parrish', 'G', true, 31, 9, 4, 3, '3-8', '2-5', '1-2', 2, 0, 1, 1),
    line('Evan Mahaffey', 'F', true, 27, 6, 6, 2, '3-5', '0-1', '0-0', 1, 1, 2, 0),
    line('Sean Stewart', 'F', false, 18, 4, 5, 0, '2-3', '0-0', '0-1', 0, 1, 1, -1),
    line('Meechie Johnson', 'G', false, 16, 3, 2, 4, '1-5', '1-3', '0-0', 1, 0, 2, -2),
    line('John Mobley Jr.', 'G', false, 14, 0, 1, 2, '0-3', '0-2', '0-0', 0, 0, 1, -3),
  ];
  return {
    id: 'ncaab-9',
    league: 'NCAA Basketball',
    status: 'live',
    period: 'OT',
    clock: '2:41',
    dateISO: '2026-06-14T01:30:00Z',
    venue: 'Value City Arena, Columbus',
    broadcast: 'FOX',
    away: { abbr: 'MICH', name: 'Wolverines', color: '#00274C', record: '22-8', rank: 11, score: 76 },
    home: { abbr: 'OSU', name: 'Buckeyes', color: '#BB0000', record: '21-9', rank: 14, score: 76 },
    scoring: [
      { label: 'H1', away: 38, home: 35 },
      { label: 'H2', away: 32, home: 35 },
      { label: 'OT', away: 6, home: 6 },
      { label: 'F', away: 76, home: 76 },
    ],
    teamStats: [
      shooting('Field Goals', 29, 62, 30, 64),
      shooting('3-Pointers', 10, 25, 8, 23),
      shooting('Free Throws', 8, 11, 8, 10),
      statPair('Off. Rebounds', 8, 10),
      statPair('Def. Rebounds', 24, 26),
      statPair('Rebounds', 32, 36),
      statPair('Assists', 17, 18),
      statPair('Steals', 9, 7),
      statPair('Blocks', 3, 6),
      statPair('Turnovers', 12, 11),
      statPair('Fouls', 18, 17),
      statPair('Points in Paint', 30, 34),
      statPair('Fast Break Pts', 14, 11),
    ],
    boxScore: {
      away: { abbr: 'MICH', players: awayPlayers, totals: totalsFrom(awayPlayers) },
      home: { abbr: 'OSU', players: homePlayers, totals: totalsFrom(homePlayers) },
    },
    highlights: [
      h('m1', 'Thornton crosses over and finishes', 'LAYUP', 'H1', '16:40', 10, 'OSU', 'Bruce Thornton'),
      h('m2', 'McDaniel pulls up from deep', '3PT', 'H1', '11:22', 9, 'MICH', 'Dug McDaniel'),
      h('m3', 'Goldin two-hand jam over two', 'DUNK', 'H1', '6:05', 12, 'MICH', 'Vladislav Goldin'),
      h('m4', 'Bradshaw swats it into the seats', 'BLOCK', 'H2', '15:18', 8, 'OSU', 'Aaron Bradshaw'),
      h('m5', 'Royal and-one in the paint', 'LAYUP', 'H2', '9:33', 11, 'OSU', 'Devin Royal'),
      h('m6', 'Burnett steal leads to a slam', 'STEAL', 'H2', '4:50', 13, 'MICH', 'Nimari Burnett'),
      h('m7', 'Thornton ties it at the buzzer', '3PT', 'H2', '0:02', 15, 'OSU', 'Bruce Thornton'),
      h('m8', 'McDaniel dishes to Goldin in OT', 'ASSIST', 'OT', '3:11', 9, 'MICH', 'Dug McDaniel'),
    ],
    schedule: scheduleFor('OSU', 'MICH', 'ncaab-9', '2026-06-14T01:30:00Z'),
  };
}

function gameKenTenn(): GameDetail {
  const awayPlayers = [
    line('Otega Oweh', 'G', true, 35, 21, 5, 3, '8-15', '3-6', '2-2', 2, 0, 2, 6),
    line('Lamont Butler', 'G', true, 33, 14, 3, 7, '5-11', '2-5', '2-2', 3, 0, 1, 4),
    line('Amari Williams', 'C', true, 30, 11, 10, 4, '5-8', '0-0', '1-2', 1, 2, 2, 5),
    line('Andrew Carr', 'F', true, 29, 10, 7, 1, '4-9', '1-3', '1-1', 0, 1, 1, 3),
    line('Koby Brea', 'G', true, 28, 9, 2, 1, '3-7', '3-6', '0-0', 1, 0, 0, 2),
    line('Jaxson Robinson', 'G', false, 20, 7, 2, 2, '3-6', '1-3', '0-0', 1, 0, 1, 1),
    line('Ansley Almonor', 'F', false, 15, 3, 3, 0, '1-3', '1-2', '0-0', 0, 0, 1, 0),
    line('Brandon Garrison', 'C', false, 11, 2, 4, 0, '1-2', '0-0', '0-0', 0, 1, 0, -1),
  ];
  const homePlayers = [
    line('Zakai Zeigler', 'G', true, 36, 19, 4, 9, '7-14', '3-7', '2-2', 3, 0, 2, 5),
    line('Chaz Lanier', 'G', true, 34, 22, 3, 2, '8-16', '5-10', '1-1', 1, 0, 1, 4),
    line('Igor Milicic Jr.', 'F', true, 31, 12, 9, 2, '5-9', '2-4', '0-0', 1, 1, 1, 3),
    line('Jahmai Mashack', 'G', true, 30, 7, 4, 3, '3-6', '1-2', '0-0', 2, 0, 1, 2),
    line('Felix Okpara', 'C', true, 27, 8, 11, 1, '4-6', '0-0', '0-2', 0, 3, 1, 4),
    line('Jordan Gainey', 'G', false, 18, 6, 2, 2, '2-5', '1-3', '1-2', 1, 0, 1, 1),
    line('Cade Phillips', 'F', false, 13, 2, 3, 0, '1-2', '0-0', '0-0', 0, 1, 0, 0),
    line('Darlinstone Dubar', 'F', false, 11, 1, 2, 1, '0-2', '0-1', '1-2', 0, 0, 1, -1),
  ];
  return {
    id: 'ncaab-7',
    league: 'NCAA Basketball',
    status: 'final',
    dateISO: '2026-06-08T22:00:00Z',
    venue: 'Food City Center, Knoxville',
    broadcast: 'ESPN2',
    away: { abbr: 'KEN', name: 'Wildcats', color: '#0033A0', record: '23-7', rank: 8, score: 77 },
    home: { abbr: 'TENN', name: 'Volunteers', color: '#FF8200', record: '25-5', rank: 4, score: 77 - 0 + 0 },
    scoring: [
      { label: 'H1', away: 36, home: 40 },
      { label: 'H2', away: 41, home: 37 },
      { label: 'F', away: 77, home: 77 },
    ],
    teamStats: [
      shooting('Field Goals', 30, 60, 30, 58),
      shooting('3-Pointers', 11, 25, 12, 27),
      shooting('Free Throws', 6, 7, 5, 9),
      statPair('Off. Rebounds', 9, 8),
      statPair('Def. Rebounds', 26, 28),
      statPair('Rebounds', 35, 36),
      statPair('Assists', 18, 20),
      statPair('Steals', 8, 8),
      statPair('Blocks', 4, 5),
      statPair('Turnovers', 12, 10),
      statPair('Fouls', 15, 16),
      statPair('Points in Paint', 28, 30),
      statPair('Fast Break Pts', 11, 12),
    ],
    boxScore: {
      away: { abbr: 'KEN', players: awayPlayers, totals: totalsFrom(awayPlayers) },
      home: { abbr: 'TENN', players: homePlayers, totals: totalsFrom(homePlayers) },
    },
    highlights: [
      h('k1', 'Lanier opens with a deep three', '3PT', 'H1', '17:55', 9, 'TENN', 'Chaz Lanier'),
      h('k2', 'Oweh attacks the rim for the dunk', 'DUNK', 'H1', '12:30', 11, 'KEN', 'Otega Oweh'),
      h('k3', 'Zeigler threads it to Okpara', 'ASSIST', 'H1', '7:14', 9, 'TENN', 'Zakai Zeigler'),
      h('k4', 'Brea catch-and-shoot from the wing', '3PT', 'H1', '2:40', 10, 'KEN', 'Koby Brea'),
      h('k5', 'Okpara erases the floater', 'BLOCK', 'H2', '14:08', 8, 'TENN', 'Felix Okpara'),
      h('k6', 'Butler picks it and pushes', 'STEAL', 'H2', '9:21', 12, 'KEN', 'Lamont Butler'),
      h('k7', 'Lanier pull-up dagger', '3PT', 'H2', '3:05', 13, 'TENN', 'Chaz Lanier'),
      h('k8', 'Williams reverse layup to tie', 'LAYUP', 'H2', '0:18', 11, 'KEN', 'Amari Williams'),
    ],
    schedule: scheduleFor('TENN', 'KEN', 'ncaab-7', '2026-06-08T22:00:00Z'),
  };
}

function gameTxOu(): GameDetail {
  const awayPlayers = [
    line('Tre Johnson', 'G', true, 35, 26, 4, 3, '9-19', '5-11', '3-3', 1, 0, 2, 3),
    line('Tramon Mark', 'G', true, 33, 14, 5, 4, '5-12', '2-6', '2-2', 2, 0, 1, 2),
    line('Arthur Kaluma', 'F', true, 31, 12, 8, 1, '5-10', '1-3', '1-2', 1, 1, 2, 1),
    line('Kadin Shedrick', 'C', true, 28, 9, 9, 1, '4-6', '0-0', '1-2', 0, 2, 1, 2),
    line('Jordan Pope', 'G', true, 27, 8, 2, 5, '3-8', '2-5', '0-0', 2, 0, 2, 0),
    line('Julian Larry', 'G', false, 17, 4, 1, 3, '1-3', '1-2', '1-2', 1, 0, 1, -1),
    line('Devon Pryor', 'F', false, 15, 3, 4, 0, '1-2', '0-0', '1-2', 0, 1, 0, 0),
    line('Ze’Rik Onyema', 'F', false, 14, 2, 5, 0, '1-2', '0-0', '0-0', 0, 1, 1, -1),
  ];
  const homePlayers = [
    line('Jeremiah Fears', 'G', true, 36, 23, 3, 8, '8-17', '3-8', '4-4', 2, 0, 3, 1),
    line('Jalon Moore', 'F', true, 34, 18, 7, 2, '7-13', '2-4', '2-2', 1, 1, 1, 2),
    line('Sam Godwin', 'C', true, 29, 8, 10, 2, '4-7', '0-0', '0-1', 0, 2, 1, 0),
    line('Duke Miles', 'G', true, 30, 10, 2, 4, '4-9', '2-5', '0-0', 2, 0, 2, -1),
    line('Mohamed Wague', 'F', true, 25, 6, 6, 0, '3-5', '0-0', '0-0', 1, 1, 1, -2),
    line('Kobe Elvis', 'G', false, 18, 5, 2, 3, '2-6', '1-3', '0-0', 1, 0, 1, -1),
    line('Brycen Goodine', 'G', false, 13, 3, 1, 1, '1-3', '1-2', '0-0', 0, 0, 0, 0),
    line('Luke Northweather', 'F', false, 10, 2, 3, 0, '1-2', '0-1', '0-0', 0, 1, 1, -1),
  ];
  return {
    id: 'ncaab-10',
    league: 'NCAA Basketball',
    status: 'upcoming',
    dateISO: '2026-06-15T00:00:00Z',
    venue: 'Lloyd Noble Center, Norman',
    broadcast: 'ESPNU',
    away: { abbr: 'TX', name: 'Longhorns', color: '#BF5700', record: '20-10', rank: 18, score: 73 },
    home: { abbr: 'OU', name: 'Sooners', color: '#841617', record: '19-11', score: 75 },
    scoring: [
      { label: 'H1', away: 35, home: 38 },
      { label: 'H2', away: 38, home: 37 },
      { label: 'F', away: 73, home: 75 },
    ],
    teamStats: [
      shooting('Field Goals', 28, 60, 30, 62),
      shooting('3-Pointers', 11, 27, 9, 22),
      shooting('Free Throws', 6, 9, 6, 7),
      statPair('Off. Rebounds', 9, 10),
      statPair('Def. Rebounds', 25, 27),
      statPair('Rebounds', 34, 37),
      statPair('Assists', 17, 19),
      statPair('Steals', 7, 7),
      statPair('Blocks', 5, 5),
      statPair('Turnovers', 11, 12),
      statPair('Fouls', 16, 15),
      statPair('Points in Paint', 28, 32),
      statPair('Fast Break Pts', 10, 12),
    ],
    boxScore: {
      away: { abbr: 'TX', players: awayPlayers, totals: totalsFrom(awayPlayers) },
      home: { abbr: 'OU', players: homePlayers, totals: totalsFrom(homePlayers) },
    },
    highlights: [
      h('t1', 'Johnson rises for the pull-up three', '3PT', 'H1', '16:11', 10, 'TX', 'Tre Johnson'),
      h('t2', 'Fears splits the defense for a layup', 'LAYUP', 'H1', '10:44', 11, 'OU', 'Jeremiah Fears'),
      h('t3', 'Moore throws it down in transition', 'DUNK', 'H1', '5:20', 12, 'OU', 'Jalon Moore'),
      h('t4', 'Shedrick blocks it off the glass', 'BLOCK', 'H1', '1:33', 8, 'TX', 'Kadin Shedrick'),
      h('t5', 'Fears dishes to Godwin inside', 'ASSIST', 'H2', '14:02', 9, 'OU', 'Jeremiah Fears'),
      h('t6', 'Mark steal and slam', 'STEAL', 'H2', '8:55', 13, 'TX', 'Tramon Mark'),
      h('t7', 'Johnson dagger from the logo', '3PT', 'H2', '2:48', 14, 'TX', 'Tre Johnson'),
      h('t8', 'Fears game-winning floater', 'LAYUP', 'H2', '0:04', 15, 'OU', 'Jeremiah Fears'),
    ],
    schedule: scheduleFor('OU', 'TX', 'ncaab-10', '2026-06-15T00:00:00Z'),
  };
}

function h(
  id: string,
  title: string,
  playType: GamePlayType,
  period: string,
  clock: string,
  durationSec: number,
  team: string,
  scorer: string,
): Highlight {
  return { id, title, playType, period, clock, durationSec, team, scorer };
}

// ─────────────────────────────────────────────────────────────────────────────
// Schedule builder — produces a chronological season for `teamAbbr`, marking
// the game vs `currentOpp` on `currentISO` as the current game.
// ─────────────────────────────────────────────────────────────────────────────

const SEASON_OPP_POOL = [
  'UNC', 'KU', 'GONZ', 'UCLA', 'PUR', 'BAY', 'ARIZ', 'HOU', 'UCONN', 'BAMA', 'AUB', 'DUKE',
];

function scheduleFor(
  teamAbbr: string,
  currentOpp: string,
  seed: string,
  currentISO: string,
): ScheduleEntry[] {
  const rng = makeRng(`${seed}:${teamAbbr}`);
  const entries: ScheduleEntry[] = [];
  const currentDate = new Date(currentISO);
  const total = 14;
  const currentIdx = 8; // place "today" partway through the season
  for (let i = 0; i < total; i++) {
    const offsetDays = (i - currentIdx) * 5;
    const d = new Date(currentDate.getTime() + offsetDays * 86400000);
    const dateISO = d.toISOString();
    if (i === currentIdx) {
      entries.push({
        dateISO,
        opponentAbbr: currentOpp,
        opponentRank: metaFor(currentOpp).rank,
        homeAway: 'H',
        isCurrent: true,
      });
      continue;
    }
    const pool = SEASON_OPP_POOL.filter((o) => o !== teamAbbr && o !== currentOpp);
    const opp = pool[Math.floor(rng() * pool.length)];
    const isPast = i < currentIdx;
    const homeAway: 'H' | 'A' = rng() > 0.5 ? 'H' : 'A';
    if (isPast) {
      const win = rng() > 0.42;
      const teamScore = 62 + Math.floor(rng() * 24);
      const margin = 2 + Math.floor(rng() * 14);
      const oppScore = win ? teamScore - margin : teamScore + margin;
      entries.push({
        dateISO,
        opponentAbbr: opp,
        opponentRank: metaFor(opp).rank,
        homeAway,
        result: win ? 'W' : 'L',
        teamScore,
        oppScore,
      });
    } else {
      entries.push({
        dateISO,
        opponentAbbr: opp,
        opponentRank: metaFor(opp).rank,
        homeAway,
      });
    }
  }
  return entries;
}

// ─────────────────────────────────────────────────────────────────────────────
// Synthesizer — for any id not hand-authored, build a complete plausible game.
// ─────────────────────────────────────────────────────────────────────────────

const FIRST_NAMES = ['Jalen', 'Marcus', 'Tyrese', 'DeShawn', 'Cam', 'Trey', 'Isaiah', 'Devin', 'Malik', 'Brandon', 'Caleb', 'Aaron', 'Jordan', 'Quentin', 'Elijah', 'Xavier'];
const LAST_NAMES = ['Carter', 'Brooks', 'Hayes', 'Coleman', 'Reeves', 'Dawson', 'Foster', 'Ellis', 'Bryant', 'Walker', 'Greene', 'Mercer', 'Holt', 'Vance', 'Sutton', 'Pierce'];
const POSITIONS = ['G', 'G', 'F', 'F', 'C', 'G', 'F', 'C'];

function synthName(rng: () => number): string {
  return `${FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)]}`;
}

function synthTeam(rng: () => number, score: number): BoxScoreLine[] {
  const players: BoxScoreLine[] = [];
  let ptsLeft = score;
  let rebLeft = 34;
  let astLeft = 16;
  for (let i = 0; i < 8; i++) {
    const starter = i < 5;
    const last = i === 7;
    const share = last ? ptsLeft : Math.min(ptsLeft, Math.round((starter ? 0.16 : 0.07) * score * (0.6 + rng() * 0.9)));
    const pts = Math.max(0, share);
    ptsLeft -= pts;
    const reb = last ? Math.max(0, rebLeft) : Math.min(rebLeft, Math.floor(rng() * (starter ? 9 : 5)));
    rebLeft -= reb;
    const ast = last ? Math.max(0, astLeft) : Math.min(astLeft, Math.floor(rng() * (starter ? 6 : 3)));
    astLeft -= ast;
    const fga = Math.max(pts > 0 ? 3 : 1, Math.round(pts / (0.9 + rng())));
    const threes = Math.min(fga, Math.floor(rng() * 4));
    const threesM = Math.min(threes, Math.floor(pts / 6));
    const ftm = Math.max(0, Math.min(6, pts - (Math.round((pts - threesM * 3) / 2) * 2)));
    const fta = ftm + Math.floor(rng() * 2);
    const fgm = Math.max(threesM, Math.round((pts - ftm) / 2));
    players.push(
      line(
        synthName(rng),
        POSITIONS[i],
        starter,
        starter ? 26 + Math.floor(rng() * 12) : 10 + Math.floor(rng() * 12),
        pts,
        reb,
        ast,
        `${Math.min(fgm, fga)}-${fga}`,
        `${threesM}-${Math.max(threes, threesM)}`,
        `${ftm}-${Math.max(fta, ftm)}`,
        Math.floor(rng() * 3),
        Math.floor(rng() * 2),
        Math.floor(rng() * 3),
        Math.floor(rng() * 17) - 8,
      ),
    );
  }
  return players;
}

const PLAY_TYPES: GamePlayType[] = ['DUNK', '3PT', 'BLOCK', 'STEAL', 'LAYUP', 'ASSIST'];

function synthGame(id: string): GameDetail {
  const rng = makeRng(id);
  // Derive two abbreviations deterministically from the id tail.
  const pool = Object.keys(TEAMS);
  const ai = Math.floor(rng() * pool.length);
  let hi = Math.floor(rng() * pool.length);
  if (hi === ai) hi = (hi + 1) % pool.length;
  const awayAbbr = pool[ai];
  const homeAbbr = pool[hi];
  const am = metaFor(awayAbbr);
  const hm = metaFor(homeAbbr);

  const statuses: GameStatus[] = ['final', 'live', 'upcoming'];
  const status = statuses[Math.floor(rng() * statuses.length)];
  const awayScore = 60 + Math.floor(rng() * 25);
  const homeScore = 60 + Math.floor(rng() * 25);

  const aH1 = Math.round(awayScore * (0.46 + rng() * 0.08));
  const hH1 = Math.round(homeScore * (0.46 + rng() * 0.08));
  const scoring: ScoringRow[] = [
    { label: 'H1', away: aH1, home: hH1 },
    { label: 'H2', away: awayScore - aH1, home: homeScore - hH1 },
    { label: 'F', away: awayScore, home: homeScore },
  ];

  const awayPlayers = synthTeam(rng, awayScore);
  const homePlayers = synthTeam(rng, homeScore);

  const highlights: Highlight[] = [];
  for (let i = 0; i < 8; i++) {
    const onAway = rng() > 0.5;
    const players = onAway ? awayPlayers : homePlayers;
    const scorer = players[Math.floor(rng() * 5)].name;
    const pt = PLAY_TYPES[Math.floor(rng() * PLAY_TYPES.length)];
    const period = i < 4 ? 'H1' : 'H2';
    const mins = i < 4 ? 18 - i * 3 : 18 - (i - 4) * 3;
    highlights.push(
      h(
        `${id}-h${i}`,
        `${scorer} with the ${pt.toLowerCase()}`,
        pt,
        period,
        `${Math.max(0, mins)}:${String(Math.floor(rng() * 60)).padStart(2, '0')}`,
        8 + Math.floor(rng() * 8),
        onAway ? awayAbbr : homeAbbr,
        scorer,
      ),
    );
  }

  const dateISO = new Date(Date.now() + (status === 'upcoming' ? 1 : -1) * 86400000).toISOString();

  return {
    id,
    league: 'NCAA Basketball',
    status,
    period: status === 'live' ? 'H2' : undefined,
    clock: status === 'live' ? '6:18' : undefined,
    dateISO,
    venue: `${hm.name} Arena`,
    broadcast: ['ESPN', 'FOX', 'CBS', 'ESPN2'][Math.floor(rng() * 4)],
    away: { abbr: awayAbbr, name: am.name, color: am.color, record: am.record, rank: am.rank, score: awayScore },
    home: { abbr: homeAbbr, name: hm.name, color: hm.color, record: hm.record, rank: hm.rank, score: homeScore },
    scoring,
    teamStats: [
      shooting('Field Goals', awayPlayers.length ? 28 : 0, 60, 30, 62),
      shooting('3-Pointers', 9, 24, 10, 25),
      shooting('Free Throws', 7, 10, 6, 9),
      statPair('Off. Rebounds', 8 + Math.floor(rng() * 5), 8 + Math.floor(rng() * 5)),
      statPair('Def. Rebounds', 24 + Math.floor(rng() * 5), 24 + Math.floor(rng() * 5)),
      statPair('Rebounds', 32 + Math.floor(rng() * 6), 32 + Math.floor(rng() * 6)),
      statPair('Assists', 14 + Math.floor(rng() * 6), 14 + Math.floor(rng() * 6)),
      statPair('Steals', 5 + Math.floor(rng() * 5), 5 + Math.floor(rng() * 5)),
      statPair('Blocks', 2 + Math.floor(rng() * 5), 2 + Math.floor(rng() * 5)),
      statPair('Turnovers', 9 + Math.floor(rng() * 6), 9 + Math.floor(rng() * 6)),
      statPair('Fouls', 13 + Math.floor(rng() * 6), 13 + Math.floor(rng() * 6)),
      statPair('Points in Paint', 26 + Math.floor(rng() * 8), 26 + Math.floor(rng() * 8)),
      statPair('Fast Break Pts', 8 + Math.floor(rng() * 8), 8 + Math.floor(rng() * 8)),
    ],
    boxScore: {
      away: { abbr: awayAbbr, players: awayPlayers, totals: totalsFrom(awayPlayers) },
      home: { abbr: homeAbbr, players: homePlayers, totals: totalsFrom(homePlayers) },
    },
    highlights,
    schedule: scheduleFor(homeAbbr, awayAbbr, id, dateISO),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed from the real SECTIONS matchup card
// ─────────────────────────────────────────────────────────────────────────────

const LEAGUE_LABEL: Record<string, string> = {
  ncaab: 'NCAA Basketball',
  nba: 'NBA',
  mlb: 'MLB',
  nhl: 'NHL',
  wnba: 'WNBA',
};

/** Locate a matchup card across all sections by its bare card id, returning the
 *  card plus its owning section (the section id is the league). */
function findMatchup(cardId: string): { card: MatchupCard; section: Section } | undefined {
  for (const section of SECTIONS) {
    for (const card of section.cards) {
      if (card.variant === 'matchup' && card.id === cardId) {
        return { card, section };
      }
    }
  }
  return undefined;
}

/** Map a card's `status` enum to the GameDetail status. */
function statusFromCard(card: MatchupCard): GameStatus {
  if (card.status === 'LIVE') return 'live';
  if (card.status === 'FINAL') return 'final';
  return 'upcoming';
}

/** Parse a live card's `statusLabel` into a period/clock pair for the header.
 *  e.g. "LIVE · Q3 4:32" → { period: 'Q3', clock: '4:32' }, "LIVE · OT" →
 *  { period: 'OT' }, "LIVE · 7th 1 out" → { period: '7th', clock: '1 out' }. */
function periodClockFromLabel(statusLabel: string): { period?: string; clock?: string } {
  const tail = statusLabel.split('·').slice(1).join('·').trim();
  if (!tail) return {};
  const m = tail.match(/^(\S+)\s+(.+)$/);
  if (m) return { period: m[1], clock: m[2] };
  return { period: tail };
}

/** Period column labels for the scoring table, by league. Basketball halves vs
 *  hockey/baseball periods/innings — kept generic but plausible. */
function periodLabels(leagueId: string): string[] {
  if (leagueId === 'nhl') return ['P1', 'P2', 'P3'];
  if (leagueId === 'mlb') return ['1-3', '4-6', '7-9'];
  return ['H1', 'H2'];
}

/** Build a scoring-by-period table that SUMS to the real final score. */
function scoringFor(
  leagueId: string,
  awayScore: number,
  homeScore: number,
  rng: () => number,
): ScoringRow[] {
  const labels = periodLabels(leagueId);
  const split = (total: number): number[] => {
    const parts: number[] = [];
    let left = total;
    for (let i = 0; i < labels.length; i++) {
      if (i === labels.length - 1) {
        parts.push(Math.max(0, left));
      } else {
        const frac = 0.4 + rng() * 0.25;
        const v = Math.min(left, Math.round(total * frac));
        parts.push(v);
        left -= v;
      }
    }
    return parts;
  };
  const aw = split(awayScore);
  const hm = split(homeScore);
  const rows: ScoringRow[] = labels.map((label, i) => ({ label, away: aw[i], home: hm[i] }));
  rows.push({ label: 'F', away: awayScore, home: homeScore });
  return rows;
}

/** Seed a complete GameDetail from a real matchup card. The header anchors
 *  (away/home abbr+color+score, league, status/period/clock, venue) come
 *  straight from the card; the deep stats are synthesized around them. */
function seededGame(id: string, card: MatchupCard, section: Section): GameDetail {
  const rng = makeRng(id);
  const leagueId = section.id;
  const league = LEAGUE_LABEL[leagueId] ?? section.title;
  const status = statusFromCard(card);

  const awayAbbr = card.away.abbr;
  const homeAbbr = card.home.abbr;
  const am = metaFor(awayAbbr);
  const hm = metaFor(homeAbbr);
  // Real scores when present; for PRE games there's no score on the card, so
  // 0/0 is the honest anchor and the box scores synth to nothing meaningful.
  const awayScore = card.away.score ?? 0;
  const homeScore = card.home.score ?? 0;

  const { period, clock } = status === 'live' ? periodClockFromLabel(card.statusLabel) : {};

  const scoring = scoringFor(leagueId, awayScore, homeScore, rng);
  const awayPlayers = synthTeam(rng, awayScore);
  const homePlayers = synthTeam(rng, homeScore);

  const highlights: Highlight[] = [];
  const hiLabels = periodLabels(leagueId);
  for (let i = 0; i < 8; i++) {
    const onAway = rng() > 0.5;
    const players = onAway ? awayPlayers : homePlayers;
    const scorer = players[Math.floor(rng() * 5)].name;
    const pt = PLAY_TYPES[Math.floor(rng() * PLAY_TYPES.length)];
    const periodLabel = hiLabels[Math.min(hiLabels.length - 1, Math.floor((i / 8) * hiLabels.length))];
    const mins = 18 - (i % 4) * 4;
    highlights.push(
      h(
        `${id}-h${i}`,
        `${scorer} with the ${pt.toLowerCase()}`,
        pt,
        periodLabel,
        `${Math.max(0, mins)}:${String(Math.floor(rng() * 60)).padStart(2, '0')}`,
        8 + Math.floor(rng() * 8),
        onAway ? awayAbbr : homeAbbr,
        scorer,
      ),
    );
  }

  const dateISO = new Date(Date.now() + (status === 'upcoming' ? 1 : -1) * 86400000).toISOString();

  return {
    id,
    league,
    status,
    period,
    clock,
    dateISO,
    venue: card.meta ?? `${hm.name} Arena`,
    broadcast: ['ESPN', 'FOX', 'CBS', 'ESPN2'][Math.floor(rng() * 4)],
    away: { abbr: awayAbbr, name: am.name, color: card.away.color, record: am.record, rank: am.rank, score: awayScore },
    home: { abbr: homeAbbr, name: hm.name, color: card.home.color, record: hm.record, rank: hm.rank, score: homeScore },
    scoring,
    teamStats: [
      shooting('Field Goals', 28, 60, 30, 62),
      shooting('3-Pointers', 9, 24, 10, 25),
      shooting('Free Throws', 7, 10, 6, 9),
      statPair('Off. Rebounds', 8 + Math.floor(rng() * 5), 8 + Math.floor(rng() * 5)),
      statPair('Def. Rebounds', 24 + Math.floor(rng() * 5), 24 + Math.floor(rng() * 5)),
      statPair('Rebounds', 32 + Math.floor(rng() * 6), 32 + Math.floor(rng() * 6)),
      statPair('Assists', 14 + Math.floor(rng() * 6), 14 + Math.floor(rng() * 6)),
      statPair('Steals', 5 + Math.floor(rng() * 5), 5 + Math.floor(rng() * 5)),
      statPair('Blocks', 2 + Math.floor(rng() * 5), 2 + Math.floor(rng() * 5)),
      statPair('Turnovers', 9 + Math.floor(rng() * 6), 9 + Math.floor(rng() * 6)),
      statPair('Fouls', 13 + Math.floor(rng() * 6), 13 + Math.floor(rng() * 6)),
      statPair('Points in Paint', 26 + Math.floor(rng() * 8), 26 + Math.floor(rng() * 8)),
      statPair('Fast Break Pts', 8 + Math.floor(rng() * 8), 8 + Math.floor(rng() * 8)),
    ],
    boxScore: {
      away: { abbr: awayAbbr, players: awayPlayers, totals: totalsFrom(awayPlayers) },
      home: { abbr: homeAbbr, players: homePlayers, totals: totalsFrom(homePlayers) },
    },
    highlights,
    schedule: scheduleFor(homeAbbr, awayAbbr, id, dateISO),
  };
}

/** Overlay the real card anchors onto a hand-authored rich game so its header
 *  (teams, scores, league, status/clock, venue) matches the card the user
 *  tapped, while keeping the curated deep box score. */
function reconcileHandAuthored(base: GameDetail, card: MatchupCard, section: Section): GameDetail {
  const league = LEAGUE_LABEL[section.id] ?? section.title;
  const status = statusFromCard(card);
  const awayScore = card.away.score ?? base.away.score;
  const homeScore = card.home.score ?? base.home.score;
  const { period, clock } = status === 'live' ? periodClockFromLabel(card.statusLabel) : {};
  return {
    ...base,
    league,
    status,
    period,
    clock,
    venue: card.meta ?? base.venue,
    away: { ...base.away, abbr: card.away.abbr, color: card.away.color, score: awayScore },
    home: { ...base.home, abbr: card.home.abbr, color: card.home.color, score: homeScore },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

const HAND_AUTHORED: Record<string, () => GameDetail> = {
  'ncaab-1': gameDukeCuse,
  'ncaab-9': gameMichOsu,
  'ncaab-7': gameKenTenn,
  'ncaab-10': gameTxOu,
};

/** Returns a complete GameDetail for any id. The id arrives as the tile id
 *  `${section.id}:${card.id}` (e.g. "ncaab:ncaab-1") from /card/[id]; a bare
 *  card id ("ncaab-1") is also accepted. We strip any `league:` prefix, locate
 *  the matchup card in SECTIONS, and seed the detail from it so the header
 *  always matches the tapped card. Hand-authored rich games keep their curated
 *  box score but have their header reconciled to the card. Never returns
 *  null/empty. */
export function getGame(gameId: string): GameDetail {
  const raw = gameId || 'ncaab:ncaab-1';
  // Tile id is "league:card-id"; strip the league prefix to get the card id.
  // Use the LAST colon-separated segment so a bare id passes through unchanged.
  const cardId = raw.includes(':') ? raw.slice(raw.lastIndexOf(':') + 1) : raw;

  const found = findMatchup(cardId);
  if (found) {
    const author = HAND_AUTHORED[cardId];
    if (author) return reconcileHandAuthored(author(), found.card, found.section);
    return seededGame(raw, found.card, found.section);
  }

  // Unknown id (no matching card) — fall back to the deterministic synthesizer.
  return synthGame(raw);
}
