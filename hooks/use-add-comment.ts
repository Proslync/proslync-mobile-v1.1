// React Query mutation hook for adding comments

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStream } from '@/lib/providers/stream-provider';
import { useAuth } from '@/lib/providers/auth-provider';
import { COMMENTS_QUERY_KEY } from './use-activity-comments';
import { ACTIVITY_QUERY_KEY } from './use-activity';

interface AddCommentParams {
  activityId: string;
  comment: string;
  parentId?: string; // For replies
}

export function useAddComment() {
  const { client, status } = useStream();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const userId = user ? String(user.id) : null;

  const mutation = useMutation({
    mutationFn: async (params: AddCommentParams) => {
      if (!client || !userId || status !== 'connected') {
        throw new Error('Stream client is not connected');
      }

      await (client as any).addComment({
        comment: params.comment,
        object_id: params.activityId,
        object_type: 'activity',
        parent_id: params.parentId,
        skip_push: false,
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate comments query to refetch comments
      queryClient.invalidateQueries({
        queryKey: [COMMENTS_QUERY_KEY, variables.activityId],
      });
      // Also invalidate activity query to update comment count
      queryClient.invalidateQueries({
        queryKey: [ACTIVITY_QUERY_KEY, variables.activityId],
      });
    },
    onError: (error) => {
      console.error('[useAddComment] Error:', error);
    },
  });

  return {
    addComment: mutation.mutateAsync,
    isAdding: mutation.isPending,
    error: mutation.error,
  };
}
