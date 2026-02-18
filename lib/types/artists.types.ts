export interface EventArtist {
  id: number;
  eventId: number;
  userId?: number;
  userName?: string;
  description?: string;
  startTime: string;
  endTime: string;
  playlistUrl?: string;
  avatarUrl?: string;
  userFullName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventArtistRequest {
  phoneNumber: string;
  userName?: string;
  description?: string;
  startTime: string;
  endTime: string;
  playlistUrl?: string;
}

export type UpdateEventArtistRequest = Partial<
  Pick<EventArtist, 'userName' | 'description' | 'startTime' | 'endTime' | 'playlistUrl'>
>;

export interface GetEventArtistsResponse {
  artists: EventArtist[];
  total: number;
}
