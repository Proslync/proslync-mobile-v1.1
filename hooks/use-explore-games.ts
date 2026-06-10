import { useQueries } from '@tanstack/react-query';

import { ncaaApi } from '@/lib/api/ncaa-api';
import type {
  NcaaGame,
  NcaaGameCollection,
  NcaaGameSport,
} from '@/lib/types/explore.types';

export const EXPLORE_GAMES_KEY = 'explore-games';

// Spring sports active around May (NCAA basketball offseason). We fetch
// in parallel so the rail renders progressively. ncaa-api returns empty
// `games` arrays for sports out of season — that's the right "no games
// today" signal.
export const DEFAULT_EXPLORE_SPORTS: NcaaGameSport[] = [
  'basketball-men',
  'lacrosse-men',
  'lacrosse-women',
  'baseball',
  'softball',
];

interface UseExploreGamesOptions {
  sports?: NcaaGameSport[];
  date?: Date;
  /**
   * When any game is live, the underlying query bumps to a faster
   * refetch interval so the score chip stays current.
   */
  liveRefetchIntervalMs?: number;
  staleMs?: number;
}

export interface UseExploreGamesResult {
  collections: NcaaGameCollection[];
  liveGames: NcaaGame[];
  finalGames: NcaaGame[];
  upcomingGames: NcaaGame[];
  isLoading: boolean;
  isFetching: boolean;
  errors: Error[];
  lastUpdatedAt?: number;
  hasLive: boolean;
}

export function useExploreGames(
  options: UseExploreGamesOptions = {},
): UseExploreGamesResult {
  const sports = options.sports ?? DEFAULT_EXPLORE_SPORTS;
  const date = options.date ?? new Date();
  const liveInterval = options.liveRefetchIntervalMs ?? 60_000;
  const staleMs = options.staleMs ?? 5 * 60_000;

  const queries = useQueries({
    queries: sports.map((sport) => ({
      queryKey: [EXPLORE_GAMES_KEY, sport, dateKey(date)],
      queryFn: () => ncaaApi.getDailyScoreboard(sport, date),
      staleTime: staleMs,
      gcTime: 30 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchInterval: (query: { state: { data: NcaaGameCollection | undefined } }) => {
        const data = query.state.data;
        if (!data) return staleMs;
        const anyLive = data.games.some((g) => g.state === 'live');
        return anyLive ? liveInterval : staleMs;
      },
    })),
  });

  const collections = queries
    .map((q) => q.data)
    .filter((d): d is NcaaGameCollection => Boolean(d));

  const allGames = collections.flatMap((c) => c.games);
  const liveGames = allGames.filter((g) => g.state === 'live');
  const finalGames = allGames.filter((g) => g.state === 'final');
  const upcomingGames = allGames.filter((g) => g.state === 'pre');

  liveGames.sort((a, b) => a.startTimeEpoch - b.startTimeEpoch);
  upcomingGames.sort((a, b) => a.startTimeEpoch - b.startTimeEpoch);
  finalGames.sort((a, b) => b.startTimeEpoch - a.startTimeEpoch);

  const errors = queries
    .map((q) => q.error)
    .filter((e): e is Error => e instanceof Error);

  return {
    collections,
    liveGames,
    finalGames,
    upcomingGames,
    isLoading: queries.some((q) => q.isLoading),
    isFetching: queries.some((q) => q.isFetching),
    errors,
    lastUpdatedAt: Math.max(
      0,
      ...queries.map((q) => q.dataUpdatedAt ?? 0),
    ),
    hasLive: liveGames.length > 0,
  };
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
