// Stream activity hooks - upload media and create activities

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStream } from '@/lib/providers/stream-provider';
import { useAuth } from '@/lib/providers/auth-provider';

// ============================================================================
// Types
// ============================================================================

export interface ActivityMedia {
  url: string;
  type: 'image' | 'video';
  mimeType: string;
  thumbUrl?: string; // Video thumbnail URL from Stream CDN
  duration?: string; // Video duration in milliseconds
}

interface UploadActivityMediaParams {
  fileUri: string;
  mimeType: string;
  fileName?: string;
}

interface CreateActivityParams {
  text?: string;
  type?: string;
  media?: ActivityMedia[];
  eventId?: number;
  userName?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Get file info from a local URI for React Native
 */
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

  const type = mimeTypes[extension] || 'application/octet-stream';
  return { name: filename, type };
}

// ============================================================================
// Upload Activity Media Hook
// ============================================================================

/**
 * Hook to upload media to Stream CDN
 * Returns CDN URL with optional video thumbnail and duration
 */
export function useUploadActivityMedia() {
  const { client, status } = useStream();

  return useMutation<ActivityMedia, Error, UploadActivityMediaParams>({
    mutationFn: async ({ fileUri, mimeType, fileName }) => {
      if (!client || status !== 'connected') {
        throw new Error('Stream client is not connected');
      }

      console.log('[useUploadActivityMedia] Uploading to Stream CDN...');
      console.log('[useUploadActivityMedia] File URI:', fileUri.substring(0, 50) + '...');
      console.log('[useUploadActivityMedia] MIME type:', mimeType);

      // Fetch the file as blob for upload
      const response = await fetch(fileUri);
      const blob = await response.blob();

      // Create a File-like object for Stream SDK
      const file = {
        uri: fileUri,
        name: fileName || getFileInfoFromUri(fileUri).name,
        type: mimeType,
        size: blob.size,
      };

      let uploadResponse;

      if (isImageMimeType(mimeType)) {
        // Upload image using Stream CDN
        console.log('[useUploadActivityMedia] Uploading as image...');
        uploadResponse = await client.uploadImage({ file: file as any });
      } else {
        // Upload video/file using Stream CDN
        console.log('[useUploadActivityMedia] Uploading as video/file...');
        uploadResponse = await client.uploadFile({ file: file as any });
      }

      if (!uploadResponse?.file) {
        throw new Error('Failed to upload file - no URL returned');
      }

      console.log('[useUploadActivityMedia] Upload successful:', uploadResponse.file);

      return {
        url: uploadResponse.file,
        type: isImageMimeType(mimeType) ? 'image' : 'video',
        mimeType,
        // For videos, Stream CDN provides thumb_url and duration
        thumbUrl: uploadResponse.thumb_url,
        duration: uploadResponse.duration,
      };
    },
    onError: (error) => {
      console.error('[useUploadActivityMedia] Error:', error);
    },
  });
}

// ============================================================================
// Create Stream Activity Hook
// ============================================================================

/**
 * Hook to create a Stream activity with optional media attachments
 */
export function useCreateStreamActivity() {
  const { client, status, userId } = useStream();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, CreateActivityParams>({
    mutationFn: async (params) => {
      if (!client || !userId || status !== 'connected') {
        throw new Error('Stream client is not connected');
      }

      console.log('[useCreateStreamActivity] Creating activity for user:', userId);

      const userFeed = client.feed('user', userId);

      // Build custom fields
      const customFields: Record<string, unknown> = {};

      if (params.eventId) {
        customFields.eventId = params.eventId;
      }

      if (params.userName) {
        customFields.userName = params.userName;
      } else if (user?.userName) {
        customFields.userName = user.userName;
      }

      // Build attachments for media using Stream's attachment format
      const attachments =
        params.media && params.media.length > 0
          ? params.media.map((media) => {
              if (media.type === 'image') {
                return {
                  type: 'image' as const,
                  image_url: media.url,
                  custom: {},
                };
              } else {
                // For videos, include thumb_url and duration in custom fields
                const attachmentCustomFields: Record<string, unknown> = {};
                if (media.thumbUrl) {
                  attachmentCustomFields.thumb_url = media.thumbUrl;
                }
                if (media.duration) {
                  attachmentCustomFields.duration = media.duration;
                }
                return {
                  type: 'file' as const,
                  asset_url: media.url,
                  custom:
                    Object.keys(attachmentCustomFields).length > 0
                      ? attachmentCustomFields
                      : {},
                };
              }
            })
          : undefined;

      await userFeed.addActivity({
        type: params.type || 'post',
        text: params.text || '',
        custom: Object.keys(customFields).length > 0 ? customFields : undefined,
        attachments,
      });

      console.log('[useCreateStreamActivity] Activity created successfully');
    },
    onSuccess: () => {
      // Invalidate feed queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
    },
    onError: (error) => {
      console.error('[useCreateStreamActivity] Error:', error);
    },
  });
}

// ============================================================================
// Combined Hook for Event Activity
// ============================================================================

interface CreateEventActivityParams {
  eventId: number;
  eventName: string;
  flyerUri?: string | null;
  description?: string;
}

/**
 * Hook to create a Stream activity for an event
 * Uploads flyer to Stream CDN and creates activity with event info
 */
export function useCreateEventActivity() {
  const uploadMedia = useUploadActivityMedia();
  const createActivity = useCreateStreamActivity();
  const { user } = useAuth();

  return useMutation<void, Error, CreateEventActivityParams>({
    mutationFn: async ({ eventId, eventName, flyerUri, description }) => {
      let media: ActivityMedia[] = [];

      // Upload flyer to Stream CDN if provided
      if (flyerUri) {
        console.log('[useCreateEventActivity] Uploading flyer to Stream CDN...');
        const { name, type } = getFileInfoFromUri(flyerUri);
        const uploadedMedia = await uploadMedia.mutateAsync({
          fileUri: flyerUri,
          mimeType: type,
          fileName: name,
        });
        media = [uploadedMedia];
      }

      // Create activity with event info
      console.log('[useCreateEventActivity] Creating activity for event:', eventId);
      await createActivity.mutateAsync({
        type: 'event',
        text: description || eventName,
        media,
        eventId,
        userName: user?.userName,
      });
    },
    onError: (error) => {
      console.error('[useCreateEventActivity] Error:', error);
    },
  });
}
