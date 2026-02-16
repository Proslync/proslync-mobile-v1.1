// Pricing API - Ticket tiers, pricing rules, and promo codes
import { apiClient } from './client';
import type {
  TicketTier,
  PricingRule,
  PromoCode,
  CreateTierRequest,
  CreatePricingRuleRequest,
  CreatePromoCodeRequest,
  ValidatePromoCodeRequest,
  ValidatePromoCodeResponse,
} from '../types/pricing.types';

export const pricingApi = {
  // ── Tiers ──────────────────────────────────────────────

  getTiers: async (eventId: number): Promise<TicketTier[]> => {
    return apiClient.get<TicketTier[]>(`/api/events/${eventId}/pricing/tiers`);
  },

  createTier: async (eventId: number, data: CreateTierRequest): Promise<TicketTier> => {
    return apiClient.post<TicketTier>(`/api/events/${eventId}/pricing/tiers`, data);
  },

  updateTier: async (
    eventId: number,
    tierId: number,
    data: Partial<CreateTierRequest>,
  ): Promise<TicketTier> => {
    return apiClient.put<TicketTier>(`/api/events/${eventId}/pricing/tiers/${tierId}`, data);
  },

  deleteTier: async (eventId: number, tierId: number): Promise<void> => {
    return apiClient.delete(`/api/events/${eventId}/pricing/tiers/${tierId}`);
  },

  // ── Pricing Rules ──────────────────────────────────────

  getPricingRules: async (eventId: number, tierId: number): Promise<PricingRule[]> => {
    return apiClient.get<PricingRule[]>(
      `/api/events/${eventId}/pricing/tiers/${tierId}/pricing`,
    );
  },

  createPricingRule: async (
    eventId: number,
    tierId: number,
    data: CreatePricingRuleRequest,
  ): Promise<PricingRule> => {
    return apiClient.post<PricingRule>(
      `/api/events/${eventId}/pricing/tiers/${tierId}/pricing`,
      data,
    );
  },

  updatePricingRule: async (
    eventId: number,
    tierId: number,
    pricingId: number,
    data: Partial<CreatePricingRuleRequest>,
  ): Promise<PricingRule> => {
    return apiClient.put<PricingRule>(
      `/api/events/${eventId}/pricing/tiers/${tierId}/pricing/${pricingId}`,
      data,
    );
  },

  deletePricingRule: async (
    eventId: number,
    tierId: number,
    pricingId: number,
  ): Promise<void> => {
    return apiClient.delete(
      `/api/events/${eventId}/pricing/tiers/${tierId}/pricing/${pricingId}`,
    );
  },

  // ── Promo Codes ────────────────────────────────────────

  getPromoCodes: async (eventId: number): Promise<PromoCode[]> => {
    return apiClient.get<PromoCode[]>(`/api/events/${eventId}/promo-codes`);
  },

  createPromoCode: async (eventId: number, data: CreatePromoCodeRequest): Promise<PromoCode> => {
    return apiClient.post<PromoCode>(`/api/events/${eventId}/promo-codes`, data);
  },

  updatePromoCode: async (
    eventId: number,
    promoId: number,
    data: Partial<CreatePromoCodeRequest>,
  ): Promise<PromoCode> => {
    return apiClient.put<PromoCode>(`/api/events/${eventId}/promo-codes/${promoId}`, data);
  },

  deletePromoCode: async (eventId: number, promoId: number): Promise<void> => {
    return apiClient.delete(`/api/events/${eventId}/promo-codes/${promoId}`);
  },

  togglePromoCodeActive: async (eventId: number, promoId: number): Promise<PromoCode> => {
    return apiClient.patch<PromoCode>(
      `/api/events/${eventId}/promo-codes/${promoId}/toggle-active`,
      {},
    );
  },

  validatePromoCode: async (
    eventId: number,
    data: ValidatePromoCodeRequest,
  ): Promise<ValidatePromoCodeResponse> => {
    return apiClient.post<ValidatePromoCodeResponse>(
      `/api/events/${eventId}/promo-codes/validate`,
      data,
    );
  },
};
