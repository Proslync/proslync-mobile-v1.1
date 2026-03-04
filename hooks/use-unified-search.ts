import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchApi } from '@/lib/api/search';
import { useDebounce } from './use-debounce';
import type {
  UnifiedSearchResponse,
  SuggestionsResponse,
} from '@/lib/types/search.types';

export const UNIFIED_SEARCH_KEY = 'unified-search';
export const SUGGESTIONS_KEY = 'search-suggestions';
export const SEARCH_HISTORY_KEY = 'search-history';

export function useUnifiedSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 400);
  const queryClient = useQueryClient();

  // Unified search results
  const searchResults = useQuery<UnifiedSearchResponse>({
    queryKey: [UNIFIED_SEARCH_KEY, debouncedQuery],
    queryFn: () =>
      searchApi.unifiedSearch({ query: debouncedQuery, limit: 20 }),
    enabled: debouncedQuery.length > 0,
    staleTime: 30 * 1000,
  });

  // Suggestions (shown before typing)
  const suggestions = useQuery<SuggestionsResponse>({
    queryKey: [SUGGESTIONS_KEY],
    queryFn: () => searchApi.getSuggestions(),
    staleTime: 2 * 60 * 1000,
  });

  // Record a search interaction
  const recordMutation = useMutation({
    mutationFn: searchApi.recordSearch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUGGESTIONS_KEY] });
    },
  });

  // Delete a single search entry
  const deleteMutation = useMutation({
    mutationFn: (id: number) => searchApi.deleteSearchEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUGGESTIONS_KEY] });
    },
  });

  // Clear all search history
  const clearHistoryMutation = useMutation({
    mutationFn: () => searchApi.clearSearchHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUGGESTIONS_KEY] });
    },
  });

  const recordSearch = useCallback(
    (data: {
      query?: string;
      selectedType?: string;
      selectedId?: number;
      displayName?: string;
      displayImage?: string;
    }) => {
      recordMutation.mutate(data);
    },
    [recordMutation],
  );

  const deleteSearchEntry = useCallback(
    (id: number) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation],
  );

  const clearSearchHistory = useCallback(() => {
    clearHistoryMutation.mutate();
  }, [clearHistoryMutation]);

  return {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    results: searchResults.data?.results ?? [],
    total: searchResults.data?.total ?? 0,
    hasMore: searchResults.data?.hasMore ?? false,
    isSearching: searchResults.isFetching,
    suggestions: suggestions.data,
    isSuggestionsLoading: suggestions.isLoading,
    recordSearch,
    deleteSearchEntry,
    clearSearchHistory,
  };
}
