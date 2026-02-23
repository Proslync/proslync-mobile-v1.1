// Pricing types for ticket tiers and promo codes

export interface PricingRule {
  id: number;
  name: string;
  price: number;
  currency: string;
  capacity?: number;
  availableFrom?: string | null;
  availableUntil?: string | null;
  displayOrder: number;
  isAvailable: boolean;
  soldCount: number;
}

export interface TicketTier {
  id: number;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  currentPricing?: PricingRule;
  pricing: PricingRule[];
  soldCount: number;
  capacity?: number;
}

export interface PromoCode {
  id: number;
  eventId: number;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivePromo {
  id: number;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  eventId: number;
  eventName: string;
  eventFlyerUrl?: string;
  validUntil?: string;
}

// Request types for CRUD operations

export interface CreateTierRequest {
  name: string;
  description?: string;
  displayOrder?: number;
}

export interface CreatePricingRuleRequest {
  name: string;
  price: number;
  currency?: string;
  capacity?: number;
  availableFrom?: string;
  availableUntil?: string;
  displayOrder?: number;
}

export interface CreatePromoCodeRequest {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses?: number | null;
  validFrom: string;
  validUntil?: string | null;
  isActive?: boolean;
  isPublic?: boolean;
}

export interface ValidatePromoCodeRequest {
  code: string;
  tierId?: number;
}

export interface ValidatePromoCodeResponse {
  isValid: boolean;
  promoCode?: PromoCode;
  discountAmount?: number;
  originalPrice?: number;
  finalPrice?: number;
  error?: string;
}
