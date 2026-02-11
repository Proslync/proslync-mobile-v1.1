// Search API
import { apiClient } from './client';
import type { SearchRequest, SearchResponse } from '../types/search.types';

export const searchApi = {
  /**
   * Search across events, venues, and people
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
};
