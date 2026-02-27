import { useQuery } from '@tanstack/react-query';
import { postsApi, type FeedItemResponse } from '@/lib/api/posts';

export const POST_QUERY_KEY = 'post';

export type { FeedItemResponse as PostResponse };

export function usePost(
  postId: string | number | null | undefined,
  enabled = true,
) {
  const id = postId ? Number(postId) : null;

  const query = useQuery<FeedItemResponse>({
    queryKey: [POST_QUERY_KEY, id],
    enabled: enabled && id !== null && !isNaN(id),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: () => postsApi.getPost(id!),
  });

  return {
    post: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
