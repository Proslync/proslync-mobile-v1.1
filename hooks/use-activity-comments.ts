// React Query hook for fetching comments on an activity

import { useQuery } from '@tanstack/react-query';
import { useStream } from '@/lib/providers/stream-provider';

export const COMMENTS_QUERY_KEY = 'stream-activity-comments';

export interface CommentData {
  id: string;
  text: string;
  object_id?: string;
  object_type?: string;
  user: {
    id: string;
    name?: string;
    image?: string;
    custom?: {
      firstName?: string;
      lastName?: string;
      userName?: string;
      verified?: boolean;
    };
  };
  created_at: string | number;
  updated_at?: string | number;
  reaction_count?: number;
  reaction_counts?: Record<string, number>;
  own_reactions?: Array<{
    type: string;
    user: { id: string };
  }>;
  reply_count?: number;
  parent_id?: string;
  children?: CommentData[];
  replies?: CommentData[];
}

interface UseActivityCommentsParams {
  activityId: string | null | undefined;
  enabled?: boolean;
  limit?: number;
  depth?: number;
}

export function useActivityComments({
  activityId,
  enabled = true,
  limit = 20,
  depth = 3,
}: UseActivityCommentsParams) {
  const { client, status } = useStream();

  const query = useQuery<CommentData[]>({
    queryKey: [COMMENTS_QUERY_KEY, activityId, limit, depth],
    enabled:
      enabled &&
      Boolean(client) &&
      status === 'connected' &&
      Boolean(activityId),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      if (!client || !activityId) {
        throw new Error(
          'Cannot fetch comments without a connected client and activityId.'
        );
      }

      const response = await (client as any).getComments({
        object_id: activityId,
        object_type: 'activity',
        limit,
        depth,
      });

      // Response structure may vary - check all possible structures
      let comments: CommentData[] = [];

      if (Array.isArray(response)) {
        comments = response as CommentData[];
      } else if (response?.comments) {
        comments = response.comments;
      } else if (response?.data?.comments) {
        comments = response.data.comments;
      } else if (response?.results) {
        comments = response.results;
      }

      return Array.isArray(comments) ? comments : [];
    },
  });

  return {
    comments: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
