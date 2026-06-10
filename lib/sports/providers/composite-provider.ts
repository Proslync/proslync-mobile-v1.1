// ── COMPOSITE PROVIDER ────────────────────────────────────
// Orchestrator: respects `isDemoMode()`, tries live first, falls back
// to fixtures on any throw. **Never throws to the UI.**

import { isDemoMode } from '@/lib/dev/dev-mode';
import type {
  AthleteBioOverlay,
  RankingsResult,
  RankingsScope,
  ScheduledGame,
  SportsDataProvider,
  TeamMeta,
} from '@/lib/sports/sports-data-provider';
import { fixtureProvider } from './fixture-provider';
import { ncaaApiProvider } from './ncaa-api-provider';
import type { NcaaGameCollection, NcaaGameSport } from '@/lib/types/explore.types';

async function withFixtureFallback<T>(
  liveCall: () => Promise<T>,
  fixtureCall: () => Promise<T>,
): Promise<T> {
  if (isDemoMode()) {
    return fixtureCall();
  }
  try {
    const live = await liveCall();
    if (live === null || (Array.isArray(live) && live.length === 0)) {
      return fixtureCall();
    }
    return live;
  } catch {
    return fixtureCall();
  }
}

async function getScoreboard(
  sport: NcaaGameSport,
  date?: Date,
): Promise<NcaaGameCollection> {
  return withFixtureFallback(
    () => ncaaApiProvider.getScoreboard(sport, date),
    () => fixtureProvider.getScoreboard(sport, date),
  );
}

async function getRankings(scope: RankingsScope): Promise<RankingsResult | null> {
  return withFixtureFallback(
    () => ncaaApiProvider.getRankings(scope),
    () => fixtureProvider.getRankings(scope),
  );
}

async function getTeam(schoolId: string): Promise<TeamMeta | null> {
  return withFixtureFallback(
    () => ncaaApiProvider.getTeam(schoolId),
    () => fixtureProvider.getTeam(schoolId),
  );
}

async function getSchedule(schoolId: string): Promise<ScheduledGame[]> {
  return withFixtureFallback(
    () => ncaaApiProvider.getSchedule(schoolId),
    () => fixtureProvider.getSchedule(schoolId),
  );
}

async function getAthleteBio(athleteId: string): Promise<AthleteBioOverlay | null> {
  return withFixtureFallback(
    () => ncaaApiProvider.getAthleteBio(athleteId),
    () => fixtureProvider.getAthleteBio(athleteId),
  );
}

export const compositeSportsProvider: SportsDataProvider = {
  getScoreboard,
  getRankings,
  getTeam,
  getSchedule,
  getAthleteBio,
};
