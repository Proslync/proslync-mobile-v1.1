// React Query infinite query hook for fetching attendees across all events owned by a user

import { useInfiniteQuery } from '@tanstack/react-query';
import { eventsApi } from '@/lib/api/events';
import type { EventAttendee, EventAttendeesResponse } from '@/lib/types/events.types';

const PAGE_SIZE = 20;

export const ALL_ATTENDEES_KEY = 'allAttendees';

interface UseAllAttendeesOptions {
  ownerId: number | undefined;
  search?: string;
  status?: string[];
}

export function useAllAttendees({ ownerId, search, status }: UseAllAttendeesOptions) {
  const query = useInfiniteQuery<EventAttendeesResponse, Error>({
    queryKey: [ALL_ATTENDEES_KEY, ownerId, search, status],
    queryFn: async ({ pageParam }) => {
      if (!ownerId) throw new Error('Owner ID required');
      return eventsApi.getAllAttendees(ownerId, {
        page: pageParam as number,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: status?.length ? status : undefined,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasNext && lastPage.page) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: !!ownerId,
    staleTime: 1000 * 60 * 2,
  });

  // Flatten pages into a single attendees array
  const attendees: EventAttendee[] = query.data?.pages.flatMap((page) => page.attendees) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  return {
    ...query,
    attendees,
    total,
  };
}
