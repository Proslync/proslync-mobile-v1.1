// ── ATHLETE SOCIAL REACH HOOK ────────────────────────────
// W25 (PLAN.md §5 P1) — React Query hook backing the cross-platform
// reach card on the athlete bio. 10-min stale matches "weekly sync"
// methodology in `mock-social-reach.ts`'s `sourceNote`; gc held at
// 30 min so multiple bio entries during a session don't refetch.

import { useQuery } from '@tanstack/react-query';

import { socialReachApi } from '@/lib/api/social-reach';

export const ATHLETE_SOCIAL_REACH_KEY = 'athlete-social-reach';

export function useAthleteSocialReach(
  athleteId: string | null | undefined,
) {
  return useQuery({
    queryKey: [ATHLETE_SOCIAL_REACH_KEY, athleteId],
    queryFn: () => socialReachApi.getAthleteSocialReach(athleteId ?? ''),
    enabled: Boolean(athleteId),
    staleTime: 600_000,
    gcTime: 1_800_000,
  });
}
