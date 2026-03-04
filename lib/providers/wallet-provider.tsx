// Wallet Provider - Connects to Stripe Connect API for earnings & payouts

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react';
import * as Clipboard from 'expo-clipboard';
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
import { eventsApi } from '../api/events';
import { ticketsApi } from '../api/tickets';
import { pricingApi } from '../api/pricing';
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
        userName: authUser.userName,
        avatarUrl: authUser.avatar?.url,
        isVerified: authUser.isVerified,
        statusTier: 'Standard',
        memberSince: authUser.createdAt || new Date().toISOString(),
        membershipCardId: authUser.id || 0,
      };
    }
    return {
      id: '0',
      name: 'Status Member',
      statusTier: 'Standard',
      memberSince: new Date().toISOString(),
      membershipCardId: 0,
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
  const [events, setEvents] = useState<WalletEventCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Stripe account status
  const fetchAccountStatus = useCallback(async () => {
    try {
      const status = await stripeConnectApi.getAccountStatus();
      setStripeAccountStatus(status);
      return status;
    } catch (error) {
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

  // Fetch active promos from backend
  const fetchPromos = useCallback(async () => {
    try {
      const promos = await pricingApi.getActivePromos();
      const mapped: Offer[] = promos.map((p) => {
        const discount =
          p.discountType === 'percentage'
            ? `${p.discountValue}% off`
            : `$${p.discountValue.toFixed(2)} off`;
        return {
          id: String(p.id),
          code: p.code,
          title: `${discount} tickets`,
          subtitle: p.eventName,
          eventId: p.eventId,
          isClaimed: false,
          expiresAt: p.validUntil,
        };
      });
      setOffers(mapped);
    } catch (error) {
      setOffers([]);
    }
  }, []);

  // Fetch user's upcoming tickets and RSVP events
  const fetchTicketsAndEvents = useCallback(async () => {
    const nowMs = Date.now();
    const cards: WalletEventCard[] = [];
    const seenEventIds = new Set<string>();

    const fmtDate = (d: Date) =>
      d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      + ' \u2022 '
      + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

    const isUpcoming = (startDate?: string, endDate?: string): boolean => {
      if (endDate) {
        const ms = new Date(endDate).getTime();
        if (!isNaN(ms)) return ms > nowMs;
      }
      if (startDate) {
        const ms = new Date(startDate).getTime();
        if (!isNaN(ms)) return ms + 12 * 60 * 60 * 1000 > nowMs;
      }
      return false;
    };

    // 1. Paid tickets
    try {
      const response = await ticketsApi.getMyTickets({
        status: 'upcoming', limit: 100, sortBy: 'eventDate', sortOrder: 'asc',
      });
      for (const t of response?.tickets ?? []) {
        if (t.status !== 'active') continue;
        // Skip finished/cancelled events
        const eventStatus = t.event?.status;
        if (eventStatus === 'finished' || eventStatus === 'cancelled') continue;
        if (!isUpcoming(t.event?.startDate, t.event?.endDate)) continue;
        const eid = t.eventId.toString();
        seenEventIds.add(eid);
        cards.push({
          id: eid,
          ticketId: t.id,
          ticketStatus: t.status,
          title: t.event?.name || 'Event',
          dateTime: t.event?.startDate || t.createdAt,
          endDateTime: t.event?.endDate || undefined,
          dateTimeLabel: fmtDate(new Date(t.event?.startDate || t.createdAt)),
          venueName: t.event?.venue?.name || 'TBA',
          flyerUrl: t.event?.flyer?.url || t.event?.imageUrl || '',
          isEarningEnabled: false,
          isPaid: t.event?.isPaid ?? false,
          pricePaid: t.pricePaid ? Number(t.pricePaid) : undefined,
        });
      }
    } catch (error) {
      console.error('[Wallet] Error fetching tickets:', error);
    }

    // 2. Free RSVP events (no ticket)
    try {
      const allEvents = await eventsApi.getEvents({ limit: 100 });
      for (const e of allEvents) {
        if (!e.isUserRegistered) continue;
        if (seenEventIds.has(e.id.toString())) continue;
        if (e.status === 'finished' || e.status === 'cancelled') continue;
        if (!isUpcoming(e.startDate, e.endDate)) continue;
        cards.push({
          id: e.id.toString(),
          title: e.name,
          dateTime: e.startDate,
          endDateTime: e.endDate,
          dateTimeLabel: fmtDate(new Date(e.startDate)),
          venueName: e.venue?.name || e.location || 'TBA',
          flyerUrl: e.flyer?.url || e.imageUrl || '',
          isEarningEnabled: false,
          isPaid: e.isPaid ?? false,
        });
      }
    } catch (error) {
      console.error('[Wallet] Error fetching RSVP events:', error);
    }

    // Sort by start date ascending
    cards.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    setEvents(cards);
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

        // Open onboarding URL
        if (response.onboardingUrl) {
          await Linking.openURL(response.onboardingUrl);
        }
      } else if (!status.chargesEnabled || !status.payoutsEnabled) {
        // Account exists but not fully active — get fresh onboarding link
        // This handles both incomplete details AND pending requirements
        const response = await stripeConnectApi.getOnboardingLink();
        await Linking.openURL(response.url);
      }

      // Refresh status after setup
      await fetchAccountStatus();
    } catch (error) {
      console.error('Error setting up Stripe account:', error);
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
      console.error('Error opening Stripe dashboard:', error);
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
        destination: methodId,
      });


      // Refresh balance and transactions
      await Promise.all([fetchBalance(), fetchTransactions()]);
    } catch (error) {
      console.error('Error creating payout:', error);
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

  // Note: Adding payout methods is done through Stripe Dashboard
  const addPayoutMethod = useCallback(async () => {
    // Open Stripe dashboard for adding payout methods
    await openStripeDashboard();
  }, [openStripeDashboard]);

  const removePayoutMethod = useCallback((methodId: string) => {
    // Payout method removal is done through Stripe Dashboard
  }, []);

  const setDefaultPayoutMethod = useCallback((methodId: string) => {
    // Default payout method is set through Stripe Dashboard
  }, []);

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

    // Fetch all wallet data
    const loadWalletData = async () => {
      setIsLoading(true);
      try {
        const [status] = await Promise.all([
          fetchAccountStatus(),
          fetchTicketsAndEvents(),
          fetchPromos(),
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
        console.error('Error loading wallet data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWalletData();
  }, [isAuthenticated, fetchAccountStatus, fetchBalance, fetchPayoutMethods, fetchTransactions, fetchTicketsAndEvents, fetchPromos]);

  const refreshWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      const [status] = await Promise.all([
        fetchAccountStatus(),
        fetchTicketsAndEvents(),
        fetchPromos(),
      ]);

      if (status?.hasAccount && status.payoutsEnabled) {
        await Promise.all([
          fetchBalance(),
          fetchPayoutMethods(),
          fetchTransactions(),
        ]);
      }
    } catch (error) {
      console.error('Error refreshing wallet:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAccountStatus, fetchBalance, fetchPayoutMethods, fetchTransactions, fetchTicketsAndEvents, fetchPromos]);

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
