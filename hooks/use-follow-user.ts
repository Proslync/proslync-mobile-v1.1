import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStream } from '@/lib/providers/stream-provider';
import { followsApi } from '@/lib/api/follows';

interface UseFollowUserResult {
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
 * Hook to follow/unfollow a user using Stream SDK directly
 * This matches the web frontend implementation for consistency
 */
export function useFollowUser(targetUserId?: number | string | null): UseFollowUserResult {
  const { client, isReady, userId: currentUserId } = useStream();
  const queryClient = useQueryClient();

  const targetId = targetUserId ? String(targetUserId) : null;

  const [isFollowing, setIsFollowing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFollowInProgress, setIsFollowInProgress] = React.useState(false);
  const [isUnfollowInProgress, setIsUnfollowInProgress] = React.useState(false);

  // Track if we've fetched for this target user
  const fetchedForUserRef = React.useRef<string | null>(null);

  const isSelfFollowAttempt = Boolean(currentUserId) && Boolean(targetId) && currentUserId === targetId;

  const canFollow =
    Boolean(client) &&
    isReady &&
    Boolean(currentUserId) &&
    Boolean(targetId) &&
    !isSelfFollowAttempt;

  // Fetch follow status from Stream
  const fetchFollowStatus = React.useCallback(async () => {
    if (!client || !currentUserId || !targetId || !isReady) {
      setIsLoading(false);
      return;
    }

    // Don't refetch if we already fetched for this user (unless forced)
    if (fetchedForUserRef.current === targetId) {
      return;
    }

    try {
      setIsLoading(true);
      console.log('[useFollowUser] Checking follow status for user:', targetId);

      // Ensure timeline feed exists
      const timelineFeed = client.feed('timeline', currentUserId);
      await timelineFeed.getOrCreate();

      // Query follow relationship
      const response = await client.queryFollows({
        limit: 1,
        filter: {
          source_feed: `timeline:${currentUserId}`,
          target_feed: `user:${targetId}`,
        },
      });

      const following = response.follows.length > 0;
      console.log('[useFollowUser] Follow status:', following);
      setIsFollowing(following);
      fetchedForUserRef.current = targetId;
    } catch (error) {
      console.error('[useFollowUser] Error checking follow status:', error);
      setIsFollowing(false);
    } finally {
      setIsLoading(false);
    }
  }, [client, currentUserId, targetId, isReady]);

  // Refetch function (forces a refresh)
  const refetch = React.useCallback(async () => {
    fetchedForUserRef.current = null;
    await fetchFollowStatus();
  }, [fetchFollowStatus]);

  // Fetch on mount and when target changes
  React.useEffect(() => {
    // Reset when target changes
    if (targetId !== fetchedForUserRef.current) {
      fetchedForUserRef.current = null;
      setIsFollowing(false);
      setIsLoading(true);
    }

    fetchFollowStatus();
  }, [fetchFollowStatus, targetId]);

  // Reset when component unmounts or target changes
  React.useEffect(() => {
    return () => {
      fetchedForUserRef.current = null;
    };
  }, [targetId]);

  // Follow function - Two-step: 1) GetStream (primary), 2) Backend sync (secondary)
  const follow = React.useCallback(async () => {
    if (!canFollow || !client || !currentUserId || !targetId) {
      console.log('[useFollowUser] Cannot follow - missing requirements');
      return;
    }

    setIsFollowInProgress(true);
    try {
      console.log('[useFollowUser] Following user:', targetId);

      // Step 1: Follow in GetStream (primary)
      const timelineFeed = client.feed('timeline', currentUserId);
      await timelineFeed.getOrCreate();
      await timelineFeed.follow(`user:${targetId}`);

      console.log('[useFollowUser] GetStream follow successful');
      setIsFollowing(true);

      // Step 2: Sync with backend database (secondary)
      // This runs after GetStream succeeds - errors logged but don't fail the operation
      try {
        const userIdNumber = Number(targetId);
        if (!isNaN(userIdNumber)) {
          await followsApi.followUser(userIdNumber);
          console.log('[useFollowUser] Backend sync successful');
        }
      } catch (syncError) {
        // Log error but don't fail - GetStream follow already succeeded
        console.error('[useFollowUser] Failed to sync follow with backend:', syncError);
      }

      // Invalidate React Query caches
      queryClient.invalidateQueries({ queryKey: ['userFollowers', Number(targetId)] });
      queryClient.invalidateQueries({ queryKey: ['userFollowing', Number(currentUserId)] });

    } catch (error: any) {
      console.error('[useFollowUser] Follow error:', error);

      // Handle case when target user feed doesn't exist
      if (
        error?.message?.includes("can't be found") ||
        error?.message?.includes('Feed') ||
        error?.message?.includes('not found')
      ) {
        throw new Error('This user profile is not yet active. Please try again later.');
      }

      // Handle already following
      if (error?.status === 409 || error?.message?.includes('already')) {
        setIsFollowing(true);
        return;
      }

      throw error;
    } finally {
      setIsFollowInProgress(false);
    }
  }, [canFollow, client, currentUserId, targetId, queryClient]);

  // Unfollow function - Two-step: 1) GetStream (primary), 2) Backend sync (secondary)
  const unfollow = React.useCallback(async () => {
    if (!canFollow || !client || !currentUserId || !targetId) {
      console.log('[useFollowUser] Cannot unfollow - missing requirements');
      return;
    }

    setIsUnfollowInProgress(true);
    try {
      console.log('[useFollowUser] Unfollowing user:', targetId);

      // Step 1: Unfollow in GetStream (primary)
      const timelineFeed = client.feed('timeline', currentUserId);
      await timelineFeed.unfollow(`user:${targetId}`);

      console.log('[useFollowUser] GetStream unfollow successful');
      setIsFollowing(false);

      // Step 2: Sync with backend database (secondary)
      // This runs after GetStream succeeds - errors logged but don't fail the operation
      try {
        const userIdNumber = Number(targetId);
        if (!isNaN(userIdNumber)) {
          await followsApi.unfollowUser(userIdNumber);
          console.log('[useFollowUser] Backend sync successful');
        }
      } catch (syncError) {
        // Log error but don't fail - GetStream unfollow already succeeded
        console.error('[useFollowUser] Failed to sync unfollow with backend:', syncError);
      }

      // Invalidate React Query caches
      queryClient.invalidateQueries({ queryKey: ['userFollowers', Number(targetId)] });
      queryClient.invalidateQueries({ queryKey: ['userFollowing', Number(currentUserId)] });

    } catch (error) {
      console.error('[useFollowUser] Unfollow error:', error);
      throw error;
    } finally {
      setIsUnfollowInProgress(false);
    }
  }, [canFollow, client, currentUserId, targetId, queryClient]);

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
