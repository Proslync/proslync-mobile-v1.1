import { useQuery } from '@tanstack/react-query';
import { followsApi } from '@/lib/api/follows';
import type { MutualFollowersResponse } from '@/lib/types/follows.types';

export const MUTUAL_FOLLOWERS_KEY = 'mutual-followers';

export function useMutualFollowers(userId: number | null | undefined) {
  const query = useQuery<MutualFollowersResponse>({
    queryKey: [MUTUAL_FOLLOWERS_KEY, userId],
    queryFn: () => followsApi.getMutualFollowers(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    mutuals: query.data?.users ?? [],
    totalCount: query.data?.totalCount ?? 0,
    isLoading: query.isLoading,
  };
}
