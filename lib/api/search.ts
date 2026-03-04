// Search API
import { apiClient } from './client';
import type {
  SearchRequest,
  SearchResponse,
  UnifiedSearchResponse,
  SuggestionsResponse,
} from '../types/search.types';

export const searchApi = {
  /**
   * Legacy search across events, venues, and people
   * Backend endpoint: GET /api/search
   */
  search: async (params: SearchRequest): Promise<SearchResponse> => {
    const queryParams = new URLSearchParams();

    if (params.query) {
      queryParams.append('query', params.query);
    }
    if (params.eventsLimit !== undefined) {
      queryParams.append('eventsLimit', String(params.eventsLimit));
    }
    if (params.venuesLimit !== undefined) {
      queryParams.append('venuesLimit', String(params.venuesLimit));
    }
    if (params.peopleLimit !== undefined) {
      queryParams.append('peopleLimit', String(params.peopleLimit));
    }

    const queryString = queryParams.toString();
    const endpoint = `/api/search${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<SearchResponse>(endpoint);
  },

  /**
   * Unified search with ranked results
   * Backend endpoint: GET /api/search/unified
   */
  unifiedSearch: async (params: {
    query: string;
    limit?: number;
    offset?: number;
  }): Promise<UnifiedSearchResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('query', params.query);
    if (params.limit !== undefined) {
      queryParams.append('limit', String(params.limit));
    }
    if (params.offset !== undefined) {
      queryParams.append('offset', String(params.offset));
    }
    return apiClient.get<UnifiedSearchResponse>(
      `/api/search/unified?${queryParams.toString()}`,
    );
  },

  /**
   * Get search suggestions (recent, frequent, mutual follow)
   * Backend endpoint: GET /api/search/suggestions
   */
  getSuggestions: async (): Promise<SuggestionsResponse> => {
    return apiClient.get<SuggestionsResponse>('/api/search/suggestions');
  },

  /**
   * Record a search interaction
   * Backend endpoint: POST /api/search/history
   */
  recordSearch: async (data: {
    query?: string;
    selectedType?: string;
    selectedId?: number;
    displayName?: string;
    displayImage?: string;
  }): Promise<void> => {
    await apiClient.post('/api/search/history', data);
  },

  /**
   * Delete a single search history entry
   * Backend endpoint: DELETE /api/search/history/:id
   */
  deleteSearchEntry: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/search/history/${id}`);
  },

  /**
   * Clear all search history
   * Backend endpoint: DELETE /api/search/history
   */
  clearSearchHistory: async (): Promise<void> => {
    await apiClient.delete('/api/search/history');
  },
};
