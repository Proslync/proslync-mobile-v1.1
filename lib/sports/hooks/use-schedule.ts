// ── useSchedule ───────────────────────────────────────────

import { useQuery } from '@tanstack/react-query';
import { compositeSportsProvider } from '@/lib/sports/providers/composite-provider';

export function useSchedule(schoolId: string | undefined) {
  return useQuery({
    queryKey: ['sports', 'schedule', schoolId],
    queryFn: () =>
      schoolId ? compositeSportsProvider.getSchedule(schoolId) : [],
    enabled: Boolean(schoolId),
    staleTime: 60 * 60 * 1000, // 1h — schedule updates daily at most
    gcTime: 6 * 60 * 60 * 1000,
  });
}
