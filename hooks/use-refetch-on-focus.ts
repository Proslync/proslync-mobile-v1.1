import * as React from 'react';
import { useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to refetch queries when screen comes into focus
 * Useful for tab screens that need fresh data when navigated to
 *
 * @param queryKeys - Array of query keys to invalidate on focus
 * @param enabled - Whether to enable refetch on focus (default: true)
 *
 * @example
 * // Refetch feed when tab is focused
 * useRefetchOnFocus([['feed', 'foryou']]);
 *
 * @example
 * // Refetch multiple queries
 * useRefetchOnFocus([['feed'], ['myEvents']]);
 */
export function useRefetchOnFocus(
  queryKeys: readonly unknown[][],
  enabled: boolean = true
) {
  const queryClient = useQueryClient();
  const firstTimeRef = React.useRef(true);

  useFocusEffect(
    React.useCallback(() => {
      // Skip the first focus (initial mount)
      if (firstTimeRef.current) {
        firstTimeRef.current = false;
        return;
      }

      if (!enabled) return;

      // Invalidate all specified query keys
      queryKeys.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    }, [enabled, queryClient, queryKeys])
  );
}

/**
 * Hook to refetch a single query when screen comes into focus
 *
 * @param queryKey - Query key to invalidate on focus
 * @param enabled - Whether to enable refetch on focus (default: true)
 *
 * @example
 * useRefetchOnScreenFocus(['feed', 'foryou', userId]);
 */
export function useRefetchOnScreenFocus(
  queryKey: readonly unknown[],
  enabled: boolean = true
) {
  useRefetchOnFocus([queryKey as unknown[]], enabled);
}
