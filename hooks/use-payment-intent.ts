// React Query hooks for payment intent
import { useMutation, useQuery } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api/payments';
import type {
  CreatePaymentIntentRequest,
  CreatePaymentIntentResponse,
  PaymentStatusResponse,
} from '@/lib/types/payments.types';

export const PAYMENT_STATUS_QUERY_KEY = 'payment-status';

/**
 * Hook for creating a payment intent
 */
export function useCreatePaymentIntent(eventId: number) {
  return useMutation<CreatePaymentIntentResponse, Error, CreatePaymentIntentRequest>({
    mutationFn: (data) => paymentsApi.createPaymentIntent(eventId, data),
  });
}

/**
 * Hook for polling payment status
 */
export function usePaymentStatus(
  paymentIntentId: string | null,
  options?: { enabled?: boolean }
) {
  return useQuery<PaymentStatusResponse>({
    queryKey: [PAYMENT_STATUS_QUERY_KEY, paymentIntentId],
    queryFn: () => paymentsApi.getPaymentStatus(paymentIntentId!),
    enabled: Boolean(paymentIntentId) && (options?.enabled ?? true),
    refetchInterval: (data) => {
      // Poll every 2 seconds while processing, stop when complete
      if (data?.state?.data?.status === 'processing') {
        return 2000;
      }
      return false;
    },
    staleTime: 0, // Always fetch fresh status
  });
}
