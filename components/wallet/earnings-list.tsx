// EarningsList - Filterable earnings FlatList

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useEarnings } from '@/hooks/use-wallet-queries';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { EarningsItem } from '@/lib/api/wallet';
import { formatCents } from '@/lib/utils';

type EarningsFilter = 'all' | 'pending' | 'transferred';

const FILTERS: { key: EarningsFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'transferred', label: 'Transferred' },
];

function StatusBadge({ status }: { status: EarningsItem['status'] }) {
  const config = {
    pending: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', label: 'Pending' },
    transferred: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', label: 'Transferred' },
    refunded: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', label: 'Refunded' },
  }[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

function EarningsRow({ item }: { item: EarningsItem }) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.rowLeft}>
        <Text style={[styles.eventName, { color: colors.text }]} numberOfLines={1}>{item.eventName}</Text>
        <Text style={[styles.rowDate, { color: colors.textSecondary }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <View style={styles.amountsRow}>
          <Text style={[styles.grossAmount, { color: colors.text }]}>{formatCents(item.grossAmount)}</Text>
          <Text style={[styles.netAmount, { color: colors.textSecondary }]}>net {formatCents(item.netAmount)}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>
    </View>
  );
}

export function EarningsList() {
  const [filter, setFilter] = useState<EarningsFilter>('all');
  const { colors, isDark } = useAppTheme();
  const params = filter === 'all' ? undefined : { status: filter as 'pending' | 'transferred' };
  const { data, isLoading, refetch, isRefetching } = useEarnings(params);

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              { overflow: 'hidden' },
            ]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.7}
          >
            <GlassView
              {...(filter === f.key ? liquidGlass.fillMedium : liquidGlass.fillFaint)}
              borderRadius={16}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={[
              styles.filterText,
              { color: colors.textSecondary },
              filter === f.key && styles.filterTextActive,
              filter === f.key && { color: colors.text },
            ]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : (
        <View style={styles.listContent}>
          {(data?.earnings ?? []).length > 0 ? (
            (data?.earnings ?? []).map((item) => (
              <EarningsRow key={String(item.id)} item={item} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={40} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No earnings yet</Text>
              <Text style={[styles.emptyHint, { color: colors.textTertiary }]}>
                Earnings from ticket sales will appear here
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  filterTextActive: {
    fontFamily: 'Lato_700Bold',
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
  rowLeft: {
    flex: 1,
    marginRight: 12,
  },
  eventName: {
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
  amountsRow: {
    alignItems: 'flex-end',
  },
  grossAmount: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  netAmount: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
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
