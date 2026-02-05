// Earnings Summary - Available, Pending, Lifetime balances with Withdraw CTA
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WalletBalances } from '../../lib/types/wallet.types';

interface EarningsSummaryProps {
  balances: WalletBalances;
  onWithdraw: () => void;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function EarningsSummary({ balances, onWithdraw }: EarningsSummaryProps) {
  const canWithdraw = balances.availableCents >= balances.minimumCashOutCents;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Earnings</Text>

      {/* Balance Cards */}
      <View style={styles.balanceRow}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available</Text>
          <Text style={styles.balanceAmount}>{formatCents(balances.availableCents)}</Text>
        </View>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Pending</Text>
          <Text style={[styles.balanceAmount, styles.pendingAmount]}>
            {formatCents(balances.pendingCents)}
          </Text>
        </View>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Lifetime</Text>
          <Text style={[styles.balanceAmount, styles.lifetimeAmount]}>
            {formatCents(balances.lifetimeCents)}
          </Text>
        </View>
      </View>

      {/* Withdraw Button - Directly below balances */}
      <TouchableOpacity
        style={[styles.withdrawButton, !canWithdraw && styles.withdrawButtonDisabled]}
        onPress={onWithdraw}
        disabled={!canWithdraw}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-down-circle" size={20} color="#fff" />
        <Text style={styles.withdrawButtonText}>Withdraw</Text>
      </TouchableOpacity>

      {/* Helper Texts - Reordered */}
      <View style={styles.helperTexts}>
        {!canWithdraw && (
          <Text style={styles.minCashoutText}>
            Min. cash out: {formatCents(balances.minimumCashOutCents)}
          </Text>
        )}
        <Text style={styles.helperText}>Pending clears after event check-in validation.</Text>
        <Text style={styles.helperText}>Fees may apply.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 6,
  },
  balanceAmount: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    color: '#34c759',
  },
  pendingAmount: {
    color: '#f59e0b',
  },
  lifetimeAmount: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34c759',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  withdrawButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  withdrawButtonText: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  helperTexts: {
    alignItems: 'center',
    gap: 4,
  },
  minCashoutText: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  helperText: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
  },
});
