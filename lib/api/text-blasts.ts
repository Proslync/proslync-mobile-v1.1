import { apiClient } from './client';
import type {
  TextBlastResponse,
  SendTextBlastRequest,
  SendTextBlastResponse,
  RecipientCountResponse,
  TextBlastAudience,
} from '../types/text-blast.types';

export const textBlastsApi = {
  sendTextBlast: async (
    eventId: number,
    data: SendTextBlastRequest,
  ): Promise<SendTextBlastResponse> => {
    return apiClient.post<SendTextBlastResponse>(
      `/api/events/${eventId}/text-blasts`,
      data,
    );
  },

  getTextBlasts: async (eventId: number): Promise<TextBlastResponse[]> => {
    return apiClient.get<TextBlastResponse[]>(
      `/api/events/${eventId}/text-blasts`,
    );
  },

  getTextBlastStatus: async (
    eventId: number,
    batchId: string,
  ): Promise<TextBlastResponse> => {
    return apiClient.get<TextBlastResponse>(
      `/api/events/${eventId}/text-blasts/${batchId}`,
    );
  },

  getRecipientCount: async (
    eventId: number,
    audience: TextBlastAudience = 'all',
  ): Promise<RecipientCountResponse> => {
    return apiClient.get<RecipientCountResponse>(
      `/api/events/${eventId}/text-blasts/recipient-count?audience=${audience}`,
    );
  },
};
