import * as React from 'react';

export interface FollowUser {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

/**
 * Hook to fetch user's followers
 * Note: GetStream React Native SDK doesn't expose followers() method directly.
 * This hook returns an empty list for now - the follower count is available via useUserFeedStats.
 * To get actual follower list, you'd need a backend endpoint.
 */
export function useUserFollowers(userId: string | number | null | undefined) {
  const [followers] = React.useState<FollowUser[]>([]);
  const [isLoading] = React.useState(false);
  const [error] = React.useState<Error | null>(null);

  // The React Native SDK doesn't have direct access to followers list
  // The follower count is available through getOrCreate() response
  // For full list, you'd need to use backend API

  return {
    followers,
    isLoading,
    error,
  };
}

/**
 * Hook to fetch users that this user is following
 * Note: Similar limitation as followers - count available but not full list via SDK
 */
export function useUserFollowing(userId: string | number | null | undefined) {
  const [following] = React.useState<FollowUser[]>([]);
  const [isLoading] = React.useState(false);
  const [error] = React.useState<Error | null>(null);

  return {
    following,
    isLoading,
    error,
  };
}

