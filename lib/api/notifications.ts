import { apiClient } from './client';
import type { MyTeamInvitation } from '../types/team.types';

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
};
