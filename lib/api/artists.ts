import { apiClient } from './client';
import type {
  CreateEventArtistRequest,
  EventArtist,
  GetEventArtistsResponse,
  UpdateEventArtistRequest,
} from '../types/artists.types';

export const artistsApi = {
  getEventArtists: async (eventId: number): Promise<GetEventArtistsResponse> => {
    return apiClient.get<GetEventArtistsResponse>(
      `/api/event-artists/events/${eventId}`,
    );
  },

  createEventArtist: async (
    eventId: number,
    data: CreateEventArtistRequest,
  ): Promise<EventArtist> => {
    return apiClient.post<EventArtist>(
      `/api/event-artists/events/${eventId}`,
      data,
    );
  },

  updateEventArtist: async (
    eventId: number,
    artistId: number,
    data: UpdateEventArtistRequest,
  ): Promise<EventArtist> => {
    return apiClient.put<EventArtist>(
      `/api/event-artists/events/${eventId}/artists/${artistId}`,
      data,
    );
  },

  deleteEventArtist: async (eventId: number, artistId: number): Promise<void> => {
    return apiClient.delete(
      `/api/event-artists/events/${eventId}/artists/${artistId}`,
    );
  },
};
