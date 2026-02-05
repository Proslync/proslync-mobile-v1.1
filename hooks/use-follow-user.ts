import * as React from 'react';
import { useStream } from '@/lib/providers/stream-provider';
import { useAuth } from '@/lib/providers/auth-provider';

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
  const { user } = useAuth();

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

  // Follow function using Stream SDK directly
  const follow = React.useCallback(async () => {
    if (!canFollow || !client || !currentUserId || !targetId) {
      console.log('[useFollowUser] Cannot follow - missing requirements');
      return;
    }

    setIsFollowInProgress(true);
    try {
      console.log('[useFollowUser] Following user:', targetId);

      const timelineFeed = client.feed('timeline', currentUserId);

      // Ensure timeline feed exists
      await timelineFeed.getOrCreate();

      // Follow the target user's feed
      await timelineFeed.follow(`user:${targetId}`);

      console.log('[useFollowUser] Successfully followed user:', targetId);
      setIsFollowing(true);
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
  }, [canFollow, client, currentUserId, targetId]);

  // Unfollow function using Stream SDK directly
  const unfollow = React.useCallback(async () => {
    if (!canFollow || !client || !currentUserId || !targetId) {
      console.log('[useFollowUser] Cannot unfollow - missing requirements');
      return;
    }

    setIsUnfollowInProgress(true);
    try {
      console.log('[useFollowUser] Unfollowing user:', targetId);

      const timelineFeed = client.feed('timeline', currentUserId);

      // Unfollow the target user's feed
      await timelineFeed.unfollow(`user:${targetId}`);

      console.log('[useFollowUser] Successfully unfollowed user:', targetId);
      setIsFollowing(false);
    } catch (error) {
      console.error('[useFollowUser] Unfollow error:', error);
      throw error;
    } finally {
      setIsUnfollowInProgress(false);
    }
  }, [canFollow, client, currentUserId, targetId]);

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
