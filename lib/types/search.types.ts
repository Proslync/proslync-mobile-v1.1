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
