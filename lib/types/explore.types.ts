// ── PROSLYNC EXPLORE TYPES ────────────────────────────────
// Canonical front-end shape for the universal Explore shell that sits as
// the 6th slot on the role spine. Every authenticated user — Athlete,
// Brand, Agent, Coach, Fan, School/AD, NIL Manager — hits the same
// Explore route and sees identical data. Per the conceptual brief in
// docs/orchestration/explore-track-brief-2026-05-10.md the fan-role
// stays a primary cockpit; Explore is a sibling, not a replacement.
//
// Data sourcing posture (per PLAN.md §5b cross-poll guardrails and the
// `recursive-research-2026-05-10.md` source posture):
//   - ncaa-api (MIT mirror, hosted) — Tier 2 cached: safe to fetch from
//     the app directly for daily scoreboards.
//   - No live ESPN polling.
//   - Every game row carries an explicit `source` ref so the UI can
//     render the same TrustMeta primitive the deal-detail surface uses.

import type {
  ComparableDealSourceKind,
  ComparableDealSourceRef,
} from '@/lib/types/comparable-deal.types';

export type NcaaGameState = 'live' | 'final' | 'pre';

export type NcaaGameSport =
  | 'basketball-men'
  | 'basketball-women'
  | 'lacrosse-men'
  | 'lacrosse-women'
  | 'baseball'
  | 'softball'
  | 'football'
  | 'hockey-men'
  | 'volleyball-women';

export interface NcaaGameTeam {
  /** Short readable name e.g. "Notre Dame", "Syracuse". */
  shortName: string;
  /** 6-char abbreviation e.g. "N DAME", "SYR". */
  abbreviation: string;
  /** ncaa-api `seo` slug, e.g. "notre-dame". */
  seo: string;
  /** Conference slug e.g. "acc", "big-east", "ivy-league". */
  conferenceSeo: string;
  /** Score as integer; undefined for pre-game. */
  score?: number;
  /** True only for finals where this team is the winner. */
  isWinner: boolean;
  /** Seed in a bracket, when present. */
  seed?: string;
}

export interface NcaaGame {
  /** ncaa-api `gameID`. */
  id: string;
  sport: NcaaGameSport;
  /** ISO date for the start of the game in the source's local time. */
  startDateISO: string;
  /** Readable start time string from the source, e.g. "5:00 PM ET". */
  startTimeLabel: string;
  /** Unix seconds at game start. */
  startTimeEpoch: number;
  state: NcaaGameState;
  /** Source's current-period string e.g. "FINAL", "4TH", "TOP 5". */
  periodLabel: string;
  /** Source's clock string when applicable, otherwise "0:00". */
  clockLabel: string;
  /** Source's `finalMessage`, e.g. "FINAL", "FINAL/OT", "" pre-game. */
  finalMessage: string;
  away: NcaaGameTeam;
  home: NcaaGameTeam;
  /** TV network broadcasting the game when known. */
  network?: string;
  /** Bracket round label when this is a postseason game. */
  bracketRound?: string;
  /** Provenance — every Explore datum carries source + freshness. */
  source: ComparableDealSourceRef;
}

export interface NcaaGameCollection {
  sport: NcaaGameSport;
  /** YYYY-MM-DD for the requested scoreboard date. */
  date: string;
  /** UTC ISO when ncaa-api last refreshed its source. */
  sourceUpdatedAt: string;
  games: NcaaGame[];
}

/** Trust posture matching the deal-detail evidence model. */
export const NCAA_API_SOURCE_KIND: ComparableDealSourceKind = 'aggregator';

export const NCAA_API_SOURCE_LABEL = 'ncaa-api (MIT mirror)';
