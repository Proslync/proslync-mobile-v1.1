import { apiClient } from './client';
import type { Venue } from '../types/events.types';
import type { VenueFollowersResponse } from '../types/venues.types';

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

  /**
   * Follow a venue
   * Backend endpoint: POST /api/venues/:id/follow
   */
  followVenue: async (venueId: number): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>(`/api/venues/${venueId}/follow`);
  },

  /**
   * Unfollow a venue
   * Backend endpoint: DELETE /api/venues/:id/follow
   */
  unfollowVenue: async (venueId: number): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/api/venues/${venueId}/follow`);
  },

  /**
   * Check if current user follows a venue
   * Backend endpoint: GET /api/venues/:id/follow-status
   */
  getVenueFollowStatus: async (venueId: number): Promise<{ isFollowing: boolean }> => {
    return apiClient.get<{ isFollowing: boolean }>(`/api/venues/${venueId}/follow-status`);
  },

  /**
   * Update venue details
   * Backend endpoint: PUT /api/venues/:id
   */
  updateVenue: async (id: number, data: Partial<Omit<Venue, 'id' | 'ownerId' | 'status'>>): Promise<Venue> => {
    return apiClient.put<Venue>(`/api/venues/${id}`, data);
  },

  /**
   * Upload venue profile image
   * Backend endpoint: POST /api/venues/:id/image
   */
  uploadVenueImage: async (venueId: number, uri: string): Promise<{ url: string }> => {
    const fileName = uri.split('/').pop() || 'venue.jpg';
    const extension = fileName.split('.').pop()?.toLowerCase();
    let mimeType = 'image/jpeg';
    if (extension === 'png') mimeType = 'image/png';
    else if (extension === 'webp') mimeType = 'image/webp';

    return apiClient.uploadFile<{ url: string }>(
      `/api/venues/${venueId}/image`,
      { uri, name: fileName, type: mimeType },
      'image',
    );
  },

  /**
   * Get paginated followers for a venue
   * Backend endpoint: GET /api/venues/:id/followers
   */
  getVenueFollowers: async (
    venueId: number,
    params?: { page?: number; limit?: number; search?: string },
  ): Promise<VenueFollowersResponse> => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return apiClient.get<VenueFollowersResponse>(
      `/api/venues/${venueId}/followers${qs ? `?${qs}` : ''}`,
    );
  },
};
