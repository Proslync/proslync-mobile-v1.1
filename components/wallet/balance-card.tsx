// BalanceCard - Compact balance display with withdraw & manage account CTAs

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassSurface } from '@/components/glass/glass-surface';
import { GlassButton } from '@/components/glass/glass-button';

interface BalanceCardProps {
  availableCents: number;
  pendingCents: number;
  lifetimeCents: number;
  onWithdraw: () => void;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function BalanceCard({
  availableCents,
  pendingCents,
  lifetimeCents,
  onWithdraw,
}: BalanceCardProps) {
  const canWithdraw = availableCents >= 100; // $1 minimum

  return (
    <GlassSurface fill="subtle" cornerRadius="lg" style={styles.container}>
      <View style={styles.balanceRow}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Available</Text>
          <Text style={styles.availableAmount}>{formatCents(availableCents)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Pending</Text>
          <Text style={styles.pendingAmount}>{formatCents(pendingCents)}</Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <GlassButton
          label={canWithdraw ? `Withdraw ${formatCents(availableCents)}` : 'Withdraw'}
          icon={<Ionicons name="arrow-down-circle" size={18} color="#fff" />}
          variant="glass"
          size="md"
          onPress={onWithdraw}
          disabled={!canWithdraw}
          fullWidth
        />
      </View>

      {lifetimeCents > 0 && (
        <View style={styles.lifetimeRow}>
          <Ionicons name="trending-up" size={16} color="#22c55e" />
          <Text style={styles.lifetimeLabel}>Lifetime Earnings</Text>
          <Text style={styles.lifetimeAmount}>{formatCents(lifetimeCents)}</Text>
        </View>
      )}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  balanceLabel: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  availableAmount: {
    fontSize: 24,
    fontFamily: 'Lato_700Bold',
    color: '#22c55e',
  },
  pendingAmount: {
    fontSize: 24,
    fontFamily: 'Lato_700Bold',
    color: '#f59e0b',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  lifetimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  lifetimeLabel: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    flex: 1,
  },
  lifetimeAmount: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
});
