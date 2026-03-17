// React Query mutations for event operations

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi, CreateEventDto, UpdateEventDto } from '@/lib/api/events';
import { filesApi } from '@/lib/api/files';
import type { Event } from '@/lib/types/events.types';
import { USER_FEED_QUERY_KEY } from './use-user-feed';
import { FEED_QUERY_KEY } from './use-feed';


interface CreateEventVariables {
  data: CreateEventDto;
  flyerUri?: string | null;
  shouldPublish?: boolean;
}

interface CreateEventResult {
  event: Event;
  flyerUrl?: string;
}

/** Handles: create event -> upload flyer -> publish. */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation<CreateEventResult, Error, CreateEventVariables>({
    mutationFn: async ({ data, flyerUri, shouldPublish = true }) => {
      // Step 1: Create event
      const event = await eventsApi.createEvent(data);
      let flyerUrl: string | undefined;

      // Step 2: Upload flyer if provided
      if (flyerUri) {
        flyerUrl = await filesApi.uploadEventFlyer(event.id, flyerUri);
      }

      // Step 3: Publish event (requires flyer/media)
      if (shouldPublish) {
        if (!flyerUri) {
          throw new Error('Event must have a flyer or image before publishing');
        }
        await eventsApi.publishEvent(event.id);
      }

      return { event, flyerUrl };
    },
    onSuccess: () => {
      // Invalidate events queries to refetch lists
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      // Invalidate user feed (for profile screen)
      queryClient.invalidateQueries({ queryKey: [USER_FEED_QUERY_KEY] });
      // Refresh feed caches so published event appears
      queryClient.invalidateQueries({ queryKey: [FEED_QUERY_KEY] });
    },
  });
}


interface UpdateEventVariables {
  eventId: number;
  data: UpdateEventDto;
  flyerUri?: string | null;
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation<Event, Error, UpdateEventVariables>({
    mutationFn: async ({ eventId, data, flyerUri }) => {
      // Step 1: Update event
      const event = await eventsApi.updateEvent(eventId, data);
      // Step 2: Upload new flyer if provided (using presigned URL flow)
      if (flyerUri) {
        await filesApi.uploadEventFlyer(eventId, flyerUri);
      }

      return event;
    },
    onSuccess: (_, variables) => {
      // Invalidate specific event and lists
      queryClient.invalidateQueries({ queryKey: ['event', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      // Invalidate user feed (for profile screen)
      queryClient.invalidateQueries({ queryKey: [USER_FEED_QUERY_KEY] });
      // Refresh feed caches so updated event data appears
      queryClient.invalidateQueries({ queryKey: [FEED_QUERY_KEY] });
    },
  });
}


interface UploadFlyerVariables {
  eventId: number;
  fileUri: string;
}

export function useUploadFlyer() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, UploadFlyerVariables>({
    mutationFn: async ({ eventId, fileUri }) => {
      const url = await filesApi.uploadEventFlyer(eventId, fileUri);      return url;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event', variables.eventId] });
    },
  });
}


export function usePublishEvent() {
  const queryClient = useQueryClient();

  return useMutation<Event, Error, number>({
    mutationFn: async (eventId) => {
      const event = await eventsApi.publishEvent(eventId);      return event;
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      // Invalidate user feed (for profile screen)
      queryClient.invalidateQueries({ queryKey: [USER_FEED_QUERY_KEY] });
      // Refresh feed caches so published event appears
      queryClient.invalidateQueries({ queryKey: [FEED_QUERY_KEY] });
    },
  });
}


export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (eventId) => {
      await eventsApi.deleteEvent(eventId);    },
    onSuccess: (_, eventId) => {
      queryClient.removeQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      // Invalidate user feed (for profile screen)
      queryClient.invalidateQueries({ queryKey: [USER_FEED_QUERY_KEY] });
      // Refresh feed caches so deleted event is removed
      queryClient.invalidateQueries({ queryKey: [FEED_QUERY_KEY] });
    },
  });
}


export function useRegisterForEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: number) => {
      const response = await eventsApi.registerForEvent(eventId);      return response;
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['eventAttendees', eventId] });
      queryClient.invalidateQueries({ queryKey: ['allAttendees'] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
    },
  });
}
