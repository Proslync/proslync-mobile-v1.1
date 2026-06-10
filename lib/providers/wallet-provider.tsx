// Wallet Provider - Connects to Stripe Connect API for earnings & payouts

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react';
import { InteractionManager } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  WalletContextType,
  WalletUser,
  WalletBalances,
  PayoutMethod,
  WalletTransaction,
  Offer,
} from '../types/wallet.types';
import { useAuth } from './auth-provider';
import {
  stripeConnectApi,
  StripeAccountStatus,
  ExternalAccount,
  EarningsItem,
  PayoutItem,
} from '../api/wallet';
import { logger } from '../dev/logger';

const log = logger.tagged('wallet');

// Extended context type with Stripe Connect features
interface ExtendedWalletContextType extends WalletContextType {
  stripeAccountStatus: StripeAccountStatus | null;
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
        userName: authUser.userName,
        avatarUrl: authUser.avatar?.url,
        isVerified: authUser.isVerified,
        statusTier: 'Standard',
        memberSince: authUser.createdAt || new Date().toISOString(),
        membershipCardId: authUser.id || 0,
        isProfileComplete: authUser.isProfileComplete ?? false,
      };
    }
    return {
      id: '0',
      name: 'Status Member',
      statusTier: 'Standard',
      memberSince: new Date().toISOString(),
      membershipCardId: 0,
      isProfileComplete: false,
    };
  }, [authUser]);

  const [balances, setBalances] = useState<WalletBalances>({
    availableCents: 0,
    pendingCents: 0,
    lifetimeCents: 0,
    minimumCashOutCents: 100, // $1 minimum
  });
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Stripe account status
  const fetchAccountStatus = useCallback(async () => {
    try {
      const status = await stripeConnectApi.getAccountStatus();
      setStripeAccountStatus(status);
      return status;
    } catch (error) {
      setStripeAccountStatus({
        hasAccount: false,
        onboardingStatus: 'pending',
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      });
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
    }
  }, []);

  // Fetch payout methods (external accounts)
  const fetchPayoutMethods = useCallback(async () => {
    try {
      const response = await stripeConnectApi.getExternalAccounts();
      const methods = (response.data ?? []).map(externalAccountToPayoutMethod);
      setPayoutMethods(methods);
    } catch (error) {
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
    }
  }, []);

  // NIL-specific wallet offers and cards will be reintroduced from deal/brand
  // sources. Ticket/event feeds were removed with the nightlife API.
  const fetchWalletCards = useCallback(async () => {
    setOffers([]);
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
        destination: methodId,
      });


      // Refresh balance and transactions
      await Promise.all([fetchBalance(), fetchTransactions()]);
    } catch (error) {
      log.error('Error creating payout:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [payoutMethods, balances.availableCents, fetchBalance, fetchTransactions]);

  const claimOffer = useCallback((offerId: string) => {
    const offer = offers.find((o) => o.id === offerId);
    if (offer?.code) {
      Clipboard.setStringAsync(offer.code);
    }
    setOffers((prev) =>
      prev.map((o) =>
        o.id === offerId ? { ...o, isClaimed: true } : o
      )
    );
  }, [offers]);

  // Payout method management is now handled via hooks in WithdrawalSheet
  const addPayoutMethod = useCallback(async () => {}, []);
  const removePayoutMethod = useCallback((_methodId: string) => {}, []);
  const setDefaultPayoutMethod = useCallback((_methodId: string) => {}, []);

  const clearPendingTransaction = useCallback((transactionId: string) => {
    // This is handled by the backend/Stripe webhooks
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

    // Defer wallet data fetch until animations settle
    setIsLoading(true);
    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        const [status] = await Promise.all([
          fetchAccountStatus(),
          fetchWalletCards(),
        ]);

        if (status?.hasAccount && status.payoutsEnabled) {
          await Promise.all([
            fetchBalance(),
            fetchPayoutMethods(),
            fetchTransactions(),
          ]);
        }
      } catch (error) {
        log.error('Error loading wallet data:', error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => task.cancel();
  }, [isAuthenticated, fetchAccountStatus, fetchBalance, fetchPayoutMethods, fetchTransactions, fetchWalletCards]);

  const refreshWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      const [status] = await Promise.all([
        fetchAccountStatus(),
        fetchWalletCards(),
      ]);

      if (status?.hasAccount && status.payoutsEnabled) {
        await Promise.all([
          fetchBalance(),
          fetchPayoutMethods(),
          fetchTransactions(),
        ]);
      }
    } catch (error) {
      log.error('Error refreshing wallet:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAccountStatus, fetchBalance, fetchPayoutMethods, fetchTransactions, fetchWalletCards]);

  const value = React.useMemo<ExtendedWalletContextType>(
    () => ({
      user,
      balances,
      payoutMethods,
      transactions,
      offers,
      events: [],
      isLoading,
      withdraw,
      claimOffer,
      addPayoutMethod,
      removePayoutMethod,
      setDefaultPayoutMethod,
      clearPendingTransaction,
      refreshWallet,
      stripeAccountStatus,
    }),
    [user, balances, payoutMethods, transactions, offers, isLoading, withdraw, claimOffer, addPayoutMethod, removePayoutMethod, setDefaultPayoutMethod, clearPendingTransaction, refreshWallet, stripeAccountStatus],
  );

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
