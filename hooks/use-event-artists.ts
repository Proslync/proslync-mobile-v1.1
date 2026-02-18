import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { artistsApi } from '@/lib/api/artists';
import type {
  CreateEventArtistRequest,
  UpdateEventArtistRequest,
} from '@/lib/types/artists.types';

export const EVENT_ARTISTS_KEY = 'event-artists';

export function useEventArtists(eventId: number) {
  return useQuery({
    queryKey: [EVENT_ARTISTS_KEY, eventId],
    queryFn: () => artistsApi.getEventArtists(eventId),
    enabled: !!eventId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateEventArtist(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEventArtistRequest) =>
      artistsApi.createEventArtist(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EVENT_ARTISTS_KEY, eventId] });
    },
  });
}

export function useUpdateEventArtist(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ artistId, data }: { artistId: number; data: UpdateEventArtistRequest }) =>
      artistsApi.updateEventArtist(eventId, artistId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EVENT_ARTISTS_KEY, eventId] });
    },
  });
}

export function useDeleteEventArtist(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (artistId: number) =>
      artistsApi.deleteEventArtist(eventId, artistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EVENT_ARTISTS_KEY, eventId] });
    },
  });
}
