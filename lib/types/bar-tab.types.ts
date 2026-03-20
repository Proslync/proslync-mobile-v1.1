// Bar tab types for venue bar ordering and payment

export type BarTabStatus = 'open' | 'closed' | 'paid' | 'voided';

export type BarOrderItemStatus = 'pending' | 'served' | 'voided';

export interface BarOrderItem {
  id: number;
  tabId: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  status: BarOrderItemStatus;
  notes?: string;
  addedBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface BarTab {
  id: number;
  eventId: number;
  venueId: number;
  customerId?: number;
  customerName: string;
  status: BarTabStatus;
  items: BarOrderItem[];
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
  paymentIntentId?: string;
  openedBy: number;
  closedBy?: number;
  openedAt: string;
  closedAt?: string;
  paidAt?: string;
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
