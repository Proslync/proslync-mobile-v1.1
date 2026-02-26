import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useStripe } from '@stripe/stripe-react-native';
import { BottomSheet } from '@/components/wallet/bottom-sheet';
import { GlassButton } from '@/components/glass/glass-button';
import { GlassSurface } from '@/components/glass/glass-surface';
import { useAppTheme } from '@/hooks/use-app-theme';
import { tablesApi } from '@/lib/api/tables';
import { usePaymentStatus } from '@/hooks/use-payment-intent';
import type { EventTableItem } from '@/lib/types/tables.types';

interface PurchaseTableSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventId: number;
  eventTitle: string;
  table: EventTableItem | null;
}

type SheetState = 'confirm' | 'payment' | 'processing' | 'success' | 'error';

export function PurchaseTableSheet({
  visible,
  onClose,
  onSuccess,
  eventId,
  eventTitle,
  table,
}: PurchaseTableSheetProps) {
  const { colors } = useAppTheme();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [sheetState, setSheetState] = useState<SheetState>('confirm');
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const { data: paymentStatus } = usePaymentStatus(paymentIntentId, {
    enabled: sheetState === 'processing',
  });

  // Reset on visibility change
  useEffect(() => {
    if (visible) {
      setSheetState('confirm');
      setPaymentIntentId(null);
    }
  }, [visible]);

  // Handle payment status updates during processing
  useEffect(() => {
    if (sheetState !== 'processing') return;

    if (paymentStatus?.status === 'succeeded') {
      setSheetState('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
    } else if (paymentStatus?.status === 'failed') {
      setSheetState('error');
    }
  }, [paymentStatus, sheetState, onSuccess]);

  const formatPrice = (price: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleReserve = async () => {
    if (!table) return;

    setSheetState('payment');

    try {
      const result = await tablesApi.purchaseTable(eventId, table.id);

      setPaymentIntentId(result.paymentIntentId);

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: result.clientSecret,
        merchantDisplayName: 'Status',
        style: 'alwaysDark',
        applePay: { merchantCountryCode: 'US' },
        googlePay: { merchantCountryCode: 'US', testEnv: __DEV__ },
      });

      if (initError) {
        throw new Error(initError.message);
      }

      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code === 'Canceled') {
          setSheetState('confirm');
          setPaymentIntentId(null);
          return;
        }
        throw new Error(paymentError.message);
      }

      setSheetState('processing');
    } catch (error: any) {
      console.error('[PurchaseTableSheet] Payment error:', error);
      setSheetState('error');
    }
  };

  const renderConfirmContent = () => {
    if (!table) return null;

    const priceLabel = formatPrice(table.price, table.currency);

    return (
      <View style={styles.confirmContainer}>
        <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.tableCard}>
          <Text style={[styles.sectionName, { color: colors.textSecondary }]}>
            {table.sectionName.toUpperCase()}
          </Text>
          <Text style={[styles.tableLabel, { color: colors.text }]}>{table.label}</Text>
          <Text style={[styles.seatCount, { color: colors.textTertiary }]}>
            {table.seatCount} seats
          </Text>
          <Text style={[styles.price, { color: colors.text }]}>{priceLabel}</Text>
        </GlassSurface>

        <View style={styles.buttonContainer}>
          <GlassButton
            label={`Reserve Table — ${priceLabel}`}
            onPress={handleReserve}
            fullWidth
            size="lg"
          />
        </View>
      </View>
    );
  };

  const renderPaymentContent = () => (
    <View style={styles.statusContainer}>
      <ActivityIndicator size="large" color="rgba(255,255,255,0.8)" style={styles.activityIndicator} />
      <Text style={[styles.statusTitle, { color: colors.text }]}>Processing payment...</Text>
    </View>
  );

  const renderProcessingContent = () => (
    <View style={styles.statusContainer}>
      <ActivityIndicator size="large" color="rgba(255,255,255,0.8)" style={styles.activityIndicator} />
      <Text style={[styles.statusTitle, { color: colors.text }]}>
        Confirming your reservation...
      </Text>
    </View>
  );

  const renderSuccessContent = () => (
    <View style={styles.statusContainer}>
      <View style={styles.successIconCircle}>
        <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
      </View>
      <Text style={[styles.statusTitle, { color: colors.text }]}>Table Reserved!</Text>
      <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>
        You're all set for {eventTitle}
      </Text>
      <View style={styles.buttonContainer}>
        <GlassButton label="Done" onPress={onClose} fullWidth size="lg" />
      </View>
    </View>
  );

  const renderErrorContent = () => (
    <View style={styles.statusContainer}>
      <View style={styles.errorIconCircle}>
        <Ionicons name="close-circle" size={48} color="#ef4444" />
      </View>
      <Text style={[styles.statusTitle, { color: colors.text }]}>Something went wrong</Text>
      <View style={styles.errorButtonRow}>
        <GlassButton
          label="Try Again"
          onPress={() => setSheetState('confirm')}
          fullWidth
          size="lg"
        />
        <GlassButton label="Close" onPress={onClose} fullWidth size="lg" />
      </View>
    </View>
  );

  const renderContent = () => {
    switch (sheetState) {
      case 'confirm':
        return renderConfirmContent();
      case 'payment':
        return renderPaymentContent();
      case 'processing':
        return renderProcessingContent();
      case 'success':
        return renderSuccessContent();
      case 'error':
        return renderErrorContent();
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight="60%">
      <View style={styles.content}>{renderContent()}</View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 4,
  },
  // Confirm state
  confirmContainer: {
    paddingBottom: 8,
  },
  tableCard: {
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  sectionName: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  tableLabel: {
    fontSize: 22,
    fontFamily: 'Lato_700Bold',
    marginBottom: 6,
  },
  seatCount: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontFamily: 'Lato_700Bold',
  },
  buttonContainer: {
    width: '100%',
  },
  // Status states
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  activityIndicator: {
    marginBottom: 20,
  },
  successIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 22,
    fontFamily: 'Lato_700Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  errorButtonRow: {
    width: '100%',
    gap: 12,
    marginTop: 24,
  },
});
