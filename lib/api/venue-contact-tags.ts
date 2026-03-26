import { apiClient } from './client';

export interface VenueContactTagRecord {
  id: number;
  venueId: number;
  userId: number;
  tags: string[];
  user?: {
    id: number;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
}

export const venueContactTagsApi = {
  getAllForVenue: (venueId: number) =>
    apiClient.get<VenueContactTagRecord[]>(
      `/api/venues/${venueId}/contact-tags`,
    ),

  getTagsForUser: (venueId: number, userId: number) =>
    apiClient.get<{ userId: number; tags: string[] }>(
      `/api/venues/${venueId}/contact-tags/${userId}`,
    ),

  updateTags: (venueId: number, userId: number, tags: string[]) =>
    apiClient.put<VenueContactTagRecord>(
      `/api/venues/${venueId}/contact-tags/${userId}`,
      { tags },
    ),
};
