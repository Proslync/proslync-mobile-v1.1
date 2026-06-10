// ── useTeamMeta ───────────────────────────────────────────

import { useQuery } from '@tanstack/react-query';
import { compositeSportsProvider } from '@/lib/sports/providers/composite-provider';

export function useTeamMeta(schoolId: string | undefined) {
  return useQuery({
    queryKey: ['sports', 'team', schoolId],
    queryFn: () => (schoolId ? compositeSportsProvider.getTeam(schoolId) : null),
    enabled: Boolean(schoolId),
    staleTime: 6 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
