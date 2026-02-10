// React Query hook for fetching user feed activities
// Based on web app pattern: hooks/stream/use-user-feed.ts

import { useQuery } from '@tanstack/react-query';
import { useStream } from '@/lib/providers/stream-provider';

export const USER_FEED_QUERY_KEY = 'stream-user-feed';

interface UserActivity {
  id: string;
  imageUrl?: string;
  videoUrl?: string;
  thumbUrl?: string; // Video thumbnail URL from Stream CDN
  mediaType: 'image' | 'video';
  likes: number;
  comments: number;
}

/**
 * React Query hook for fetching user's feed activities from GetStream
 * Uses queryKey: ['stream-user-feed', userId] - can be invalidated on mutations
 */
export function useUserFeed(
  userId: string | number | null | undefined,
  enabled = true
) {
  const { client, isReady } = useStream();
  const userIdStr = userId ? String(userId) : null;

  const query = useQuery<UserActivity[]>({
    queryKey: [USER_FEED_QUERY_KEY, userIdStr],
    enabled: enabled && Boolean(client) && isReady && Boolean(userIdStr),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      if (!client || !userIdStr) {
        throw new Error('Cannot fetch user feed without a connected client and userId.');
      }

      const feed = client.feed('user', userIdStr);
      const response = await feed.getOrCreate({ limit: 50 });

      // Map activities to a simpler format for the grid
      const rawActivities = response.activities || [];
      const mappedActivities: UserActivity[] = [];

      for (const activity of rawActivities) {
        const act = activity as any;
        // Try to extract media from various sources
        let imageUrl = act.imageUrl || act.image;
        let videoUrl = act.videoUrl || act.video;
        let thumbUrl: string | undefined;
        let mediaType: 'image' | 'video' = 'image';

        // Check attachments
        if (act.attachments?.length > 0) {
          const attachment = act.attachments[0];
          if (attachment.type === 'video' || attachment.type === 'file') {
            videoUrl = attachment.url || attachment.asset_url;
            // Extract thumbnail from custom fields (Stream CDN provides thumb_url)
            thumbUrl = attachment.custom?.thumb_url || attachment.thumb_url;
            mediaType = 'video';
          } else {
            imageUrl = attachment.url || attachment.image_url || attachment.asset_url;
          }
        }

        // Check for event flyer
        if (!imageUrl && act.event?.flyer?.url) {
          imageUrl = act.event.flyer.url;
        }

        // Skip activities without media
        if (!imageUrl && !videoUrl) {
          continue;
        }

        if (videoUrl) {
          mediaType = 'video';
        }

        mappedActivities.push({
          id: act.id,
          imageUrl,
          videoUrl,
          thumbUrl,
          mediaType,
          likes: act.reaction_counts?.like || 0,
          comments: act.reaction_counts?.comment || 0,
        });
      }

      return mappedActivities;
    },
  });

  return {
    activities: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
