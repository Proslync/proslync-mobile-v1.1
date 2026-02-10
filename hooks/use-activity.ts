// React Query hook for fetching a single activity by ID

import { useQuery } from '@tanstack/react-query';
import { useStream } from '@/lib/providers/stream-provider';

export const ACTIVITY_QUERY_KEY = 'stream-activity';

export interface ActivityResponse {
  id: string;
  type?: string;
  text?: string;
  created_at: string;
  updated_at?: string;
  user?: {
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
  attachments?: Array<{
    type: 'image' | 'file';
    image_url?: string;
    asset_url?: string;
    url?: string;
    thumb_url?: string;
    custom?: {
      thumb_url?: string;
      duration?: string;
    };
  }>;
  custom?: {
    eventId?: number;
    userName?: string;
    venueId?: number;
    venueName?: string;
    venueLogo?: string;
  };
  reaction_count?: number;
  reaction_groups?: Record<string, { count?: number }>;
  reaction_counts?: Record<string, number>;
  own_reactions?: Array<{
    type: string;
    user?: { id: string };
  }>;
}

export function useActivity(
  activityId: string | null | undefined,
  enabled = true
) {
  const { client, status } = useStream();

  const query = useQuery<ActivityResponse>({
    queryKey: [ACTIVITY_QUERY_KEY, activityId],
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
          'Cannot fetch activity without a connected client and activityId.'
        );
      }

      // Get activity by ID using GetStream client.queryActivities()
      const response = await client.queryActivities({
        filter: {
          id: { $eq: activityId },
        },
        limit: 1,
      });

      // Response structure may vary - check both possible structures
      const results =
        (response as any).results ||
        (response as any).data?.results ||
        (response as any).activities;
      const activity = Array.isArray(results) ? results[0] : results;

      if (!activity) {
        throw new Error(`Activity with id ${activityId} not found`);
      }

      return activity as ActivityResponse;
    },
  });

  return {
    activity: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
