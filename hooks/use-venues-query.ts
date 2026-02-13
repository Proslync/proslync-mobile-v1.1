// React Query hook for fetching user's venues

import { useQuery } from '@tanstack/react-query';
import { venuesApi } from '@/lib/api/venues';
import type { Venue } from '@/lib/types/events.types';

export function useMyVenues() {
  return useQuery<Venue[], Error>({
    queryKey: ['myVenues'],
    queryFn: () => venuesApi.getMyVenues(),
    staleTime: 1000 * 60 * 5, // 5 minutes — venues change rarely
  });
}
