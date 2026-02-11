// React Query hook for fetching ticket tiers
import { useQuery } from '@tanstack/react-query';
import { pricingApi } from '@/lib/api/pricing';
import type { TicketTier } from '@/lib/types/pricing.types';

export const TIERS_QUERY_KEY = 'event-tiers';

/**
 * Hook for fetching ticket tiers for an event
 */
export function useGetTiers(eventId: number) {
  return useQuery<TicketTier[]>({
    queryKey: [TIERS_QUERY_KEY, eventId],
    queryFn: () => pricingApi.getTiers(eventId),
    enabled: Boolean(eventId),
    staleTime: 60 * 1000, // 1 minute
  });
}
