// ── SPORTS DATA PROVIDER (interface) ──────────────────────
// Tier-2 abstraction over live + fixture sports data. The interface
// lets surfaces ask for scoreboards, rankings, team metadata, schedule,
// and athlete bios without caring whether they were served by the
// live ncaa-api or by a hand-authored fixture.
//
// Two implementations live alongside this file:
//   - providers/ncaa-api-provider.ts   →  live (Tier 2 cached)
//   - providers/fixture-provider.ts    →  hand-authored fixtures
//   - providers/composite-provider.ts  →  orchestrator. Honors
//                                          `isDemoMode()` and falls back
//                                          to fixtures on any throw.
//                                          Never throws to the UI.

import type {
  NcaaGameCollection,
  NcaaGameSport,
} from '@/lib/types/explore.types';

export type RankingsScope = {
  sport: NcaaGameSport;
  week?: number;
};

export interface RankedTeam {
  rank: number;
  schoolName: string;
  conferenceSeo?: string;
  recordLabel?: string;
  previousRank?: number;
}

export interface RankingsResult {
  sport: NcaaGameSport;
  week: number;
  publishedAt: string;
  teams: RankedTeam[];
  sourceLabel: string;
  sourceKind: 'live' | 'fixture' | 'synthetic';
}

export interface TeamMeta {
  schoolId: string;
  name: string;
  conferenceSeo?: string;
  primaryColorHex?: string;
  logoSlug?: string;
}

export interface ScheduledGame {
  id: string;
  startDateISO: string;
  startTimeLabel: string;
  homeShortName: string;
  awayShortName: string;
  venue?: string;
}

export interface AthleteBioOverlay {
  athleteId: string;
  schoolName?: string;
  classYear?: string;
  position?: string;
  height?: string;
  hometown?: string;
  sourceKind: 'live' | 'fixture' | 'synthetic';
  sourceLabel: string;
  retrievedAt: string;
}

export interface SportsDataProvider {
  getScoreboard(sport: NcaaGameSport, date?: Date): Promise<NcaaGameCollection>;
  getRankings(scope: RankingsScope): Promise<RankingsResult | null>;
  getTeam(schoolId: string): Promise<TeamMeta | null>;
  getSchedule(schoolId: string): Promise<ScheduledGame[]>;
  getAthleteBio(athleteId: string): Promise<AthleteBioOverlay | null>;
}
