// ── PERMISSION GRANT HOOKS ────────────────────────────────
// Sprint 3.7 (PLAN §3.7) read hooks for the athlete consent /
// permission-grant model. 2-minute stale window — consent records
// rarely change, but the audit log must surface freshly after a
// pause / revoke / level change.

import { useQuery } from '@tanstack/react-query';

import { permissionGrantsApi } from '@/lib/api/permission-grants';

export const ATHLETE_PERMISSION_GRANTS_KEY = 'athlete-permission-grants';
export const PERMISSION_GRANT_KEY = 'permission-grant';

export function useAthletePermissionGrants(athleteId: string | null | undefined) {
  return useQuery({
    queryKey: [ATHLETE_PERMISSION_GRANTS_KEY, athleteId],
    queryFn: () => permissionGrantsApi.listForAthlete(athleteId ?? ''),
    enabled: Boolean(athleteId),
    staleTime: 120_000,
    gcTime: 600_000,
  });
}

export function usePermissionGrant(id: string | null | undefined) {
  return useQuery({
    queryKey: [PERMISSION_GRANT_KEY, id],
    queryFn: () => permissionGrantsApi.getGrant(id ?? ''),
    enabled: Boolean(id),
    staleTime: 120_000,
    gcTime: 600_000,
  });
}
