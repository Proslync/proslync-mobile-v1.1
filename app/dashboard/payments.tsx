// Dashboard Payments Screen - Tabbed wallet dashboard with earnings, payouts, and overview

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { SegmentedControl } from '@/components/shared/segmented-control';
import {
  BalanceCard,
  OnboardingCard,
  EarningsList,
  PayoutsList,
  WithdrawalSheet,
  AccountStatusCard,
} from '@/components/wallet';
import { GlassSurface } from '@/components/glass/glass-surface';
import {
  useStripeAccountStatus,
  useStripeBalance,
  useExternalAccounts,
  useEarnings,
  usePayouts,
  useSetupStripeAccount,
  STRIPE_ACCOUNT_STATUS_KEY,
  STRIPE_BALANCE_KEY,
  STRIPE_EXTERNAL_ACCOUNTS_KEY,
  STRIPE_EARNINGS_KEY,
  STRIPE_PAYOUTS_KEY,
} from '@/hooks/use-wallet-queries';
import { stripeConnectApi, type EarningsItem, type PayoutItem } from '@/lib/api/wallet';
import type { WalletBalances, PayoutMethod } from '@/lib/types/wallet.types';

const TAB_SEGMENTS = ['Overview', 'Earnings', 'Payouts'];

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Helper: convert ExternalAccount to PayoutMethod for WithdrawalSheet
// Backend returns camelCase (type, bankName, defaultForCurrency)
function toPayoutMethod(account: any): PayoutMethod {
  return {
    id: account.id,
    type: (account.type ?? account.object) === 'bank_account' ? 'bank' : 'debit',
    label: account.bankName ?? account.bank_name ?? account.brand ?? 'Account',
    last4: account.last4,
    isDefault: account.defaultForCurrency ?? account.default_for_currency ?? false,
  };
}

export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedTab, setSelectedTab] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [withdrawalSheetVisible, setWithdrawalSheetVisible] = useState(false);

  // React Query hooks — all fetch independently (matching web app pattern)
  const { data: accountStatus, isLoading: statusLoading } = useStripeAccountStatus();
  const { data: balance } = useStripeBalance();
  const { data: externalAccounts } = useExternalAccounts();
  const { data: earningsData } = useEarnings();
  const { data: payoutsData } = usePayouts();
  const setupMutation = useSetupStripeAccount();

  // Account active = chargesEnabled && payoutsEnabled (matches web app)
  const isAccountActive = !!accountStatus?.chargesEnabled && !!accountStatus?.payoutsEnabled;
  const needsSetup = !isAccountActive;

  // Derived data
  const availableCents = Array.isArray(balance?.available)
    ? balance.available.reduce((sum, b) => sum + b.amount, 0)
    : 0;
  const pendingCents = Array.isArray(balance?.pending)
    ? balance.pending.reduce((sum, b) => sum + b.amount, 0)
    : 0;
  const payoutMethods = (externalAccounts?.data ?? []).map(toPayoutMethod);
  const canWithdraw = availableCents >= 100;

  // Build balances object for WithdrawalSheet
  const balancesForSheet: WalletBalances = {
    availableCents,
    pendingCents,
    lifetimeCents: earningsData?.summary?.totalNet ?? 0,
    minimumCashOutCents: 100,
  };

  const handleSetup = async () => {
    try {
      setIsSettingUp(true);
      await setupMutation.mutateAsync();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to set up payout account');
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleOpenDashboard = async () => {
    try {
      const response = await stripeConnectApi.getDashboardLink();
      await Linking.openURL(response.url);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to open Stripe dashboard');
    }
  };

  const handleWithdraw = async (amountCents: number, methodId: string) => {
    try {
      await stripeConnectApi.createPayout({ amount: amountCents, destinationId: methodId });
      queryClient.invalidateQueries({ queryKey: [STRIPE_BALANCE_KEY] });
      queryClient.invalidateQueries({ queryKey: [STRIPE_PAYOUTS_KEY] });
      Alert.alert('Success', 'Your withdrawal has been submitted!');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to process withdrawal');
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [STRIPE_ACCOUNT_STATUS_KEY] }),
      queryClient.invalidateQueries({ queryKey: [STRIPE_BALANCE_KEY] }),
      queryClient.invalidateQueries({ queryKey: [STRIPE_EXTERNAL_ACCOUNTS_KEY] }),
      queryClient.invalidateQueries({ queryKey: [STRIPE_EARNINGS_KEY] }),
      queryClient.invalidateQueries({ queryKey: [STRIPE_PAYOUTS_KEY] }),
    ]);
    setIsRefreshing(false);
  }, [queryClient]);

  // Loading state
  if (statusLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <DarkGradientBg />
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading payments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DarkGradientBg />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payments</Text>
        <View style={styles.headerButton} />
      </Animated.View>

      {/* Account Status - always visible (matches web app) */}
      {accountStatus && (
        <AccountStatusCard
          accountStatus={accountStatus}
          onContinueSetup={needsSetup ? handleSetup : undefined}
          isSettingUp={isSettingUp}
        />
      )}

      {needsSetup ? (
        /* Onboarding */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#fff" />
          }
        >
          <OnboardingCard
            onSetup={handleSetup}
            isSettingUp={isSettingUp}
            accountStatus={accountStatus}
          />
        </ScrollView>
      ) : (
        /* Main tabbed content — single ScrollView so everything scrolls together */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#fff" />
          }
        >
          <BalanceCard
            availableCents={availableCents}
            pendingCents={balancesForSheet.pendingCents}
            lifetimeCents={balancesForSheet.lifetimeCents}
            onWithdraw={() => setWithdrawalSheetVisible(true)}
          />
          <SegmentedControl
            segments={TAB_SEGMENTS}
            selectedIndex={selectedTab}
            onSelect={setSelectedTab}
          />

          {selectedTab === 0 && (
            <OverviewTab
              earnings={earningsData?.earnings ?? []}
              payouts={payoutsData?.payouts ?? []}
            />
          )}
          {selectedTab === 1 && <EarningsList />}
          {selectedTab === 2 && (
            <PayoutsList
              onWithdraw={() => setWithdrawalSheetVisible(true)}
              canWithdraw={canWithdraw}
            />
          )}
        </ScrollView>
      )}

      {/* Withdrawal Sheet */}
      <WithdrawalSheet
        visible={withdrawalSheetVisible}
        onClose={() => setWithdrawalSheetVisible(false)}
        balances={balancesForSheet}
        payoutMethods={payoutMethods}
        onWithdraw={handleWithdraw}
        onAddPayoutMethod={handleOpenDashboard}
      />
    </View>
  );
}

// ── Overview Tab ────────────────────────────────────────────

interface OverviewTabProps {
  earnings: EarningsItem[];
  payouts: PayoutItem[];
}

function OverviewTab({
  earnings,
  payouts,
}: OverviewTabProps) {
  // Combine and sort recent activity (last 10)
  type ActivityItem = { id: string; type: 'earning' | 'payout'; title: string; date: string; amount: number; positive: boolean };

  const recentActivity: ActivityItem[] = [
    ...earnings.slice(0, 10).map((e): ActivityItem => ({
      id: `e-${e.id}`,
      type: 'earning',
      title: e.eventName,
      date: e.createdAt,
      amount: e.netAmount,
      positive: true,
    })),
    ...payouts.slice(0, 10).map((p): ActivityItem => ({
      id: `p-${p.id}`,
      type: 'payout',
      title: `${p.destination.bankName || p.destination.brand || 'Account'} ••${p.destination.last4}`,
      date: p.created,
      amount: p.amount,
      positive: false,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <View style={styles.overviewContent}>
      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivity.length > 0 ? (
          <GlassSurface fill="subtle" cornerRadius="md" style={styles.activityList}>
            {recentActivity.map((item) => (
              <View key={item.id} style={styles.activityItem}>
                <View style={[styles.activityIcon, item.positive ? styles.earningIcon : styles.payoutIcon]}>
                  <Ionicons
                    name={item.positive ? 'arrow-down' : 'arrow-up'}
                    size={14}
                    color="#fff"
                  />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.activityDate}>
                    {new Date(item.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[styles.activityAmount, item.positive ? styles.positiveAmount : styles.negativeAmount]}>
                  {item.positive ? '+' : '-'}{formatCents(item.amount)}
                </Text>
              </View>
            ))}
          </GlassSurface>
        ) : (
          <GlassSurface fill="subtle" cornerRadius="md" style={styles.emptyActivity}>
            <Ionicons name="receipt-outline" size={40} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>No activity yet</Text>
            <Text style={styles.emptyHint}>Your earnings and withdrawals will appear here</Text>
          </GlassSurface>
        )}
      </View>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  overviewContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  // Sections
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    marginBottom: 10,
  },
  // Activity
  activityList: {
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  activityIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningIcon: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  payoutIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  activityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: 'Lato_600SemiBold',
    color: '#fff',
  },
  activityDate: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  activityAmount: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  positiveAmount: {
    color: '#22c55e',
  },
  negativeAmount: {
    color: '#ef4444',
  },
  emptyActivity: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.3)',
    marginTop: 4,
    textAlign: 'center',
  },
});
