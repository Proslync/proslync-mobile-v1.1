// React Query mutation hook for comment reactions (likes)

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStream } from '@/lib/providers/stream-provider';
import { useAuth } from '@/lib/providers/auth-provider';
import { COMMENTS_QUERY_KEY } from './use-activity-comments';

interface AddCommentReactionParams {
  commentId: string;
  activityId: string; // Needed to invalidate comments query
  type?: string;
  enforceUnique?: boolean;
}

interface DeleteCommentReactionParams {
  commentId: string;
  activityId: string; // Needed to invalidate comments query
  type: string;
}

export function useCommentReaction() {
  const { client, status } = useStream();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const userId = user ? String(user.id) : null;

  const addMutation = useMutation({
    mutationFn: async (params: AddCommentReactionParams) => {
      if (!client || !userId || status !== 'connected') {
        throw new Error('Stream client is not connected');
      }

      await (client as any).addCommentReaction({
        id: params.commentId,
        type: params.type || 'like',
        enforce_unique: params.enforceUnique ?? true,
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate comments query to refetch with updated reactions
      queryClient.invalidateQueries({
        queryKey: [COMMENTS_QUERY_KEY, variables.activityId],
      });
    },
    onError: (error) => {
      console.error('[useCommentReaction] Error adding reaction:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (params: DeleteCommentReactionParams) => {
      if (!client || !userId || status !== 'connected') {
        throw new Error('Stream client is not connected');
      }

      await (client as any).deleteCommentReaction({
        id: params.commentId,
        type: params.type,
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate comments query to refetch with updated reactions
      queryClient.invalidateQueries({
        queryKey: [COMMENTS_QUERY_KEY, variables.activityId],
      });
    },
    onError: (error) => {
      console.error('[useCommentReaction] Error deleting reaction:', error);
    },
  });

  return {
    addReaction: addMutation.mutateAsync,
    deleteReaction: deleteMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
