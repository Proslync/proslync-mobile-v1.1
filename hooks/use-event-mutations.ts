// React Query mutations for event operations

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi, CreateEventDto, UpdateEventDto } from '@/lib/api/events';
import { filesApi } from '@/lib/api/files';
import type { Event } from '@/lib/types/events.types';
import { USER_FEED_QUERY_KEY } from './use-user-feed';

// ============================================================================
// Create Event Mutation
// ============================================================================

interface CreateEventVariables {
  data: CreateEventDto;
  flyerUri?: string | null;
  shouldPublish?: boolean;
}

interface CreateEventResult {
  event: Event;
  flyerUrl?: string;
}

/**
 * Mutation hook for creating a new event
 * Handles: create event -> upload flyer to S3 -> publish
 * Stream activity is created server-side on publish for reliable distribution.
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation<CreateEventResult, Error, CreateEventVariables>({
    mutationFn: async ({ data, flyerUri, shouldPublish = true }) => {
      // Step 1: Create event
      const event = await eventsApi.createEvent(data);
      console.log('[useCreateEvent] Event created:', event.id);

      let flyerUrl: string | undefined;

      // Step 2: Upload flyer if provided
      if (flyerUri) {
        try {
          flyerUrl = await filesApi.uploadEventFlyer(event.id, flyerUri);
          console.log('[useCreateEvent] Flyer uploaded to S3:', flyerUrl);
        } catch (error) {
          console.warn('[useCreateEvent] S3 flyer upload failed:', error);
        }
      }

      // Step 3: Publish event (backend handles Stream activity creation)
      if (shouldPublish) {
        try {
          await eventsApi.publishEvent(event.id);
          console.log('[useCreateEvent] Event published');
        } catch (error) {
          console.warn('[useCreateEvent] Publish failed:', error);
        }
      }

      return { event, flyerUrl };
    },
    onSuccess: () => {
      // Invalidate events queries to refetch lists
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      // Invalidate feed queries
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      // Invalidate user feed (for profile screen)
      queryClient.invalidateQueries({ queryKey: [USER_FEED_QUERY_KEY] });
    },
  });
}

// ============================================================================
// Update Event Mutation
// ============================================================================

interface UpdateEventVariables {
  eventId: number;
  data: UpdateEventDto;
  flyerUri?: string | null;
}

/**
 * Mutation hook for updating an existing event
 * Handles: update event -> upload new flyer if provided
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation<Event, Error, UpdateEventVariables>({
    mutationFn: async ({ eventId, data, flyerUri }) => {
      // Step 1: Update event
      const event = await eventsApi.updateEvent(eventId, data);
      console.log('[useUpdateEvent] Event updated:', eventId);

      // Step 2: Upload new flyer if provided (using presigned URL flow)
      if (flyerUri) {
        try {
          await filesApi.uploadEventFlyer(eventId, flyerUri);
          console.log('[useUpdateEvent] Flyer uploaded');
        } catch (error) {
          console.warn('[useUpdateEvent] Flyer upload failed:', error);
        }
      }

      return event;
    },
    onSuccess: (_, variables) => {
      // Invalidate specific event and lists
      queryClient.invalidateQueries({ queryKey: ['event', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      // Invalidate feed queries so updated event appears with new data
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      // Invalidate user feed (for profile screen)
      queryClient.invalidateQueries({ queryKey: [USER_FEED_QUERY_KEY] });
    },
  });
}

// ============================================================================
// Upload Flyer Mutation (standalone)
// ============================================================================

interface UploadFlyerVariables {
  eventId: number;
  fileUri: string;
}

/**
 * Standalone mutation hook for uploading event flyer
 * Uses presigned URL flow for direct S3 upload
 */
export function useUploadFlyer() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, UploadFlyerVariables>({
    mutationFn: async ({ eventId, fileUri }) => {
      const url = await filesApi.uploadEventFlyer(eventId, fileUri);
      console.log('[useUploadFlyer] Flyer uploaded:', url);
      return url;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event', variables.eventId] });
    },
  });
}

// ============================================================================
// Publish Event Mutation
// ============================================================================

/**
 * Mutation hook for publishing an event (draft -> published)
 */
export function usePublishEvent() {
  const queryClient = useQueryClient();

  return useMutation<Event, Error, number>({
    mutationFn: async (eventId) => {
      const event = await eventsApi.publishEvent(eventId);
      console.log('[usePublishEvent] Event published:', eventId);
      return event;
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      // Invalidate feed queries so published event appears in feed
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      // Invalidate user feed (for profile screen)
      queryClient.invalidateQueries({ queryKey: [USER_FEED_QUERY_KEY] });
    },
  });
}

// ============================================================================
// Delete Event Mutation
// ============================================================================

/**
 * Mutation hook for deleting an event
 */
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (eventId) => {
      await eventsApi.deleteEvent(eventId);
      console.log('[useDeleteEvent] Event deleted:', eventId);
    },
    onSuccess: (_, eventId) => {
      queryClient.removeQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      // Invalidate feed queries so deleted event is removed from feed
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      // Invalidate user feed (for profile screen)
      queryClient.invalidateQueries({ queryKey: [USER_FEED_QUERY_KEY] });
    },
  });
}

// ============================================================================
// RSVP Mutation
// ============================================================================

/**
 * Mutation hook for registering/RSVPing to an event
 */
export function useRegisterForEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: number) => {
      const response = await eventsApi.registerForEvent(eventId);
      console.log('[useRegisterForEvent] RSVP response:', response);
      return response;
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });
}
