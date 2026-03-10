import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type {
  AdminStatsResponse,
  AdminUsersResponse,
  AdminEventsResponse,
  AdminPostsResponse,
  ActivityItem,
  ModerationRule,
  ContentType,
} from '@/lib/api/admin';

export const ADMIN_STATS_KEY = 'admin-stats';
export const ADMIN_ACTIVITY_KEY = 'admin-activity';
export const ADMIN_USERS_KEY = 'admin-users';
export const ADMIN_EVENTS_KEY = 'admin-events';
export const ADMIN_POSTS_KEY = 'admin-posts';
export const ADMIN_MODERATION_RULES_KEY = 'admin-moderation-rules';

// ── Queries ──────────────────────────────────────────────────

export function useAdminStats() {
  return useQuery<AdminStatsResponse>({
    queryKey: [ADMIN_STATS_KEY],
    queryFn: () => adminApi.getStats(),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useAdminActivity(limit = 20) {
  return useQuery<ActivityItem[]>({
    queryKey: [ADMIN_ACTIVITY_KEY, limit],
    queryFn: () => adminApi.getRecentActivity(limit),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useAdminUsers(params: {
  search?: string;
  status?: string;
  role?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery<AdminUsersResponse>({
    queryKey: [ADMIN_USERS_KEY, params],
    queryFn: () => adminApi.getUsers(params),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useAdminEvents(params: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery<AdminEventsResponse>({
    queryKey: [ADMIN_EVENTS_KEY, params],
    queryFn: () => adminApi.getEvents(params),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useAdminPosts(params: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery<AdminPostsResponse>({
    queryKey: [ADMIN_POSTS_KEY, params],
    queryFn: () => adminApi.getPosts(params),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// ── Mutations ────────────────────────────────────────────────

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      adminApi.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_STATS_KEY] });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, status }: { userId: number; status: string }) =>
      adminApi.updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_STATS_KEY] });
    },
  });
}

export function useUpdateUserVerified() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      isVerified,
    }: {
      userId: number;
      isVerified: boolean;
    }) => adminApi.updateUserVerified(userId, isVerified),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_STATS_KEY] });
    },
  });
}

export function useUpdateEventStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, status }: { eventId: number; status: string }) =>
      adminApi.updateEventStatus(eventId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_EVENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_STATS_KEY] });
    },
  });
}

export function useAdminDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: number) => adminApi.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_EVENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_STATS_KEY] });
    },
  });
}

export function useAdminDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: number) => adminApi.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_POSTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_STATS_KEY] });
    },
  });
}

// ── Content Moderation Rules ────────────────────────────────

export function useContentModerationRules() {
  return useQuery<ModerationRule[]>({
    queryKey: [ADMIN_MODERATION_RULES_KEY],
    queryFn: () => adminApi.getContentModerationRules(),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useCreateModerationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      description: string;
      contentTypes: ContentType[];
      isEnabled?: boolean;
    }) => adminApi.createContentModerationRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [ADMIN_MODERATION_RULES_KEY],
      });
    },
  });
}

export function useUpdateModerationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      name?: string;
      description?: string;
      contentTypes?: ContentType[];
      isEnabled?: boolean;
      sortOrder?: number;
    }) => adminApi.updateContentModerationRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [ADMIN_MODERATION_RULES_KEY],
      });
    },
  });
}

export function useDeleteModerationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteContentModerationRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [ADMIN_MODERATION_RULES_KEY],
      });
    },
  });
}
