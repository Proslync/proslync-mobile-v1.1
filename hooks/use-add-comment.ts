import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '@/lib/api/posts';
import { POST_COMMENTS_KEY } from './use-post-comments';
import { POST_QUERY_KEY } from './use-post';
import { FEED_QUERY_KEY } from './use-feed';

interface AddCommentParams {
  postId: number;
  comment: string;
  parentId?: number;
}

export function useAddComment() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: AddCommentParams) => {
      await postsApi.addComment(params.postId, params.comment, params.parentId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [POST_COMMENTS_KEY, variables.postId],
      });
      queryClient.invalidateQueries({
        queryKey: [POST_QUERY_KEY, variables.postId],
      });
      queryClient.invalidateQueries({
        queryKey: [FEED_QUERY_KEY],
      });
    },
  });

  return {
    addComment: mutation.mutateAsync,
    isAdding: mutation.isPending,
    error: mutation.error,
  };
}
