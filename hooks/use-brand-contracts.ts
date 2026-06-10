// ── BRAND CONTRACTS HOOK (Sprint 2.5 · W33) ──────────────
// React Query hook for the per-athlete contract drill-down on the
// Brand roster surface. Mock-first; backed by `brandContractsApi`.
//
// Anchors:
//   - PLAN.md §2.5 (Brand roster contract drill-down per W33)

import { useQuery } from '@tanstack/react-query';

import { brandContractsApi } from '@/lib/api/brand-contracts';

export const BRAND_ATHLETE_CONTRACT_KEY = 'brand-athlete-contract';

export function useBrandAthleteContract(
  athleteId: string | null | undefined,
  brandId?: string,
) {
  return useQuery({
    queryKey: [BRAND_ATHLETE_CONTRACT_KEY, athleteId ?? null, brandId ?? null],
    queryFn: () => brandContractsApi.getAthleteContract(athleteId ?? '', brandId),
    enabled: Boolean(athleteId),
    staleTime: 300_000,
    gcTime: 600_000,
  });
}
