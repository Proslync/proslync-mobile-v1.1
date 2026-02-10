// React Query mutations for event operations

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi, CreateEventDto, UpdateEventDto } from '@/lib/api/events';
import { filesApi } from '@/lib/api/files';
import { useStream } from '@/lib/providers/stream-provider';
import { useAuth } from '@/lib/providers/auth-provider';
import type { Event } from '@/lib/types/events.types';
import type { ActivityMedia } from './use-stream-activity';

// Helper to get file info from URI
function getFileInfoFromUri(uri: string): { name: string; type: string } {
  const filename = uri.split('/').pop() || 'file';
  const match = /\.(\w+)$/.exec(filename);
  const extension = match ? match[1].toLowerCase() : '';

  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
  };

  return { name: filename, type: mimeTypes[extension] || 'image/jpeg' };
}

function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

// ============================================================================
// Create Event Mutation
// ============================================================================

interface CreateEventVariables {
  data: CreateEventDto;
  flyerUri?: string | null;
  shouldPublish?: boolean;
  createStreamActivity?: boolean;
}

interface CreateEventResult {
  event: Event;
  flyerUrl?: string;
  streamActivityCreated?: boolean;
}

/**
 * Mutation hook for creating a new event
 * Handles: create event -> upload flyer to S3 -> upload to Stream CDN -> publish -> create Stream activity
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { client: streamClient, status: streamStatus, userId: streamUserId } = useStream();
  const { user } = useAuth();

  return useMutation<CreateEventResult, Error, CreateEventVariables>({
    mutationFn: async ({ data, flyerUri, shouldPublish = true, createStreamActivity = true }) => {
      // Step 1: Create event
      const event = await eventsApi.createEvent(data);
      console.log('[useCreateEvent] Event created:', event.id);

      let flyerUrl: string | undefined;
      let streamMedia: ActivityMedia | undefined;

      // Step 2: Upload flyer if provided
      if (flyerUri) {
        const { name, type } = getFileInfoFromUri(flyerUri);

        // 2a: Upload to S3 via presigned URL (for event flyer storage)
        try {
          flyerUrl = await filesApi.uploadEventFlyer(event.id, flyerUri);
          console.log('[useCreateEvent] Flyer uploaded to S3:', flyerUrl);
        } catch (error) {
          console.warn('[useCreateEvent] S3 flyer upload failed:', error);
        }

        // 2b: Upload to Stream CDN (for feed activity)
        if (streamClient && streamStatus === 'connected' && createStreamActivity) {
          try {
            console.log('[useCreateEvent] Uploading to Stream CDN...');

            // Fetch the file as blob
            const response = await fetch(flyerUri);
            const blob = await response.blob();

            const file = {
              uri: flyerUri,
              name,
              type,
              size: blob.size,
            };

            let uploadResponse;
            if (isImageMimeType(type)) {
              uploadResponse = await streamClient.uploadImage({ file: file as any });
            } else {
              uploadResponse = await streamClient.uploadFile({ file: file as any });
            }

            if (uploadResponse?.file) {
              streamMedia = {
                url: uploadResponse.file,
                type: isImageMimeType(type) ? 'image' : 'video',
                mimeType: type,
                thumbUrl: uploadResponse.thumb_url,
                duration: uploadResponse.duration,
              };
              console.log('[useCreateEvent] Stream CDN upload successful:', streamMedia.url);
            }
          } catch (error) {
            console.warn('[useCreateEvent] Stream CDN upload failed:', error);
          }
        }
      }

      // Step 3: Publish event if requested
      if (shouldPublish) {
        try {
          await eventsApi.publishEvent(event.id);
          console.log('[useCreateEvent] Event published');
        } catch (error) {
          console.warn('[useCreateEvent] Publish failed:', error);
        }
      }

      // Step 4: Create Stream activity if enabled
      let streamActivityCreated = false;
      if (createStreamActivity && streamClient && streamStatus === 'connected' && streamUserId) {
        try {
          console.log('[useCreateEvent] Creating Stream activity...');
          const userFeed = streamClient.feed('user', streamUserId);

          // Build custom fields
          const customFields: Record<string, unknown> = {
            eventId: event.id,
          };

          if (user?.userName) {
            customFields.userName = user.userName;
          }

          // Build attachments
          const attachments = streamMedia
            ? [
                streamMedia.type === 'image'
                  ? {
                      type: 'image' as const,
                      image_url: streamMedia.url,
                      custom: {},
                    }
                  : {
                      type: 'file' as const,
                      asset_url: streamMedia.url,
                      custom: {
                        ...(streamMedia.thumbUrl && { thumb_url: streamMedia.thumbUrl }),
                        ...(streamMedia.duration && { duration: streamMedia.duration }),
                      },
                    },
              ]
            : undefined;

          await userFeed.addActivity({
            type: 'event',
            text: data.description || data.name,
            custom: customFields,
            attachments,
          });

          streamActivityCreated = true;
          console.log('[useCreateEvent] Stream activity created');
        } catch (error) {
          console.warn('[useCreateEvent] Stream activity creation failed:', error);
        }
      }

      return { event, flyerUrl, streamActivityCreated };
    },
    onSuccess: () => {
      // Invalidate events queries to refetch lists
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      // Invalidate feed queries
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
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
