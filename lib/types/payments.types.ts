// Payment types for Stripe integration

export interface CustomerAddress {
  country: string; // ISO 3166-1 alpha-2 country code (e.g., "US")
  postalCode?: string;
  state?: string;
  city?: string;
  line1?: string;
}

export interface CreatePaymentIntentRequest {
  tierId: number;
  pricingId: number;
  promoCode?: string;
  quantity?: number;
  customerAddress?: CustomerAddress;
  metadata?: {
    referralCode?: string;
    source?: string;
  };
}

export interface PaymentBreakdown {
  basePrice: number; // Subtotal before tax and discount
  discount: number; // Discount amount
  subtotal: number; // Subtotal after discount, before tax
  tax: number; // Tax amount
  finalPrice: number; // Final total including tax
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number; // in cents (includes tax)
  currency: string;
  breakdown: PaymentBreakdown;
}

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'refunded';

export interface PaymentStatusResponse {
  status: PaymentStatus;
  ticketId?: number;
  error?: string;
}
