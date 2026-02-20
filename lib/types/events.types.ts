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
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
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
  ticketsAvailableNow?: boolean;
  ticketsAvailableFrom?: string | null;
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
  SEATED = 'seated',
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
  seatedBy?: number;
  seatedAt?: string;
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

export interface EventPermissionsResponse {
  isOwner: boolean;
  permissions: RolePermissions;
}
