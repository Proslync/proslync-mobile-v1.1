// Payments API - Stripe payment intents
import { apiClient } from './client';
import type {
  CreatePaymentIntentRequest,
  CreatePaymentIntentResponse,
  PaymentStatusResponse,
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
};
