import { useInfiniteQuery } from '@tanstack/react-query';
import { postsApi, type FeedItemResponse } from '@/lib/api/posts';

export const USER_FEED_QUERY_KEY = 'user-posts';

interface UserActivity {
  id: string;
  imageUrl?: string;
  videoUrl?: string;
  thumbUrl?: string;
  mediaType: 'image' | 'video';
  likes: number;
  comments: number;
}

function mapToUserActivity(item: FeedItemResponse): UserActivity | null {
  const firstMedia = item.media?.[0];

  // For events, use flyer/image as the display image
  const imageUrl =
    item.type === 'event'
      ? item.eventFlyerUrl || item.eventImageUrl || (firstMedia?.type === 'image' ? firstMedia.url : undefined)
      : firstMedia?.type === 'image'
        ? firstMedia.url
        : undefined;

  const videoUrl = firstMedia?.type === 'video' ? firstMedia.url : undefined;
  const thumbUrl = firstMedia?.thumbnailUrl;

  // Skip items without media (for the grid view)
  if (!imageUrl && !videoUrl) {
    return null;
  }

  return {
    id: String(item.id),
    imageUrl: imageUrl || undefined,
    videoUrl,
    thumbUrl,
    mediaType: videoUrl ? 'video' : 'image',
    likes: item.likeCount,
    comments: item.commentCount,
  };
}

export function useUserFeed(
  userId: string | number | null | undefined,
  enabled = true,
) {
  const userIdNum = userId ? Number(userId) : null;

  const query = useInfiniteQuery({
    queryKey: [USER_FEED_QUERY_KEY, userIdNum],
    enabled: enabled && userIdNum !== null && !isNaN(userIdNum),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      return postsApi.getUserPosts(userIdNum!, pageParam, 50);
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const activities = (query.data?.pages ?? [])
    .flatMap((page) => page.items.map(mapToUserActivity))
    .filter((item): item is UserActivity => item !== null);

  return {
    activities,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    loadMore: async () => {
      if (query.hasNextPage && !query.isFetchingNextPage) {
        await query.fetchNextPage();
      }
    },
    hasMore: !!query.hasNextPage,
  };
}
