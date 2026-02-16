// React Query infinite query hook for fetching event attendees with pagination

import { useInfiniteQuery } from '@tanstack/react-query';
import { eventsApi } from '@/lib/api/events';
import type { EventAttendee, EventAttendeesResponse } from '@/lib/types/events.types';

const PAGE_SIZE = 20;

interface UseEventAttendeesOptions {
  eventId: number | undefined;
  search?: string;
  status?: string[];
}

export function useEventAttendees({ eventId, search, status }: UseEventAttendeesOptions) {
  const query = useInfiniteQuery<EventAttendeesResponse, Error>({
    queryKey: ['eventAttendees', eventId, search, status],
    queryFn: async ({ pageParam }) => {
      if (!eventId) throw new Error('Event ID required');
      return eventsApi.getEventAttendees(eventId, {
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
    enabled: !!eventId,
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
