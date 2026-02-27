// React Query mutation hooks for pricing CRUD operations

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pricingApi } from '@/lib/api/pricing';
import { TIERS_QUERY_KEY } from './use-ticket-tiers';
import type {
  CreateTierRequest,
  CreatePricingRuleRequest,
  CreatePromoCodeRequest,
  PromoCode,
} from '@/lib/types/pricing.types';

const PROMO_CODES_QUERY_KEY = 'event-promo-codes';


export function useGetPromoCodes(eventId: number) {
  return useQuery<PromoCode[]>({
    queryKey: [PROMO_CODES_QUERY_KEY, eventId],
    queryFn: () => pricingApi.getPromoCodes(eventId),
    enabled: Boolean(eventId),
    staleTime: 60 * 1000,
  });
}


export function useCreateTier(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTierRequest) => pricingApi.createTier(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TIERS_QUERY_KEY, eventId] });
    },
  });
}

export function useUpdateTier(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tierId, data }: { tierId: number; data: Partial<CreateTierRequest> }) =>
      pricingApi.updateTier(eventId, tierId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TIERS_QUERY_KEY, eventId] });
    },
  });
}

export function useDeleteTier(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tierId: number) => pricingApi.deleteTier(eventId, tierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TIERS_QUERY_KEY, eventId] });
    },
  });
}


export function useCreatePricingRule(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tierId, data }: { tierId: number; data: CreatePricingRuleRequest }) =>
      pricingApi.createPricingRule(eventId, tierId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TIERS_QUERY_KEY, eventId] });
    },
  });
}

export function useUpdatePricingRule(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tierId,
      pricingId,
      data,
    }: {
      tierId: number;
      pricingId: number;
      data: Partial<CreatePricingRuleRequest>;
    }) => pricingApi.updatePricingRule(eventId, tierId, pricingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TIERS_QUERY_KEY, eventId] });
    },
  });
}

export function useDeletePricingRule(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tierId, pricingId }: { tierId: number; pricingId: number }) =>
      pricingApi.deletePricingRule(eventId, tierId, pricingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TIERS_QUERY_KEY, eventId] });
    },
  });
}


export function useCreatePromoCode(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePromoCodeRequest) => pricingApi.createPromoCode(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROMO_CODES_QUERY_KEY, eventId] });
    },
  });
}

export function useUpdatePromoCode(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      promoId,
      data,
    }: {
      promoId: number;
      data: Partial<CreatePromoCodeRequest>;
    }) => pricingApi.updatePromoCode(eventId, promoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROMO_CODES_QUERY_KEY, eventId] });
    },
  });
}

export function useDeletePromoCode(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (promoId: number) => pricingApi.deletePromoCode(eventId, promoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROMO_CODES_QUERY_KEY, eventId] });
    },
  });
}

export function useTogglePromoCodeActive(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ promoId, isActive }: { promoId: number; isActive: boolean }) =>
      pricingApi.togglePromoCodeActive(eventId, promoId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROMO_CODES_QUERY_KEY, eventId] });
    },
  });
}
