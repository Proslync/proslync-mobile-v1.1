import { NativeSheet } from "@/components/ui/native-sheet";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import {
  useCreatePaymentIntent,
  useGetTiers,
  usePaymentStatus,
  useValidatePromoCode,
} from "@/hooks";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { CreatePaymentIntentResponse } from "@/lib/types/payments.types";
import type {
  PricingRule,
  ValidatePromoCodeResponse,
} from "@/lib/types/pricing.types";
import { Ionicons } from "@expo/vector-icons";
import { useStripe } from "@stripe/stripe-react-native";
import { GlassView } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import * as React from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface PurchaseTicketSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (ticketCount: number) => void;
  eventId: number;
  eventTitle: string;
  eventDate?: string;
  eventImage?: string;
}

type SheetState = "selection" | "payment" | "processing" | "success" | "error";

export function PurchaseTicketSheet({
  visible,
  onClose,
  onSuccess,
  eventId,
  eventTitle,
  eventDate,
  eventImage,
}: PurchaseTicketSheetProps) {
  const { colors, baseColors, isDark } = useAppTheme();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // State
  const [sheetState, setSheetState] = React.useState<SheetState>("selection");
  const [selectedTierId, setSelectedTierId] = React.useState<number | null>(
    null,
  );
  const [selectedPricingId, setSelectedPricingId] = React.useState<
    number | null
  >(null);
  const [quantity, setQuantity] = React.useState(1);
  const [promoCode, setPromoCode] = React.useState("");
  const [appliedPromoCode, setAppliedPromoCode] =
    React.useState<ValidatePromoCodeResponse | null>(null);
  const [paymentIntent, setPaymentIntent] =
    React.useState<CreatePaymentIntentResponse | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // React Query hooks
  const {
    data: tiers,
    isLoading: isLoadingTiers,
    error: tiersError,
  } = useGetTiers(eventId);
  const validatePromoMutation = useValidatePromoCode(eventId);
  const createPaymentMutation = useCreatePaymentIntent(eventId);
  const { data: paymentStatus } = usePaymentStatus(
    paymentIntent?.paymentIntentId || null,
    { enabled: sheetState === "processing" },
  );

  // Derived values
  const selectedTier = tiers?.find((t) => t.id === selectedTierId);
  const selectedPricing = selectedTier?.pricing.find(
    (p) => p.id === selectedPricingId,
  );

  // Calculate available quantity
  const availableQuantity = React.useMemo(() => {
    if (!selectedTier || !selectedPricing) return 0;
    const capacity = selectedPricing.capacity ?? selectedTier.capacity;
    if (!capacity) return 10; // Max 10 if no capacity limit
    const soldCount = selectedPricing.soldCount ?? selectedTier.soldCount ?? 0;
    return Math.min(capacity - soldCount, 10); // Max 10 per purchase
  }, [selectedTier, selectedPricing]);

  // Calculate pricing
  const subtotal = (selectedPricing?.price ?? 0) * quantity;
  const discountAmount = appliedPromoCode?.discountAmount
    ? appliedPromoCode.discountAmount * quantity
    : 0;
  const estimatedTotal = subtotal - discountAmount;

  // Helper to check if a pricing rule is available
  // If isAvailable is not set, compute based on capacity (null = unlimited)
  const isPricingAvailable = React.useCallback(
    (pricing: PricingRule): boolean => {
      // If backend explicitly says not available, respect that
      if (pricing.isAvailable === false) {
        // But check if it's because capacity is null (unlimited) - then it should be available
        if (pricing.capacity === null || pricing.capacity === undefined) {
          return true; // Unlimited capacity
        }
        return false;
      }
      // If isAvailable is true or undefined, check capacity
      if (pricing.capacity === null || pricing.capacity === undefined) {
        return true; // Unlimited
      }
      return pricing.capacity > (pricing.soldCount || 0);
    },
    [],
  );

  // Reset state when sheet opens
  React.useEffect(() => {
    if (visible) {
      setSheetState("selection");
      setSelectedTierId(null);
      setSelectedPricingId(null);
      setQuantity(1);
      setPromoCode("");
      setAppliedPromoCode(null);
      setPaymentIntent(null);
      setErrorMessage(null);
    }
  }, [visible]);

  // Auto-select first tier when loaded
  React.useEffect(() => {
    if (tiers && tiers.length > 0 && !selectedTierId) {
      const firstAvailableTier = tiers.find(
        (t) => t.isActive && t.pricing.some(isPricingAvailable),
      );
      if (firstAvailableTier) {
        setSelectedTierId(firstAvailableTier.id);
        const defaultPricing =
          firstAvailableTier.currentPricing ||
          firstAvailableTier.pricing.find(isPricingAvailable);
        if (defaultPricing) {
          setSelectedPricingId(defaultPricing.id);
        }
      }
    }
  }, [tiers, selectedTierId, isPricingAvailable]);

  // Update pricing when tier changes
  React.useEffect(() => {
    if (selectedTierId && tiers) {
      const tier = tiers.find((t) => t.id === selectedTierId);
      if (tier) {
        const defaultPricing =
          tier.currentPricing || tier.pricing.find(isPricingAvailable);
        setSelectedPricingId(defaultPricing?.id ?? null);
      }
      // Reset promo code and quantity when tier changes
      setAppliedPromoCode(null);
      setQuantity(1);
    }
  }, [selectedTierId, tiers, isPricingAvailable]);

  // Reset promo when pricing changes
  React.useEffect(() => {
    setAppliedPromoCode(null);
  }, [selectedPricingId]);

  // Handle payment status updates
  React.useEffect(() => {
    if (paymentStatus?.status === "succeeded") {
      setSheetState("success");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess(quantity);
    } else if (paymentStatus?.status === "failed") {
      setSheetState("error");
      setErrorMessage(paymentStatus.error || "Payment failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [paymentStatus, quantity, onSuccess]);

  const handleSelectTier = (tierId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTierId(tierId);
  };

  const handleSelectPricing = (pricingId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPricingId(pricingId);
  };

  const handleQuantityChange = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuantity((prev) => {
      const newQty = prev + delta;
      if (appliedPromoCode) {
        setAppliedPromoCode(null);
      }
      return Math.max(1, Math.min(newQty, availableQuantity));
    });
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim() || !selectedTierId) return;

    try {
      const result = await validatePromoMutation.mutateAsync({
        code: promoCode.trim(),
        tierId: selectedTierId,
      });

      if (result.isValid && result.promoCode) {
        setAppliedPromoCode(result);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setAppliedPromoCode(null);
        setErrorMessage(result.error || "Invalid promo code");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      setAppliedPromoCode(null);
      setErrorMessage("Failed to validate promo code");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleRemovePromoCode = () => {
    setAppliedPromoCode(null);
    setPromoCode("");
  };

  const handleBuy = async () => {
    if (!selectedTierId || !selectedPricingId) return;

    setSheetState("payment");
    setErrorMessage(null);

    try {
      // Create payment intent
      const result = await createPaymentMutation.mutateAsync({
        tierId: selectedTierId,
        pricingId: selectedPricingId,
        promoCode: appliedPromoCode?.promoCode?.code,
        quantity,
        metadata: { source: "mobile-app" },
      });

      setPaymentIntent(result);

      // Initialize Stripe PaymentSheet with Apple Pay and Google Pay
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: result.clientSecret,
        merchantDisplayName: "Status",
        style: isDark ? "alwaysDark" : "alwaysLight",
        applePay: { merchantCountryCode: "US" },
        googlePay: { merchantCountryCode: "US", testEnv: __DEV__ },
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // Present PaymentSheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code === "Canceled") {
          // User cancelled - go back to selection
          setSheetState("selection");
          setPaymentIntent(null);
          return;
        }
        throw new Error(paymentError.message);
      }

      // Payment submitted - start polling for status
      setSheetState("processing");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error: any) {
      console.error("Payment error:", error);
      setSheetState("error");
      setErrorMessage(error?.message || "Payment failed. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleClose = () => {
    setSheetState("selection");
    setPaymentIntent(null);
    setErrorMessage(null);
    onClose();
  };

  const handleRetry = () => {
    setSheetState("selection");
    setPaymentIntent(null);
    setErrorMessage(null);
  };

  const formatPrice = (price: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(price);
  };

  const renderTierSelection = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Select Ticket Type
      </Text>
      <View style={styles.tierList}>
        {tiers?.map((tier) => {
          const isSelected = selectedTierId === tier.id;
          const isAvailable =
            tier.isActive && tier.pricing.some(isPricingAvailable);

          return (
            <TouchableOpacity
              key={tier.id}
              onPress={() => isAvailable && handleSelectTier(tier.id)}
              disabled={!isAvailable}
              style={[styles.tierCard, !isAvailable && { opacity: 0.5 }]}
              activeOpacity={0.7}
            >
              <GlassView
                {...(isSelected ? liquidGlass.fillMedium : liquidGlass.fill)}
                borderRadius={12}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.tierHeader}>
                <Text style={[styles.tierName, { color: colors.text }]}>
                  {tier.name}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                )}
              </View>
              {tier.description && (
                <Text
                  style={[
                    styles.tierDescription,
                    { color: colors.textSecondary },
                  ]}
                  numberOfLines={2}
                >
                  {tier.description}
                </Text>
              )}
              {tier.currentPricing && (
                <Text style={[styles.tierPrice, { color: colors.text }]}>
                  {formatPrice(
                    tier.currentPricing.price,
                    tier.currentPricing.currency,
                  )}
                </Text>
              )}
              {!isAvailable && (
                <Text
                  style={[styles.soldOutText, { color: colors.textTertiary }]}
                >
                  Sold Out
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderPricingOptions = () => {
    if (
      !selectedTier ||
      selectedTier.pricing.filter(isPricingAvailable).length <= 1
    ) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Select Pricing
        </Text>
        <View style={styles.pricingList}>
          {selectedTier.pricing.filter(isPricingAvailable).map((pricing) => {
            const isSelected = selectedPricingId === pricing.id;

            return (
              <TouchableOpacity
                key={pricing.id}
                onPress={() => handleSelectPricing(pricing.id)}
                style={styles.pricingCard}
                activeOpacity={0.7}
              >
                <GlassView
                  {...(isSelected ? liquidGlass.fillMedium : liquidGlass.fill)}
                  borderRadius={10}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.pricingContent}>
                  <Text style={[styles.pricingName, { color: colors.text }]}>
                    {pricing.name}
                  </Text>
                  <Text style={[styles.pricingPrice, { color: colors.text }]}>
                    {formatPrice(pricing.price, pricing.currency)}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderPromoCode = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Promo Code (optional)
      </Text>
      <View style={styles.promoRow}>
        <View
          style={[
            styles.promoInput,
            {
              overflow: "hidden" as const,
              backgroundColor: isDark ? undefined : "rgba(0,0,0,0.04)",
              borderColor: isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.08)",
            },
          ]}
        >
          {isDark && (
            <GlassView
              {...liquidGlass.fillFaint}
              borderRadius={10}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          <TextInput
            value={promoCode}
            onChangeText={(text) => {
              setPromoCode(text.toUpperCase().replace(/[^A-Z0-9]/g, ""));
              if (appliedPromoCode) setAppliedPromoCode(null);
            }}
            placeholder="Enter code"
            placeholderTextColor={colors.textTertiary}
            style={{
              flex: 1,
              height: "100%",
              paddingHorizontal: 14,
              fontSize: 14,
              fontFamily: "Lato_400Regular",
              color: colors.text,
            }}
            editable={!appliedPromoCode}
            autoCapitalize="characters"
            maxLength={50}
          />
        </View>
        {appliedPromoCode ? (
          <TouchableOpacity
            onPress={handleRemovePromoCode}
            style={[styles.promoButton, { overflow: "hidden" }]}
          >
            <GlassView
              {...liquidGlass.fillFaint}
              borderRadius={10}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={[styles.promoButtonText, { color: "#ef4444" }]}>
              Remove
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleApplyPromoCode}
            disabled={
              !promoCode.trim() ||
              !selectedTierId ||
              validatePromoMutation.isPending
            }
            style={[
              styles.promoButton,
              {
                overflow: "hidden",
                opacity: !promoCode.trim() || !selectedTierId ? 0.5 : 1,
              },
            ]}
          >
            <GlassView
              {...liquidGlass.fill}
              borderRadius={10}
              style={StyleSheet.absoluteFillObject}
            />
            {validatePromoMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={[styles.promoButtonText, { color: colors.text }]}>
                Apply
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      {appliedPromoCode && (
        <View style={styles.promoApplied}>
          <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
          <Text style={styles.promoAppliedText}>
            Code applied: {appliedPromoCode.promoCode?.code}
          </Text>
        </View>
      )}
    </View>
  );

  const renderQuantitySelector = () => {
    if (!selectedTier || !selectedPricing) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Quantity
        </Text>
        <View style={styles.quantityRow}>
          <TouchableOpacity
            onPress={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
            style={[styles.quantityButton, quantity <= 1 && { opacity: 0.4 }]}
            activeOpacity={0.7}
          >
            <GlassView
              {...liquidGlass.fill}
              borderRadius={20}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="remove" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.quantityDisplay}>
            <Text style={[styles.quantityText, { color: colors.text }]}>
              {quantity}
            </Text>
            {availableQuantity > 0 && (
              <Text
                style={[styles.availableText, { color: colors.textTertiary }]}
              >
                {availableQuantity} available
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => handleQuantityChange(1)}
            disabled={quantity >= availableQuantity}
            style={[
              styles.quantityButton,
              quantity >= availableQuantity && { opacity: 0.4 },
            ]}
            activeOpacity={0.7}
          >
            <GlassView
              {...liquidGlass.fill}
              borderRadius={20}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="add" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPriceSummary = () => {
    if (!selectedPricing) return null;

    return (
      <View style={styles.summary}>
        <GlassView
          {...liquidGlass.fill}
          borderRadius={12}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            Subtotal {quantity > 1 && `(${quantity} tickets)`}
          </Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {formatPrice(subtotal, selectedPricing.currency)}
          </Text>
        </View>
        {appliedPromoCode && discountAmount > 0 && (
          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Discount ({appliedPromoCode.promoCode?.code})
            </Text>
            <Text style={[styles.summaryValue, { color: "#22c55e" }]}>
              -{formatPrice(discountAmount, selectedPricing.currency)}
            </Text>
          </View>
        )}
        <View style={[styles.totalRow, { borderTopColor: colors.separator }]}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>
            {formatPrice(estimatedTotal, selectedPricing.currency)}
          </Text>
        </View>
      </View>
    );
  };

  const renderSelectionContent = () => (
    <ScrollView
      style={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Event Info */}
      <View style={styles.eventRow}>
        {eventImage && (
          <Image
            source={{ uri: eventImage }}
            style={[styles.eventThumb, { borderColor: colors.border }]}
          />
        )}
        <View style={styles.eventInfo}>
          <Text
            style={[styles.eventTitle, { color: colors.text }]}
            numberOfLines={2}
          >
            {eventTitle}
          </Text>
          {eventDate && (
            <Text
              style={[styles.eventDate, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {eventDate}
            </Text>
          )}
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.separator }]} />

      {isLoadingTiers ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.textSecondary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading tickets...
          </Text>
        </View>
      ) : tiersError ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={32}
            color={colors.textTertiary}
            style={{ marginBottom: 8 }}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Failed to load tickets
          </Text>
          <Text
            style={[
              styles.emptyText,
              { color: colors.textTertiary, fontSize: 12, marginTop: 4 },
            ]}
          >
            {tiersError.message || "Please try again later"}
          </Text>
        </View>
      ) : !tiers || tiers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No tickets available for this event
          </Text>
        </View>
      ) : (
        <>
          {renderTierSelection()}
          {renderPricingOptions()}
          {renderPromoCode()}
          {renderQuantitySelector()}
          {renderPriceSummary()}

          {/* Error Message */}
          {errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Buy Button */}
          <TouchableOpacity
            style={[
              styles.buyButton,
              (!selectedTierId ||
                !selectedPricingId ||
                createPaymentMutation.isPending) && {
                opacity: 0.5,
              },
            ]}
            onPress={handleBuy}
            activeOpacity={0.8}
            disabled={
              !selectedTierId ||
              !selectedPricingId ||
              createPaymentMutation.isPending
            }
          >
            <GlassView
              {...liquidGlass.fillMedium}
              borderRadius={12}
              style={StyleSheet.absoluteFill}
            />
            {createPaymentMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <>
                <Ionicons
                  name="ticket-outline"
                  size={20}
                  color={colors.text}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.buyButtonText, { color: colors.text }]}>
                  Buy Ticket{quantity > 1 ? "s" : ""}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );

  const renderProcessingContent = () => (
    <View style={styles.statusContainer}>
      <View style={[styles.statusIcon, { overflow: "hidden" }]}>
        <GlassView
          {...liquidGlass.fillFaint}
          borderRadius={44}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color="#fff" />
      </View>
      <Text style={[styles.statusTitle, { color: colors.text }]}>
        Processing Payment
      </Text>
      <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>
        Please wait while we confirm your payment...
      </Text>
    </View>
  );

  const renderSuccessContent = () => (
    <View style={styles.statusContainer}>
      <View style={[styles.statusIcon, { overflow: "hidden" }]}>
        <GlassView
          {...liquidGlass.fillFaint}
          borderRadius={44}
          style={StyleSheet.absoluteFillObject}
        />
        <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
      </View>
      <Text style={[styles.statusTitle, { color: colors.text }]}>
        Purchase Complete!
      </Text>
      <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>
        {quantity} ticket{quantity > 1 ? "s" : ""} for {eventTitle}
      </Text>
      <Text style={[styles.statusHint, { color: colors.textTertiary }]}>
        Your tickets are in your wallet
      </Text>
      <TouchableOpacity
        style={styles.doneButton}
        onPress={handleClose}
        activeOpacity={0.8}
      >
        <GlassView
          {...liquidGlass.fillMedium}
          borderRadius={12}
          style={StyleSheet.absoluteFill}
        />
        <Text style={[styles.doneButtonText, { color: colors.text }]}>
          Done
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorContent = () => (
    <View style={styles.statusContainer}>
      <View style={[styles.statusIcon, { overflow: "hidden" }]}>
        <GlassView
          {...liquidGlass.fillFaint}
          borderRadius={44}
          style={StyleSheet.absoluteFillObject}
        />
        <Ionicons name="close-circle" size={48} color="#ef4444" />
      </View>
      <Text style={[styles.statusTitle, { color: colors.text }]}>
        Payment Failed
      </Text>
      <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>
        {errorMessage || "Something went wrong. Please try again."}
      </Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={handleRetry}
        activeOpacity={0.8}
      >
        <GlassView
          {...liquidGlass.fillMedium}
          borderRadius={12}
          style={StyleSheet.absoluteFill}
        />
        <Text style={[styles.retryButtonText, { color: colors.text }]}>
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    switch (sheetState) {
      case "processing":
        return renderProcessingContent();
      case "success":
        return renderSuccessContent();
      case "error":
        return renderErrorContent();
      default:
        return renderSelectionContent();
    }
  };

  return (
    <NativeSheet
      isPresented={visible}
      onDismiss={handleClose}
      detents={[{ fraction: 0.8 }, "large"]}
      rnContent
      scrollable
    >
      <View style={styles.content}>{renderContent()}</View>
    </NativeSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 4,
  },
  scrollContent: {
    // ScrollView takes content height, maxHeight is controlled by BottomSheet
  },
  // Event Info
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
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
    fontFamily: "Lato_700Bold",
    lineHeight: 22,
  },
  eventDate: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  // Loading/Empty states
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    minHeight: 150,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    minHeight: 150,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
    textAlign: "center",
  },
  // Section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Lato_700Bold",
    marginBottom: 10,
  },
  // Tier Selection
  tierList: {
    gap: 10,
  },
  tierCard: {
    padding: 14,
    borderRadius: 12,
    overflow: "hidden",
  },
  tierHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  tierName: {
    fontSize: 16,
    fontFamily: "Lato_700Bold",
  },
  tierDescription: {
    fontSize: 12,
    fontFamily: "Lato_400Regular",
    marginBottom: 6,
  },
  tierPrice: {
    fontSize: 18,
    fontFamily: "Lato_700Bold",
  },
  soldOutText: {
    fontSize: 12,
    fontFamily: "Lato_400Regular",
    marginTop: 4,
  },
  // Pricing Options
  pricingList: {
    gap: 8,
  },
  pricingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
    overflow: "hidden",
  },
  pricingContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginRight: 8,
  },
  pricingName: {
    fontSize: 14,
    fontFamily: "Lato_700Bold",
  },
  pricingPrice: {
    fontSize: 16,
    fontFamily: "Lato_700Bold",
  },
  // Promo Code
  promoRow: {
    flexDirection: "row",
    gap: 10,
  },
  promoInput: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: "Lato_400Regular",
  },
  promoButton: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 70,
  },
  promoButtonText: {
    fontSize: 14,
    fontFamily: "Lato_700Bold",
  },
  promoApplied: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  promoAppliedText: {
    fontSize: 12,
    fontFamily: "Lato_400Regular",
    color: "#22c55e",
  },
  // Quantity
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  quantityDisplay: {
    alignItems: "center",
    minWidth: 80,
  },
  quantityText: {
    fontSize: 22,
    fontFamily: "Lato_700Bold",
  },
  availableText: {
    fontSize: 11,
    fontFamily: "Lato_400Regular",
    marginTop: 2,
  },
  // Summary
  summary: {
    padding: 14,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
  },
  summaryValue: {
    fontSize: 13,
    fontFamily: "Lato_700Bold",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 15,
    fontFamily: "Lato_700Bold",
  },
  totalValue: {
    fontSize: 17,
    fontFamily: "Lato_700Bold",
  },
  // Error
  errorContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    textAlign: "center",
  },
  // Buy Button
  buyButton: {
    flexDirection: "row",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 16,
  },
  buyButtonText: {
    fontSize: 16,
    fontFamily: "Lato_700Bold",
    letterSpacing: 0.3,
  },
  // Status States
  statusContainer: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  statusIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 22,
    fontFamily: "Lato_700Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  statusSubtitle: {
    fontSize: 15,
    fontFamily: "Lato_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  statusHint: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    marginTop: 12,
    marginBottom: 24,
  },
  doneButton: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: "Lato_700Bold",
  },
  retryButton: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginTop: 24,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: "Lato_700Bold",
  },
});
