// Event Payments Screen - Event-specific earnings with summary

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { GlassSurface } from '@/components/glass/glass-surface';
import { useEarnings } from '@/hooks/use-wallet-queries';
import type { EarningsItem } from '@/lib/api/wallet';

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

function EarningRow({ item }: { item: EarningsItem }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowTitle} numberOfLines={1}>{item.eventName}</Text>
        <Text style={styles.rowDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.grossAmount}>{formatCents(item.grossAmount)}</Text>
        <Text style={styles.feeAmount}>-{formatCents(item.platformFee)} fee</Text>
        <Text style={styles.netAmount}>net {formatCents(item.netAmount)}</Text>
        <StatusBadge status={item.status} />
      </View>
    </View>
  );
}

export default function EventPaymentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const eventId = Number(id);

  const { data, isLoading, refetch, isRefetching } = useEarnings(
    { eventId },
  );

  const summary = data?.summary;
  const earnings = data?.earnings ?? [];

  return (
    <View style={styles.container}>
      <DarkGradientBg />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Payments</Text>
        <View style={styles.headerButton} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <FlatList
          data={earnings}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <EarningRow item={item} />}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#fff" />
          }
          ListHeaderComponent={
            summary ? (
              <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Gross</Text>
                    <Text style={styles.summaryGross}>{formatCents(summary.totalGross)}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Fees</Text>
                    <Text style={styles.summaryFees}>-{formatCents(summary.totalPlatformFees)}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Net</Text>
                    <Text style={styles.summaryNet}>{formatCents(summary.totalNet)}</Text>
                  </View>
                </View>
                {summary.pendingAmount > 0 && (
                  <View style={styles.pendingRow}>
                    <Ionicons name="time-outline" size={14} color="#f59e0b" />
                    <Text style={styles.pendingText}>
                      {formatCents(summary.pendingAmount)} pending
                    </Text>
                  </View>
                )}
              </GlassSurface>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyText}>No earnings yet</Text>
              <Text style={styles.emptyHint}>
                Ticket sales for this event will appear here
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerButton: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  // Summary card
  summaryCard: {
    padding: 20,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  summaryGross: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  summaryFees: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    color: '#ef4444',
  },
  summaryNet: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    color: '#22c55e',
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  pendingText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: '#f59e0b',
  },
  // Earnings rows
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
  rowTitle: {
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
    gap: 2,
  },
  grossAmount: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  feeAmount: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(239, 68, 68, 0.8)',
  },
  netAmount: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(34, 197, 94, 0.8)',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
  },
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
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
