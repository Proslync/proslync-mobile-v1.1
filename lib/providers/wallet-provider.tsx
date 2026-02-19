// Wallet Provider - Connects to Stripe Connect API for earnings & payouts

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react';
import * as Linking from 'expo-linking';
import {
  WalletContextType,
  WalletUser,
  WalletBalances,
  PayoutMethod,
  WalletTransaction,
  Offer,
  WalletEventCard,
} from '../types/wallet.types';
import {
  MOCK_WALLET_USER,
  MOCK_OFFERS,
} from '../data/wallet-mock';
import { eventsApi } from '../api/events';
import { useAuth } from './auth-provider';
import {
  stripeConnectApi,
  StripeAccountStatus,
  ExternalAccount,
  EarningsItem,
  PayoutItem,
} from '../api/wallet';

// Extended context type with Stripe Connect features
interface ExtendedWalletContextType extends WalletContextType {
  stripeAccountStatus: StripeAccountStatus | null;
  setupStripeAccount: () => Promise<void>;
  openStripeDashboard: () => Promise<void>;
}

const WalletContext = createContext<ExtendedWalletContextType | null>(null);

interface WalletProviderProps {
  children: ReactNode;
}

// Helper: Convert ExternalAccount to PayoutMethod
function externalAccountToPayoutMethod(account: ExternalAccount): PayoutMethod {
  return {
    id: account.id,
    type: account.object === 'bank_account' ? 'bank' : 'debit',
    label: account.bank_name || account.brand || 'Account',
    last4: account.last4,
    isDefault: account.default_for_currency,
  };
}

// Helper: Convert EarningsItem to WalletTransaction
function earningsToTransaction(earning: EarningsItem): WalletTransaction {
  return {
    id: `earning-${earning.id}`,
    type: earning.status === 'pending' ? 'pending' : 'earned',
    title: earning.eventName,
    subtitle: `Net: $${(earning.netAmount / 100).toFixed(2)}`,
    amountCents: earning.netAmount,
    status: earning.status === 'pending' ? 'pending' : 'completed',
    createdAt: earning.createdAt,
    eventId: String(earning.eventId),
  };
}

// Helper: Convert PayoutItem to WalletTransaction
function payoutToTransaction(payout: PayoutItem): WalletTransaction {
  const statusMap: Record<string, 'pending' | 'completed'> = {
    pending: 'pending',
    in_transit: 'pending',
    paid: 'completed',
    failed: 'completed',
    canceled: 'completed',
  };

  return {
    id: `payout-${payout.id}`,
    type: 'withdrawal',
    title: `Withdrawal to ${payout.destination.bankName || payout.destination.brand || 'Account'} ••${payout.destination.last4}`,
    subtitle: payout.status === 'paid' ? 'Completed' : payout.status,
    amountCents: -payout.amount, // Negative for withdrawals
    status: statusMap[payout.status] || 'pending',
    createdAt: payout.created,
  };
}

export function WalletProvider({ children }: WalletProviderProps) {
  const { user: authUser, isAuthenticated } = useAuth();

  // Stripe Connect state
  const [stripeAccountStatus, setStripeAccountStatus] = useState<StripeAccountStatus | null>(null);

  // Build wallet user from authenticated user data
  const user = useMemo<WalletUser>(() => {
    if (authUser) {
      const displayName = authUser.firstName && authUser.lastName
        ? `${authUser.firstName} ${authUser.lastName}`
        : authUser.userName || authUser.firstName || 'Status Member';

      return {
        id: String(authUser.id),
        name: displayName,
        statusTier: MOCK_WALLET_USER.statusTier, // TODO: Get from membership API
        memberSince: authUser.createdAt || MOCK_WALLET_USER.memberSince,
        membershipCardId: MOCK_WALLET_USER.membershipCardId, // TODO: Get from membership API
      };
    }
    return MOCK_WALLET_USER;
  }, [authUser]);

  const [balances, setBalances] = useState<WalletBalances>({
    availableCents: 0,
    pendingCents: 0,
    lifetimeCents: 0,
    minimumCashOutCents: 100, // $1 minimum
  });
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [offers, setOffers] = useState<Offer[]>(MOCK_OFFERS);
  const [events, setEvents] = useState<WalletEventCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Stripe account status
  const fetchAccountStatus = useCallback(async () => {
    try {
      const status = await stripeConnectApi.getAccountStatus();
      setStripeAccountStatus(status);
      return status;
    } catch (error) {
      console.log('[Wallet] No Stripe account or error fetching status:', error);
      setStripeAccountStatus({ hasAccount: false, chargesEnabled: false, payoutsEnabled: false, detailsSubmitted: false });
      return null;
    }
  }, []);

  // Fetch balance from Stripe
  const fetchBalance = useCallback(async () => {
    try {
      const balanceData = await stripeConnectApi.getBalance();

      // Sum up available and pending amounts (usually just USD)
      const availableCents = Array.isArray(balanceData.available)
        ? balanceData.available.reduce((sum, b) => sum + b.amount, 0)
        : 0;
      const pendingCents = Array.isArray(balanceData.pending)
        ? balanceData.pending.reduce((sum, b) => sum + b.amount, 0)
        : 0;

      setBalances(prev => ({
        ...prev,
        availableCents,
        pendingCents,
      }));
    } catch (error) {
      console.log('[Wallet] Error fetching balance:', error);
    }
  }, []);

  // Fetch payout methods (external accounts)
  const fetchPayoutMethods = useCallback(async () => {
    try {
      const response = await stripeConnectApi.getExternalAccounts();
      const methods = (response.data ?? []).map(externalAccountToPayoutMethod);
      setPayoutMethods(methods);
    } catch (error) {
      console.log('[Wallet] Error fetching payout methods:', error);
      setPayoutMethods([]);
    }
  }, []);

  // Fetch transactions (earnings + payouts)
  const fetchTransactions = useCallback(async () => {
    try {
      const [earningsResponse, payoutsResponse] = await Promise.all([
        stripeConnectApi.getEarnings({ limit: 50 }),
        stripeConnectApi.getPayouts({ limit: 50 }),
      ]);

      // Convert and combine transactions
      const earningsTxs = earningsResponse.earnings.map(earningsToTransaction);
      const payoutTxs = payoutsResponse.payouts.map(payoutToTransaction);

      // Update lifetime earnings from summary
      setBalances(prev => ({
        ...prev,
        lifetimeCents: earningsResponse.summary.totalNet,
      }));

      // Combine and sort by date (newest first)
      const allTransactions = [...earningsTxs, ...payoutTxs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setTransactions(allTransactions);
    } catch (error) {
      console.log('[Wallet] Error fetching transactions:', error);
    }
  }, []);

  // Fetch RSVP'd events from the events API
  const fetchRsvpEvents = useCallback(async () => {
    try {
      const allEvents = await eventsApi.getEvents({ limit: 100 });
      const now = new Date();
      const rsvpEvents: WalletEventCard[] = allEvents
        .filter((e) => e.isUserRegistered && new Date(e.startDate) >= now)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .map((e) => {
          const start = new Date(e.startDate);
          const dateTimeLabel = start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
            + ' \u2022 '
            + start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
          return {
            id: e.id.toString(),
            title: e.name,
            dateTime: e.startDate,
            dateTimeLabel,
            venueName: e.venue?.name || e.location || 'TBA',
            flyerUrl: e.flyer?.url || e.imageUrl || 'https://picsum.photos/seed/event/400/600',
            isEarningEnabled: false,
          };
        });
      setEvents(rsvpEvents);
    } catch (error) {
      console.log('[Wallet] Error fetching RSVP events:', error);
    }
  }, []);

  // Setup Stripe Connect account
  const setupStripeAccount = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check if account exists
      const status = await fetchAccountStatus();

      if (!status?.hasAccount) {
        // Create new account
        const response = await stripeConnectApi.createAccount();
        console.log('[Wallet] Created Stripe account:', response.accountId);

        // Open onboarding URL
        if (response.onboardingUrl) {
          await Linking.openURL(response.onboardingUrl);
        }
      } else if (!status.detailsSubmitted) {
        // Account exists but onboarding not complete - get new link
        const response = await stripeConnectApi.getOnboardingLink();
        await Linking.openURL(response.url);
      }

      // Refresh status after setup
      await fetchAccountStatus();
    } catch (error) {
      console.error('[Wallet] Error setting up Stripe account:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAccountStatus]);

  // Open Stripe Express Dashboard
  const openStripeDashboard = useCallback(async () => {
    try {
      const response = await stripeConnectApi.getDashboardLink();
      await Linking.openURL(response.url);
    } catch (error) {
      console.error('[Wallet] Error opening Stripe dashboard:', error);
      throw error;
    }
  }, []);

  // Withdraw (create payout)
  const withdraw = useCallback(async (amountCents: number, methodId: string) => {
    const method = payoutMethods.find((m) => m.id === methodId);
    if (!method || amountCents > balances.availableCents) {
      throw new Error('Invalid withdrawal request');
    }

    try {
      setIsLoading(true);

      const response = await stripeConnectApi.createPayout({
        amount: amountCents,
        destinationId: methodId,
      });

      console.log('[Wallet] Payout created:', response);

      // Refresh balance and transactions
      await Promise.all([fetchBalance(), fetchTransactions()]);
    } catch (error) {
      console.error('[Wallet] Error creating payout:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [payoutMethods, balances.availableCents, fetchBalance, fetchTransactions]);

  const claimOffer = useCallback((offerId: string) => {
    setOffers((prev) =>
      prev.map((offer) =>
        offer.id === offerId ? { ...offer, isClaimed: true } : offer
      )
    );
  }, []);

  // Note: Adding payout methods is done through Stripe Dashboard
  const addPayoutMethod = useCallback(async () => {
    // Open Stripe dashboard for adding payout methods
    await openStripeDashboard();
  }, [openStripeDashboard]);

  const removePayoutMethod = useCallback((methodId: string) => {
    // Payout method removal is done through Stripe Dashboard
    console.log('[Wallet] Remove payout method - open Stripe dashboard');
  }, []);

  const setDefaultPayoutMethod = useCallback((methodId: string) => {
    // Default payout method is set through Stripe Dashboard
    console.log('[Wallet] Set default payout method - open Stripe dashboard');
  }, []);

  const clearPendingTransaction = useCallback((transactionId: string) => {
    // This is handled by the backend/Stripe webhooks
    console.log('[Wallet] Clear pending transaction:', transactionId);
  }, []);

  // Initial data fetch when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      // Reset state when logged out
      setStripeAccountStatus(null);
      setBalances({
        availableCents: 0,
        pendingCents: 0,
        lifetimeCents: 0,
        minimumCashOutCents: 100,
      });
      setPayoutMethods([]);
      setTransactions([]);
      return;
    }

    // Fetch all wallet data
    const loadWalletData = async () => {
      setIsLoading(true);
      try {
        const [status] = await Promise.all([
          fetchAccountStatus(),
          fetchRsvpEvents(),
        ]);

        // Only fetch financial data if account is set up
        if (status?.hasAccount && status.payoutsEnabled) {
          await Promise.all([
            fetchBalance(),
            fetchPayoutMethods(),
            fetchTransactions(),
          ]);
        }
      } catch (error) {
        console.error('[Wallet] Error loading wallet data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWalletData();
  }, [isAuthenticated, fetchAccountStatus, fetchBalance, fetchPayoutMethods, fetchTransactions, fetchRsvpEvents]);

  const refreshWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      const [status] = await Promise.all([
        fetchAccountStatus(),
        fetchRsvpEvents(),
      ]);

      if (status?.hasAccount && status.payoutsEnabled) {
        await Promise.all([
          fetchBalance(),
          fetchPayoutMethods(),
          fetchTransactions(),
        ]);
      }
    } catch (error) {
      console.error('[Wallet] Error refreshing wallet:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAccountStatus, fetchBalance, fetchPayoutMethods, fetchTransactions, fetchRsvpEvents]);

  const value: ExtendedWalletContextType = {
    user,
    balances,
    payoutMethods,
    transactions,
    offers,
    events,
    isLoading,
    withdraw,
    claimOffer,
    addPayoutMethod,
    removePayoutMethod,
    setDefaultPayoutMethod,
    clearPendingTransaction,
    refreshWallet,
    // Extended Stripe Connect features
    stripeAccountStatus,
    setupStripeAccount,
    openStripeDashboard,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet(): ExtendedWalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
