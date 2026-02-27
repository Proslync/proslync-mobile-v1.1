import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '@/lib/api/posts';
import { FEED_QUERY_KEY } from './use-feed';
import { POST_QUERY_KEY } from './use-post';
import { USER_FEED_QUERY_KEY } from './use-user-feed';

interface LikeParams {
  postId: number;
}

interface UnlikeParams {
  postId: number;
}

export function usePostReaction() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [FEED_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [POST_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [USER_FEED_QUERY_KEY] });
  };

  const likeMutation = useMutation({
    mutationFn: (params: LikeParams) => postsApi.likePost(params.postId),
    onSuccess: invalidate,
  });

  const unlikeMutation = useMutation({
    mutationFn: (params: UnlikeParams) => postsApi.unlikePost(params.postId),
    onSuccess: invalidate,
  });

  return {
    like: likeMutation.mutateAsync,
    unlike: unlikeMutation.mutateAsync,
    isLiking: likeMutation.isPending,
    isUnliking: unlikeMutation.isPending,
  };
}
