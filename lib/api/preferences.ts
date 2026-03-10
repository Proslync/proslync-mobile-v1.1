import { apiClient } from './client';
import type { UserPreferences } from '../types/preferences.types';

export const preferencesApi = {
  getPreferences: async (): Promise<UserPreferences> => {
    return apiClient.get<UserPreferences>('/api/user-preferences');
  },

  updatePreferences: async (
    data: Partial<UserPreferences>,
  ): Promise<UserPreferences> => {
    return apiClient.patch<UserPreferences>('/api/user-preferences', data);
  },
};
