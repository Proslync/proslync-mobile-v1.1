// PayoutsList - Payout history FlatList with withdraw CTA

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { GlassButton } from '@/components/glass/glass-button';
import { usePayouts } from '@/hooks/use-wallet-queries';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { PayoutItem } from '@/lib/api/wallet';

interface PayoutsListProps {
  onWithdraw: () => void;
  canWithdraw: boolean;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const STATUS_CONFIG: Record<PayoutItem['status'], { color: string; bg: string; label: string }> = {
  pending: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', label: 'Pending' },
  in_transit: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', label: 'In Transit' },
  paid: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', label: 'Paid' },
  failed: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', label: 'Failed' },
  canceled: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)', label: 'Canceled' },
};

function PayoutRow({ item }: { item: PayoutItem }) {
  const { colors, isDark } = useAppTheme();
  const statusConfig = STATUS_CONFIG[item.status];
  const destLabel = item.destination.bankName || item.destination.brand || 'Account';

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={[styles.rowIcon, { overflow: 'hidden' }]}>
        <GlassView {...liquidGlass.fillFaint} borderRadius={10} style={StyleSheet.absoluteFillObject} />
        <Ionicons
          name={item.destination.type === 'bank_account' ? 'business-outline' : 'card-outline'}
          size={18}
          color={colors.textSecondary}
        />
      </View>
      <View style={styles.rowLeft}>
        <Text style={[styles.destLabel, { color: colors.text }]} numberOfLines={1}>
          {destLabel} ••{item.destination.last4}
        </Text>
        <Text style={[styles.rowDate, { color: colors.textSecondary }]}>
          {new Date(item.created).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.payoutAmount, { color: colors.text }]}>{formatCents(item.amount)}</Text>
        <View style={[styles.badge, { backgroundColor: statusConfig.bg }]}>
          <Text style={[styles.badgeText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function PayoutsList({ onWithdraw, canWithdraw }: PayoutsListProps) {
  const { colors, isDark } = useAppTheme();
  const { data, isLoading, refetch, isRefetching } = usePayouts();

  return (
    <View style={styles.container}>
      {canWithdraw && (
        <View style={styles.withdrawCta}>
          <GlassButton
            label="Withdraw Funds"
            icon={<Ionicons name="arrow-down-circle" size={18} color={colors.text} />}
            variant="glass"
            size="md"
            onPress={onWithdraw}
            fullWidth
          />
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : (
        <View style={styles.listContent}>
          {(data?.payouts ?? []).length > 0 ? (
            (data?.payouts ?? []).map((item) => (
              <PayoutRow key={item.id} item={item} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={40} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No payouts yet</Text>
              <Text style={[styles.emptyHint, { color: colors.textTertiary }]}>
                Your withdrawal history will appear here
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  withdrawCta: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowLeft: {
    flex: 1,
    marginRight: 12,
  },
  destLabel: {
    fontSize: 15,
    fontFamily: 'Lato_600SemiBold',
  },
  rowDate: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  payoutAmount: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  emptyHint: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
  },
});
