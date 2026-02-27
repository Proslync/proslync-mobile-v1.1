import { useInfiniteQuery } from '@tanstack/react-query';
import { postsApi, type CommentResponse } from '@/lib/api/posts';

export const POST_COMMENTS_KEY = 'post-comments';

export interface CommentData {
  id: string;
  text: string;
  user: {
    id: string;
    name?: string;
    image?: string;
    custom?: {
      firstName?: string;
      lastName?: string;
      userName?: string;
    };
  };
  created_at: string;
}

function mapComment(c: CommentResponse): CommentData {
  const displayName = [c.user?.firstName, c.user?.lastName]
    .filter(Boolean)
    .join(' ');

  return {
    id: String(c.id),
    text: c.text || '',
    user: {
      id: String(c.userId),
      name: displayName || c.user?.userName,
      image: c.user?.avatar?.url || undefined,
      custom: {
        firstName: c.user?.firstName,
        lastName: c.user?.lastName,
        userName: c.user?.userName,
      },
    },
    created_at: c.createdAt,
  };
}

interface UsePostCommentsParams {
  postId: string | number | null | undefined;
  enabled?: boolean;
  limit?: number;
}

export function usePostComments({
  postId,
  enabled = true,
  limit = 20,
}: UsePostCommentsParams) {
  const id = postId ? Number(postId) : null;

  const query = useInfiniteQuery({
    queryKey: [POST_COMMENTS_KEY, id],
    enabled: enabled && id !== null && !isNaN(id),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      return postsApi.getComments(id!, pageParam, limit);
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const comments = (query.data?.pages ?? []).flatMap((page) =>
    page.comments.map(mapComment),
  );

  return {
    comments,
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
