// React Query hooks for dashboard data
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardApi, DashboardStats } from '@/lib/api/dashboard';
import { venuesApi } from '@/lib/api/venues';
import type { Venue } from '@/lib/types/events.types';

// Query keys
export const DASHBOARD_STATS_QUERY_KEY = 'dashboard-stats';
export const MY_VENUES_QUERY_KEY = 'my-venues';

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: [DASHBOARD_STATS_QUERY_KEY],
    queryFn: () => dashboardApi.getDashboardStats(),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMyVenues() {
  return useQuery<Venue[]>({
    queryKey: [MY_VENUES_QUERY_KEY],
    queryFn: async () => {
      try {
        return await venuesApi.getMyVenues();
      } catch {
        // Return empty array if venues fetch fails (user may not have venues)
        return [];
      }
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDashboard() {
  const queryClient = useQueryClient();

  const statsQuery = useDashboardStats();
  const venuesQuery = useMyVenues();

  // Combined loading state - true if either query is loading
  const isLoading = statsQuery.isLoading || venuesQuery.isLoading;

  // Combined error - prefer stats error, fall back to venues error
  const error = statsQuery.error?.message || venuesQuery.error?.message || null;

  // Refetch both queries
  const refetch = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [DASHBOARD_STATS_QUERY_KEY] }),
      queryClient.invalidateQueries({ queryKey: [MY_VENUES_QUERY_KEY] }),
    ]);
  };

  return {
    stats: statsQuery.data ?? null,
    venues: venuesQuery.data ?? [],
    isLoading,
    error,
    refetch,
  };
}
