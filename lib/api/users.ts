// Users API — block, report, mute

import { apiClient } from './client';

export interface BlockUserResponse {
  success: boolean;
  message: string;
}

export interface ReportUserResponse {
  success: boolean;
  message: string;
}

export const usersApi = {
  /**
   * Block a user
   */
  blockUser: async (userId: number): Promise<BlockUserResponse> => {
    return apiClient.post<BlockUserResponse>(`/api/users/${userId}/block`, {});
  },

  /**
   * Unblock a user
   */
  unblockUser: async (userId: number): Promise<BlockUserResponse> => {
    return apiClient.delete<BlockUserResponse>(`/api/users/${userId}/block`);
  },

  /**
   * Report a user
   */
  reportUser: async (
    userId: number,
    reason: string,
    details?: string,
  ): Promise<ReportUserResponse> => {
    return apiClient.post<ReportUserResponse>(`/api/users/${userId}/report`, {
      reason,
      details,
    });
  },

  /**
   * Restrict a user (limits interactions without full block)
   */
  restrictUser: async (userId: number): Promise<BlockUserResponse> => {
    return apiClient.post<BlockUserResponse>(`/api/users/${userId}/restrict`, {});
  },

  /**
   * Remove restriction on a user
   */
  unrestrictUser: async (userId: number): Promise<BlockUserResponse> => {
    return apiClient.delete<BlockUserResponse>(`/api/users/${userId}/restrict`);
  },
};
