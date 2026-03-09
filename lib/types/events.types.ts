// Event types for the mobile app
import type { RolePermissions } from './team.types';

export interface Flyer {
  id: string;
  originalName?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  url: string;
  fileType?: string;
  status?: string;
}

export interface Venue {
  id: number;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
  status?: string;
  ownerId?: number;
}

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ACTIVE = 'active',
  FINISHED = 'finished',
  CANCELLED = 'cancelled',
}

export interface Event {
  id: number;
  name: string;
  description?: string;
  location?: string;
  venueId?: number;
  ownerId: number;
  status: EventStatus;
  startDate: string;
  endDate: string;
  maxCapacity?: number;
  minimumAge?: number;
  eventType?: string;
  imageUrl?: string;
  isPublic: boolean;
  publicUrl?: string;
  flyerId?: string;
  flyer?: Flyer;
  venue?: Venue;
  createdAt?: string;
  updatedAt?: string;
  attendeeCount?: number;
  isUserRegistered?: boolean;
  isPaid?: boolean;
  doorCoverPriceCents?: number;
  ticketsAvailableNow?: boolean;
  ticketsAvailableFrom?: string | null;
  locationDetails?: {
    addressLine1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    formattedAddress?: string;
    coordinates?: { lat: number; lng: number };
  };
}

export interface EventsSearchResponse {
  events: Event[];
  total?: number;
  page?: number;
  limit?: number;
}

export enum EventUserStatus {
  REQUESTED = 'requested',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export interface EventAttendee {
  id: number;
  userId?: number;
  firstName?: string;
  lastName?: string;
  userName?: string;
  avatarUrl?: string;
  avatar?: string;
  phoneNumber?: string;
  email?: string;
  birthDate?: string;
  guestName?: string;
  isGuest?: boolean;
  isRegistered?: boolean;
  status?: EventUserStatus;
  notes?: string;
  verifiedBy?: number;
  verifiedAt?: string;
  tableNumber?: string;
  registeredAt?: string;
  createdAt?: string;
  updatedAt?: string;
  isBlacklisted?: boolean;
  blacklistReason?: string;
  blacklistedAt?: string;
}

export interface EventAttendeesResponse {
  attendees: EventAttendee[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  statistics?: {
    totalAttendees: number;
    verifiedAttendees: number;
    pendingAttendees: number;
  };
}

export interface Contact {
  userId?: number;
  firstName: string;
  lastName: string;
  userName?: string;
  phoneNumber?: string;
  email?: string;
  avatar?: string;
  eventCount: number;
  lastEventDate?: string;
  firstEventDate?: string;
  createdAt: string;
}

export interface ContactsResponse {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface EventPermissionsResponse {
  isOwner: boolean;
  permissions: RolePermissions;
}
