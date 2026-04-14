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
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassSurface } from '@/components/glass/glass-surface';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useEarnings } from '@/hooks/use-wallet-queries';
import { formatCents } from '@/lib/utils';
import type { EarningsItem } from '@/lib/api/wallet';

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

function EarningRow({ item, colors }: { item: EarningsItem; colors: ReturnType<typeof useAppTheme>['colors'] }) {
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.rowLeft}>
        <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>{item.eventName}</Text>
        <Text style={[styles.rowDate, { color: colors.textTertiary }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.grossAmount, { color: colors.text }]}>{formatCents(item.grossAmount)}</Text>
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
  const { colors, isDark } = useAppTheme();
  const eventId = Number(id);

  const { data, isLoading, refetch, isRefetching } = useEarnings(
    { eventId },
  );

  const summary = data?.summary;
  const earnings = data?.earnings ?? [];

  return (
    <View style={[styles.container, { backgroundColor: '#f2f2f2' }]}>

      {/* Fixed pill row */}
      <View style={[styles.pillRow, { paddingTop: insets.top + 16 }]}>
        <Pressable style={styles.pillIcon} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#000" />
        </Pressable>
        <View style={styles.pillLabel}>
          {isLiquidGlassSupported ? (
            <LiquidGlassView effect="regular" style={StyleSheet.absoluteFill} />
          ) : null}
          <Text style={styles.pillLabelText}>Payments</Text>
        </View>
      </View>

      <LinearGradient colors={['#f2f2f2', 'rgba(242,242,242,0)']} style={styles.topFade} pointerEvents="none" />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      ) : (
        <FlatList
          data={earnings}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <EarningRow item={item} colors={colors} />}
          contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.text} />
          }
          ListHeaderComponent={
            summary ? (
              <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Gross</Text>
                    <Text style={[styles.summaryGross, { color: colors.text }]}>{formatCents(summary.totalGross)}</Text>
                  </View>
                  <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Fees</Text>
                    <Text style={styles.summaryFees}>-{formatCents(summary.totalPlatformFees)}</Text>
                  </View>
                  <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Net</Text>
                    <Text style={styles.summaryNet}>{formatCents(summary.totalNet)}</Text>
                  </View>
                </View>
                {summary.pendingAmount > 0 && (
                  <View style={[styles.pendingRow, { borderTopColor: colors.border }]}>
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
              <Ionicons name="receipt-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No earnings yet</Text>
              <Text style={[styles.emptyHint, { color: colors.textTertiary }]}>
                Earnings from ticket sales will show up here once customers purchase tickets
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pillRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, alignItems: 'center', paddingBottom: 8, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  pillIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' },
  pillLabel: { height: 38, borderRadius: 19, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  pillLabelText: { fontSize: 14, fontWeight: '500', color: 'rgba(0,0,0,0.8)' },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 9 },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
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
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginBottom: 4,
  },
  summaryGross: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
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
  },
  rowLeft: {
    flex: 1,
    marginRight: 12,
  },
  rowTitle: {
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
    gap: 2,
  },
  grossAmount: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
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
  },
  emptyHint: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
