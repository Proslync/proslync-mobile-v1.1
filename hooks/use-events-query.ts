// React Query hooks for fetching events

import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '@/lib/api/events';
import type { Event } from '@/lib/types/events.types';

export function useMyEvents(organizationId?: number) {
  return useQuery<Event[], Error>({
    queryKey: ['myEvents', organizationId],
    queryFn: async () => {
      const events = await eventsApi.getMyEvents(organizationId);
      events.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      return events;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useEvent(eventId: number | undefined) {
  return useQuery<Event, Error>({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!eventId) throw new Error('Event ID required');
      return eventsApi.getEvent(eventId);
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useEvents(params?: Parameters<typeof eventsApi.getEvents>[0]) {
  return useQuery<Event[], Error>({
    queryKey: ['events', params],
    queryFn: async () => {
      return eventsApi.getEvents(params);
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
