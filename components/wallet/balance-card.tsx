// BalanceCard - Compact balance display with withdraw & manage account CTAs

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassSurface } from '@/components/glass/glass-surface';
import { GlassButton } from '@/components/glass/glass-button';
import { useAppTheme } from '@/hooks/use-app-theme';
import { formatCents } from '@/lib/utils';

interface BalanceCardProps {
  availableCents: number;
  pendingCents: number;
  lifetimeCents: number;
  onWithdraw: () => void;
}

export function BalanceCard({
  availableCents,
  pendingCents,
  lifetimeCents,
  onWithdraw,
}: BalanceCardProps) {
  const { colors } = useAppTheme();
  const canWithdraw = availableCents >= 100; // $1 minimum

  return (
    <GlassSurface fill="subtle" cornerRadius="lg" style={styles.container}>
      <View style={styles.balanceRow}>
        <View style={styles.balanceItem}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Available</Text>
          <Text style={styles.availableAmount}>{formatCents(availableCents)}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.balanceItem}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Pending</Text>
          <Text style={styles.pendingAmount}>{formatCents(pendingCents)}</Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <GlassButton
          label={canWithdraw ? `Withdraw ${formatCents(availableCents)}` : 'Withdraw'}
          icon={<Ionicons name="arrow-down-circle" size={18} color={colors.text} />}
          variant="glass"
          size="md"
          onPress={onWithdraw}
          disabled={!canWithdraw}
          fullWidth
        />
      </View>

      {lifetimeCents > 0 && (
        <View style={[styles.lifetimeRow, { borderTopColor: colors.border }]}>
          <Ionicons name="trending-up" size={16} color="#22c55e" />
          <Text style={[styles.lifetimeLabel, { color: colors.textSecondary }]}>Lifetime Earnings</Text>
          <Text style={[styles.lifetimeAmount, { color: colors.text }]}>{formatCents(lifetimeCents)}</Text>
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
  },
  balanceLabel: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
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
    gap: 8,
  },
  lifetimeLabel: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    flex: 1,
  },
  lifetimeAmount: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
});
