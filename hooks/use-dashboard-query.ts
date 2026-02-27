// React Query hooks for dashboard/analytics data

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboard';
import type { MarketingStats } from '@/lib/api/dashboard';

export function useEventMarketingStats(eventId: number | undefined) {
  return useQuery<MarketingStats, Error>({
    queryKey: ['eventMarketingStats', eventId],
    queryFn: () => dashboardApi.getEventMarketingStats(eventId!),
    enabled: !!eventId,
    staleTime: 1000 * 60 * 2,
  });
}
