import { useInfiniteQuery } from '@tanstack/react-query';
import { venuesApi } from '@/lib/api/venues';
import type { VenueFollower, VenueFollowersResponse } from '@/lib/types/venues.types';

const PAGE_SIZE = 20;

export const VENUE_FOLLOWERS_KEY = 'venueFollowers';

interface UseVenueFollowersOptions {
  venueId: number | undefined;
  search?: string;
}

export function useVenueFollowers({ venueId, search }: UseVenueFollowersOptions) {
  const query = useInfiniteQuery<VenueFollowersResponse, Error>({
    queryKey: [VENUE_FOLLOWERS_KEY, venueId, search],
    queryFn: async ({ pageParam }) => {
      if (!venueId) throw new Error('Venue ID required');
      return venuesApi.getVenueFollowers(venueId, {
        page: pageParam as number,
        limit: PAGE_SIZE,
        search: search || undefined,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasNext && lastPage.page) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: !!venueId,
    staleTime: 1000 * 60 * 2,
  });

  const followers: VenueFollower[] = query.data?.pages.flatMap((page) => page.followers) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  return {
    ...query,
    followers,
    total,
  };
}
