import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@/lib/api/search';
import { useDebounce } from './use-debounce';
import { format } from 'date-fns';
import type {
  SearchRequest,
  SearchResponse,
  DiscoverPerson,
  DiscoverEvent,
  DiscoverVenue,
} from '@/lib/types/search.types';

export const SEARCH_QUERY_KEY = 'search';

interface UseSearchOptions extends Omit<SearchRequest, 'query'> {
  initialQuery?: string;
}

/**
 * Hook for searching events, venues, and people
 * Uses React Query with debounced search query
 */
export function useSearch(options: UseSearchOptions = {}) {
  const [searchQuery, setSearchQuery] = useState(options.initialQuery || '');
  const debouncedQuery = useDebounce(searchQuery, 500);

  const searchParams: SearchRequest = {
    ...options,
    query: debouncedQuery || undefined,
  };

  const query = useQuery<SearchResponse>({
    queryKey: [SEARCH_QUERY_KEY, searchParams],
    queryFn: () => searchApi.search(searchParams),
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    ...query,
    searchQuery,
    setSearchQuery,
  };
}

// Mapper functions to transform API response to UI format

export function mapPersonToDiscover(person: {
  id: number;
  firstName: string;
  lastName: string;
  userName?: string;
  avatar?: { id: string; url: string } | null;
}): DiscoverPerson {
  return {
    id: person.id,
    username: person.userName || `user-${person.id}`,
    name: `${person.firstName} ${person.lastName}`.trim() || `User ${person.id}`,
    avatar: person.avatar?.url,
    followers: 0, // TODO: Add follower count when available
    verified: false,
  };
}

export function mapEventToDiscover(event: {
  id: number;
  name: string;
  startDate?: string;
  venueName: string;
  flyer?: { id: string; url: string } | null;
}): DiscoverEvent {
  return {
    id: event.id,
    title: event.name,
    date: event.startDate ? format(new Date(event.startDate), 'MMM d, yyyy') : 'Date TBA',
    location: event.venueName || 'Location TBA',
    image: event.flyer?.url,
    attendees: 0,
    price: 'Free',
  };
}

export function mapVenueToDiscover(venue: {
  id: number;
  name: string;
  address?: string;
  logo?: { id: string; url: string } | null;
}): DiscoverVenue {
  return {
    id: venue.id,
    name: venue.name,
    type: 'Venue',
    location: venue.address || 'Location TBA',
    image: venue.logo?.url,
  };
}
