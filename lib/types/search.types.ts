// Search API types

export interface SearchRequest {
  query?: string;
  eventsLimit?: number;
  venuesLimit?: number;
  peopleLimit?: number;
}

export interface SearchEvent {
  id: number;
  name: string;
  description?: string;
  startDate?: string;
  venueName: string;
  venueId: number;
  flyer?: { id: string; url: string } | null;
}

export interface SearchVenue {
  id: number;
  name: string;
  description?: string;
  address?: string;
  logo?: { id: string; url: string } | null;
}

export interface SearchPerson {
  id: number;
  firstName: string;
  lastName: string;
  userName?: string;
  avatar?: { id: string; url: string } | null;
  mutualCount?: number;
}

export interface SearchResponse {
  events: SearchEvent[];
  venues: SearchVenue[];
  people: SearchPerson[];
}

// Discover UI types (mapped from search response)
export type DiscoverCategory = 'people' | 'events' | 'venues';

export interface DiscoverPerson {
  id: number;
  username: string;
  name: string;
  avatar?: string;
  followers: number;
  verified: boolean;
  mutualCount?: number;
}

export interface DiscoverEvent {
  id: number;
  title: string;
  date: string;
  location: string;
  image?: string;
  attendees: number;
  price: string;
}

export interface DiscoverVenue {
  id: number;
  name: string;
  type: string;
  location: string;
  image?: string;
}

// ── Unified search types ──

export interface UnifiedSearchItem {
  type: 'person' | 'event' | 'venue' | 'post';
  id: number;
  score: number;
  // Person
  userName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: { id: string; url: string } | null;
  isVerified?: boolean;
  isFollowing?: boolean;
  mutualCount?: number;
  // Event
  name?: string;
  description?: string | null;
  startDate?: string | null;
  venueName?: string | null;
  venueId?: number | null;
  flyer?: { id: string; url: string } | null;
  // Venue
  address?: string | null;
  logo?: { id: string; url: string } | null;
  // Post
  text?: string | null;
  authorName?: string | null;
  authorAvatar?: string | null;
  media?: unknown[];
  likeCount?: number;
}

export interface UnifiedSearchResponse {
  results: UnifiedSearchItem[];
  total: number;
  hasMore: boolean;
}

export interface SearchSuggestion {
  type: 'recent' | 'frequent' | 'mutual';
  id: number;
  query?: string | null;
  selectedType?: string | null;
  selectedId?: number | null;
  displayName?: string | null;
  displayImage?: string | null;
  searchedAt?: string;
  userName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: { id: string; url: string } | null;
  isVerified?: boolean;
  mutualCount?: number;
}

export interface SuggestionsResponse {
  recentSearches: SearchSuggestion[];
  frequentFriends: SearchSuggestion[];
  mutualFollowSuggestions: SearchSuggestion[];
}
