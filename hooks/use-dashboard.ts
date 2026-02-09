import { useState, useEffect, useCallback } from 'react';
import { dashboardApi, DashboardStats } from '@/lib/api/dashboard';
import { venuesApi } from '@/lib/api/venues';
import type { Venue } from '@/lib/types/events.types';

interface UseDashboardResult {
  stats: DashboardStats | null;
  venues: Venue[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboard(): UseDashboardResult {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [dashboardStats, myVenues] = await Promise.all([
        dashboardApi.getDashboardStats(),
        venuesApi.getMyVenues().catch(() => [] as Venue[]),
      ]);
      setStats(dashboardStats);
      setVenues(myVenues);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMessage);
      console.error('[useDashboard] Error fetching stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    venues,
    isLoading,
    error,
    refetch: fetchStats,
  };
}
