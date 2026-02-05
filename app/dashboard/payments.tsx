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

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading payments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payments</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={openStripeDashboard}
          activeOpacity={0.7}
          disabled={needsStripeSetup}
        >
          <Ionicons
            name="open-outline"
            size={22}
            color={needsStripeSetup ? 'rgba(255,255,255,0.3)' : '#8b5cf6'}
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
            tintColor="#fff"
          />
        }
      >
        {needsStripeSetup ? (
          /* Stripe Connect Setup */
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={styles.setupContainer}
          >
            <View style={styles.setupIconContainer}>
              <Ionicons name="wallet-outline" size={56} color="#8b5cf6" />
            </View>
            <Text style={styles.setupTitle}>Set Up Payouts</Text>
            <Text style={styles.setupDescription}>
              Connect your bank account or debit card to receive earnings from ticket sales and tips.
            </Text>

            <View style={styles.setupFeatures}>
              <View style={styles.setupFeature}>
                <Ionicons name="shield-checkmark" size={20} color="#22c55e" />
                <Text style={styles.setupFeatureText}>Secure payments via Stripe</Text>
              </View>
              <View style={styles.setupFeature}>
                <Ionicons name="flash" size={20} color="#f59e0b" />
                <Text style={styles.setupFeatureText}>Instant payouts to debit cards</Text>
              </View>
              <View style={styles.setupFeature}>
                <Ionicons name="calendar" size={20} color="#3b82f6" />
                <Text style={styles.setupFeatureText}>1-3 day bank transfers</Text>
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
              <Text style={styles.setupHint}>
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
                <View style={[styles.balanceCard, styles.availableCard]}>
                  <Text style={styles.balanceLabel}>Available</Text>
                  <Text style={styles.balanceAmount}>
                    {formatCents(balances?.availableCents ?? 0)}
                  </Text>
                  <TouchableOpacity
                    style={[styles.withdrawButton, !canWithdraw && styles.withdrawButtonDisabled]}
                    onPress={() => setWithdrawalSheetVisible(true)}
                    disabled={!canWithdraw}
                  >
                    <Ionicons name="arrow-down-circle" size={18} color="#fff" />
                    <Text style={styles.withdrawButtonText}>Withdraw</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.balanceCard}>
                  <Text style={styles.balanceLabel}>Pending</Text>
                  <Text style={[styles.balanceAmount, styles.pendingAmount]}>
                    {formatCents(balances?.pendingCents ?? 0)}
                  </Text>
                  <Text style={styles.balanceHint}>Clears after events</Text>
                </View>
              </View>

              <View style={styles.lifetimeCard}>
                <Ionicons name="trending-up" size={20} color="#22c55e" />
                <View style={styles.lifetimeContent}>
                  <Text style={styles.lifetimeLabel}>Lifetime Earnings</Text>
                  <Text style={styles.lifetimeAmount}>
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
                <Text style={styles.sectionTitle}>Payout Methods</Text>
                <TouchableOpacity onPress={openStripeDashboard}>
                  <Text style={styles.manageLink}>Manage</Text>
                </TouchableOpacity>
              </View>

              {payoutMethods.length > 0 ? (
                <View style={styles.methodsList}>
                  {payoutMethods.map((method) => (
                    <View key={method.id} style={styles.methodItem}>
                      <View style={styles.methodIcon}>
                        <Ionicons
                          name={method.type === 'bank' ? 'business' : 'card'}
                          size={20}
                          color="#fff"
                        />
                      </View>
                      <View style={styles.methodInfo}>
                        <Text style={styles.methodLabel}>{method.label}</Text>
                        <Text style={styles.methodLast4}>••••{method.last4}</Text>
                      </View>
                      {method.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <TouchableOpacity style={styles.addMethodButton} onPress={openStripeDashboard}>
                  <Ionicons name="add-circle-outline" size={24} color="#8b5cf6" />
                  <Text style={styles.addMethodText}>Add payout method</Text>
                </TouchableOpacity>
              )}
            </Animated.View>

            {/* Recent Activity */}
            <Animated.View
              entering={FadeInDown.delay(300).duration(400)}
              style={styles.section}
            >
              <Text style={styles.sectionTitle}>Recent Activity</Text>

              {recentTransactions.length > 0 ? (
                <View style={styles.transactionsList}>
                  {recentTransactions.map((tx) => (
                    <View key={tx.id} style={styles.transactionItem}>
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
                        <Text style={styles.transactionTitle}>{tx.title}</Text>
                        <Text style={styles.transactionDate}>
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
                <View style={styles.emptyActivity}>
                  <Ionicons name="receipt-outline" size={40} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.emptyActivityText}>No activity yet</Text>
                  <Text style={styles.emptyActivityHint}>
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
    color: 'rgba(255,255,255,0.6)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
    color: '#fff',
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
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  setupIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  setupTitle: {
    fontSize: 24,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    marginBottom: 12,
  },
  setupDescription: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
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
    color: 'rgba(255, 255, 255, 0.8)',
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
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
    color: 'rgba(255, 255, 255, 0.5)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
  },
  availableCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  balanceLabel: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
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
    color: 'rgba(255, 255, 255, 0.4)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  withdrawButtonText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  lifetimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
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
    color: 'rgba(255, 255, 255, 0.6)',
  },
  lifetimeAmount: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
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
    color: '#fff',
  },
  manageLink: {
    fontSize: 14,
    fontFamily: 'Lato_600SemiBold',
    color: '#8b5cf6',
  },
  // Payout Methods
  methodsList: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#fff',
  },
  methodLast4: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  defaultBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    color: '#8b5cf6',
  },
  addMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderStyle: 'dashed',
    padding: 16,
    gap: 10,
  },
  addMethodText: {
    fontSize: 15,
    fontFamily: 'Lato_600SemiBold',
    color: '#8b5cf6',
  },
  // Transactions
  transactionsList: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningIcon: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  withdrawalIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  transactionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  transactionTitle: {
    fontSize: 14,
    fontFamily: 'Lato_600SemiBold',
    color: '#fff',
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
  },
  emptyActivityText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 12,
  },
  emptyActivityHint: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 4,
    textAlign: 'center',
  },
});
