// Wallet Types

export type StatusTier =
  | 'Newcomer'
  | 'Regular'
  | 'Preferred'
  | 'Insider'
  | 'A-List'
  | 'Icon'
  | 'Phantom';

export interface WalletUser {
  id: string;
  name: string;
  statusTier: StatusTier;
  memberSince: string;
  membershipCardId?: number;
}

export interface WalletBalances {
  availableCents: number;
  pendingCents: number;
  lifetimeCents: number;
  minimumCashOutCents: number;
}

export type PayoutMethodType = 'bank' | 'debit';

export interface PayoutMethod {
  id: string;
  type: PayoutMethodType;
  label: string;
  last4: string;
  isDefault: boolean;
}

export type TransactionType = 'earned' | 'pending' | 'adjustment' | 'withdrawal';
export type TransactionStatus = 'pending' | 'completed';

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  title: string;
  subtitle?: string;
  amountCents: number;
  status?: TransactionStatus;
  createdAt: string;
  eventId?: string;
}

export interface Offer {
  id: string;
  title: string;
  subtitle: string;
  eligibility: string;
  isClaimed: boolean;
  expiresAt?: string;
}

export interface WalletEventCard {
  id: string;
  title: string;
  dateTime: string;
  dateTimeLabel: string;
  venueName: string;
  flyerUrl: string;
  isEarningEnabled: boolean;
  perksLabel?: string;
  isRecommended?: boolean;
}

export type ActivityFilter = 'all' | 'earned' | 'withdrawals';

export interface WalletState {
  user: WalletUser;
  balances: WalletBalances;
  payoutMethods: PayoutMethod[];
  transactions: WalletTransaction[];
  offers: Offer[];
  events: WalletEventCard[];
  isLoading: boolean;
}

export interface WalletActions {
  withdraw: (amountCents: number, methodId: string) => void | Promise<void>;
  claimOffer: (offerId: string) => void;
  addPayoutMethod: (method: Omit<PayoutMethod, 'id'>) => void | Promise<void>;
  removePayoutMethod: (methodId: string) => void;
  setDefaultPayoutMethod: (methodId: string) => void;
  clearPendingTransaction: (transactionId: string) => void;
  refreshWallet: () => Promise<void>;
}

export interface WalletContextType extends WalletState, WalletActions {}

// Tier perks mapping
export const TIER_PERKS: Record<StatusTier, string[]> = {
  Newcomer: ['Early access to select events', 'Birthday reward'],
  Regular: ['5% cashback on tickets', 'Early access to select events'],
  Preferred: ['Line skip at select venues', '10% cashback on tickets', 'Priority support'],
  Insider: ['Line skip at all venues', '15% cashback', 'VIP lounge access', 'Priority support'],
  'A-List': ['Complimentary entry', '20% cashback', 'VIP table upgrades', 'Dedicated concierge'],
  Icon: ['All A-List perks', 'Private event invites', '25% cashback', 'Exclusive merch'],
  Phantom: ['Unlimited access', 'Maximum cashback', 'Owner-level treatment', 'Secret events'],
};
