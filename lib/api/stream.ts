// Stream API - Fetch tokens from backend
import { apiClient } from './client';

export interface StreamTokenResponse {
  token: string;
  expiresAt: string;
  ttlSeconds: number;
}

export interface StreamTokensResponse {
  feedToken: StreamTokenResponse;
  chatToken: StreamTokenResponse;
}

/**
 * Stream API - Fetch tokens from backend for direct GetStream access
 */
export const streamApi = {
  /**
   * Get Stream Feed token
   * POST /api/stream/token/feed
   */
  getFeedToken: async (ttlSeconds?: number): Promise<StreamTokenResponse> => {
    return apiClient.post<StreamTokenResponse>('/api/stream/token/feed', {
      ttlSeconds: ttlSeconds || 3600, // Default 1 hour
    });
  },

  /**
   * Get Stream Chat token
   * POST /api/stream/token/chat
   */
  getChatToken: async (ttlSeconds?: number): Promise<StreamTokenResponse> => {
    return apiClient.post<StreamTokenResponse>('/api/stream/token/chat', {
      ttlSeconds: ttlSeconds || 3600,
    });
  },

  /**
   * Get both Feed and Chat tokens
   * POST /api/stream/token
   */
  getTokens: async (ttlSeconds?: number): Promise<StreamTokensResponse> => {
    return apiClient.post<StreamTokensResponse>('/api/stream/token', {
      ttlSeconds: ttlSeconds || 3600,
    });
  },
};
