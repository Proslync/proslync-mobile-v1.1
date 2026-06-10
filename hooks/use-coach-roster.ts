// ── COACH ROSTER HOOK ────────────────────────────────────
// Sprint 4 — feeds the coach NIL Watch surface with the
// athlete-id roster + per-athlete NIL rollup. Roster does not
// change often during a session, so 5-minute stale window.

import { useQuery } from '@tanstack/react-query';

import { coachRosterApi } from '@/lib/api/coach-roster';

export const COACH_ROSTER_KEY = 'coach-roster';

export function useCoachRoster(coachId: string | null | undefined) {
  return useQuery({
    queryKey: [COACH_ROSTER_KEY, coachId],
    queryFn: () => coachRosterApi.getCoachRoster(coachId ?? ''),
    enabled: Boolean(coachId),
    staleTime: 300_000,
    gcTime: 600_000,
  });
}
