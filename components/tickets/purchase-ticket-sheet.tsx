import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BottomSheet } from '@/components/wallet/bottom-sheet';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ticketsApi } from '@/lib/api/tickets';
import type { TicketInfoResponse } from '@/lib/api/tickets';

interface PurchaseTicketSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (ticketCount: number) => void;
  eventId: number;
  eventTitle: string;
  eventDate?: string;
  eventImage?: string;
  price?: number | null;
}

export function PurchaseTicketSheet({
  visible,
  onClose,
  onSuccess,
  eventId,
  eventTitle,
  eventDate,
  eventImage,
  price: initialPrice,
}: PurchaseTicketSheetProps) {
  const { colors, isDark } = useAppTheme();
  const [quantity, setQuantity] = React.useState(1);
  const [ticketInfo, setTicketInfo] = React.useState<TicketInfoResponse | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = React.useState(false);
  const [isPurchasing, setIsPurchasing] = React.useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const unitPrice = ticketInfo?.price ?? initialPrice ?? 0;
  const serviceFee = ticketInfo?.serviceFee ?? Math.round(unitPrice * 0.1 * 100) / 100;
  const maxQuantity = ticketInfo?.maxPerPurchase ?? 10;
  const subtotal = unitPrice * quantity;
  const totalFees = serviceFee * quantity;
  const total = subtotal + totalFees;

  // Fetch ticket info when sheet opens
  React.useEffect(() => {
    if (visible && eventId) {
      setQuantity(1);
      setPurchaseSuccess(false);
      setError(null);
      fetchTicketInfo();
    }
  }, [visible, eventId]);

  const fetchTicketInfo = async () => {
    setIsLoadingInfo(true);
    try {
      const info = await ticketsApi.getTicketInfo(eventId);
      setTicketInfo(info);
    } catch (err) {
      // Use initial price as fallback
      console.log('[PurchaseSheet] Could not fetch ticket info:', err);
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const handleIncrement = () => {
    if (quantity < maxQuantity) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setQuantity(q => q + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setQuantity(q => q - 1);
    }
  };

  const handlePurchase = async () => {
    if (isPurchasing) return;
    setIsPurchasing(true);
    setError(null);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const response = await ticketsApi.purchaseTicket(eventId, { quantity });

      if (response.success) {
        setPurchaseSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSuccess(quantity);
      } else {
        setError(response.message || 'Purchase failed. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err: any) {
      console.error('[PurchaseSheet] Purchase error:', err);
      setError(err?.message || 'Something went wrong. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleClose = () => {
    setPurchaseSuccess(false);
    setError(null);
    setQuantity(1);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={handleClose} maxHeight="70%">
      {purchaseSuccess ? (
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
            <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>Purchase Complete!</Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            {quantity} ticket{quantity > 1 ? 's' : ''} for {eventTitle}
          </Text>
          <Text style={[styles.successHint, { color: colors.textTertiary }]}>
            Your tickets are in your wallet
          </Text>
          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)', borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)' }]}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={[styles.doneButtonText, { color: colors.text }]}>Done</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Event Info */}
          <View style={styles.eventRow}>
            {eventImage && (
              <Image source={{ uri: eventImage }} style={[styles.eventThumb, { borderColor: colors.border }]} />
            )}
            <View style={styles.eventInfo}>
              <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
                {eventTitle}
              </Text>
              {eventDate && (
                <Text style={[styles.eventDate, { color: colors.textSecondary }]} numberOfLines={1}>
                  {eventDate}
                </Text>
              )}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.separator }]} />

          {isLoadingInfo ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.textSecondary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading ticket info...</Text>
            </View>
          ) : (
            <>
              {/* Quantity Selector */}
              <View style={styles.quantityRow}>
                <Text style={[styles.label, { color: colors.text }]}>Quantity</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    onPress={handleDecrement}
                    disabled={quantity <= 1}
                    style={[
                      styles.quantityButton,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' },
                      quantity <= 1 && { opacity: 0.35 },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={20} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.quantityText, { color: colors.text }]}>{quantity}</Text>
                  <TouchableOpacity
                    onPress={handleIncrement}
                    disabled={quantity >= maxQuantity}
                    style={[
                      styles.quantityButton,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' },
                      quantity >= maxQuantity && { opacity: 0.35 },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.separator }]} />

              {/* Price Breakdown */}
              <View style={styles.priceSection}>
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
                    ${unitPrice.toFixed(2)} x {quantity}
                  </Text>
                  <Text style={[styles.priceValue, { color: colors.textSecondary }]}>
                    ${subtotal.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
                    Service fee x {quantity}
                  </Text>
                  <Text style={[styles.priceValue, { color: colors.textSecondary }]}>
                    ${totalFees.toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.totalDivider, { backgroundColor: colors.separator }]} />
                <View style={styles.priceRow}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
                  <Text style={[styles.totalValue, { color: colors.text }]}>
                    ${total.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Purchase Button */}
              <TouchableOpacity
                style={[
                  styles.purchaseButton,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)', borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)' },
                  isPurchasing && { opacity: 0.7 },
                ]}
                onPress={handlePurchase}
                activeOpacity={0.8}
                disabled={isPurchasing || unitPrice <= 0}
              >
                {isPurchasing ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Text style={[styles.purchaseButtonText, { color: colors.text }]}>
                    Pay ${total.toFixed(2)}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 4,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  eventThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    borderWidth: 1,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    lineHeight: 22,
  },
  eventDate: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  quantityText: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    minWidth: 24,
    textAlign: 'center',
  },
  priceSection: {
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  priceValue: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  totalDivider: {
    height: 1,
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  totalValue: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  errorContainer: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
  },
  purchaseButton: {
    marginTop: 20,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 0.3,
  },
  // Success state
  successContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontFamily: 'Lato_700Bold',
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
  },
  successHint: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 8,
    marginBottom: 24,
  },
  doneButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
});
