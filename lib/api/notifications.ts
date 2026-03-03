import { apiClient } from './client';
import type { MyTeamInvitation } from '../types/team.types';
import type { NotificationsResponse } from '../types/notifications.types';

export const notificationsApi = {
  getMyTeamInvitations: async (): Promise<MyTeamInvitation[]> => {
    return apiClient.get<MyTeamInvitation[]>(
      '/api/user/me/team-invitations',
    );
  },

  acceptTeamInvitation: async (invitationId: number): Promise<void> => {
    return apiClient.post(`/api/user/me/team-invitations/${invitationId}/accept`);
  },

  declineTeamInvitation: async (invitationId: number): Promise<void> => {
    return apiClient.post(`/api/user/me/team-invitations/${invitationId}/decline`);
  },

  getNotifications: async (
    page: number = 1,
    limit: number = 20,
  ): Promise<NotificationsResponse> => {
    return apiClient.get<NotificationsResponse>(
      `/api/notifications?page=${page}&limit=${limit}`,
    );
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    return apiClient.get<{ count: number }>('/api/notifications/unread-count');
  },

  markAsRead: async (id: number): Promise<void> => {
    return apiClient.patch(`/api/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    return apiClient.patch('/api/notifications/read-all');
  },
};
