// ── useAthleteBio ─────────────────────────────────────────

import { useQuery } from '@tanstack/react-query';
import { compositeSportsProvider } from '@/lib/sports/providers/composite-provider';

export function useAthleteBio(athleteId: string | undefined) {
  return useQuery({
    queryKey: ['sports', 'athlete-bio', athleteId],
    queryFn: () =>
      athleteId ? compositeSportsProvider.getAthleteBio(athleteId) : null,
    enabled: Boolean(athleteId),
    staleTime: 6 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
