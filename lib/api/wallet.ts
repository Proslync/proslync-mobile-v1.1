// Wallet API - Google Wallet & Apple Wallet integration
import { apiClient } from './client';


export interface GoogleWalletResponse {
  success: boolean;
  data: {
    saveUrl?: string;
    jwt?: string;
  };
  message?: string;
  error?: string;
}

export async function addToGoogleWallet(membershipCardId: number): Promise<GoogleWalletResponse> {
  return apiClient.post<GoogleWalletResponse>(
    `/api/google-wallet/membership-cards/${membershipCardId}/add-to-wallet`
  );
}

export async function updateGoogleWalletCard(
  membershipCardId: number,
  updates: { points?: number; accountName?: string; status?: string }
): Promise<GoogleWalletResponse> {
  return apiClient.patch<GoogleWalletResponse>(
    `/api/google-wallet/membership-cards/${membershipCardId}`,
    updates
  );
}


export interface AppleWalletTokenResponse {
  success: boolean;
  data: {
    downloadUrl: string;
    userId: number;
  };
  message?: string;
  error?: string;
}

export async function generateAppleWalletToken(): Promise<AppleWalletTokenResponse> {
  return apiClient.post<AppleWalletTokenResponse>(
    '/api/apple-wallet/membership-cards/generate-token'
  );
}

export async function generateAppleWalletTicketToken(ticketNumber: string): Promise<AppleWalletTokenResponse> {
  return apiClient.post<AppleWalletTokenResponse>(
    `/api/apple-wallet/tickets/${ticketNumber}/generate-token`
  );
}


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

export async function getMembershipCard(): Promise<MembershipCardResponse> {
  return apiClient.get<MembershipCardResponse>('/api/membership-cards/me');
}


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
  destination?: string; // external account ID
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
  getAccountStatus: async (): Promise<StripeAccountStatus> => {
    return apiClient.get<StripeAccountStatus>('/api/stripe-connect/accounts/status');
  },

  createAccount: async (): Promise<CreateAccountResponse> => {
    return apiClient.post<CreateAccountResponse>('/api/stripe-connect/accounts/create');
  },

  getOnboardingLink: async (): Promise<OnboardingLinkResponse> => {
    return apiClient.post<OnboardingLinkResponse>('/api/stripe-connect/accounts/onboarding-link');
  },

  getDashboardLink: async (): Promise<DashboardLinkResponse> => {
    return apiClient.get<DashboardLinkResponse>('/api/stripe-connect/accounts/dashboard-link');
  },

  deleteAccount: async (): Promise<void> => {
    return apiClient.delete('/api/stripe-connect/accounts');
  },

  /**
   * Get account balance (available and pending)
   * Backend returns flat { available, pending, currency } — normalize to array format
   */
  getBalance: async (): Promise<BalanceResponse> => {
    const raw: any = await apiClient.get('/api/stripe-connect/payouts/balance');
    const currency = raw.currency ?? 'usd';

    return {
      available: Array.isArray(raw.available)
        ? raw.available
        : [{ amount: raw.available ?? 0, currency }],
      pending: Array.isArray(raw.pending)
        ? raw.pending
        : [{ amount: raw.pending ?? 0, currency }],
    };
  },

  getExternalAccounts: async (): Promise<ExternalAccountsResponse> => {
    const raw: any = await apiClient.get('/api/stripe-connect/payouts/external-accounts');
    // Backend may return flat array or { data: [...] }
    return {
      data: Array.isArray(raw) ? raw : (raw.data ?? []),
      hasMore: raw.hasMore ?? false,
    };
  },

  /**
   * Get earnings list with filtering and pagination
   * Maps backend field names to our app's interface
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

    const raw: any = await apiClient.get(endpoint);

    // Map backend fields → app fields
    return {
      earnings: (raw.earnings ?? []).map((e: any): EarningsItem => ({
        id: e.id,
        eventId: e.eventId,
        eventName: e.eventName,
        grossAmount: e.totalAmount ?? e.grossAmount ?? 0,
        platformFee: e.platformFee ?? 0,
        netAmount: e.organizerAmount ?? e.netAmount ?? 0,
        status: e.status,
        createdAt: e.createdAt,
        transferredAt: e.transferredAt,
      })),
      pagination: raw.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 },
      summary: {
        totalGross: raw.summary?.totalEarnings ?? raw.summary?.totalGross ?? 0,
        totalPlatformFees: raw.summary?.totalPlatformFees ?? 0,
        totalNet: (raw.summary?.totalEarnings ?? 0) - (raw.summary?.totalPlatformFees ?? 0),
        pendingAmount: raw.summary?.totalPending ?? raw.summary?.pendingAmount ?? 0,
        transferredAmount: raw.summary?.totalTransferred ?? raw.summary?.transferredAmount ?? 0,
      },
    };
  },

  transferFunds: async (): Promise<TransferFundsResponse> => {
    return apiClient.post<TransferFundsResponse>('/api/stripe-connect/payouts/transfer');
  },

  createPayout: async (data: CreatePayoutDto): Promise<CreatePayoutResponse> => {
    return apiClient.post<CreatePayoutResponse>('/api/stripe-connect/payouts/create', data);
  },

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
