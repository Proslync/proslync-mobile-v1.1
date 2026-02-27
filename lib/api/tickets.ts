// Ticket Purchase & Management API
import { apiClient } from './client';

export interface TicketPurchaseRequest {
  quantity: number;
}

export interface TicketPurchaseResponse {
  success: boolean;
  message: string;
  tickets?: {
    id: number;
    ticketNumber: string;
    status: string;
    eventId: number;
    userId: number;
    createdAt: string;
  }[];
  totalCharged?: number;
  currency?: string;
  paymentIntentId?: string;
  checkoutUrl?: string;
}

export interface TicketInfoResponse {
  eventId: number;
  eventName: string;
  price: number;
  currency: string;
  available: boolean;
  remainingCapacity?: number;
  maxPerPurchase: number;
  serviceFee: number;
}

export interface TicketTransferRequest {
  recipientUsername?: string;
  recipientUserId?: number;
}

export interface TicketTransferResponse {
  success: boolean;
  message: string;
  newTicketId?: number;
  newTicketNumber?: string;
}

export interface UserTicket {
  id: number;
  eventId: number;
  userId: number;
  ticketNumber: string;
  status: 'active' | 'redeemed' | 'cancelled' | 'transferred';
  pricePaid?: number;
  currency?: string;
  transferredFrom?: number;
  transferredTo?: number;
  transferredAt?: string;
  purchasedAt?: string;
  createdAt: string;
  event?: {
    id: number;
    name: string;
    startDate: string;
    endDate?: string;
    status?: string;
    isPaid?: boolean;
    imageUrl?: string;
    venue?: {
      name: string;
      address?: string;
    };
    flyer?: {
      url: string;
    };
  };
}

export interface UserTicketsResponse {
  tickets: UserTicket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const ticketsApi = {
  /**
   * Get current user's tickets with filtering
   * Backend endpoint: GET /api/tickets/my
   */
  getMyTickets: async (params?: {
    status?: 'upcoming' | 'past' | 'all';
    ticketStatus?: string;
    page?: number;
    limit?: number;
    sortBy?: 'eventDate' | 'createdAt' | 'eventName';
    sortOrder?: 'asc' | 'desc';
  }): Promise<UserTicketsResponse> => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.ticketStatus) query.set('ticketStatus', params.ticketStatus);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
    const qs = query.toString();
    return apiClient.get<UserTicketsResponse>(`/api/tickets/my${qs ? `?${qs}` : ''}`);
  },

  /**
   * Get ticket info/pricing for an event
   * Backend endpoint: GET /api/events/:eventId/tickets/info
   */
  getTicketInfo: async (eventId: number): Promise<TicketInfoResponse> => {
    return apiClient.get<TicketInfoResponse>(`/api/events/${eventId}/tickets/info`);
  },

  /**
   * Purchase tickets for an event
   * Backend handles Stripe payment via Connect
   * Backend endpoint: POST /api/events/:eventId/tickets/purchase
   */
  purchaseTicket: async (eventId: number, data: TicketPurchaseRequest): Promise<TicketPurchaseResponse> => {
    return apiClient.post<TicketPurchaseResponse>(`/api/events/${eventId}/tickets/purchase`, data);
  },

  /**
   * Transfer a ticket to another user
   * Backend endpoint: POST /api/tickets/:ticketId/transfer
   */
  transferTicket: async (ticketId: number, data: TicketTransferRequest): Promise<TicketTransferResponse> => {
    return apiClient.post<TicketTransferResponse>(`/api/tickets/${ticketId}/transfer`, data);
  },

};
