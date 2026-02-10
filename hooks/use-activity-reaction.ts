// React Query mutation hook for activity reactions (likes)

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStream } from '@/lib/providers/stream-provider';
import { useAuth } from '@/lib/providers/auth-provider';
import { ACTIVITY_QUERY_KEY } from './use-activity';
import { USER_FEED_QUERY_KEY } from './use-user-feed';

interface AddReactionParams {
  activityId: string;
  type?: string;
  custom?: Record<string, unknown>;
  enforceUnique?: boolean;
}

interface DeleteReactionParams {
  activityId: string;
  type: string;
}

export function useActivityReaction() {
  const { client, status } = useStream();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const userId = user ? String(user.id) : null;

  const addMutation = useMutation({
    mutationFn: async (params: AddReactionParams) => {
      if (!client || !userId || status !== 'connected') {
        throw new Error('Stream client is not connected');
      }

      await (client as any).addActivityReaction({
        activity_id: params.activityId,
        type: params.type || 'like',
        custom: params.custom || { emoji: '❤️' },
        enforce_unique: params.enforceUnique ?? true,
        skip_push: false,
      });
    },
    onSuccess: () => {
      // Invalidate activity queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: [ACTIVITY_QUERY_KEY],
      });
      // Also invalidate feed and user feed to update reaction counts
      queryClient.invalidateQueries({
        queryKey: ['feed'],
      });
      queryClient.invalidateQueries({
        queryKey: ['timeline'],
      });
      queryClient.invalidateQueries({
        queryKey: [USER_FEED_QUERY_KEY],
      });
    },
    onError: (error) => {
      console.error('[useActivityReaction] Error adding reaction:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (params: DeleteReactionParams) => {
      if (!client || !userId || status !== 'connected') {
        throw new Error('Stream client is not connected');
      }

      await (client as any).deleteActivityReaction({
        activity_id: params.activityId,
        type: params.type,
      });
    },
    onSuccess: () => {
      // Invalidate activity queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: [ACTIVITY_QUERY_KEY],
      });
      // Also invalidate feed and user feed to update reaction counts
      queryClient.invalidateQueries({
        queryKey: ['feed'],
      });
      queryClient.invalidateQueries({
        queryKey: ['timeline'],
      });
      queryClient.invalidateQueries({
        queryKey: [USER_FEED_QUERY_KEY],
      });
    },
    onError: (error) => {
      console.error('[useActivityReaction] Error deleting reaction:', error);
    },
  });

  return {
    addReaction: addMutation.mutateAsync,
    deleteReaction: deleteMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
