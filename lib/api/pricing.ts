// Pricing API - Ticket tiers and promo codes
import { apiClient } from './client';
import type {
  TicketTier,
  ValidatePromoCodeRequest,
  ValidatePromoCodeResponse,
} from '../types/pricing.types';

export const pricingApi = {
  /**
   * Get ticket tiers for an event
   * Backend endpoint: GET /api/events/:eventId/pricing/tiers
   */
  getTiers: async (eventId: number): Promise<TicketTier[]> => {
    return apiClient.get<TicketTier[]>(`/api/events/${eventId}/pricing/tiers`);
  },

  /**
   * Validate a promo code for an event
   * Backend endpoint: POST /api/events/:eventId/promo-codes/validate
   */
  validatePromoCode: async (
    eventId: number,
    data: ValidatePromoCodeRequest
  ): Promise<ValidatePromoCodeResponse> => {
    return apiClient.post<ValidatePromoCodeResponse>(
      `/api/events/${eventId}/promo-codes/validate`,
      data
    );
  },
};
