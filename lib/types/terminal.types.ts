// Terminal (Tap to Pay) types

export interface TerminalConnectionTokenResponse {
  secret: string;
}

export interface TerminalLocationResponse {
  locationId: string;
}

export interface CreateTerminalPaymentIntentRequest {
  guestId: number;
  tierId?: number;
  pricingId?: number;
  customAmountCents?: number;
}

export interface CreateTerminalPaymentIntentResponse {
  paymentIntentId: string;
  amount: number;
  currency: string;
}
