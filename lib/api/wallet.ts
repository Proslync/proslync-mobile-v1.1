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
  id: number;
  cardNumber: string;
  userId: number;
  userFirstName: string;
  userLastName: string;
  userPhoneNumber: string;
  pdf417Payload: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getMembershipCard(): Promise<MembershipCardResponse> {
  return apiClient.get<MembershipCardResponse>('/api/membership-cards/my-card');
}


export interface StripeRequirements {
  currentlyDue: string[];
  eventuallyDue: string[];
  pastDue: string[];
}

export interface StripeAccountStatus {
  hasAccount: boolean;
  accountId?: string;
  onboardingStatus: 'pending' | 'in_progress' | 'complete' | 'rejected' | 'restricted';
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements?: StripeRequirements;
  futureRequirements?: StripeRequirements;
  disabledReason?: string;
}

// Disabled reason message helper
export interface DisabledReasonInfo {
  title: string;
  description: string;
  isRecoverable: boolean;
}

export function getDisabledReasonMessage(reason?: string): DisabledReasonInfo {
  if (!reason) {
    return { title: 'Account Restricted', description: 'Your account has restrictions. Contact support for help.', isRecoverable: false };
  }

  if (reason === 'requirements.pending_verification') {
    return { title: 'Under Review', description: 'Your account is being verified by Stripe. This usually takes a few minutes.', isRecoverable: true };
  }

  if (reason === 'requirements.past_due') {
    return { title: 'Action Required', description: 'Stripe needs additional information to keep your account active.', isRecoverable: true };
  }

  if (reason.startsWith('rejected.')) {
    const subReason = reason.replace('rejected.', '');
    const descriptions: Record<string, string> = {
      fraud: 'Your account was declined due to suspected fraudulent activity.',
      terms_of_service: 'Your account was declined for violating Stripe\'s terms of service.',
      listed: 'Your account was declined because it appears on a prohibited persons list.',
      other: 'Your account was declined. Please contact support for more information.',
    };
    return {
      title: 'Account Declined',
      description: descriptions[subReason] || descriptions.other,
      isRecoverable: false,
    };
  }

  return { title: 'Account Restricted', description: 'Your account has restrictions. Please resolve outstanding requirements.', isRecoverable: true };
}

// Remediation field mapping
export type RemediationTarget = 'personal_info' | 'address' | 'bank_account' | 'document' | 'unknown';

export interface RemediationItem {
  requirement: string;
  target: RemediationTarget;
  label: string;
}

const REQUIREMENT_MAP: { pattern: string; target: RemediationTarget; label: string }[] = [
  { pattern: 'individual.dob', target: 'personal_info', label: 'Date of birth' },
  { pattern: 'individual.ssn_last_4', target: 'personal_info', label: 'SSN (last 4 digits)' },
  { pattern: 'individual.first_name', target: 'personal_info', label: 'First name' },
  { pattern: 'individual.last_name', target: 'personal_info', label: 'Last name' },
  { pattern: 'individual.address', target: 'address', label: 'Address' },
  { pattern: 'individual.verification.document', target: 'document', label: 'Identity document' },
  { pattern: 'external_account', target: 'bank_account', label: 'Bank account or debit card' },
  { pattern: 'documents.bank_account_ownership_verification', target: 'document', label: 'Bank account verification document' },
];

export function getRequiredRemediationFields(requirements?: StripeRequirements): RemediationItem[] {
  if (!requirements) return [];

  const allDue = [...(requirements.currentlyDue ?? []), ...(requirements.pastDue ?? [])];
  if (allDue.length === 0) return [];

  const seen = new Set<string>();
  const items: RemediationItem[] = [];

  for (const req of allDue) {
    const mapping = REQUIREMENT_MAP.find(m => req.includes(m.pattern));
    const key = mapping ? mapping.target : req;
    if (seen.has(key)) continue;
    seen.add(key);

    if (mapping) {
      items.push({ requirement: req, target: mapping.target, label: mapping.label });
    } else {
      items.push({ requirement: req, target: 'unknown', label: req });
    }
  }

  return items;
}

export interface CreateAccountResponse {
  accountId: string;
  onboardingUrl: string;
}

export interface OnboardingLinkResponse {
  url: string;
  expiresAt: string;
}

// Custom account onboarding types
export interface OnboardingPersonalInfo {
  firstName: string;
  lastName: string;
  dobDay: number;
  dobMonth: number;
  dobYear: number;
  ssnLast4: string;
}

export interface OnboardingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface OnboardingBankAccount {
  routingNumber: string;
  accountNumber: string;
  accountHolderName: string;
}

export interface CreateCustomAccountRequest {
  personalInfo: OnboardingPersonalInfo;
  address: OnboardingAddress;
  bankAccount?: OnboardingBankAccount;
  cardToken?: string;
}

export interface CreateCustomAccountResponse {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onboardingStatus: string;
  requirements?: {
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
  };
}

export interface UpdateCustomAccountRequest {
  personalInfo?: OnboardingPersonalInfo;
  address?: OnboardingAddress;
  bankAccount?: OnboardingBankAccount;
  cardToken?: string;
  fullSsn?: string;
}

export interface AddBankAccountRequest {
  routingNumber: string;
  accountNumber: string;
  accountHolderName: string;
}

export interface AddDebitCardRequest {
  token: string;
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

// Document verification types
export type DocumentType = 'bank_account_ownership_verification' | 'identity_document';
export type DocumentSide = 'front' | 'back';

export interface UploadDocumentResponse {
  fileId: string;
  documentType: DocumentType;
  success: boolean;
}

// Document requirement detection helpers
const DOCUMENT_REQUIREMENT_PATTERNS = [
  'documents.bank_account_ownership_verification',
  'individual.verification.document',
];

function collectDueRequirements(
  requirements?: StripeRequirements,
  futureRequirements?: StripeRequirements,
): string[] {
  const items: string[] = [];
  if (requirements) {
    items.push(...(requirements.currentlyDue ?? []), ...(requirements.pastDue ?? []), ...(requirements.eventuallyDue ?? []));
  }
  if (futureRequirements) {
    items.push(...(futureRequirements.currentlyDue ?? []), ...(futureRequirements.pastDue ?? []), ...(futureRequirements.eventuallyDue ?? []));
  }
  return items;
}

export function needsDocumentUpload(
  requirements?: StripeRequirements,
  futureRequirements?: StripeRequirements,
): boolean {
  const allDue = collectDueRequirements(requirements, futureRequirements);
  return allDue.some(req =>
    DOCUMENT_REQUIREMENT_PATTERNS.some(pattern => req.includes(pattern))
  );
}

export function getRequiredDocumentTypes(
  requirements?: StripeRequirements,
  futureRequirements?: StripeRequirements,
): DocumentType[] {
  const allDue = collectDueRequirements(requirements, futureRequirements);
  const types: DocumentType[] = [];

  if (allDue.some(req => req.includes('documents.bank_account_ownership_verification'))) {
    types.push('bank_account_ownership_verification');
  }
  if (allDue.some(req => req.includes('individual.verification.document'))) {
    types.push('identity_document');
  }

  return types;
}

export const stripeConnectApi = {
  getAccountStatus: async (): Promise<StripeAccountStatus> => {
    return apiClient.get<StripeAccountStatus>('/api/stripe-connect/accounts/status');
  },

  createAccount: async (): Promise<CreateAccountResponse> => {
    return apiClient.post<CreateAccountResponse>('/api/stripe-connect/accounts/create');
  },

  createCustomAccount: async (data: CreateCustomAccountRequest): Promise<CreateCustomAccountResponse> => {
    return apiClient.post<CreateCustomAccountResponse>('/api/stripe-connect/accounts/create', data);
  },

  updateCustomAccount: async (data: UpdateCustomAccountRequest): Promise<CreateCustomAccountResponse> => {
    return apiClient.patch<CreateCustomAccountResponse>('/api/stripe-connect/accounts/update', data);
  },

  getOnboardingLink: async (): Promise<OnboardingLinkResponse> => {
    return apiClient.post<OnboardingLinkResponse>('/api/stripe-connect/accounts/onboarding-link');
  },

  uploadDocument: async (
    fileUri: string,
    documentType: DocumentType,
    documentSide: DocumentSide = 'front',
  ): Promise<UploadDocumentResponse> => {
    const fileName = fileUri.split('/').pop() || 'document.jpg';
    const fileType = fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
    const queryParams = `documentType=${documentType}&documentSide=${documentSide}`;

    return apiClient.uploadFile<UploadDocumentResponse>(
      `/api/stripe-connect/accounts/upload-document?${queryParams}`,
      { uri: fileUri, name: fileName, type: fileType },
      'file',
    );
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

  addBankAccount: async (data: AddBankAccountRequest): Promise<ExternalAccount> => {
    return apiClient.post<ExternalAccount>('/api/stripe-connect/payouts/external-accounts/bank', data);
  },

  addDebitCard: async (data: AddDebitCardRequest): Promise<ExternalAccount> => {
    return apiClient.post<ExternalAccount>('/api/stripe-connect/payouts/external-accounts/card', data);
  },

  removeExternalAccount: async (externalAccountId: string): Promise<void> => {
    return apiClient.delete(`/api/stripe-connect/payouts/external-accounts/${externalAccountId}`);
  },

  setDefaultExternalAccount: async (externalAccountId: string): Promise<ExternalAccount> => {
    return apiClient.patch<ExternalAccount>(`/api/stripe-connect/payouts/external-accounts/${externalAccountId}/default`);
  },
};
