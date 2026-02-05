// Hooks for fetching user followers and following from backend API

import { useQuery } from '@tanstack/react-query';
import { followsApi } from '@/lib/api/follows';
import type { UserFollowItem, VenueFollowItem } from '@/lib/types/follows.types';

// Default avatar for users without one
const DEFAULT_AVATAR = 'https://picsum.photos/200';

// Interface for display in UI (used by profile screen)
export interface FollowUser {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

// Interface for venue display
export interface FollowVenue {
  id: string;
  name: string;
  logo: string;
}

/**
 * Transform API user item to UI format
 */
function transformUserItem(item: UserFollowItem): FollowUser {
  return {
    id: item.id.toString(),
    userName: item.userName || 'user',
    firstName: item.firstName || '',
    lastName: item.lastName || '',
    avatar: item.avatarUrl || DEFAULT_AVATAR,
  };
}

/**
 * Transform API venue item to UI format
 */
function transformVenueItem(item: VenueFollowItem): FollowVenue {
  return {
    id: item.id.toString(),
    name: item.name,
    logo: item.logoUrl || DEFAULT_AVATAR,
  };
}

/**
 * Hook to fetch user's followers
 * @param userId - User ID to fetch followers for
 * @param enabled - Set to true to fetch (use for lazy loading when modal opens)
 */
export function useUserFollowers(
  userId: string | number | null | undefined,
  enabled: boolean = true
) {
  const numericUserId = userId ? Number(userId) : null;

  const query = useQuery({
    queryKey: ['userFollowers', numericUserId],
    queryFn: async () => {
      console.log('[useUserFollowers] Fetching followers for user:', numericUserId);
      const result = await followsApi.getUserFollowers(numericUserId!);
      console.log('[useUserFollowers] Response:', result);
      return result;
    },
    enabled: !!numericUserId && enabled,
    staleTime: 30000, // 30 seconds - data considered fresh for this duration
    refetchOnMount: true, // Refetch when component mounts if data is stale
  });

  return {
    followers: query.data?.userFollowers.map(transformUserItem) || [],
    totalFollowers: query.data?.totalFollowers || 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to fetch users and venues that this user is following
 * @param userId - User ID to fetch following for
 * @param enabled - Set to true to fetch (use for lazy loading when modal opens)
 */
export function useUserFollowing(
  userId: string | number | null | undefined,
  enabled: boolean = true
) {
  const numericUserId = userId ? Number(userId) : null;

  const query = useQuery({
    queryKey: ['userFollowing', numericUserId],
    queryFn: async () => {
      console.log('[useUserFollowing] Fetching following for user:', numericUserId);
      const result = await followsApi.getUserFollowing(numericUserId!);
      console.log('[useUserFollowing] Response:', result);
      return result;
    },
    enabled: !!numericUserId && enabled,
    staleTime: 30000, // 30 seconds - data considered fresh for this duration
    refetchOnMount: true, // Refetch when component mounts if data is stale
  });

  return {
    // Combined list of users for backward compatibility with existing UI
    following: query.data?.followingUsers.map(transformUserItem) || [],
    // Separate lists for more detailed UI
    followingUsers: query.data?.followingUsers.map(transformUserItem) || [],
    followingVenues: query.data?.followingVenues.map(transformVenueItem) || [],
    totalFollowing: query.data?.totalFollowing || 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
