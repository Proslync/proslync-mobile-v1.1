import * as React from 'react';
import { useStream } from '@/lib/providers/stream-provider';

interface UserActivity {
  id: string;
  imageUrl?: string;
  videoUrl?: string;
  mediaType: 'image' | 'video';
  likes: number;
  comments: number;
}

/**
 * Hook to fetch user's activities (posts) from GetStream
 */
export function useUserActivities(userId: string | number | null | undefined) {
  const { client, isReady } = useStream();
  const [activities, setActivities] = React.useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchActivities = React.useCallback(async () => {
    if (!isReady || !client || !userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const userIdStr = String(userId);
      const userFeed = client.feed('user', userIdStr);
      const response = await userFeed.getOrCreate({ limit: 50 });

      // Map activities to a simpler format for the grid
      const rawActivities = response.activities || [];
      const mappedActivities: UserActivity[] = [];

      for (const activity of rawActivities) {
        const act = activity as any;
        // Try to extract media from various sources
        let imageUrl = act.imageUrl || act.image;
        let videoUrl = act.videoUrl || act.video;
        let mediaType: 'image' | 'video' = 'image';

        // Check attachments
        if (act.attachments?.length > 0) {
          const attachment = act.attachments[0];
          if (attachment.type === 'video') {
            videoUrl = attachment.url || attachment.asset_url;
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
          mediaType,
          likes: act.reaction_counts?.like || 0,
          comments: act.reaction_counts?.comment || 0,
        });
      }

      setActivities(mappedActivities);
      console.log('[UserActivities] Fetched', mappedActivities.length, 'activities');
    } catch (err) {
      console.error('[UserActivities] Error fetching activities:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch activities'));
    } finally {
      setIsLoading(false);
    }
  }, [client, isReady, userId]);

  // Fetch on mount and when dependencies change
  React.useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Refetch function for manual refresh
  const refetch = React.useCallback(async () => {
    console.log('[UserActivities] Manual refetch triggered');
    await fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    isLoading,
    error,
    refetch,
  };
}
