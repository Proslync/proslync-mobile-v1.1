import { apiClient } from './client';

export interface SpotifyTrack {
  spotifyId: string;
  name: string;
  artistName: string;
  albumName: string;
  albumArtUrl: string;
  previewUrl?: string;
  durationMs: number;
  externalUrl: string;
}

export const spotifyApi = {
  searchTracks: async (query: string, limit = 10): Promise<SpotifyTrack[]> => {
    return apiClient.get<SpotifyTrack[]>(
      `/api/spotify/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    );
  },
};
