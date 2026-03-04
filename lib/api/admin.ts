import { apiClient } from './client';

// ── Response Types ───────────────────────────────────────────

export interface AdminStatsResponse {
  users: {
    total: number;
    active: number;
    blocked: number;
    newThisWeek: number;
    verified: number;
  };
  events: {
    total: number;
    published: number;
    draft: number;
    cancelled: number;
    newThisWeek: number;
  };
  posts: { total: number };
  rsvps: { total: number };
}

export interface AdminUser {
  id: number;
  phoneNumber: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: string;
  status: string;
  isVerified: boolean;
  isProfileComplete: boolean;
  avatarUrl: string | null;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminEvent {
  id: number;
  name: string;
  description?: string;
  status: string;
  ownerId: number;
  owner?: {
    id: number;
    userName?: string;
    firstName?: string;
    lastName?: string;
  };
  startDate?: string;
  endDate?: string;
  isPublic: boolean;
  createdAt: string;
  venue?: { id: number; name: string } | null;
  flyer?: { url: string } | null;
  imageUrl?: string;
}

export interface AdminEventsResponse {
  events: AdminEvent[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminPost {
  id: number;
  type: string;
  text?: string;
  authorId: number;
  author?: {
    id: number;
    userName?: string;
    firstName?: string;
    lastName?: string;
    avatar?: { url: string } | null;
  };
  media?: { type: string; url: string; thumbnailUrl?: string }[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
  event?: { id: number; name: string } | null;
}

export interface AdminPostsResponse {
  posts: AdminPost[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ActivityItem {
  type: 'user_joined' | 'event_created' | 'post_created';
  id: number;
  title: string;
  subtitle: string;
  createdAt: string;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
}

// ── API Methods ──────────────────────────────────────────────

export const adminApi = {
  getStats: () => apiClient.get<AdminStatsResponse>('/api/admin/stats'),

  getRecentActivity: (limit = 20) =>
    apiClient.get<ActivityItem[]>(`/api/admin/activity?limit=${limit}`),

  getUsers: (params: {
    search?: string;
    status?: string;
    role?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.role) query.set('role', params.role);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return apiClient.get<AdminUsersResponse>(
      `/api/admin/users${qs ? `?${qs}` : ''}`,
    );
  },

  updateUserRole: (userId: number, role: string) =>
    apiClient.patch<SuccessResponse>(`/api/admin/users/${userId}/role`, {
      role,
    }),

  updateUserStatus: (userId: number, status: string) =>
    apiClient.patch<SuccessResponse>(`/api/admin/users/${userId}/status`, {
      status,
    }),

  updateUserVerified: (userId: number, isVerified: boolean) =>
    apiClient.patch<SuccessResponse>(`/api/admin/users/${userId}/verified`, {
      isVerified,
    }),

  getEvents: (params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return apiClient.get<AdminEventsResponse>(
      `/api/admin/events${qs ? `?${qs}` : ''}`,
    );
  },

  updateEventStatus: (eventId: number, status: string) =>
    apiClient.patch<SuccessResponse>(`/api/admin/events/${eventId}/status`, {
      status,
    }),

  deleteEvent: (eventId: number) =>
    apiClient.delete<SuccessResponse>(`/api/admin/events/${eventId}`),

  getPosts: (params: {
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return apiClient.get<AdminPostsResponse>(
      `/api/admin/posts${qs ? `?${qs}` : ''}`,
    );
  },

  deletePost: (postId: number) =>
    apiClient.delete<SuccessResponse>(`/api/admin/posts/${postId}`),
};
