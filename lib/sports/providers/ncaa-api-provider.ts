// ── NCAA-API PROVIDER (live, Tier 2 cached) ───────────────
// Wraps the existing `lib/api/ncaa-api.ts` for `getScoreboard`.
// Rankings / team-meta / schedule / athlete-bio are deferred to the
// fixture provider via fallthrough until the corresponding ncaa-api
// endpoints are vetted per PLAN §5b. The composite-provider catches
// every throw so the UI never sees a network error.

import { ncaaApi } from '@/lib/api/ncaa-api';
import type {
  AthleteBioOverlay,
  RankingsResult,
  RankingsScope,
  ScheduledGame,
  SportsDataProvider,
  TeamMeta,
} from '@/lib/sports/sports-data-provider';
import type {
  NcaaGameCollection,
  NcaaGameSport,
} from '@/lib/types/explore.types';

async function getScoreboard(
  sport: NcaaGameSport,
  date: Date = new Date(),
): Promise<NcaaGameCollection> {
  return ncaaApi.getDailyScoreboard(sport, date);
}

// Rankings: the ncaa-api `/rankings/...` endpoint exists, but the
// projector for that route hasn't been vetted yet. Return null so the
// composite provider falls back to the AP25 seed.
async function getRankings(_scope: RankingsScope): Promise<RankingsResult | null> {
  return null;
}

async function getTeam(_schoolId: string): Promise<TeamMeta | null> {
  return null;
}

async function getSchedule(_schoolId: string): Promise<ScheduledGame[]> {
  return [];
}

async function getAthleteBio(_athleteId: string): Promise<AthleteBioOverlay | null> {
  return null;
}

export const ncaaApiProvider: SportsDataProvider = {
  getScoreboard,
  getRankings,
  getTeam,
  getSchedule,
  getAthleteBio,
};
