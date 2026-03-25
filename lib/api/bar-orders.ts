import { apiClient } from './client';
import type {
  BarOrder,
  CreateOrderRequest,
  CreateOrderResponse,
  OrderListResponse,
  PayOrderRequest,
} from '../types/bar-order.types';

export const barOrdersApi = {
  createOrder: (eventId: number, data: CreateOrderRequest) =>
    apiClient.post<CreateOrderResponse>(
      `/api/events/${eventId}/bar/orders`,
      data,
    ),

  payOrder: (eventId: number, orderId: number, data: PayOrderRequest) =>
    apiClient.post<BarOrder>(
      `/api/events/${eventId}/bar/orders/${orderId}/pay`,
      data,
    ),

  cancelOrder: (eventId: number, orderId: number) =>
    apiClient.post<BarOrder>(
      `/api/events/${eventId}/bar/orders/${orderId}/cancel`,
    ),

  getOrders: (
    eventId: number,
    params?: { page?: number; limit?: number; status?: string },
  ) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    const qs = searchParams.toString();
    return apiClient.get<OrderListResponse>(
      `/api/events/${eventId}/bar/orders${qs ? `?${qs}` : ''}`,
    );
  },

  getOrder: (eventId: number, orderId: number) =>
    apiClient.get<BarOrder>(`/api/events/${eventId}/bar/orders/${orderId}`),
};
