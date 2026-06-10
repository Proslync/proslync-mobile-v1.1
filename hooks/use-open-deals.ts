// ── OPEN-DEALS HOOKS ──────────────────────────────────────
// Sprint 2.3 React-Query layer over `openDealsApi`. Standard 2-minute
// stale window, 10-minute gc — matches the analytics + comparable-deal
// cadence elsewhere in the app.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { openDealsApi, type OpenDealApplyPayload } from '@/lib/api/open-deals';

export const OPEN_DEALS_KEY = 'open-deals';
export const OPEN_DEAL_KEY = 'open-deal';
export const OPEN_DEAL_RANKED_APPLICANTS_KEY = 'open-deal-ranked-applicants';

export function useOpenDeals() {
  return useQuery({
    queryKey: [OPEN_DEALS_KEY],
    queryFn: () => openDealsApi.getOpenDeals(),
    staleTime: 120_000,
    gcTime: 600_000,
  });
}

export function useOpenDeal(id: string | null | undefined) {
  return useQuery({
    queryKey: [OPEN_DEAL_KEY, id],
    queryFn: () => openDealsApi.getOpenDeal(id ?? ''),
    enabled: Boolean(id),
    staleTime: 120_000,
    gcTime: 600_000,
  });
}

export function useRankedApplicants(openDealId: string | null | undefined) {
  return useQuery({
    queryKey: [OPEN_DEAL_RANKED_APPLICANTS_KEY, openDealId],
    queryFn: () => openDealsApi.getRankedApplicants(openDealId ?? ''),
    enabled: Boolean(openDealId),
    staleTime: 120_000,
    gcTime: 600_000,
  });
}

export interface ApplyToOpenDealVariables {
  openDealId: string;
  applicantId: string;
  payload?: OpenDealApplyPayload;
}

/**
 * Sprint 2.3 athlete-side mutation. The underlying api method is mock —
 * it returns a synthetic `OpenDealApplication` without persisting. On
 * success we still invalidate the deal + ranked-applicants queries so
 * the next read goes through the api boundary cleanly when persistence
 * lands.
 */
export function useApplyToOpenDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ openDealId, applicantId, payload }: ApplyToOpenDealVariables) =>
      openDealsApi.applyToOpenDeal(openDealId, applicantId, payload),
    onSuccess: (_application, { openDealId }) => {
      queryClient.invalidateQueries({ queryKey: [OPEN_DEAL_KEY, openDealId] });
      queryClient.invalidateQueries({
        queryKey: [OPEN_DEAL_RANKED_APPLICANTS_KEY, openDealId],
      });
      queryClient.invalidateQueries({ queryKey: [OPEN_DEALS_KEY] });
    },
  });
}
