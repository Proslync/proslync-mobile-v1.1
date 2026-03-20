import { apiClient } from './client';

export interface GenerateLinkingCodeResponse {
  code: string;
  expiresAt: string;
  appleMessagesUrl: string;
}

export const appleMessagesApi = {
  generateLinkingCode: () =>
    apiClient.post<GenerateLinkingCodeResponse>(
      '/api/apple-business-messages/generate-linking-code',
      {}
    ),
};
