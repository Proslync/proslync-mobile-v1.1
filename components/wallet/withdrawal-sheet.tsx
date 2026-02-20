// Withdrawal Sheet - Comprehensive withdraw flow with integrated payout management
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useToast } from '@/components/shared/toast';
import { BottomSheet } from './bottom-sheet';
import { WalletBalances, PayoutMethod } from '../../lib/types/wallet.types';

interface WithdrawalSheetProps {
  visible: boolean;
  onClose: () => void;
  balances: WalletBalances;
  payoutMethods: PayoutMethod[];
  onWithdraw: (amountCents: number, methodId: string) => void | Promise<void>;
  onAddPayoutMethod: (method: Omit<PayoutMethod, 'id'>) => void | Promise<void>;
}

type SheetView = 'withdraw' | 'confirm' | 'select-method' | 'add-method-choice';

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const QUICK_AMOUNTS = [
  { label: '25%', multiplier: 0.25 },
  { label: '50%', multiplier: 0.5 },
  { label: 'Max', multiplier: 1 },
];

export function WithdrawalSheet({
  visible,
  onClose,
  balances,
  payoutMethods,
  onWithdraw,
  onAddPayoutMethod,
}: WithdrawalSheetProps) {
  const { colors, isDark } = useAppTheme();
  const toast = useToast();
  const [view, setView] = useState<SheetView>('withdraw');
  const [amountInput, setAmountInput] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(
    payoutMethods.find((m) => m.isDefault)?.id || payoutMethods[0]?.id || null
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const amountCents = useMemo(() => {
    const parsed = parseFloat(amountInput);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100);
  }, [amountInput]);

  const canWithdraw =
    amountCents >= balances.minimumCashOutCents &&
    amountCents <= balances.availableCents &&
    selectedMethodId !== null;

  const selectedMethod = payoutMethods.find((m) => m.id === selectedMethodId);

  const handleClose = () => {
    setView('withdraw');
    setAmountInput('');
    onClose();
  };

  const handleQuickAmount = (multiplier: number) => {
    const amount = Math.floor(balances.availableCents * multiplier) / 100;
    setAmountInput(amount.toFixed(2));
  };

  const handleWithdraw = () => {
    if (!canWithdraw || !selectedMethodId || isProcessing) return;
    setView('confirm');
  };

  const handleConfirmWithdraw = async () => {
    if (!selectedMethodId || isProcessing) return;
    try {
      setIsProcessing(true);
      await onWithdraw(amountCents, selectedMethodId);
      handleClose();
    } catch (error: any) {
      toast.showError(error?.message || 'Failed to process withdrawal');
      setView('withdraw');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectMethod = (methodId: string) => {
    setSelectedMethodId(methodId);
    setView('withdraw');
  };

  // Render different views
  const renderWithdrawView = () => (
    <>
      <Text style={[styles.title, { color: colors.text }]}>Withdraw</Text>

      {/* Available Balance */}
      <View style={styles.balanceSection}>
        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Available balance</Text>
        <Text style={styles.balanceAmount}>{formatCents(balances.availableCents)}</Text>
      </View>

      {/* Amount Input */}
      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.textTertiary }]}>Amount</Text>
        <View style={[
          styles.inputContainer,
          { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }
        ]}>
          <Text style={[styles.currencySymbol, { color: colors.textTertiary }]}>$</Text>
          <TextInput
            style={[styles.amountInput, { color: colors.text }]}
            value={amountInput}
            onChangeText={setAmountInput}
            placeholder="0.00"
            placeholderTextColor={colors.placeholder}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
        </View>

        {/* Quick Amount Buttons */}
        <View style={styles.quickAmounts}>
          {QUICK_AMOUNTS.map((qa) => (
            <TouchableOpacity
              key={qa.label}
              style={[
                styles.quickAmountButton,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }
              ]}
              onPress={() => handleQuickAmount(qa.multiplier)}
            >
              <Text style={styles.quickAmountText}>{qa.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Payout Method Selector */}
      <View style={styles.methodSection}>
        <Text style={[styles.inputLabel, { color: colors.textTertiary }]}>Payout method</Text>
        <TouchableOpacity
          style={[
            styles.methodSelector,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }
          ]}
          onPress={() => setView('select-method')}
        >
          {selectedMethod ? (
            <View style={styles.selectedMethodContent}>
              <Ionicons
                name={selectedMethod.type === 'bank' ? 'business-outline' : 'card-outline'}
                size={20}
                color={colors.text}
              />
              <View style={styles.selectedMethodInfo}>
                <Text style={[styles.selectedMethodLabel, { color: colors.text }]}>{selectedMethod.label}</Text>
                <Text style={[styles.selectedMethodLast4, { color: colors.textTertiary }]}>••••{selectedMethod.last4}</Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.addMethodText, { color: colors.textTertiary }]}>Select payout method</Text>
          )}
          <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Estimated Arrival */}
      {selectedMethod && (
        <View style={styles.arrivalSection}>
          <Ionicons name="time-outline" size={16} color={colors.textTertiary} />
          <Text style={[styles.arrivalText, { color: colors.textTertiary }]}>
            {selectedMethod.type === 'debit' ? 'Instant' : '1-3 business days'}
          </Text>
        </View>
      )}

      {/* Withdraw Button */}
      <TouchableOpacity
        style={[
          styles.withdrawButton,
          (!canWithdraw || isProcessing) && [
            styles.withdrawButtonDisabled,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)' }
          ]
        ]}
        onPress={handleWithdraw}
        disabled={!canWithdraw || isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.withdrawButtonText}>
            {amountCents < balances.minimumCashOutCents && amountCents > 0
              ? `Min. ${formatCents(balances.minimumCashOutCents)}`
              : 'Confirm Withdrawal'}
          </Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderSelectMethodView = () => (
    <>
      <View style={styles.viewHeader}>
        <TouchableOpacity onPress={() => setView('withdraw')} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0095f6" />
        </TouchableOpacity>
        <Text style={[styles.viewTitle, { color: colors.text }]}>Select Payout Method</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.methodList}>
        {payoutMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodOption,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' },
              selectedMethodId === method.id && styles.methodOptionSelected,
            ]}
            onPress={() => handleSelectMethod(method.id)}
          >
            <Ionicons
              name={method.type === 'bank' ? 'business-outline' : 'card-outline'}
              size={22}
              color={selectedMethodId === method.id ? '#0095f6' : colors.textSecondary}
            />
            <View style={styles.methodOptionInfo}>
              <Text style={[styles.methodOptionLabel, { color: colors.text }]}>{method.label}</Text>
              <Text style={[styles.methodOptionLast4, { color: colors.textTertiary }]}>••••{method.last4}</Text>
            </View>
            {selectedMethodId === method.id && (
              <Ionicons name="checkmark-circle" size={22} color="#0095f6" />
            )}
          </TouchableOpacity>
        ))}

        {/* Add Payout Method Option */}
        <TouchableOpacity
          style={styles.addMethodOption}
          onPress={() => setView('add-method-choice')}
        >
          <Ionicons name="add-circle-outline" size={22} color="#0095f6" />
          <Text style={styles.addMethodOptionText}>Add payout method</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );

  const renderConfirmView = () => (
    <>
      <View style={styles.confirmContainer}>
        <View style={styles.confirmIconWrapper}>
          <Ionicons name="arrow-down-circle" size={48} color="#22c55e" />
        </View>
        <Text style={[styles.confirmTitle, { color: colors.text }]}>Confirm Withdrawal</Text>
        <Text style={[styles.confirmAmount, { color: colors.text }]}>{formatCents(amountCents)}</Text>
        {selectedMethod && (
          <View style={styles.confirmDestination}>
            <Ionicons
              name={selectedMethod.type === 'bank' ? 'business-outline' : 'card-outline'}
              size={18}
              color={colors.textSecondary}
            />
            <Text style={[styles.confirmDestText, { color: colors.textSecondary }]}>
              {selectedMethod.label} ••••{selectedMethod.last4}
            </Text>
          </View>
        )}
        <Text style={[styles.confirmArrival, { color: colors.textTertiary }]}>
          Estimated arrival: {selectedMethod?.type === 'debit' ? 'Instant' : '1-3 business days'}
        </Text>
      </View>

      <View style={styles.confirmButtons}>
        <TouchableOpacity
          style={[
            styles.confirmCancelButton,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' },
          ]}
          onPress={() => setView('withdraw')}
          disabled={isProcessing}
        >
          <Text style={[styles.confirmCancelText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmWithdrawButton, isProcessing && { opacity: 0.6 }]}
          onPress={handleConfirmWithdraw}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.confirmWithdrawText}>Withdraw</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  const renderAddMethodChoiceView = () => (
    <>
      <View style={styles.viewHeader}>
        <TouchableOpacity onPress={() => setView('select-method')} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0095f6" />
        </TouchableOpacity>
        <Text style={[styles.viewTitle, { color: colors.text }]}>Add Payout Method</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.methodChoices}>
        <View style={styles.stripeInfoContainer}>
          <Ionicons name="shield-checkmark" size={32} color="#8b5cf6" />
          <Text style={[styles.stripeInfoTitle, { color: colors.text }]}>Secure Setup via Stripe</Text>
          <Text style={[styles.stripeInfoText, { color: colors.textSecondary }]}>
            To add a bank account or debit card, you'll be redirected to Stripe's secure dashboard where you can manage your payout methods.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.openStripeButton}
          onPress={async () => {
            try {
              await onAddPayoutMethod({} as any);
              handleClose();
            } catch (error) {
              // Error handled in provider
            }
          }}
        >
          <Ionicons name="open-outline" size={20} color="#fff" />
          <Text style={styles.openStripeButtonText}>Open Stripe Dashboard</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <BottomSheet visible={visible} onClose={handleClose} maxHeight="90%">
      {view === 'withdraw' && renderWithdrawView()}
      {view === 'confirm' && renderConfirmView()}
      {view === 'select-method' && renderSelectMethodView()}
      {view === 'add-method-choice' && renderAddMethodChoiceView()}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  balanceSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  balanceAmount: {
    fontSize: 32,
    fontFamily: 'Lato_700Bold',
    color: '#34c759',
    marginTop: 4,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontFamily: 'Lato_400Regular',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontFamily: 'Lato_700Bold',
    paddingVertical: 16,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#0095f6',
  },
  methodSection: {
    marginBottom: 16,
  },
  methodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 14,
    minHeight: 56,
  },
  selectedMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedMethodInfo: {
    marginLeft: 12,
  },
  selectedMethodLabel: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  selectedMethodLast4: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  addMethodText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  arrivalSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  arrivalText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  withdrawButton: {
    backgroundColor: '#34c759',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  withdrawButtonDisabled: {},
  withdrawButtonText: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  // View header
  viewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  viewTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Method list
  methodList: {
    maxHeight: 300,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodOptionSelected: {
    borderColor: '#0095f6',
    backgroundColor: 'rgba(0, 149, 246, 0.1)',
  },
  methodOptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  methodOptionLabel: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  methodOptionLast4: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  addMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0095f6',
    borderStyle: 'dashed',
    gap: 10,
  },
  addMethodOptionText: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#0095f6',
  },
  // Method choices
  methodChoices: {
    gap: 16,
  },
  stripeInfoContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  stripeInfoTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    marginTop: 12,
    marginBottom: 8,
  },
  stripeInfoText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  openStripeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  openStripeButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  // Confirm view
  confirmContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  confirmIconWrapper: {
    marginBottom: 4,
  },
  confirmTitle: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
  },
  confirmAmount: {
    fontSize: 36,
    fontFamily: 'Lato_700Bold',
    color: '#22c55e',
    marginVertical: 4,
  },
  confirmDestination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  confirmDestText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
  },
  confirmArrival: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 4,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  confirmCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  confirmWithdrawButton: {
    flex: 1,
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmWithdrawText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
});
