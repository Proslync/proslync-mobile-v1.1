// ── useRankings ───────────────────────────────────────────
// AP25 / coaches-poll style ranking via the composite provider.

import { useQuery } from '@tanstack/react-query';
import { compositeSportsProvider } from '@/lib/sports/providers/composite-provider';
import type { RankingsScope } from '@/lib/sports/sports-data-provider';

export function useRankings(scope: RankingsScope) {
  return useQuery({
    queryKey: ['sports', 'rankings', scope.sport, scope.week ?? 'current'],
    queryFn: () => compositeSportsProvider.getRankings(scope),
    staleTime: 6 * 60 * 60 * 1000, // 6h — rankings update weekly
    gcTime: 24 * 60 * 60 * 1000,
  });
}
