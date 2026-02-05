// Wallet API - Google Wallet & Apple Wallet integration
import { apiClient } from './client';

// ============ Google Wallet ============

export interface GoogleWalletResponse {
  success: boolean;
  data: {
    saveUrl?: string;
    jwt?: string;
  };
  message?: string;
  error?: string;
}

/**
 * Add membership card to Google Wallet
 * Returns a save URL or JWT for adding the card
 */
export async function addToGoogleWallet(membershipCardId: number): Promise<GoogleWalletResponse> {
  return apiClient.post<GoogleWalletResponse>(
    `/api/google-wallet/membership-cards/${membershipCardId}/add-to-wallet`
  );
}

/**
 * Update Google Wallet membership card
 */
export async function updateGoogleWalletCard(
  membershipCardId: number,
  updates: { points?: number; accountName?: string; status?: string }
): Promise<GoogleWalletResponse> {
  return apiClient.patch<GoogleWalletResponse>(
    `/api/google-wallet/membership-cards/${membershipCardId}`,
    updates
  );
}

// ============ Apple Wallet ============

export interface AppleWalletTokenResponse {
  success: boolean;
  data: {
    downloadUrl: string;
    userId: number;
  };
  message?: string;
  error?: string;
}

/**
 * Generate download token for Apple Wallet membership card
 * Returns a download URL for the .pkpass file
 */
export async function generateAppleWalletToken(): Promise<AppleWalletTokenResponse> {
  return apiClient.post<AppleWalletTokenResponse>(
    '/api/apple-wallet/membership-cards/generate-token'
  );
}

/**
 * Generate download token for Apple Wallet event ticket
 */
export async function generateAppleWalletTicketToken(ticketNumber: string): Promise<AppleWalletTokenResponse> {
  return apiClient.post<AppleWalletTokenResponse>(
    `/api/apple-wallet/tickets/${ticketNumber}/generate-token`
  );
}

// ============ Membership Card ============

export interface MembershipCardResponse {
  success: boolean;
  data: {
    id: number;
    userId: number;
    tier: string;
    points: number;
    memberSince: string;
    accountName: string;
  };
  message?: string;
}

/**
 * Get user's membership card info
 */
export async function getMembershipCard(): Promise<MembershipCardResponse> {
  return apiClient.get<MembershipCardResponse>('/api/membership-cards/me');
}

// ============ Stripe Connect - Earnings & Payouts ============

export interface StripeAccountStatus {
  hasAccount: boolean;
  accountId?: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements?: {
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
  };
}

export interface CreateAccountResponse {
  accountId: string;
  onboardingUrl: string;
}

export interface OnboardingLinkResponse {
  url: string;
  expiresAt: string;
}

export interface DashboardLinkResponse {
  url: string;
  expiresAt: string;
}

export interface BalanceResponse {
  available: {
    amount: number;
    currency: string;
  }[];
  pending: {
    amount: number;
    currency: string;
  }[];
}

export interface ExternalAccount {
  id: string;
  object: 'bank_account' | 'card';
  bank_name?: string;
  brand?: string;
  last4: string;
  routing_number?: string;
  country: string;
  currency: string;
  default_for_currency: boolean;
}

export interface ExternalAccountsResponse {
  data: ExternalAccount[];
  hasMore: boolean;
}

export interface EarningsItem {
  id: number;
  eventId: number;
  eventName: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  status: 'pending' | 'transferred' | 'refunded';
  createdAt: string;
  transferredAt?: string;
}

export interface EarningsListResponse {
  earnings: EarningsItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalGross: number;
    totalPlatformFees: number;
    totalNet: number;
    pendingAmount: number;
    transferredAmount: number;
  };
}

export interface GetEarningsParams {
  page?: number;
  limit?: number;
  eventId?: number;
  status?: 'pending' | 'transferred' | 'refunded';
  startDate?: string;
  endDate?: string;
}

export interface CreatePayoutDto {
  amount: number; // in cents
  currency?: string;
  destinationId?: string; // external account ID
}

export interface PayoutItem {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'in_transit' | 'paid' | 'failed' | 'canceled';
  arrivalDate: string;
  created: string;
  destination: {
    id: string;
    type: 'bank_account' | 'card';
    last4: string;
    bankName?: string;
    brand?: string;
  };
}

export interface CreatePayoutResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
  arrivalDate: string;
  destination: {
    id: string;
    type: string;
    last4: string;
  };
}

export interface PayoutsListResponse {
  payouts: PayoutItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetPayoutsParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface TransferFundsResponse {
  transferredAmount: number;
  transferredCount: number;
  skippedCount: number;
  transfers: Array<{
    earningsId: number;
    amount: number;
    transferId: string;
  }>;
}

export const stripeConnectApi = {
  /**
   * Get Stripe Connect account status
   */
  getAccountStatus: async (): Promise<StripeAccountStatus> => {
    return apiClient.get<StripeAccountStatus>('/api/stripe-connect/accounts/status');
  },

  /**
   * Create a new Stripe Connect Express account
   */
  createAccount: async (): Promise<CreateAccountResponse> => {
    return apiClient.post<CreateAccountResponse>('/api/stripe-connect/accounts/create');
  },

  /**
   * Get onboarding link for account setup
   */
  getOnboardingLink: async (): Promise<OnboardingLinkResponse> => {
    return apiClient.post<OnboardingLinkResponse>('/api/stripe-connect/accounts/onboarding-link');
  },

  /**
   * Get Stripe Express Dashboard link
   */
  getDashboardLink: async (): Promise<DashboardLinkResponse> => {
    return apiClient.get<DashboardLinkResponse>('/api/stripe-connect/accounts/dashboard-link');
  },

  /**
   * Delete Stripe Connect account
   */
  deleteAccount: async (): Promise<void> => {
    return apiClient.delete('/api/stripe-connect/accounts');
  },

  /**
   * Get account balance (available and pending)
   */
  getBalance: async (): Promise<BalanceResponse> => {
    return apiClient.get<BalanceResponse>('/api/stripe-connect/payouts/balance');
  },

  /**
   * Get external accounts (bank accounts & debit cards)
   */
  getExternalAccounts: async (): Promise<ExternalAccountsResponse> => {
    return apiClient.get<ExternalAccountsResponse>('/api/stripe-connect/payouts/external-accounts');
  },

  /**
   * Get earnings list with filtering and pagination
   */
  getEarnings: async (params?: GetEarningsParams): Promise<EarningsListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.eventId) queryParams.append('eventId', params.eventId.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/api/stripe-connect/earnings?${queryString}`
      : '/api/stripe-connect/earnings';

    return apiClient.get<EarningsListResponse>(endpoint);
  },

  /**
   * Transfer held funds to connected account (for completed events)
   */
  transferFunds: async (): Promise<TransferFundsResponse> => {
    return apiClient.post<TransferFundsResponse>('/api/stripe-connect/payouts/transfer');
  },

  /**
   * Create a payout (withdrawal) to external account
   */
  createPayout: async (data: CreatePayoutDto): Promise<CreatePayoutResponse> => {
    return apiClient.post<CreatePayoutResponse>('/api/stripe-connect/payouts/create', data);
  },

  /**
   * Get payout history
   */
  getPayouts: async (params?: GetPayoutsParams): Promise<PayoutsListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/api/stripe-connect/payouts?${queryString}`
      : '/api/stripe-connect/payouts';

    return apiClient.get<PayoutsListResponse>(endpoint);
  },
};
