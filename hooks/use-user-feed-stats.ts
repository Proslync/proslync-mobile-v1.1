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

interface UserFeedStats {
  followerCount: number;
  followingCount: number;
  isFollowedByMe: boolean;
  activities: UserActivity[];
}

/**
 * Hook to fetch user's follower/following counts, follow status, and activities from GetStream
 * Combines stats and activities in one call to avoid concurrent getOrCreate errors
 */
export function useUserFeedStats(userId: string | number | null | undefined) {
  const { client, isReady, userId: currentUserId } = useStream();
  const [stats, setStats] = React.useState<UserFeedStats>({
    followerCount: 0,
    followingCount: 0,
    isFollowedByMe: false,
    activities: [],
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasFetched, setHasFetched] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchStats = React.useCallback(async () => {
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

        // GetStream returns follower_count and following_count on the feed object
        // own_follows contains follow relationships from the current user
        const feedData = response as any;

        // Based on Stream API response structure:
        // - feed.follower_count, feed.following_count are inside the feed object
        // - own_follows is INSIDE feed object (shows if current user follows this feed)
        const feed = feedData.feed || {};
        const followerCount = feed.follower_count ?? 0;
        const followingCount = feed.following_count ?? 0;
        const ownFollows = feed.own_follows || [];

        // Check if current user follows this user by looking at own_follows
        // own_follows contains follow relationships where current user is the source
        const isFollowedByMe = ownFollows.some((follow: any) => {
          const sourceFeed = follow.source_feed?.feed || '';
          // Current user's timeline should be following target user's feed
          return sourceFeed === `timeline:${currentUserId}`;
        });

        // Parse activities
        const rawActivities = feedData.activities || [];
        const activities: UserActivity[] = [];

        for (const activity of rawActivities) {
          const act = activity as any;
          let imageUrl = act.imageUrl || act.image;
          let videoUrl = act.videoUrl || act.video;
          let mediaType: 'image' | 'video' = 'image';

          if (act.attachments?.length > 0) {
            const attachment = act.attachments[0];
            if (attachment.type === 'video') {
              videoUrl = attachment.url || attachment.asset_url;
              mediaType = 'video';
            } else {
              imageUrl = attachment.url || attachment.image_url || attachment.asset_url;
            }
          }

          if (!imageUrl && act.event?.flyer?.url) {
            imageUrl = act.event.flyer.url;
          }

          if (!imageUrl && !videoUrl) {
            continue;
          }

          if (videoUrl) {
            mediaType = 'video';
          }

          activities.push({
            id: act.id,
            imageUrl,
            videoUrl,
            mediaType,
            likes: act.reaction_counts?.like || 0,
            comments: act.reaction_counts?.comment || 0,
          });
        }

        setStats({
          followerCount,
          followingCount,
          isFollowedByMe,
          activities,
        });
        setHasFetched(true);

        console.log('[UserFeedStats] Stats for user', userIdStr, ':', {
          followerCount,
          followingCount,
          isFollowedByMe,
          ownFollowsLength: ownFollows.length,
          activitiesCount: activities.length,
          currentUserId,
        });
      } catch (err) {
        console.error('[UserFeedStats] Error fetching stats:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch stats'));
      } finally {
        setIsLoading(false);
      }
  }, [client, isReady, userId, currentUserId]);

  // Fetch on mount and when dependencies change
  React.useEffect(() => {
    setHasFetched(false);
    fetchStats();
  }, [fetchStats]);

  // Refetch function for manual refresh
  const refetch = React.useCallback(async () => {
    console.log('[UserFeedStats] Manual refetch triggered');
    await fetchStats();
  }, [fetchStats]);

  return {
    ...stats,
    isLoading,
    hasFetched,
    error,
    refetch,
  };
}
