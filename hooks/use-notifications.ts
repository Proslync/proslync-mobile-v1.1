import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/notifications';
import type { NotificationsResponse } from '@/lib/types/notifications.types';

export const MY_TEAM_INVITATIONS_KEY = 'my-team-invitations';
export const NOTIFICATIONS_KEY = 'notifications';
export const UNREAD_COUNT_KEY = 'notifications-unread-count';

export function useMyTeamInvitations() {
  return useQuery({
    queryKey: [MY_TEAM_INVITATIONS_KEY],
    queryFn: () => notificationsApi.getMyTeamInvitations(),
    staleTime: 0,
  });
}

export function useAcceptTeamInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: number) =>
      notificationsApi.acceptTeamInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MY_TEAM_INVITATIONS_KEY] });
    },
  });
}

export function useDeclineTeamInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: number) =>
      notificationsApi.declineTeamInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MY_TEAM_INVITATIONS_KEY] });
    },
  });
}

const PAGE_SIZE = 20;

export function useNotifications() {
  const query = useInfiniteQuery<NotificationsResponse, Error>({
    queryKey: [NOTIFICATIONS_KEY],
    queryFn: async ({ pageParam }) => {
      return notificationsApi.getNotifications(pageParam as number, PAGE_SIZE);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasNext) return lastPage.page + 1;
      return undefined;
    },
    staleTime: 30_000,
  });

  const notifications =
    query.data?.pages.flatMap((page) => page.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  return { ...query, notifications, total };
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: [UNREAD_COUNT_KEY],
    queryFn: async () => {
      const result = await notificationsApi.getUnreadCount();
      return result.count;
    },
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY] });
    },
  });
}
