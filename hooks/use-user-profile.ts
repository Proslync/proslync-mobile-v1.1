import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { usersApi } from '@/lib/api/users';
import type { PublicUserProfile } from '@/lib/types/auth.types';

export const USER_PROFILE_KEY = 'user-profile';

export function useUserProfile(options: { username?: string; userId?: string }) {
  return useQuery<PublicUserProfile | null, Error>({
    queryKey: [USER_PROFILE_KEY, options.userId, options.username],
    queryFn: async () => {
      if (options.userId) {
        const numericId = Number(options.userId);
        if (!isNaN(numericId)) {
          return authApi.getUserById(numericId);
        }
      }
      if (options.username) {
        const searchResult = await authApi.getUserByUsername(options.username);
        if (searchResult) {
          return (await authApi.getUserById(searchResult.id)) || searchResult;
        }
        // Search filters blocked users — check blocked list for a match
        try {
          const blocked = await usersApi.getBlockedUsers();
          const match = blocked.blockedUsers?.find(
            (u) => u.userName?.toLowerCase() === options.username?.toLowerCase(),
          );
          if (match) {
            return authApi.getUserById(match.id);
          }
        } catch {}
      }
      return null;
    },
    enabled: !!(options.userId || options.username),
    staleTime: 2 * 60 * 1000,
  });
}
