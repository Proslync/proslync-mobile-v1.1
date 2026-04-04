import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { FEED_QUERY_KEY } from './use-feed';
import { CONVERSATIONS_KEY } from './use-conversations';
import { NOTIFICATIONS_KEY } from './use-notifications';
import { USER_PROFILE_KEY } from './use-user-profile';

export const BLOCKED_USERS_KEY = 'blocked-users';

export function useBlockedUsers() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [BLOCKED_USERS_KEY],
    queryFn: usersApi.getBlockedUsers,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    blockedUsers: data?.blockedUsers ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    refetch,
  };
}

export function useBlockUser() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (userId: number) => usersApi.blockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BLOCKED_USERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FEED_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [USER_PROFILE_KEY] });
      queryClient.invalidateQueries({ queryKey: ['user-follow-status'] });
      queryClient.invalidateQueries({ queryKey: ['userFollowers'] });
      queryClient.invalidateQueries({ queryKey: ['userFollowing'] });
    },
  });

  return {
    block: mutation.mutateAsync,
    isBlocking: mutation.isPending,
  };
}

export function useUnblockUser() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (userId: number) => usersApi.unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BLOCKED_USERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FEED_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [USER_PROFILE_KEY] });
      queryClient.invalidateQueries({ queryKey: ['user-follow-status'] });
      queryClient.invalidateQueries({ queryKey: ['userFollowers'] });
      queryClient.invalidateQueries({ queryKey: ['userFollowing'] });
    },
  });

  return {
    unblock: mutation.mutateAsync,
    isUnblocking: mutation.isPending,
  };
}
