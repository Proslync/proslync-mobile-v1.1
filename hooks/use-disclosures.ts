// ── ATHLETE DISCLOSURES HOOKS (Sprint 3.4) ───────────────
// React-Query hooks for the NIL Go-shaped athlete disclosure packet.
// 2-minute stale / 10-minute gc matches the comparable-deal + risk-report
// cadence elsewhere in `hooks/`.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { disclosuresApi } from '@/lib/api/disclosures';
import type { ComplianceDisclosure } from '@/lib/types/compliance-disclosure.types';

export const ATHLETE_DISCLOSURES_KEY = 'athlete-disclosures';
export const DISCLOSURE_KEY = 'disclosure';

export function useAthleteDisclosures(athleteId: string | null | undefined) {
  return useQuery({
    queryKey: [ATHLETE_DISCLOSURES_KEY, athleteId],
    queryFn: () => disclosuresApi.listAthleteDisclosures(athleteId ?? ''),
    enabled: Boolean(athleteId),
    staleTime: 120_000,
    gcTime: 600_000,
  });
}

export function useDisclosure(id: string | null | undefined) {
  return useQuery({
    queryKey: [DISCLOSURE_KEY, id],
    queryFn: () => disclosuresApi.getDisclosure(id ?? ''),
    enabled: Boolean(id),
    staleTime: 120_000,
    gcTime: 600_000,
  });
}

export interface UpdateDisclosureVars {
  id: string;
  patch: Partial<ComplianceDisclosure>;
}

/**
 * Mock-only inline edit. On success seeds the detail-query cache with
 * the patched copy and invalidates so any list views re-render. The
 * underlying fixture is not mutated.
 */
export function useUpdateDisclosure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: UpdateDisclosureVars) =>
      disclosuresApi.updateDisclosure(id, patch),
    onSuccess: (data, vars) => {
      if (data) {
        queryClient.setQueryData([DISCLOSURE_KEY, vars.id], data);
      }
      queryClient.invalidateQueries({ queryKey: [DISCLOSURE_KEY, vars.id] });
      queryClient.invalidateQueries({ queryKey: [ATHLETE_DISCLOSURES_KEY] });
    },
  });
}
