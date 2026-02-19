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
import { useEarnings } from '@/hooks/use-wallet-queries';
import type { EarningsItem } from '@/lib/api/wallet';

type EarningsFilter = 'all' | 'pending' | 'transferred';

const FILTERS: { key: EarningsFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'transferred', label: 'Transferred' },
];

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

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
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.eventName} numberOfLines={1}>{item.eventName}</Text>
        <Text style={styles.rowDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <View style={styles.amountsRow}>
          <Text style={styles.grossAmount}>{formatCents(item.grossAmount)}</Text>
          <Text style={styles.netAmount}>net {formatCents(item.netAmount)}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>
    </View>
  );
}

export function EarningsList() {
  const [filter, setFilter] = useState<EarningsFilter>('all');
  const params = filter === 'all' ? undefined : { status: filter as 'pending' | 'transferred' };
  const { data, isLoading, refetch, isRefetching } = useEarnings(params);

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : (
        <View style={styles.listContent}>
          {(data?.earnings ?? []).length > 0 ? (
            (data?.earnings ?? []).map((item) => (
              <EarningsRow key={String(item.id)} item={item} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={40} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyText}>No earnings yet</Text>
              <Text style={styles.emptyHint}>
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  filterTextActive: {
    color: '#fff',
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
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  rowLeft: {
    flex: 1,
    marginRight: 12,
  },
  eventName: {
    fontSize: 15,
    fontFamily: 'Lato_600SemiBold',
    color: '#fff',
  },
  rowDate: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
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
    color: '#fff',
  },
  netAmount: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
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
    color: 'rgba(255, 255, 255, 0.5)',
  },
  emptyHint: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
  },
});
