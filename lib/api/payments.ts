// Payments API - Stripe payment intents
import { apiClient } from './client';
import type {
  CreatePaymentIntentRequest,
  CreatePaymentIntentResponse,
  PaymentStatusResponse,
  UnpaidAttendeesResponse,
  CollectAtDoorRequest,
  CollectAtDoorResponse,
} from '../types/payments.types';

export const paymentsApi = {
  /**
   * Create a payment intent for ticket purchase
   * Backend endpoint: POST /api/events/:eventId/payments/create-intent
   */
  createPaymentIntent: async (
    eventId: number,
    data: CreatePaymentIntentRequest
  ): Promise<CreatePaymentIntentResponse> => {
    return apiClient.post<CreatePaymentIntentResponse>(
      `/api/events/${eventId}/payments/create-intent`,
      data
    );
  },

  /**
   * Get payment status by payment intent ID
   * Backend endpoint: GET /api/payments/:paymentIntentId/status
   */
  getPaymentStatus: async (paymentIntentId: string): Promise<PaymentStatusResponse> => {
    return apiClient.get<PaymentStatusResponse>(
      `/api/payments/${paymentIntentId}/status`
    );
  },

  /**
   * Get unpaid checked-in attendees for an event
   * Backend endpoint: GET /api/events/:eventId/attendees/unpaid
   */
  getUnpaidAttendees: async (eventId: number): Promise<UnpaidAttendeesResponse> => {
    return apiClient.get<UnpaidAttendeesResponse>(
      `/api/events/${eventId}/attendees/unpaid`
    );
  },

  /**
   * Fetch a Stripe Terminal connection token for Tap to Pay
   * Backend endpoint: POST /api/terminal/connection-token
   */
  fetchConnectionToken: async (): Promise<string> => {
    const res = await apiClient.post<{ secret: string }>('/api/terminal/connection-token', {});
    return res.secret;
  },

  /**
   * Get or create a Stripe Terminal location for an event
   * Backend endpoint: GET /api/events/:eventId/terminal/location
   */
  fetchTerminalLocation: async (eventId: number): Promise<string> => {
    const res = await apiClient.get<{ locationId: string }>(`/api/events/${eventId}/terminal/location`);
    return res.locationId;
  },

  /**
   * Initiate collect-at-door payment for a guest
   * Backend endpoint: POST /api/events/:eventId/payments/collect-at-door
   */
  collectAtDoor: async (
    eventId: number,
    data: CollectAtDoorRequest
  ): Promise<CollectAtDoorResponse> => {
    return apiClient.post<CollectAtDoorResponse>(
      `/api/events/${eventId}/payments/collect-at-door`,
      data
    );
  },
};
