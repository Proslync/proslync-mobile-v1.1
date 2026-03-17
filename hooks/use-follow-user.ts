import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/providers/auth-provider';
import { followsApi } from '@/lib/api/follows';
import { authApi } from '@/lib/api/auth';
import { USER_FEED_QUERY_KEY } from './use-user-feed';
import { FEED_QUERY_KEY } from './use-feed';

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

const FOLLOW_STATUS_KEY = 'user-follow-status';

export function useFollowUser(targetUserId?: number | string | null): UseFollowUserResult {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const currentUserId = user?.id ?? null;
  const targetId = targetUserId ? Number(targetUserId) : null;

  const isSelfFollowAttempt = !!(currentUserId && targetId && currentUserId === targetId);

  const canFollow = !!(currentUserId && targetId && !isSelfFollowAttempt);

  const [isFollowInProgress, setIsFollowInProgress] = React.useState(false);
  const [isUnfollowInProgress, setIsUnfollowInProgress] = React.useState(false);

  const statusQuery = useQuery({
    queryKey: [FOLLOW_STATUS_KEY, targetId],
    enabled: canFollow,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const result = await authApi.getFollowStatus(targetId!);
      return result.isFollowing;
    },
  });

  const isFollowing = statusQuery.data ?? false;

  const follow = React.useCallback(async () => {
    if (!canFollow || !targetId) return;

    setIsFollowInProgress(true);
    try {
      await followsApi.followUser(targetId);

      // Optimistically update cache
      queryClient.setQueryData([FOLLOW_STATUS_KEY, targetId], true);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['userFollowers', targetId] });
      queryClient.invalidateQueries({ queryKey: ['userFollowing', currentUserId] });
      queryClient.invalidateQueries({ queryKey: [USER_FEED_QUERY_KEY, targetId] });
      queryClient.invalidateQueries({ queryKey: [FEED_QUERY_KEY] });
    } catch (error: any) {
      if (error?.status === 409 || error?.message?.includes('already')) {
        queryClient.setQueryData([FOLLOW_STATUS_KEY, targetId], true);
        return;
      }
      throw error;
    } finally {
      setIsFollowInProgress(false);
    }
  }, [canFollow, targetId, currentUserId, queryClient]);

  const unfollow = React.useCallback(async () => {
    if (!canFollow || !targetId) return;

    setIsUnfollowInProgress(true);
    try {
      await followsApi.unfollowUser(targetId);

      // Optimistically update cache
      queryClient.setQueryData([FOLLOW_STATUS_KEY, targetId], false);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['userFollowers', targetId] });
      queryClient.invalidateQueries({ queryKey: ['userFollowing', currentUserId] });
      queryClient.invalidateQueries({ queryKey: [USER_FEED_QUERY_KEY, targetId] });
      queryClient.invalidateQueries({ queryKey: [FEED_QUERY_KEY] });
    } catch (error) {
      console.error('Unfollow error:', error);
      throw error;
    } finally {
      setIsUnfollowInProgress(false);
    }
  }, [canFollow, targetId, currentUserId, queryClient]);

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
