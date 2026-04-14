// Dashboard Payments Screen - Tabbed wallet dashboard with earnings, payouts, and overview

import { GlassSurface } from "@/components/glass/glass-surface";
import { DarkGradientBg } from "@/components/shared/dark-gradient-bg";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { useToast } from "@/components/shared/toast";
import {
  AccountStatusCard,
  BalanceCard,
  EarningsList,
  OnboardingCard,
  PayoutsList,
  WithdrawalSheet,
} from "@/components/wallet";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  STRIPE_ACCOUNT_STATUS_KEY,
  STRIPE_BALANCE_KEY,
  STRIPE_EARNINGS_KEY,
  STRIPE_EXTERNAL_ACCOUNTS_KEY,
  STRIPE_PAYOUTS_KEY,
  useEarnings,
  useExternalAccounts,
  usePayouts,
  useStripeAccountStatus,
  useStripeBalance,
  useDeleteStripeAccount,
} from "@/hooks/use-wallet-queries";
import { useAccountStatusSocket } from "@/hooks/use-account-status-socket";
import {
  stripeConnectApi,
  needsDocumentUpload,
  getRequiredRemediationFields,
  type EarningsItem,
  type PayoutItem,
  type StripeAccountStatus,
  type RemediationItem,
} from "@/lib/api/wallet";
import type { PayoutMethod, WalletBalances } from "@/lib/types/wallet.types";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GlassView } from 'expo-glass-effect';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { LinearGradient } from 'expo-linear-gradient';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeOutLeft,
  FadeOutRight,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatCents } from "@/lib/utils";

const TAB_SEGMENTS = ["Overview", "Earnings", "Payouts"];

// Helper: convert ExternalAccount to PayoutMethod for WithdrawalSheet
// Backend returns camelCase (type, bankName, defaultForCurrency)
function toPayoutMethod(account: any): PayoutMethod {
  return {
    id: account.id,
    type:
      (account.type ?? account.object) === "bank_account" ? "bank" : "debit",
    label: account.bankName ?? account.bank_name ?? account.brand ?? "Account",
    last4: account.last4,
    isDefault:
      account.defaultForCurrency ?? account.default_for_currency ?? false,
  };
}

export default function PaymentsScreen() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { setup, organizationId: orgIdParam } = useLocalSearchParams<{ setup?: string; organizationId?: string }>();
  const orgId = orgIdParam ? parseInt(orgIdParam, 10) : undefined;

  const [selectedTab, setSelectedTab] = useState(0);
  const previousTabRef = React.useRef(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [withdrawalSheetVisible, setWithdrawalSheetVisible] = useState(false);
  const [setupResult, setSetupResult] = useState<"success" | "pending" | null>(
    null,
  );
  const setupHandledRef = React.useRef(false);

  // Real-time account status updates via WebSocket
  useAccountStatusSocket({ enabled: true });

  const deleteAccount = useDeleteStripeAccount();

  // React Query hooks — all fetch independently (matching web app pattern)
  const { data: accountStatus, isLoading: statusLoading } =
    useStripeAccountStatus();
  const hasAccount = !!accountStatus?.hasAccount;
  const { data: balance } = useStripeBalance(hasAccount);
  const { data: externalAccounts } = useExternalAccounts(hasAccount);
  const { data: earningsData } = useEarnings(orgId ? { organizationId: orgId } : undefined, hasAccount);
  const { data: payoutsData } = usePayouts(undefined, hasAccount);
  // Handle return from Stripe onboarding deep link
  React.useEffect(() => {
    if (!setup || setupHandledRef.current) return;
    setupHandledRef.current = true;

    // Refetch account status from Stripe, then show result based on actual state
    queryClient
      .refetchQueries({ queryKey: [STRIPE_ACCOUNT_STATUS_KEY] })
      .then(() => {
        const fresh = queryClient.getQueryData<StripeAccountStatus>([
          STRIPE_ACCOUNT_STATUS_KEY,
        ]);
        if (fresh?.chargesEnabled && fresh?.payoutsEnabled) {
          setSetupResult("success");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          setSetupResult("pending");
        }
        setTimeout(() => setSetupResult(null), 4000);
      });
  }, [setup, queryClient]);

  // Account active = chargesEnabled && payoutsEnabled (matches web app)
  const isAccountActive =
    !!accountStatus?.chargesEnabled && !!accountStatus?.payoutsEnabled;
  const needsSetup = !isAccountActive;
  const hasDocRequirement = needsDocumentUpload(
    accountStatus?.requirements,
    accountStatus?.futureRequirements,
  );

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

  const handleRemediationPress = useCallback((item: RemediationItem) => {
    switch (item.target) {
      case 'personal_info':
        router.push('/stripe-onboarding?mode=update&step=0');
        break;
      case 'address':
        router.push('/stripe-onboarding?mode=update&step=1');
        break;
      case 'bank_account':
        router.push('/stripe-onboarding?mode=update&step=2');
        break;
      case 'document':
        router.push('/stripe-document-upload');
        break;
      default:
        toast.showError(`Unknown requirement: ${item.requirement}. Please contact support.`);
    }
  }, [router, toast]);

  const handleDeleteAccount = useCallback(async () => {
    try {
      await deleteAccount.mutateAsync();
      toast.showSuccess('Account deleted. You can set up a new one.');
    } catch (error: any) {
      toast.showError(error?.message || 'Failed to delete account');
    }
  }, [deleteAccount, toast]);

  const handleSetup = async () => {
    if (accountStatus?.hasAccount && needsDocumentUpload(accountStatus?.requirements, accountStatus?.futureRequirements)) {
      router.push("/stripe-document-upload");
    } else if (accountStatus?.hasAccount) {
      router.push("/stripe-onboarding?from=dashboard&mode=update");
    } else {
      router.push("/stripe-onboarding?from=dashboard");
    }
  };

  const handleWithdraw = async (amountCents: number, methodId: string) => {
    try {
      await stripeConnectApi.createPayout({
        amount: amountCents,
        destination: methodId,
      });
      queryClient.invalidateQueries({ queryKey: [STRIPE_BALANCE_KEY] });
      queryClient.invalidateQueries({ queryKey: [STRIPE_PAYOUTS_KEY] });
      toast.showSuccess("Your withdrawal has been submitted!");
    } catch (error: any) {
      toast.showError(error?.message || "Failed to process withdrawal");
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [STRIPE_ACCOUNT_STATUS_KEY] }),
      queryClient.invalidateQueries({ queryKey: [STRIPE_BALANCE_KEY] }),
      queryClient.invalidateQueries({
        queryKey: [STRIPE_EXTERNAL_ACCOUNTS_KEY],
      }),
      queryClient.invalidateQueries({ queryKey: [STRIPE_EARNINGS_KEY] }),
      queryClient.invalidateQueries({ queryKey: [STRIPE_PAYOUTS_KEY] }),
    ]);
    setIsRefreshing(false);
  }, [queryClient]);

  // Loading state
  if (statusLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.loadingContainer,
          { backgroundColor: '#f2f2f2' },
        ]}
      >
        <ActivityIndicator size="large" color="#000" />
        <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading payments...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#f2f2f2' }]}>

      {/* Pill row header */}
      <View style={[styles.pillRow, { paddingTop: insets.top + 16 }]}>
        <Pressable style={styles.pillIcon} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#000" />
        </Pressable>
        {TAB_SEGMENTS.map((label, index) => {
          const isActive = selectedTab === index;
          return (
            <Pressable
              key={label}
              style={styles.pillFilter}
              onPress={() => { previousTabRef.current = selectedTab; setSelectedTab(index); }}
            >
              {isLiquidGlassSupported ? (
                <LiquidGlassView effect="regular" style={StyleSheet.absoluteFill} />
              ) : (
                <View style={styles.pillGlassLayer} pointerEvents="none">
                  <GlassView {...liquidGlass.surface} tintColor={isActive ? 'rgba(0,0,0,0.12)' : 'transparent'} borderRadius={19} style={StyleSheet.absoluteFill} />
                </View>
              )}
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <LinearGradient colors={['#f2f2f2', 'rgba(242,242,242,0)']} style={styles.topFade} pointerEvents="none" />

      {/* Setup result banner */}
      {setupResult && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[
            styles.setupBanner,
            setupResult === "success"
              ? styles.setupBannerSuccess
              : styles.setupBannerPending,
          ]}
        >
          <Ionicons
            name={setupResult === "success" ? "checkmark-circle" : "time"}
            size={20}
            color="#fff"
          />
          <Text style={[styles.setupBannerText, { color: colors.text }]}>
            {setupResult === "success"
              ? "Payout account connected successfully!"
              : "Account setup is being reviewed by Stripe. This usually takes a few minutes."}
          </Text>
        </Animated.View>
      )}

      {/* Account Status - always visible (matches web app) */}
      {accountStatus && (
        <View style={styles.statusContainer}>
          <AccountStatusCard
            accountStatus={accountStatus}
            onContinueSetup={needsSetup ? handleSetup : undefined}
            isSettingUp={false}
          />
        </View>
      )}

      {needsSetup ? (
        /* Onboarding */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingTop: insets.top + 70, paddingBottom: insets.bottom + 20 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.text}
            />
          }
        >
          <View style={styles.onboardingContainer}>
            <OnboardingCard
              onSetup={handleSetup}
              onCheckStatus={handleRefresh}
              onDeleteAccount={handleDeleteAccount}
              onRemediationPress={handleRemediationPress}
              isSettingUp={false}
              isDeletingAccount={deleteAccount.isPending}
              accountStatus={accountStatus}
            />
          </View>
        </ScrollView>
      ) : (
        /* Main tabbed content — single ScrollView so everything scrolls together */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingTop: insets.top + 70, paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.text}
            />
          }
        >
          {/* Document upload warning banner */}
          {hasDocRequirement && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <TouchableOpacity
                style={styles.docBanner}
                onPress={() => router.push("/stripe-document-upload")}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color="#f59e0b"
                />
                <Text style={[styles.docBannerText, { color: colors.text }]}>
                  Document verification required. Tap to upload.
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            </Animated.View>
          )}
          {/* Future requirements info card */}
          {accountStatus?.futureRequirements &&
            ((accountStatus.futureRequirements.currentlyDue?.length ?? 0) > 0 ||
              (accountStatus.futureRequirements.eventuallyDue?.length ?? 0) > 0) && (
              <Animated.View entering={FadeInDown.duration(300)}>
                <GlassSurface
                  fill="subtle"
                  cornerRadius="md"
                  style={styles.futureReqCard}
                >
                  <View style={styles.futureReqHeader}>
                    <Ionicons
                      name="information-circle-outline"
                      size={20}
                      color="#3b82f6"
                    />
                    <Text style={[styles.futureReqTitle, { color: colors.text }]}>
                      Upcoming Requirements
                    </Text>
                  </View>
                  {getRequiredRemediationFields(accountStatus.futureRequirements).map(
                    (item) => (
                      <View key={item.requirement} style={styles.futureReqItem}>
                        <Text style={[styles.futureReqDot, { color: colors.textTertiary }]}>•</Text>
                        <Text style={[styles.futureReqText, { color: colors.textSecondary }]}>{item.label}</Text>
                      </View>
                    ),
                  )}
                </GlassSurface>
              </Animated.View>
            )}

          <BalanceCard
            availableCents={availableCents}
            pendingCents={balancesForSheet.pendingCents}
            lifetimeCents={balancesForSheet.lifetimeCents}
            onWithdraw={() => setWithdrawalSheetVisible(true)}
          />

          <Animated.View
            key={`tab-${selectedTab}`}
            entering={
              selectedTab > previousTabRef.current
                ? FadeInRight.duration(250)
                : FadeInLeft.duration(250)
            }
            exiting={
              selectedTab > previousTabRef.current
                ? FadeOutLeft.duration(150)
                : FadeOutRight.duration(150)
            }
          >
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
          </Animated.View>
        </ScrollView>
      )}

      {/* Withdrawal Sheet */}
      <WithdrawalSheet
        visible={withdrawalSheetVisible}
        onClose={() => setWithdrawalSheetVisible(false)}
        balances={balancesForSheet}
        payoutMethods={payoutMethods}
        onWithdraw={handleWithdraw}
      />
    </View>
  );
}

interface OverviewTabProps {
  earnings: EarningsItem[];
  payouts: PayoutItem[];
}

function OverviewTab({ earnings, payouts }: OverviewTabProps) {
  const { colors } = useAppTheme();
  // Combine and sort recent activity (last 10)
  type ActivityItem = {
    id: string;
    type: "earning" | "payout";
    title: string;
    date: string;
    amount: number;
    positive: boolean;
  };

  const recentActivity: ActivityItem[] = [
    ...earnings.slice(0, 10).map(
      (e): ActivityItem => ({
        id: `e-${e.id}`,
        type: "earning",
        title: e.eventName,
        date: e.createdAt,
        amount: e.netAmount,
        positive: true,
      }),
    ),
    ...payouts.slice(0, 10).map(
      (p): ActivityItem => ({
        id: `p-${p.id}`,
        type: "payout",
        title: `${p.destination.bankName || p.destination.brand || "Account"} ••${p.destination.last4}`,
        date: p.created,
        amount: p.amount,
        positive: false,
      }),
    ),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <View style={styles.overviewContent}>
      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
        {recentActivity.length > 0 ? (
          <GlassSurface
            fill="subtle"
            cornerRadius="md"
            style={styles.activityList}
          >
            {recentActivity.map((item) => (
              <View key={item.id} style={[styles.activityItem, { borderBottomColor: colors.border }]}>
                <View
                  style={[
                    styles.activityIcon,
                    item.positive ? styles.earningIcon : styles.payoutIcon,
                  ]}
                >
                  <Ionicons
                    name={item.positive ? "arrow-down" : "arrow-up"}
                    size={14}
                    color="#fff"
                  />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={[styles.activityTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.activityDate, { color: colors.textSecondary }]}>
                    {new Date(item.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.activityAmount,
                    item.positive
                      ? styles.positiveAmount
                      : styles.negativeAmount,
                  ]}
                >
                  {item.positive ? "+" : "-"}
                  {formatCents(item.amount)}
                </Text>
              </View>
            ))}
          </GlassSurface>
        ) : (
          <GlassSurface
            fill="subtle"
            cornerRadius="md"
            style={styles.emptyActivity}
          >
            <Ionicons
              name="receipt-outline"
              size={40}
              color={colors.textTertiary}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No activity yet</Text>
            <Text style={[styles.emptyHint, { color: colors.textTertiary }]}>
              Your earnings and withdrawals will appear here
            </Text>
          </GlassSurface>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  setupBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  setupBannerSuccess: {
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    borderColor: "rgba(34, 197, 94, 0.25)",
  },
  setupBannerPending: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderColor: "rgba(245, 158, 11, 0.25)",
  },
  setupBannerText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Lato_400Regular",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Lato_400Regular",
  },
  docBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderColor: "rgba(245, 158, 11, 0.25)",
  },
  docBannerText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Lato_600SemiBold",
  },
  statusContainer: { marginHorizontal: 16, marginTop: 8, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
  onboardingContainer: { marginHorizontal: 16, marginTop: 8, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
  pillRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, alignItems: 'center', paddingBottom: 8, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 9 },
  pillIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' },
  pillFilter: { height: 38, borderRadius: 19, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  pillGlassLayer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', borderRadius: 19 },
  pillText: { fontSize: 14, fontWeight: '500', color: 'rgba(0,0,0,0.5)' },
  pillTextActive: { color: 'rgba(0,0,0,0.8)' },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Lato_700Bold",
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
    fontFamily: "Lato_700Bold",
    marginBottom: 10,
  },
  // Activity
  activityList: {
    overflow: "hidden",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
  },
  activityIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  earningIcon: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
  },
  payoutIcon: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },
  activityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: "Lato_600SemiBold",
  },
  activityDate: {
    fontSize: 12,
    fontFamily: "Lato_400Regular",
    marginTop: 2,
  },
  activityAmount: {
    fontSize: 15,
    fontFamily: "Lato_700Bold",
  },
  positiveAmount: {
    color: "#22c55e",
  },
  negativeAmount: {
    color: "#ef4444",
  },
  emptyActivity: {
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Lato_700Bold",
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    marginTop: 4,
    textAlign: "center",
  },
  futureReqCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
  },
  futureReqHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  futureReqTitle: {
    fontSize: 14,
    fontFamily: "Lato_600SemiBold",
  },
  futureReqItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 3,
  },
  futureReqDot: {
    fontSize: 14,
  },
  futureReqText: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
  },
});
