export type BarOrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunded';

export interface QuickOrderItem {
  id: number;
  orderId: number;
  menuItemId: number | null;
  name: string;
  priceCents: number;
  quantity: number;
  createdAt: string;
}

export interface BarOrder {
  id: number;
  eventId: number;
  venueId: number;
  bartenderId: number | null;
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
  status: BarOrderStatus;
  paymentIntentId: string | null;
  paymentMethod: string;
  items: QuickOrderItem[];
  createdAt: string;
  updatedAt: string;
}

// Request types
export interface CreateOrderRequest {
  items: { menuItemId: number; quantity: number }[];
  tipCents: number;
}

export interface PayOrderRequest {
  paymentIntentId: string;
}

// Response types
export interface CreateOrderResponse {
  order: BarOrder;
  clientSecret: string;
  paymentIntentId: string;
}

export interface OrderListResponse {
  orders: BarOrder[];
  total: number;
}
