import { useQuery } from '@tanstack/react-query';
import { followsApi } from '@/lib/api/follows';
import type { MutualFollowersResponse } from '@/lib/types/follows.types';

export const MUTUAL_FOLLOWERS_KEY = 'mutual-followers';

export function useMutualFollowers(userId: string | number | null | undefined) {
  const numericId = userId ? Number(userId) : null;

  const query = useQuery<MutualFollowersResponse>({
    queryKey: [MUTUAL_FOLLOWERS_KEY, numericId],
    queryFn: () => followsApi.getMutualFollowers(numericId!),
    enabled: !!numericId && !isNaN(numericId),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    mutualFollowers: query.data?.users ?? [],
    totalMutualCount: query.data?.totalCount ?? 0,
    isLoading: query.isLoading,
  };
}
