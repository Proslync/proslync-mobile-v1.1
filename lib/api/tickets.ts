// Ticket Purchase API
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
  recipientPhone?: string;
  recipientUserId?: number;
}

export interface TicketTransferResponse {
  success: boolean;
  message: string;
}

export interface TicketListingRequest {
  price: number;
}

export interface TicketListingResponse {
  success: boolean;
  message: string;
  listingId?: number;
}

export const ticketsApi = {
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
  transferTicket: async (ticketId: string, data: TicketTransferRequest): Promise<TicketTransferResponse> => {
    return apiClient.post<TicketTransferResponse>(`/api/tickets/${ticketId}/transfer`, data);
  },

  /**
   * List a ticket for resale
   * Backend endpoint: POST /api/tickets/:ticketId/list
   */
  listTicketForSale: async (ticketId: string, data: TicketListingRequest): Promise<TicketListingResponse> => {
    return apiClient.post<TicketListingResponse>(`/api/tickets/${ticketId}/list`, data);
  },

  /**
   * Cancel a ticket listing
   * Backend endpoint: DELETE /api/tickets/:ticketId/list
   */
  cancelListing: async (ticketId: string): Promise<TicketTransferResponse> => {
    return apiClient.delete<TicketTransferResponse>(`/api/tickets/${ticketId}/list`);
  },
};
