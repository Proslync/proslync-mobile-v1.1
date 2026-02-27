import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/providers/auth-provider';
import { venuesApi } from '@/lib/api/venues';
import { VENUE_FOLLOWERS_KEY } from './use-venue-followers';

interface UseFollowVenueResult {
  isFollowing: boolean;
  isLoading: boolean;
  canFollow: boolean;
  follow: () => Promise<void>;
  unfollow: () => Promise<void>;
  isFollowInProgress: boolean;
  isUnfollowInProgress: boolean;
  refetch: () => Promise<void>;
}

const VENUE_FOLLOW_STATUS_KEY = 'venue-follow-status';

export function useFollowVenue(venueId?: number | string | null): UseFollowVenueResult {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const currentUserId = user?.id ?? null;
  const targetVenueId = venueId ? Number(venueId) : null;

  const canFollow = !!(currentUserId && targetVenueId);

  const [isFollowInProgress, setIsFollowInProgress] = React.useState(false);
  const [isUnfollowInProgress, setIsUnfollowInProgress] = React.useState(false);

  const statusQuery = useQuery({
    queryKey: [VENUE_FOLLOW_STATUS_KEY, targetVenueId],
    enabled: canFollow,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const result = await venuesApi.getVenueFollowStatus(targetVenueId!);
      return result.isFollowing;
    },
  });

  const isFollowing = statusQuery.data ?? false;

  const follow = React.useCallback(async () => {
    if (!canFollow || !targetVenueId) return;

    setIsFollowInProgress(true);
    try {
      await venuesApi.followVenue(targetVenueId);

      queryClient.setQueryData([VENUE_FOLLOW_STATUS_KEY, targetVenueId], true);
      queryClient.invalidateQueries({ queryKey: [VENUE_FOLLOWERS_KEY, targetVenueId] });
    } catch (error: any) {
      if (error?.status === 409 || error?.message?.includes('already')) {
        queryClient.setQueryData([VENUE_FOLLOW_STATUS_KEY, targetVenueId], true);
        return;
      }
      throw error;
    } finally {
      setIsFollowInProgress(false);
    }
  }, [canFollow, targetVenueId, queryClient]);

  const unfollow = React.useCallback(async () => {
    if (!canFollow || !targetVenueId) return;

    setIsUnfollowInProgress(true);
    try {
      await venuesApi.unfollowVenue(targetVenueId);

      queryClient.setQueryData([VENUE_FOLLOW_STATUS_KEY, targetVenueId], false);
      queryClient.invalidateQueries({ queryKey: [VENUE_FOLLOWERS_KEY, targetVenueId] });
    } catch (error) {
      console.error('Unfollow error:', error);
      throw error;
    } finally {
      setIsUnfollowInProgress(false);
    }
  }, [canFollow, targetVenueId, queryClient]);

  const refetch = React.useCallback(async () => {
    await statusQuery.refetch();
  }, [statusQuery]);

  return {
    isFollowing,
    isLoading: statusQuery.isLoading,
    canFollow,
    follow,
    unfollow,
    isFollowInProgress,
    isUnfollowInProgress,
    refetch,
  };
}
