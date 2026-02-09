// Dashboard Payments Screen - Earnings, Payouts, and Stripe Connect management
import * as React from 'react';
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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useWallet } from '@/lib/providers/wallet-provider';
import { WithdrawalSheet } from '@/components/wallet';
import { useAppTheme } from '@/hooks/use-app-theme';

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const {
    balances,
    payoutMethods,
    transactions,
    isLoading,
    withdraw,
    refreshWallet,
    stripeAccountStatus,
    setupStripeAccount,
    openStripeDashboard,
    addPayoutMethod,
  } = useWallet();

  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isSettingUp, setIsSettingUp] = React.useState(false);
  const [withdrawalSheetVisible, setWithdrawalSheetVisible] = React.useState(false);

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await refreshWallet();
    setIsRefreshing(false);
  }, [refreshWallet]);

  const handleSetupStripeAccount = async () => {
    try {
      setIsSettingUp(true);
      await setupStripeAccount();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to set up payout account');
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleWithdraw = async (amountCents: number, methodId: string) => {
    try {
      await withdraw(amountCents, methodId);
      Alert.alert('Success', 'Your withdrawal has been submitted!');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to process withdrawal');
    }
  };

  const needsStripeSetup = !stripeAccountStatus?.hasAccount || !stripeAccountStatus?.payoutsEnabled;
  const canWithdraw = balances && balances.availableCents >= balances.minimumCashOutCents;

  // Filter transactions to show only earnings and withdrawals
  const recentTransactions = transactions.slice(0, 10);

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: colors.background,
    },
    loadingText: {
      color: colors.textTertiary,
    },
    header: {
      borderBottomColor: colors.border,
    },
    headerTitle: {
      color: colors.text,
    },
    setupContainer: {
      backgroundColor: isDark ? 'rgba(56, 151, 240, 0.1)' : 'rgba(56, 151, 240, 0.06)',
      borderColor: isDark ? 'rgba(56, 151, 240, 0.3)' : 'rgba(56, 151, 240, 0.2)',
    },
    setupIconContainer: {
      backgroundColor: isDark ? 'rgba(56, 151, 240, 0.15)' : 'rgba(56, 151, 240, 0.1)',
    },
    setupTitle: {
      color: colors.text,
    },
    setupDescription: {
      color: colors.textSecondary,
    },
    setupFeatureText: {
      color: colors.textSecondary,
    },
    setupHint: {
      color: colors.textTertiary,
    },
    balanceCard: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    },
    availableCard: {
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.08)',
      borderColor: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)',
    },
    balanceLabel: {
      color: colors.textTertiary,
    },
    balanceHint: {
      color: colors.textTertiary,
    },
    lifetimeCard: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    },
    lifetimeLabel: {
      color: colors.textTertiary,
    },
    lifetimeAmount: {
      color: colors.text,
    },
    sectionTitle: {
      color: colors.text,
    },
    methodsList: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    },
    methodItem: {
      borderBottomColor: colors.border,
    },
    methodIcon: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    },
    methodIconColor: {
      color: colors.text,
    },
    methodLabel: {
      color: colors.text,
    },
    methodLast4: {
      color: colors.textTertiary,
    },
    defaultBadge: {
      backgroundColor: isDark ? 'rgba(56, 151, 240, 0.15)' : 'rgba(56, 151, 240, 0.1)',
    },
    addMethodButton: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      borderColor: isDark ? 'rgba(56, 151, 240, 0.4)' : 'rgba(56, 151, 240, 0.3)',
    },
    transactionsList: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    },
    transactionItem: {
      borderBottomColor: colors.border,
    },
    transactionTitle: {
      color: colors.text,
    },
    transactionDate: {
      color: colors.textTertiary,
    },
    emptyActivity: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    },
    emptyActivityText: {
      color: colors.textTertiary,
    },
    emptyActivityHint: {
      color: colors.textTertiary,
    },
    withdrawButtonDisabled: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.container, styles.loadingContainer, dynamicStyles.container]}>
        <ActivityIndicator size="large" color={colors.text} />
        <Text style={[styles.loadingText, dynamicStyles.loadingText]}>Loading payments...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, dynamicStyles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Payments</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={openStripeDashboard}
          activeOpacity={0.7}
          disabled={needsStripeSetup}
        >
          <Ionicons
            name="open-outline"
            size={22}
            color={needsStripeSetup ? colors.textTertiary : '#3897F0'}
          />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.text}
          />
        }
      >
        {needsStripeSetup ? (
          /* Stripe Connect Setup */
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={[styles.setupContainer, dynamicStyles.setupContainer]}
          >
            <View style={[styles.setupIconContainer, dynamicStyles.setupIconContainer]}>
              <Ionicons name="wallet-outline" size={56} color="#3897F0" />
            </View>
            <Text style={[styles.setupTitle, dynamicStyles.setupTitle]}>Set Up Payouts</Text>
            <Text style={[styles.setupDescription, dynamicStyles.setupDescription]}>
              Connect your bank account or debit card to receive earnings from ticket sales and tips.
            </Text>

            <View style={styles.setupFeatures}>
              <View style={styles.setupFeature}>
                <Ionicons name="shield-checkmark" size={20} color="#22c55e" />
                <Text style={[styles.setupFeatureText, dynamicStyles.setupFeatureText]}>Secure payments via Stripe</Text>
              </View>
              <View style={styles.setupFeature}>
                <Ionicons name="flash" size={20} color="#f59e0b" />
                <Text style={[styles.setupFeatureText, dynamicStyles.setupFeatureText]}>Instant payouts to debit cards</Text>
              </View>
              <View style={styles.setupFeature}>
                <Ionicons name="calendar" size={20} color="#3b82f6" />
                <Text style={[styles.setupFeatureText, dynamicStyles.setupFeatureText]}>1-3 day bank transfers</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.setupButton, isSettingUp && styles.setupButtonDisabled]}
              onPress={handleSetupStripeAccount}
              disabled={isSettingUp}
            >
              {isSettingUp ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="link" size={20} color="#fff" />
                  <Text style={styles.setupButtonText}>Connect Payout Account</Text>
                </>
              )}
            </TouchableOpacity>

            {stripeAccountStatus?.hasAccount && !stripeAccountStatus?.detailsSubmitted && (
              <Text style={[styles.setupHint, dynamicStyles.setupHint]}>
                You have a pending setup. Tap above to complete it.
              </Text>
            )}
          </Animated.View>
        ) : (
          <>
            {/* Balance Cards */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              style={styles.balanceSection}
            >
              <View style={styles.balanceCards}>
                <View style={[styles.balanceCard, styles.availableCard, dynamicStyles.availableCard]}>
                  <Text style={[styles.balanceLabel, dynamicStyles.balanceLabel]}>Available</Text>
                  <Text style={styles.balanceAmount}>
                    {formatCents(balances?.availableCents ?? 0)}
                  </Text>
                  <TouchableOpacity
                    style={[styles.withdrawButton, !canWithdraw && [styles.withdrawButtonDisabled, dynamicStyles.withdrawButtonDisabled]]}
                    onPress={() => setWithdrawalSheetVisible(true)}
                    disabled={!canWithdraw}
                  >
                    <Ionicons name="arrow-down-circle" size={18} color="#fff" />
                    <Text style={styles.withdrawButtonText}>Withdraw</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.balanceCard, dynamicStyles.balanceCard]}>
                  <Text style={[styles.balanceLabel, dynamicStyles.balanceLabel]}>Pending</Text>
                  <Text style={[styles.balanceAmount, styles.pendingAmount]}>
                    {formatCents(balances?.pendingCents ?? 0)}
                  </Text>
                  <Text style={[styles.balanceHint, dynamicStyles.balanceHint]}>Clears after events</Text>
                </View>
              </View>

              <View style={[styles.lifetimeCard, dynamicStyles.lifetimeCard]}>
                <Ionicons name="trending-up" size={20} color="#22c55e" />
                <View style={styles.lifetimeContent}>
                  <Text style={[styles.lifetimeLabel, dynamicStyles.lifetimeLabel]}>Lifetime Earnings</Text>
                  <Text style={[styles.lifetimeAmount, dynamicStyles.lifetimeAmount]}>
                    {formatCents(balances?.lifetimeCents ?? 0)}
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Payout Methods */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              style={styles.section}
            >
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Payout Methods</Text>
                <TouchableOpacity onPress={openStripeDashboard}>
                  <Text style={styles.manageLink}>Manage</Text>
                </TouchableOpacity>
              </View>

              {payoutMethods.length > 0 ? (
                <View style={[styles.methodsList, dynamicStyles.methodsList]}>
                  {payoutMethods.map((method) => (
                    <View key={method.id} style={[styles.methodItem, dynamicStyles.methodItem]}>
                      <View style={[styles.methodIcon, dynamicStyles.methodIcon]}>
                        <Ionicons
                          name={method.type === 'bank' ? 'business' : 'card'}
                          size={20}
                          color={colors.text}
                        />
                      </View>
                      <View style={styles.methodInfo}>
                        <Text style={[styles.methodLabel, dynamicStyles.methodLabel]}>{method.label}</Text>
                        <Text style={[styles.methodLast4, dynamicStyles.methodLast4]}>••••{method.last4}</Text>
                      </View>
                      {method.isDefault && (
                        <View style={[styles.defaultBadge, dynamicStyles.defaultBadge]}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <TouchableOpacity style={[styles.addMethodButton, dynamicStyles.addMethodButton]} onPress={openStripeDashboard}>
                  <Ionicons name="add-circle-outline" size={24} color="#3897F0" />
                  <Text style={styles.addMethodText}>Add payout method</Text>
                </TouchableOpacity>
              )}
            </Animated.View>

            {/* Recent Activity */}
            <Animated.View
              entering={FadeInDown.delay(300).duration(400)}
              style={styles.section}
            >
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Recent Activity</Text>

              {recentTransactions.length > 0 ? (
                <View style={[styles.transactionsList, dynamicStyles.transactionsList]}>
                  {recentTransactions.map((tx) => (
                    <View key={tx.id} style={[styles.transactionItem, dynamicStyles.transactionItem]}>
                      <View style={[
                        styles.transactionIcon,
                        tx.type === 'withdrawal' ? styles.withdrawalIcon : styles.earningIcon
                      ]}>
                        <Ionicons
                          name={tx.type === 'withdrawal' ? 'arrow-up' : 'arrow-down'}
                          size={16}
                          color="#fff"
                        />
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={[styles.transactionTitle, dynamicStyles.transactionTitle]}>{tx.title}</Text>
                        <Text style={[styles.transactionDate, dynamicStyles.transactionDate]}>
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text style={[
                        styles.transactionAmount,
                        tx.amountCents < 0 ? styles.negativeAmount : styles.positiveAmount
                      ]}>
                        {tx.amountCents < 0 ? '-' : '+'}{formatCents(Math.abs(tx.amountCents))}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={[styles.emptyActivity, dynamicStyles.emptyActivity]}>
                  <Ionicons name="receipt-outline" size={40} color={colors.textTertiary} />
                  <Text style={[styles.emptyActivityText, dynamicStyles.emptyActivityText]}>No activity yet</Text>
                  <Text style={[styles.emptyActivityHint, dynamicStyles.emptyActivityHint]}>
                    Your earnings and withdrawals will appear here
                  </Text>
                </View>
              )}
            </Animated.View>
          </>
        )}
      </ScrollView>

      {/* Withdrawal Sheet */}
      <WithdrawalSheet
        visible={withdrawalSheetVisible}
        onClose={() => setWithdrawalSheetVisible(false)}
        balances={balances ?? { availableCents: 0, pendingCents: 0, lifetimeCents: 0, minimumCashOutCents: 100 }}
        payoutMethods={payoutMethods}
        onWithdraw={handleWithdraw}
        onAddPayoutMethod={addPayoutMethod}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  // Setup Container
  setupContainer: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
  },
  setupIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  setupTitle: {
    fontSize: 24,
    fontFamily: 'Lato_700Bold',
    marginBottom: 12,
  },
  setupDescription: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  setupFeatures: {
    alignSelf: 'stretch',
    gap: 12,
    marginBottom: 24,
  },
  setupFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  setupFeatureText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3897F0',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
    gap: 10,
    alignSelf: 'stretch',
  },
  setupButtonDisabled: {
    opacity: 0.6,
  },
  setupButtonText: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  setupHint: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 16,
    textAlign: 'center',
  },
  // Balance Section
  balanceSection: {
    marginBottom: 24,
  },
  balanceCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  balanceCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  availableCard: {
    borderWidth: 1,
  },
  balanceLabel: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontFamily: 'Lato_700Bold',
    color: '#22c55e',
    marginBottom: 12,
  },
  pendingAmount: {
    color: '#f59e0b',
  },
  balanceHint: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  withdrawButtonDisabled: {
    // backgroundColor set dynamically
  },
  withdrawButtonText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  lifetimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  lifetimeContent: {
    flex: 1,
  },
  lifetimeLabel: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  lifetimeAmount: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
  },
  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  manageLink: {
    fontSize: 14,
    fontFamily: 'Lato_600SemiBold',
    color: '#3897F0',
  },
  // Payout Methods
  methodsList: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  methodLabel: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  methodLast4: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    color: '#3897F0',
  },
  addMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 16,
    gap: 10,
  },
  addMethodText: {
    fontSize: 15,
    fontFamily: 'Lato_600SemiBold',
    color: '#3897F0',
  },
  // Transactions
  transactionsList: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningIcon: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  withdrawalIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  transactionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  transactionTitle: {
    fontSize: 14,
    fontFamily: 'Lato_600SemiBold',
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
  transactionAmount: {
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
    borderRadius: 12,
  },
  emptyActivityText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    marginTop: 12,
  },
  emptyActivityHint: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 4,
    textAlign: 'center',
  },
});
