// Events API client for fetching event details
import { apiClient } from './client';
import type { Event, EventsSearchResponse, EventAttendeesResponse, EventPermissionsResponse, ContactsResponse } from '../types/events.types';

export interface RsvpResponse {
  success: boolean;
  message: string;
}

export interface ValidateTicketRequest {
  pdf417Payload: string;
  scannedAt?: string;
}

export interface ValidateTicketResponse {
  success: boolean;
  valid: boolean;
  message: string;
  ticket?: {
    id: number;
    ticketNumber: string;
    status: string;
    eventId: number;
    userId: number;
    redeemedBy?: number;
    redeemedAt?: string;
    createdAt: string;
  };
  user?: {
    id: number;
    firstName?: string;
    lastName?: string;
    phoneNumber: string;
    email?: string;
  };
  event?: {
    id: number;
    name: string;
    startDate: string;
    venue: {
      name: string;
      address: string;
    };
  };
  failureReason?: string;
}

// Driver's License / ID Card Validation
export interface ValidateDocumentRequest {
  firstName: string;
  lastName: string;
  birthDate: string; // YYYY-MM-DD
  expirationDate: string; // YYYY-MM-DD
  documentNumber?: string;
}

export interface ValidateDocumentResponse {
  success: boolean;
  message: string;
  guestId: number;
  status: string;
  isPreRegistered: boolean;
  age: number;
  guestInfo: {
    firstName: string;
    lastName: string;
    birthDate: string;
    expirationDate: string;
    documentNumber?: string;
  };
  validationFailed?: boolean;
  validationReason?: string;
  tempId?: string; // Used for linking with membership card
}

// Membership Card Validation
export interface ValidateMembershipCardRequest {
  tempId: string; // From document validation
  payload: string; // PDF417 payload
  scannedAt?: string;
}

export interface ValidateMembershipCardResponse {
  success: boolean;
  message: string;
  guestId: number;
  userId?: number;
  ticketId?: number;
  status: string;
  merged: boolean;
  updated: boolean;
  membershipCard?: {
    id: number;
    cardNumber: string;
    userId: number;
    isActive: boolean;
  };
  user?: {
    id: number;
    firstName?: string;
    lastName?: string;
    phoneNumber: string;
    email?: string;
  };
  guestName?: string;
  ticket?: {
    id: number;
    ticketNumber: string;
    status: string;
    scanCount: number;
  };
  failureReason?: string;
}

export interface NearbyEventsParams {
  latitude?: number;
  longitude?: number;
  radius?: number; // in miles
  limit?: number;
}

export interface LocationDetails {
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  placeId?: string;
  formattedAddress?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface CreateTierInline {
  name: string;
  description?: string;
  displayOrder?: number;
  pricing: {
    name: string;
    price: number;
    currency?: string;
    capacity?: number;
    availableFrom?: string;
    availableUntil?: string;
  }[];
}

export interface CreateEventDto {
  name: string;
  description?: string;
  venueId?: number;
  location?: string;
  locationDetails?: LocationDetails;
  startDate?: string;
  endDate?: string;
  maxCapacity?: number;
  minimumAge?: number;
  eventType?: string;
  imageUrl?: string;
  isPublic?: boolean;
  tiers?: CreateTierInline[];
  doorCoverPriceCents?: number;
}

export interface UpdateEventDto {
  name?: string;
  description?: string;
  venueId?: number;
  location?: string;
  locationDetails?: LocationDetails;
  startDate?: string;
  endDate?: string;
  maxCapacity?: number;
  minimumAge?: number;
  eventType?: string;
  imageUrl?: string;
  isPublic?: boolean;
  doorCoverPriceCents?: number;
}

export const eventsApi = {
  /**
   * Get a single event by ID
   */
  getEvent: async (id: number): Promise<Event> => {
    return apiClient.get<Event>(`/api/events/${id}`);
  },

  /**
   * Get multiple events by IDs (batch fetch)
   * Backend endpoint: GET /api/events?ids=1,2,3
   */
  getEventsByIds: async (ids: number[]): Promise<Event[]> => {
    if (ids.length === 0) {
      return [];
    }

    // Format: ids=1,2,3 (comma-separated)
    const idsParam = ids.join(',');
    const response = await apiClient.get<EventsSearchResponse>(
      `/api/events?ids=${idsParam}`,
    );
    return response.events;
  },

  /**
   * Get all events or nearby events
   * Backend endpoint: GET /api/events or GET /api/events?lat=x&lng=y&radius=z
   */
  getEvents: async (params?: NearbyEventsParams): Promise<Event[]> => {
    const queryParams = new URLSearchParams();

    if (params?.latitude && params?.longitude) {
      queryParams.append('lat', params.latitude.toString());
      queryParams.append('lng', params.longitude.toString());
    }
    if (params?.radius) {
      queryParams.append('radius', params.radius.toString());
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/api/events?${queryString}` : '/api/events';

    const response = await apiClient.get<EventsSearchResponse>(endpoint);
    return response.events;
  },

  /**
   * Search events by query
   * Backend endpoint: GET /api/events/search?q=query
   */
  searchEvents: async (query: string): Promise<Event[]> => {
    if (!query.trim()) {
      return [];
    }
    const response = await apiClient.get<EventsSearchResponse>(
      `/api/events/search?q=${encodeURIComponent(query)}`,
    );
    return response.events;
  },

  /**
   * Get attendees for an event with pagination, search, and status filtering
   * Backend endpoint: GET /api/events/:id/attendees
   */
  getEventAttendees: async (
    eventId: number,
    params?: { page?: number; limit?: number; search?: string; status?: string[] },
  ): Promise<EventAttendeesResponse> => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.status?.length) params.status.forEach((s) => query.append('status', s));
    const qs = query.toString();
    return apiClient.get<EventAttendeesResponse>(
      `/api/events/${eventId}/attendees${qs ? `?${qs}` : ''}`,
    );
  },

  /**
   * Register/RSVP for an event
   */
  registerForEvent: async (eventId: number): Promise<RsvpResponse> => {
    return apiClient.post<RsvpResponse>(`/api/events/${eventId}/register`, {});
  },

  /**
   * Get events a user has registered for
   * Backend endpoint: GET /api/users/:id/events
   */
  getUserEvents: async (
    userId: number,
    params?: { limit?: number; sortBy?: 'date' | 'name' | 'registered'; sortOrder?: 'asc' | 'desc' },
  ): Promise<Event[]> => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
    const qs = query.toString();
    const response = await apiClient.get<{ events: Event[] }>(
      `/api/users/${userId}/events${qs ? `?${qs}` : ''}`,
    );
    return response.events;
  },

  /**
   * Cancel RSVP / registration for an event
   */
  cancelRegistration: async (eventId: number): Promise<RsvpResponse> => {
    return apiClient.delete<RsvpResponse>(`/api/events/${eventId}/register`);
  },

  /**
   * Create a new event
   * Backend endpoint: POST /api/events
   */
  createEvent: async (data: CreateEventDto): Promise<Event> => {
    return apiClient.post<Event>('/api/events', data);
  },

  /**
   * Get events created by the current user
   * Backend endpoint: GET /api/events?myEvents=true
   */
  getMyEvents: async (): Promise<Event[]> => {
    const response = await apiClient.get<EventsSearchResponse>('/api/events?myEvents=true&limit=100');
    return response.events;
  },

  /**
   * Publish an event (draft -> published)
   * Backend endpoint: PATCH /api/events/:id/publish
   */
  publishEvent: async (eventId: number): Promise<Event> => {
    return apiClient.patch<Event>(`/api/events/${eventId}/publish`, {});
  },

  /**
   * Upload a flyer image for an event
   * Backend endpoint: POST /api/events/:id/flyer
   */
  uploadFlyer: async (eventId: number, imageUri: string): Promise<{ url: string }> => {
    const filename = imageUri.split('/').pop() || 'flyer.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    return apiClient.uploadFile<{ url: string }>(
      `/api/events/${eventId}/flyer`,
      { uri: imageUri, name: filename, type },
      'flyer'
    );
  },

  /**
   * Update an existing event
   * Backend endpoint: PUT /api/events/:id
   */
  updateEvent: async (eventId: number, data: UpdateEventDto): Promise<Event> => {
    return apiClient.put<Event>(`/api/events/${eventId}`, data);
  },

  /**
   * Delete an event
   * Backend endpoint: DELETE /api/events/:id
   */
  deleteEvent: async (eventId: number): Promise<void> => {
    return apiClient.delete(`/api/events/${eventId}`);
  },

  /**
   * Validate a ticket from scanned QR code payload
   * Backend endpoint: POST /api/tickets/events/:eventId/validate
   * This also auto-redeems the ticket if valid
   */
  validateTicket: async (eventId: number, data: ValidateTicketRequest): Promise<ValidateTicketResponse> => {
    return apiClient.post<ValidateTicketResponse>(`/api/tickets/events/${eventId}/validate`, data);
  },

  /**
   * Validate a driver's license or ID card
   * Backend endpoint: POST /api/events/:eventId/attendees/validate-document
   * Returns a tempId for linking with membership card validation
   */
  validateDocument: async (eventId: number, data: ValidateDocumentRequest): Promise<ValidateDocumentResponse> => {
    return apiClient.post<ValidateDocumentResponse>(`/api/events/${eventId}/attendees/validate-document`, data);
  },

  /**
   * Validate a membership card and link with guest from document validation
   * Backend endpoint: POST /api/events/:eventId/attendees/validate-membership-card
   */
  validateMembershipCard: async (eventId: number, data: ValidateMembershipCardRequest): Promise<ValidateMembershipCardResponse> => {
    return apiClient.post<ValidateMembershipCardResponse>(`/api/events/${eventId}/attendees/validate-membership-card`, data);
  },

  /**
   * Approve a guest for entry (Bouncer only)
   * Backend endpoint: PUT /api/events/:eventId/attendees/:guestId/approve
   */
  approveGuest: async (eventId: number, guestId: number, notes?: string): Promise<any> => {
    return apiClient.put(`/api/events/${eventId}/attendees/${guestId}/approve`, { notes });
  },

  /**
   * Deny a guest entry (Bouncer only)
   * Backend endpoint: PUT /api/events/:eventId/attendees/:guestId/deny
   */
  denyGuest: async (eventId: number, guestId: number, notes: string): Promise<any> => {
    return apiClient.put(`/api/events/${eventId}/attendees/${guestId}/deny`, { notes });
  },

  /**
   * Get current user's permissions for an event
   * Backend endpoint: GET /api/events/:eventId/permissions
   */
  getEventPermissions: async (eventId: number): Promise<EventPermissionsResponse> => {
    return apiClient.get<EventPermissionsResponse>(`/api/events/${eventId}/permissions`);
  },

  /**
   * Get attendees across ALL events owned by a user
   * Backend endpoint: GET /api/events/attendees?ownerId=x
   */
  getAllAttendees: async (
    ownerId: number,
    params?: { page?: number; limit?: number; search?: string; status?: string[] },
  ): Promise<EventAttendeesResponse> => {
    const query = new URLSearchParams();
    query.set('ownerId', String(ownerId));
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.status?.length) params.status.forEach((s) => query.append('status', s));
    return apiClient.get<EventAttendeesResponse>(`/api/events/attendees?${query.toString()}`);
  },

  /**
   * Get unique contacts (CRM-style deduplicated list) across all events owned by a user
   * Backend endpoint: GET /api/events/contacts?ownerId=x
   */
  getContacts: async (
    ownerId: number,
    params?: { page?: number; limit?: number; search?: string },
  ): Promise<ContactsResponse> => {
    const query = new URLSearchParams();
    query.set('ownerId', String(ownerId));
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    return apiClient.get<ContactsResponse>(`/api/events/contacts?${query.toString()}`);
  },
};
