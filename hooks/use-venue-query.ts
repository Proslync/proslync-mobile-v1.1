import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { venuesApi } from '@/lib/api/venues';
import type { Venue } from '@/lib/types/events.types';

export function useVenue(id?: number) {
  return useQuery<Venue, Error>({
    queryKey: ['venue', id],
    queryFn: () => venuesApi.getVenue(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateVenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<Venue, 'id' | 'ownerId' | 'status'>> }) =>
      venuesApi.updateVenue(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['venue', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['myVenues'] });
    },
  });
}
