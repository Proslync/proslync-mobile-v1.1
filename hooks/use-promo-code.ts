// React Query hook for promo code validation
import { useMutation } from '@tanstack/react-query';
import { pricingApi } from '@/lib/api/pricing';
import type { ValidatePromoCodeRequest } from '@/lib/types/pricing.types';

export function useValidatePromoCode(eventId: number) {
  return useMutation({
    mutationFn: (data: ValidatePromoCodeRequest) =>
      pricingApi.validatePromoCode(eventId, data),
  });
}
