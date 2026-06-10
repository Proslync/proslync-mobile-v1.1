// ── useScoreboard ─────────────────────────────────────────
// Calls the composite SportsDataProvider through TanStack Query.
// Refetches every 60s when any game is live; idle otherwise.

import { useQuery } from '@tanstack/react-query';
import { compositeSportsProvider } from '@/lib/sports/providers/composite-provider';
import type { NcaaGameSport } from '@/lib/types/explore.types';

export function useScoreboard(sport: NcaaGameSport, date?: Date) {
  return useQuery({
    queryKey: ['sports', 'scoreboard', sport, date?.toISOString() ?? 'today'],
    queryFn: () => compositeSportsProvider.getScoreboard(sport, date),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: (query) => {
      const collection = query.state.data;
      if (!collection) return false;
      const hasLive = collection.games.some((g) => g.state === 'live');
      return hasLive ? 60 * 1000 : false;
    },
  });
}
