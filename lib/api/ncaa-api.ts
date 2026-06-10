// ── NCAA-API ADAPTER (Explore games source) ───────────────
// Direct fetch wrapper around the public ncaa-api mirror at
// `ncaa-api.henrygd.me`. Per PLAN.md §5b and the cross-poll source
// posture (`recursive-research-2026-05-10.md` + the round-2 NIL/tools
// research), ncaa-api is the only NCAA scoreboard source cleared for
// Proslync to call directly:
//
//   • License — MIT (mirror) / Apache (upstream)
//   • Posture — Tier 2 cached. React Query handles the cache layer
//     (staleTime 5min, refetchInterval 60s when a game is live).
//   • Forbidden — no live ESPN polling, no On3 scrape, no Sports
//     Reference scrape. Anything else needs a paid feed + counsel sign-
//     off (Q-source-posture in PLAN §9, still open).
//
// The adapter projects ncaa-api's payload onto the canonical
// `NcaaGame` shape declared in `lib/types/explore.types.ts` so the
// Explore surface can later swap to the proslync-backend without
// touching the UI.

import {
  NCAA_API_SOURCE_KIND,
  NCAA_API_SOURCE_LABEL,
  type NcaaGame,
  type NcaaGameCollection,
  type NcaaGameSport,
  type NcaaGameState,
  type NcaaGameTeam,
} from '@/lib/types/explore.types';

const NCAA_API_BASE = 'https://ncaa-api.henrygd.me';
const FETCH_TIMEOUT_MS = 8000;

interface RawTeam {
  score: string;
  names: { char6: string; short: string; seo: string; full?: string };
  winner: boolean;
  seed?: string;
  conferences?: { conferenceSeo?: string }[];
}

interface RawGame {
  game: {
    gameID: string;
    away: RawTeam;
    home: RawTeam;
    finalMessage: string;
    title: string;
    url: string;
    network?: string;
    liveVideoEnabled?: boolean;
    startTime: string;
    startTimeEpoch: string;
    gameState: NcaaGameState | string;
    startDate: string;
    currentPeriod: string;
    contestClock: string;
    bracketId?: number;
    bracketRound?: number;
    championshipGame?: {
      round?: { roundNumber?: number; title?: string; subtitle?: string };
    };
  };
}

interface RawScoreboard {
  inputMD5Sum?: string;
  updated_at?: string;
  games: RawGame[];
}

function parseScore(raw: string): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function projectTeam(raw: RawTeam): NcaaGameTeam {
  return {
    shortName: raw.names.short,
    abbreviation: raw.names.char6,
    seo: raw.names.seo,
    conferenceSeo: raw.conferences?.[0]?.conferenceSeo ?? '',
    score: parseScore(raw.score),
    isWinner: Boolean(raw.winner),
    seed: raw.seed || undefined,
  };
}

function normalizeState(raw: string): NcaaGameState {
  if (raw === 'live' || raw === 'final' || raw === 'pre') return raw;
  // ncaa-api occasionally returns capitalized states.
  const lowered = raw.toLowerCase();
  if (lowered === 'live' || lowered === 'final' || lowered === 'pre') {
    return lowered as NcaaGameState;
  }
  return 'pre';
}

function freshnessDays(updatedAtIso: string | undefined): number {
  if (!updatedAtIso) return 0;
  const parsed = Date.parse(updatedAtIso);
  if (Number.isNaN(parsed)) return 0;
  const diffMs = Date.now() - parsed;
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

function projectGame(
  raw: RawGame,
  sport: NcaaGameSport,
  sourceUpdatedAt: string,
): NcaaGame {
  const round = raw.game.championshipGame?.round;
  const bracketRound = round?.title
    ? `${round.title}${round.subtitle ? ` · ${round.subtitle}` : ''}`
    : undefined;

  return {
    id: raw.game.gameID,
    sport,
    startDateISO: raw.game.startDate,
    startTimeLabel: raw.game.startTime,
    startTimeEpoch: Number(raw.game.startTimeEpoch) || 0,
    state: normalizeState(raw.game.gameState),
    periodLabel: raw.game.currentPeriod || raw.game.finalMessage || '',
    clockLabel: raw.game.contestClock || '0:00',
    finalMessage: raw.game.finalMessage,
    away: projectTeam(raw.game.away),
    home: projectTeam(raw.game.home),
    network: raw.game.network || undefined,
    bracketRound,
    source: {
      id: `ncaa-api:${sport}:${raw.game.gameID}`,
      label: NCAA_API_SOURCE_LABEL,
      kind: NCAA_API_SOURCE_KIND,
      retrievedAt: new Date().toISOString(),
      freshnessDays: freshnessDays(sourceUpdatedAt),
    },
  };
}

/**
 * Format today's date for the ncaa-api scoreboard route, in the user's
 * local timezone. Path shape is `/scoreboard/<sport>/d1/YYYY/MM/DD`.
 */
export function todayScoreboardPath(
  sport: NcaaGameSport,
  date: Date = new Date(),
): { date: string; path: string } {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const isoDate = `${yyyy}-${mm}-${dd}`;
  return {
    date: isoDate,
    path: `/scoreboard/${sport}/d1/${yyyy}/${mm}/${dd}`,
  };
}

export const ncaaApi = {
  /** Returns the canonical-shape scoreboard collection for one sport. */
  async getDailyScoreboard(
    sport: NcaaGameSport,
    date: Date = new Date(),
  ): Promise<NcaaGameCollection> {
    const { date: isoDate, path } = todayScoreboardPath(sport, date);
    const url = `${NCAA_API_BASE}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`ncaa-api ${path} returned HTTP ${res.status}`);
      }
      const raw = (await res.json()) as RawScoreboard;
      const sourceUpdatedAt = raw.updated_at ?? new Date().toISOString();
      return {
        sport,
        date: isoDate,
        sourceUpdatedAt,
        games: (raw.games ?? []).map((row) =>
          projectGame(row, sport, sourceUpdatedAt),
        ),
      };
    } finally {
      clearTimeout(timer);
    }
  },
};
