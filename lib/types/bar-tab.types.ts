// Bar tab types for venue bar ordering and payment

export type BarTabStatus = 'open' | 'closed' | 'paid' | 'voided';

export type BarOrderItemStatus = 'pending' | 'served' | 'voided';

// Matches PosOrderItem entity from backend
export interface BarOrderItem {
  id: number;
  tabId: number;
  menuItemId?: number;
  name: string;
  price: number; // cents
  quantity: number;
  status: BarOrderItemStatus;
  modifiers?: unknown[];
  voidReason?: string;
  compReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Matches PosTab entity from backend
export interface BarTab {
  id: number;
  eventId?: number;
  venueId: number;
  shiftId: number;
  staffId: number;
  guestName?: string;
  status: BarTabStatus;
  orderItems: BarOrderItem[];
  subtotal: number; // cents
  taxAmount: number; // cents
  tipAmount: number; // cents
  total: number; // cents
  paymentId?: number;
  openedAt: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Request / Response types ---

export interface OpenTabRequest {
  customerName: string;
  customerId?: number;
}

export interface OpenTabResponse {
  tab: BarTab;
}

export interface AddItemsRequest {
  items: Array<{
    menuItemId: number;
    quantity: number;
    notes?: string;
  }>;
}

export interface AddItemsResponse {
  tab: BarTab;
}

export interface CloseTabRequest {
  tipCents?: number;
}

export interface CloseTabResponse {
  tab: BarTab;
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export interface VoidItemResponse {
  tab: BarTab;
}

export interface ActiveTabsResponse {
  tabs: BarTab[];
  totalOpenTabs: number;
  totalRevenueCents: number;
}

export interface BarTabSummary {
  totalOpenTabs: number;
  totalPaidTabs: number;
  totalRevenueCents: number;
  averageTabCents: number;
}

export interface MarkTabPaidResponse {
  tab: BarTab;
}
