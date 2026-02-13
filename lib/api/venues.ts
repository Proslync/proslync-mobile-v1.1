import { apiClient } from './client';
import type { Venue } from '../types/events.types';

export const venuesApi = {
  /**
   * Get venues owned by the current user
   * Backend endpoint: GET /api/venues/my — returns Venue[] directly
   */
  getMyVenues: async (): Promise<Venue[]> => {
    return apiClient.get<Venue[]>('/api/venues/my');
  },

  /**
   * Get a single venue by ID
   * Backend endpoint: GET /api/venues/:id
   */
  getVenue: async (id: number): Promise<Venue> => {
    return apiClient.get<Venue>(`/api/venues/${id}`);
  },
};
