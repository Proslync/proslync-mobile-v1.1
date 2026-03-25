import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { barOrdersApi } from '@/lib/api/bar-orders';
import type {
  CreateOrderRequest,
  PayOrderRequest,
} from '@/lib/types/bar-order.types';
import { BAR_SUMMARY_KEY } from './use-bar-tabs';

export const BAR_ORDERS_KEY = 'bar-orders';

export function useCreateOrder(eventId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderRequest) =>
      barOrdersApi.createOrder(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BAR_ORDERS_KEY, eventId] });
    },
  });
}

export function usePayOrder(eventId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: number;
      data: PayOrderRequest;
    }) => barOrdersApi.payOrder(eventId, orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BAR_ORDERS_KEY, eventId] });
      queryClient.invalidateQueries({ queryKey: [BAR_SUMMARY_KEY, eventId] });
    },
  });
}

export function useCancelOrder(eventId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) =>
      barOrdersApi.cancelOrder(eventId, orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BAR_ORDERS_KEY, eventId] });
    },
  });
}

export function useBarOrders(
  eventId: number,
  params?: { page?: number; limit?: number; status?: string },
) {
  return useQuery({
    queryKey: [
      BAR_ORDERS_KEY,
      eventId,
      params?.page,
      params?.limit,
      params?.status,
    ],
    queryFn: () => barOrdersApi.getOrders(eventId, params),
    enabled: !!eventId,
    staleTime: 30_000,
  });
}
