import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { preferencesApi } from '@/lib/api/preferences';
import type { UserPreferences } from '@/lib/types/preferences.types';

export const USER_PREFERENCES_KEY = 'user-preferences';

export function useUserPreferences() {
  return useQuery({
    queryKey: [USER_PREFERENCES_KEY],
    queryFn: () => preferencesApi.getPreferences(),
    staleTime: 5 * 60_000,
  });
}

export function useUpdatePreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<UserPreferences>) =>
      preferencesApi.updatePreferences(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: [USER_PREFERENCES_KEY] });

      const previous = queryClient.getQueryData<UserPreferences>([
        USER_PREFERENCES_KEY,
      ]);

      if (previous) {
        queryClient.setQueryData<UserPreferences>([USER_PREFERENCES_KEY], {
          ...previous,
          ...data,
        });
      }

      return { previous };
    },
    onError: (_err, _data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          [USER_PREFERENCES_KEY],
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [USER_PREFERENCES_KEY] });
    },
  });
}
