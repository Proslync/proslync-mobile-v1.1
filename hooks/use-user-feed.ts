import { useInfiniteQuery } from '@tanstack/react-query';
import { postsApi, type FeedItemResponse } from '@/lib/api/posts';

export const USER_FEED_QUERY_KEY = 'user-posts';

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

  const posts: FeedItemResponse[] = (query.data?.pages ?? []).flatMap(
    (page) => page.items,
  );

  return {
    posts,
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
