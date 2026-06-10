import { useQuery } from '@tanstack/react-query';

import { nilCompsApi } from '@/lib/api/nil-comps';

export const DEAL_COMPARABLES_KEY = 'deal-comparables';

export function useDealComparables(dealId: string | null | undefined) {
  return useQuery({
    queryKey: [DEAL_COMPARABLES_KEY, dealId],
    queryFn: () => nilCompsApi.getDealComparables(dealId ?? ''),
    enabled: Boolean(dealId),
    staleTime: 120_000,
    gcTime: 600_000,
  });
}
