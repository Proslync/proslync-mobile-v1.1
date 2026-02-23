import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStream } from '@/lib/providers/stream-provider';
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

/**
 * Hook to follow/unfollow a venue using Stream SDK directly
 * Two-step: 1) GetStream follow (primary), 2) Backend DB sync (secondary)
 * Mirrors useFollowUser but targets venue: feeds
 */
export function useFollowVenue(venueId?: number | string | null): UseFollowVenueResult {
  const { client, isReady, userId: currentUserId } = useStream();
  const queryClient = useQueryClient();

  const targetVenueId = venueId ? String(venueId) : null;

  const [isFollowing, setIsFollowing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFollowInProgress, setIsFollowInProgress] = React.useState(false);
  const [isUnfollowInProgress, setIsUnfollowInProgress] = React.useState(false);

  const fetchedForVenueRef = React.useRef<string | null>(null);

  const canFollow =
    Boolean(client) &&
    isReady &&
    Boolean(currentUserId) &&
    Boolean(targetVenueId);

  // Fetch follow status from Stream
  const fetchFollowStatus = React.useCallback(async () => {
    if (!client || !currentUserId || !targetVenueId || !isReady) {
      setIsLoading(false);
      return;
    }

    if (fetchedForVenueRef.current === targetVenueId) {
      return;
    }

    try {
      setIsLoading(true);

      const timelineFeed = client.feed('timeline', currentUserId);
      await timelineFeed.getOrCreate();

      const response = await client.queryFollows({
        limit: 1,
        filter: {
          source_feed: `timeline:${currentUserId}`,
          target_feed: `venue:${targetVenueId}`,
        },
      });

      const following = response.follows.length > 0;
      setIsFollowing(following);
      fetchedForVenueRef.current = targetVenueId;
    } catch (error) {
      console.error('[useFollowVenue] Error checking follow status:', error);
      setIsFollowing(false);
    } finally {
      setIsLoading(false);
    }
  }, [client, currentUserId, targetVenueId, isReady]);

  const refetch = React.useCallback(async () => {
    fetchedForVenueRef.current = null;
    await fetchFollowStatus();
  }, [fetchFollowStatus]);

  React.useEffect(() => {
    if (targetVenueId !== fetchedForVenueRef.current) {
      fetchedForVenueRef.current = null;
      setIsFollowing(false);
      setIsLoading(true);
    }
    fetchFollowStatus();
  }, [fetchFollowStatus, targetVenueId]);

  React.useEffect(() => {
    return () => {
      fetchedForVenueRef.current = null;
    };
  }, [targetVenueId]);

  const follow = React.useCallback(async () => {
    if (!canFollow || !client || !currentUserId || !targetVenueId) return;

    setIsFollowInProgress(true);
    try {
      // Step 1: Follow in GetStream (primary)
      const timelineFeed = client.feed('timeline', currentUserId);
      await timelineFeed.getOrCreate();
      await timelineFeed.follow(`venue:${targetVenueId}`);

      setIsFollowing(true);

      // Step 2: Sync with backend database (secondary, non-critical)
      try {
        const venueIdNumber = Number(targetVenueId);
        if (!isNaN(venueIdNumber)) {
          await venuesApi.followVenue(venueIdNumber);
        }
      } catch (syncError) {
        console.error('[useFollowVenue] Failed to sync follow with backend:', syncError);
      }

      // Invalidate venue followers cache
      queryClient.invalidateQueries({ queryKey: [VENUE_FOLLOWERS_KEY, Number(targetVenueId)] });
    } catch (error: any) {
      console.error('[useFollowVenue] Follow error:', error);

      if (
        error?.message?.includes("can't be found") ||
        error?.message?.includes('Feed') ||
        error?.message?.includes('not found')
      ) {
        throw new Error('This venue profile is not yet active. Please try again later.');
      }

      if (error?.status === 409 || error?.message?.includes('already')) {
        setIsFollowing(true);
        return;
      }

      throw error;
    } finally {
      setIsFollowInProgress(false);
    }
  }, [canFollow, client, currentUserId, targetVenueId, queryClient]);

  const unfollow = React.useCallback(async () => {
    if (!canFollow || !client || !currentUserId || !targetVenueId) return;

    setIsUnfollowInProgress(true);
    try {
      // Step 1: Unfollow in GetStream (primary)
      const timelineFeed = client.feed('timeline', currentUserId);
      await timelineFeed.unfollow(`venue:${targetVenueId}`);

      setIsFollowing(false);

      // Step 2: Sync with backend database (secondary, non-critical)
      try {
        const venueIdNumber = Number(targetVenueId);
        if (!isNaN(venueIdNumber)) {
          await venuesApi.unfollowVenue(venueIdNumber);
        }
      } catch (syncError) {
        console.error('[useFollowVenue] Failed to sync unfollow with backend:', syncError);
      }

      // Invalidate venue followers cache
      queryClient.invalidateQueries({ queryKey: [VENUE_FOLLOWERS_KEY, Number(targetVenueId)] });
    } catch (error) {
      console.error('[useFollowVenue] Unfollow error:', error);
      throw error;
    } finally {
      setIsUnfollowInProgress(false);
    }
  }, [canFollow, client, currentUserId, targetVenueId, queryClient]);

  return {
    isFollowing,
    isLoading,
    canFollow,
    follow,
    unfollow,
    isFollowInProgress,
    isUnfollowInProgress,
    refetch,
  };
}
