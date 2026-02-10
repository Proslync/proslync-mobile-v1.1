import { apiClient } from './client';
import type { Venue } from '../types/events.types';

export interface VenuesResponse {
  venues: Venue[];
}

export const venuesApi = {
  /**
   * Get venues owned by the current user
   * Backend endpoint: GET /api/venues/my
   */
  getMyVenues: async (): Promise<Venue[]> => {
    const response = await apiClient.get<VenuesResponse>('/api/venues/my');
    return response.venues;
  },

  /**
   * Get a single venue by ID
   * Backend endpoint: GET /api/venues/:id
   */
  getVenue: async (id: number): Promise<Venue> => {
    return apiClient.get<Venue>(`/api/venues/${id}`);
  },
};
