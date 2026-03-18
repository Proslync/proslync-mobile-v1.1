// Activity List - Transaction history with filters (fixed pending badge)
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { WalletTransaction, ActivityFilter } from '../../lib/types/wallet.types';

interface ActivityListProps {
  transactions: WalletTransaction[];
  filter: ActivityFilter;
  onFilterChange: (filter: ActivityFilter) => void;
  onSeeAll?: () => void;
}

function formatCents(cents: number): string {
  const prefix = cents >= 0 ? '+' : '';
  return `${prefix}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getTransactionIcon(type: WalletTransaction['type']): string {
  switch (type) {
    case 'earned':
      return 'arrow-down-circle';
    case 'pending':
      return 'time';
    case 'adjustment':
      return 'swap-horizontal';
    case 'withdrawal':
      return 'arrow-up-circle';
    default:
      return 'ellipse';
  }
}

function getTransactionColor(type: WalletTransaction['type'], amount: number): string {
  if (type === 'withdrawal' || amount < 0) return '#ff3b30';
  if (type === 'pending') return '#f59e0b';
  return '#34c759';
}

const FILTERS: { key: ActivityFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'earned', label: 'Earned' },
  { key: 'withdrawals', label: 'Withdrawals' },
];

function TransactionRow({ transaction }: { transaction: WalletTransaction }) {
  const color = getTransactionColor(transaction.type, transaction.amountCents);
  const isPending = transaction.status === 'pending';

  return (
    <View style={styles.transactionRow}>
      {/* Left: Icon */}
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons
          name={getTransactionIcon(transaction.type) as any}
          size={18}
          color={color}
        />
      </View>

      {/* Middle: Title, subtitle, pending chip */}
      <View style={styles.txContent}>
        <View style={styles.txTitleRow}>
          <Text style={styles.txTitle} numberOfLines={1}>
            {transaction.title}
          </Text>
          {isPending && (
            <View style={styles.pendingChip}>
              <Text style={styles.pendingChipText}>Pending</Text>
            </View>
          )}
        </View>
        {transaction.subtitle && (
          <Text style={styles.txSubtitle} numberOfLines={1}>
            {transaction.subtitle}
          </Text>
        )}
      </View>

      {/* Right: Amount and date - Always visible, fixed width */}
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color }]}>
          {formatCents(transaction.amountCents)}
        </Text>
        <Text style={styles.txDate}>{formatDate(transaction.createdAt)}</Text>
      </View>
    </View>
  );
}

export function ActivityList({
  transactions,
  filter,
  onFilterChange,
  onSeeAll,
}: ActivityListProps) {
  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'all') return true;
    if (filter === 'earned') return tx.type === 'earned' || tx.type === 'pending';
    if (filter === 'withdrawals') return tx.type === 'withdrawal';
    return true;
  }).slice(0, 10);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterButton, { overflow: 'hidden' }]}
            onPress={() => onFilterChange(f.key)}
            activeOpacity={0.7}
          >
            <GlassView
              {...(filter === f.key ? liquidGlass.fillMedium : liquidGlass.fillFaint)}
              borderRadius={16}
              style={StyleSheet.absoluteFillObject}
            />
            <Text
              style={[styles.filterText, filter === f.key && styles.filterTextActive]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transactions */}
      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={40} color="rgba(255,255,255,0.2)" />
          <Text style={styles.emptyText}>No activity yet</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TransactionRow transaction={item} />}
          scrollEnabled={false}
          contentContainerStyle={styles.transactionsList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    minHeight: 36,
    justifyContent: 'center',
  },
  filterButtonActive: {},
  filterText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  filterTextActive: {
    color: '#fff',
    fontFamily: 'Lato_700Bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 12,
  },
  transactionsList: {
    paddingHorizontal: 16,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txContent: {
    flex: 1,
    marginRight: 12,
  },
  txTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  txTitle: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    flexShrink: 1,
  },
  pendingChip: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingChipText: {
    fontSize: 9,
    fontFamily: 'Lato_700Bold',
    color: '#f59e0b',
  },
  txSubtitle: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  txAmount: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  txDate: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 2,
  },
});
