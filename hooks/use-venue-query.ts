import { useQuery } from '@tanstack/react-query';
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
