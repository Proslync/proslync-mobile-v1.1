// Revenue Analytics — React Query hook for revenue time series data

import { useQuery } from '@tanstack/react-query';
import {
  analyticsApi,
  type RevenueTimeSeriesResponse,
} from '@/lib/api/analytics';

export const REVENUE_TIMESERIES_KEY = 'revenue-timeseries';

/**
 * Fetch revenue time series for dashboard (all events) or a specific event.
 * Uses the new backend endpoints that return daily-aggregated revenue data.
 */
export function useRevenueTimeSeries(range: string, eventId?: number) {
  return useQuery<RevenueTimeSeriesResponse>({
    queryKey: [REVENUE_TIMESERIES_KEY, range, eventId],
    queryFn: () =>
      eventId
        ? analyticsApi.getEventRevenueTimeSeries(eventId, range)
        : analyticsApi.getRevenueTimeSeries(range),
    enabled: eventId ? eventId > 0 : true,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
