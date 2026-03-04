import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '@/lib/api/posts';
import { POST_QUERY_KEY } from './use-post';
import { FEED_QUERY_KEY } from './use-feed';
import { USER_FEED_QUERY_KEY } from './use-user-feed';

export function useDeletePost() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (postId: number) => postsApi.deletePost(postId),
    onSuccess: (_, postId) => {
      queryClient.removeQueries({ queryKey: [POST_QUERY_KEY, postId] });
      queryClient.invalidateQueries({ queryKey: [FEED_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [USER_FEED_QUERY_KEY] });
    },
  });

  return {
    deletePost: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}
