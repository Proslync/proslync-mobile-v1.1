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
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import * as Haptics from 'expo-haptics';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { GlassSurface } from '@/components/glass/glass-surface';
import { TabStatusBadge } from '@/components/bar/tab-status-badge';
import { AddItemsSheet } from '@/components/bar/add-items-sheet';
import { CheckoutSheet } from '@/components/bar/checkout-sheet';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { useTerminalPayment } from '@/lib/providers/terminal-provider';
import { useStableRouter } from '@/hooks/use-stable-router';
import {
  useBarTab,
  useAddItems,
  useVoidItem,
  useCloseTab,
  useMarkTabPaid,
  useDeleteTab,
  useEvent,
} from '@/hooks';
import { useToast } from '@/components/shared/toast';
import { formatCents } from '@/lib/utils';
import type { BarOrderItem } from '@/lib/types/bar-tab.types';

function BarTabDetailScreen() {
  const { id, tabId: tabIdParam } = useLocalSearchParams<{
    id: string;
    tabId: string;
  }>();
  const router = useStableRouter();
  const insets = useSafeAreaInsets();
  const eventId = id ? Number(id) : undefined;
  const tabId = tabIdParam ? Number(tabIdParam) : undefined;

  const { data: tab, isLoading } = useBarTab(eventId, tabId);
  const { data: event } = useEvent(eventId);
  const addItems = useAddItems(eventId!, tabId!);
  const voidItem = useVoidItem(eventId!, tabId!);
  const closeTab = useCloseTab(eventId!, tabId!);
  const markPaid = useMarkTabPaid(eventId!, tabId!);
  const deleteTab = useDeleteTab(eventId!, tabId!);
  const { showError, showSuccess } = useToast();

  const {
    readerStatus,
    isReaderConnected,
    isInitialized,
    connectReader,
    collectPayment,
  } = useTerminalPayment();

  const [addItemsVisible, setAddItemsVisible] = React.useState(false);
  const [tipSheetVisible, setTipSheetVisible] = React.useState(false);
  const [voidConfirm, setVoidConfirm] = React.useState<BarOrderItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState(false);
  const [paymentStatus, setPaymentStatus] = React.useState<
    'idle' | 'closing' | 'collecting' | 'processing' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const pendingClientSecretRef = React.useRef<string | null>(null);

  // Auto-connect Terminal reader when entering screen
  const connectAttemptedRef = React.useRef(false);
  React.useEffect(() => {
    if (!eventId || !isInitialized || isReaderConnected || connectAttemptedRef.current) return;
    if (readerStatus === 'connecting') return;
    connectAttemptedRef.current = true;
    connectReader(eventId).catch(() => {});
  }, [eventId, isInitialized, isReaderConnected, readerStatus, connectReader]);

  const activeItems = React.useMemo(
    () => (tab?.orderItems ?? []).filter((i) => i.status !== 'voided'),
    [tab],
  );

  const handleAddItems = React.useCallback(
    async (items: Array<{ menuItemId: number; quantity: number; notes?: string }>) => {
      if (!items.length) return;
      try {
        await addItems.mutateAsync({ items });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Error handled by mutation
      }
    },
    [addItems],
  );

  const handleDeleteTab = React.useCallback(async () => {
    try {
      await deleteTab.mutateAsync();
      setDeleteConfirm(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccess('Tab deleted');
      router.back();
    } catch {
      showError('Cannot delete tab — void or remove items first.');
    }
  }, [deleteTab, router, showSuccess, showError]);

  const handleVoidItem = React.useCallback(
    async (item: BarOrderItem) => {
      try {
        await voidItem.mutateAsync(item.id);
        setVoidConfirm(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        showError('Failed to void item.');
      }
    },
    [voidItem],
  );

  const handleCloseAndCharge = React.useCallback(() => {
    if (!tab || paymentStatus !== 'idle') return;
    // If we already have a pending client secret from a previous close, retry collection
    if (pendingClientSecretRef.current && tab.status === 'closed') {
      handleRetryCollect();
      return;
    }
    if (tab.status !== 'open') return;
    setTipSheetVisible(true);
  }, [tab, paymentStatus]);

  const handleRetryCollect = React.useCallback(async () => {
    const clientSecret = pendingClientSecretRef.current;
    if (!clientSecret || !eventId || !tabId) return;

    setPaymentStatus('collecting');
    try {
      await collectPayment(clientSecret);
      setPaymentStatus('processing');
      await markPaid.mutateAsync();
      pendingClientSecretRef.current = null;
      setPaymentStatus('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => router.back(), 1500);
    } catch (err: any) {
      if (err?.message?.includes('canceled')) {
        setPaymentStatus('idle');
        return;
      }
      setPaymentStatus('error');
      setErrorMessage(err?.message || 'Payment failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => setPaymentStatus('idle'), 2000);
    }
  }, [eventId, tabId, collectPayment, markPaid, router]);

  const handleChargeWithTip = React.useCallback(
    async (tipCents: number) => {
      if (!tab || !eventId || !tabId) return;
      setTipSheetVisible(false);
      setPaymentStatus('closing');

      try {
        const { clientSecret } = await closeTab.mutateAsync({ tipCents });
        pendingClientSecretRef.current = clientSecret;

        setPaymentStatus('collecting');
        await collectPayment(clientSecret);

        setPaymentStatus('processing');
        await markPaid.mutateAsync();

        pendingClientSecretRef.current = null;
        setPaymentStatus('success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        setTimeout(() => {
          router.back();
        }, 1500);
      } catch (err: any) {
        if (err?.message?.includes('canceled')) {
          setPaymentStatus('idle');
          return;
        }
        setPaymentStatus('error');
        setErrorMessage(err?.message || 'Payment failed');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setTimeout(() => setPaymentStatus('idle'), 2000);
      }
    },
    [tab, eventId, tabId, closeTab, collectPayment, markPaid, router],
  );

  const isProcessing = paymentStatus !== 'idle' && paymentStatus !== 'error';
  const canRetry = tab?.status === 'closed' && !!pendingClientSecretRef.current && !isProcessing;
  const canCharge =
    (tab?.status === 'open' && activeItems.length > 0 && !isProcessing) || canRetry;

  const renderItem = React.useCallback(
    ({ item }: { item: BarOrderItem }) => (
      <View style={styles.orderItemRow}>
        <View style={styles.orderItemInfo}>
          <Text style={styles.orderItemName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.notes && (
            <Text style={styles.orderItemNotes} numberOfLines={1}>
              {item.notes}
            </Text>
          )}
        </View>
        <Text style={styles.orderItemQty}>x{item.quantity}</Text>
        <Text style={styles.orderItemPrice}>{formatCents(item.price * item.quantity)}</Text>
        {tab?.status === 'open' && (
          <TouchableOpacity
            onPress={() => setVoidConfirm(item)}
            style={styles.voidButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle-outline" size={20} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        )}
      </View>
    ),
    [tab?.status],
  );

  if (isLoading || !tab) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <DarkGradientBg />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
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
          <Text style={styles.headerTitle} numberOfLines={1}>
            {tab.guestName || 'Guest'}
          </Text>
          <TabStatusBadge status={tab.status} />
        </View>
        <View style={styles.headerButton} />
      </Animated.View>

      {/* Payment status banner */}
      {paymentStatus !== 'idle' && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.paymentBanner}>
          <View
            style={[
              styles.paymentDot,
              {
                backgroundColor:
                  paymentStatus === 'success'
                    ? '#34d399'
                    : paymentStatus === 'error'
                      ? '#f87171'
                      : '#fbbf24',
              },
            ]}
          />
          <Text style={styles.paymentStatusText}>
            {paymentStatus === 'closing' && 'Closing tab...'}
            {paymentStatus === 'collecting' && 'Waiting for tap...'}
            {paymentStatus === 'processing' && 'Processing payment...'}
            {paymentStatus === 'success' && 'Payment received!'}
            {paymentStatus === 'error' && 'Payment failed'}
          </Text>
        </Animated.View>
      )}

      {/* Items list */}
      <FlatList
        data={activeItems}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        ListHeaderComponent={
          tab.status === 'open' ? (
            <Animated.View entering={FadeInDown.duration(300)}>
              <TouchableOpacity
                style={[styles.addItemsButton, { overflow: 'hidden' }]}
                onPress={() => setAddItemsVisible(true)}
                activeOpacity={0.7}
              >
                <GlassView {...liquidGlass.fill} borderRadius={12} style={StyleSheet.absoluteFill} />
                <Ionicons name="add-circle-outline" size={20} color="rgba(255,255,255,0.7)" />
                <Text style={styles.addItemsText}>Add Items</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : null
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No items yet</Text>
        }
      />

      {/* Footer with total and charge button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }, deleteConfirm && { opacity: 0 }]}>
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
        {tab.status === 'paid' && (
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, styles.totalFinal]}>Total Charged</Text>
            <Text style={[styles.totalValue, styles.totalFinal]}>
              {formatCents(tab.total)}
            </Text>
          </View>
        )}

        {canCharge && (
          <TouchableOpacity
            style={[styles.chargeButton, { overflow: 'hidden' }]}
            onPress={handleCloseAndCharge}
            activeOpacity={0.7}
          >
            <GlassView {...liquidGlass.fillMedium} borderRadius={14} style={StyleSheet.absoluteFill} />
            <Ionicons name="flash" size={20} color="#fff" />
            <Text style={styles.chargeButtonText}>
              {canRetry ? 'Retry Payment' : 'Close & Charge'}
            </Text>
          </TouchableOpacity>
        )}

        {!isReaderConnected && tab.status === 'open' && (
          <Text style={styles.readerHint}>
            {readerStatus === 'connecting'
              ? 'Connecting to reader...'
              : 'Terminal reader not connected'}
          </Text>
        )}

        {tab.status === 'open' && activeItems.length === 0 && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setDeleteConfirm(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
            <Text style={styles.deleteButtonText}>Delete Tab</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Add Items Sheet */}
      {event?.venueId && (
        <AddItemsSheet
          visible={addItemsVisible}
          venueId={event.venueId}
          onClose={() => setAddItemsVisible(false)}
          onConfirm={handleAddItems}
        />
      )}

      {/* Tip Entry Sheet */}
      <CheckoutSheet
        visible={tipSheetVisible}
        subtotalCents={tab.subtotal}
        onClose={() => setTipSheetVisible(false)}
        onConfirm={handleChargeWithTip}
        loading={isProcessing}
      />

      {/* Confirm modals — last in tree so they render on top of everything */}
      <ConfirmSheet
        visible={!!voidConfirm}
        onClose={() => setVoidConfirm(null)}
        title="Void Item"
        message={`Remove "${voidConfirm?.name}" from this tab?`}
        confirmLabel="Void"
        onConfirm={() => voidConfirm && handleVoidItem(voidConfirm)}
        isLoading={voidItem.isPending}
        icon="trash-outline"
      />

      <ConfirmSheet
        visible={!!errorMessage}
        onClose={() => setErrorMessage(null)}
        title="Payment Failed"
        message={errorMessage || ''}
        alertOnly
        icon="card-outline"
      />

      <ConfirmSheet
        visible={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDeleteTab}
        title="Delete Tab"
        message={`Delete ${tab?.guestName || 'this'} tab? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        isLoading={deleteTab.isPending}
        icon="trash-outline"
      />
    </View>
  );
}

export default BarTabDetailScreen;

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
    paddingBottom: 12,
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
    maxWidth: 200,
  },
  paymentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  paymentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paymentStatusText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  addItemsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  addItemsText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    paddingVertical: 32,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  orderItemInfo: {
    flex: 1,
    marginRight: 8,
  },
  orderItemName: {
    fontSize: 15,
    color: '#fff',
  },
  orderItemNotes: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  orderItemQty: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginRight: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  orderItemPrice: {
    fontSize: 15,
    color: '#fff',
    minWidth: 60,
    textAlign: 'right',
  },
  voidButton: {
    marginLeft: 8,
    padding: 4,
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
  totalFinal: {
    fontSize: 16,
  },
  chargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 12,
  },
  chargeButtonText: {
    fontSize: 17,
    color: '#fff',
  },
  readerHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    marginTop: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 12,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#FF3B30',
  },
});
