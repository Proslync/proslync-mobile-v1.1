import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { TabStatusBadge } from '@/components/bar/tab-status-badge';
import { useMyBarTab } from '@/hooks';
import { formatCents } from '@/lib/utils';
import type { BarOrderItem } from '@/lib/types/bar-tab.types';

export default function MyTabScreen() {
  const { eventId: eventIdParam } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const eventId = eventIdParam ? Number(eventIdParam) : undefined;

  const { data: tab, isLoading } = useMyBarTab(eventId);

  const activeItems = React.useMemo(
    () => (tab?.orderItems ?? []).filter((i) => i.status !== 'voided'),
    [tab],
  );

  const renderItem = React.useCallback(
    ({ item }: { item: BarOrderItem }) => (
      <View style={styles.itemRow}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.notes && (
            <Text style={styles.itemNotes} numberOfLines={1}>
              {item.notes}
            </Text>
          )}
        </View>
        <Text style={styles.itemQty}>x{item.quantity}</Text>
        <Text style={styles.itemPrice}>{formatCents(item.price * item.quantity)}</Text>
      </View>
    ),
    [],
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <DarkGradientBg />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </View>
    );
  }

  if (!tab) {
    return (
      <View style={styles.container}>
        <DarkGradientBg />
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Tab</Text>
          <View style={styles.headerButton} />
        </Animated.View>
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={48} color="rgba(255,255,255,0.15)" />
          <Text style={styles.emptyTitle}>No open tab</Text>
          <Text style={styles.emptySubtitle}>
            Order from the bar menu to start a tab
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DarkGradientBg />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Tab</Text>
          <TabStatusBadge status={tab.status} />
        </View>
        <View style={styles.headerButton} />
      </Animated.View>

      {/* Items */}
      <FlatList
        data={activeItems}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No items yet</Text>
        }
      />

      {/* Footer total */}
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}
      >
        <GlassView {...liquidGlass.surface} borderRadius={0} style={StyleSheet.absoluteFill} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatCents(tab.subtotal)}</Text>
        </View>
        {tab.tipAmount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tip</Text>
            <Text style={styles.totalValue}>{formatCents(tab.tipAmount)}</Text>
          </View>
        )}
        {tab.taxAmount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax</Text>
            <Text style={styles.totalValue}>{formatCents(tab.taxAmount)}</Text>
          </View>
        )}
        {tab.status === 'paid' && (
          <View style={[styles.totalRow, styles.totalFinalRow]}>
            <Text style={styles.totalFinalLabel}>Total</Text>
            <Text style={styles.totalFinalValue}>{formatCents(tab.total)}</Text>
          </View>
        )}
        {tab.status === 'open' && (
          <Text style={styles.tabHint}>
            Your bartender will close your tab when you're ready to pay
          </Text>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.5)',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    paddingVertical: 32,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 15,
    color: '#fff',
  },
  itemNotes: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  itemQty: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginRight: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  itemPrice: {
    fontSize: 15,
    color: '#fff',
    minWidth: 60,
    textAlign: 'right',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  totalValue: {
    fontSize: 14,
    color: '#fff',
  },
  totalFinalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  totalFinalLabel: {
    fontSize: 17,
    color: '#fff',
  },
  totalFinalValue: {
    fontSize: 17,
    color: '#fff',
  },
  tabHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginTop: 12,
  },
});
