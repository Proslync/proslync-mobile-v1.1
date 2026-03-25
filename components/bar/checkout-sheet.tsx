import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { GlassView } from "expo-glass-effect";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeSheet, canUseNativeSheet } from "@/components/ui/native-sheet";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const RADIUS = 20;
const SPRING_CONFIG = { damping: 20, stiffness: 300, mass: 0.8 };
const TIP_PRESETS = [15, 18, 20, 25];

function formatCents(cents: number): string {
  if (!Number.isFinite(cents)) return "$0.00";
  return `$${(cents / 100).toFixed(2)}`;
}

const renderBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop
    {...props}
    disappearsOnIndex={-1}
    appearsOnIndex={0}
    opacity={0.6}
  />
);

export interface OrderLineItem {
  name: string;
  quantity: number;
  priceCents: number;
}

interface CheckoutSheetProps {
  visible: boolean;
  subtotalCents: number;
  onClose: () => void;
  onConfirm: (tipCents: number) => void;
  loading?: boolean;
  /** Optional order items to display as summary */
  items?: OrderLineItem[];
}

// ─── Shared Tip Content (used by both native and gorhom) ───

function TipContent({
  subtotalCents,
  onClose,
  onConfirm,
  loading,
  items,
}: Omit<CheckoutSheetProps, "visible">) {
  const insets = useSafeAreaInsets();
  const [selectedPercent, setSelectedPercent] = React.useState<number | null>(
    null,
  );
  const [customTipCents, setCustomTipCents] = React.useState(0);

  // Reset state when content mounts (sheet opens)
  React.useEffect(() => {
    setSelectedPercent(null);
    setCustomTipCents(0);
  }, []);

  const tipCents = React.useMemo(() => {
    if (selectedPercent !== null) {
      return Math.round(subtotalCents * (selectedPercent / 100));
    }
    return customTipCents;
  }, [selectedPercent, customTipCents, subtotalCents]);

  const totalCents = subtotalCents + tipCents;

  return (
    <View style={[styles.content, { paddingBottom: insets.bottom + 12 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Checkout</Text>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </View>

      {/* Order summary */}
      {items && items.length > 0 && (
        <View style={styles.orderSummary}>
          {items.map((item, i) => (
            <View key={i} style={styles.orderRow}>
              <Text style={styles.orderQty}>{item.quantity}×</Text>
              <Text style={styles.orderName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.orderPrice}>
                {formatCents(item.priceCents * item.quantity)}
              </Text>
            </View>
          ))}
          <View style={styles.orderDivider} />
          <View style={styles.orderRow}>
            <Text style={styles.orderSubtotalLabel}>Subtotal</Text>
            <Text style={styles.orderSubtotalValue}>
              {formatCents(subtotalCents)}
            </Text>
          </View>
        </View>
      )}

      {!items?.length && (
        <Text style={styles.subtotal}>
          Subtotal: {formatCents(subtotalCents)}
        </Text>
      )}

      {/* Tip presets */}
      <View style={styles.presetsRow}>
        {TIP_PRESETS.map((pct) => {
          const isActive = selectedPercent === pct;
          return (
            <TouchableOpacity
              key={pct}
              style={[
                styles.presetButton,
                isActive && styles.presetButtonActive,
              ]}
              onPress={() => setSelectedPercent(isActive ? null : pct)}
              activeOpacity={0.7}
            >
              <GlassView
                {...(isActive ? liquidGlass.fillStrong : liquidGlass.fill)}
                borderRadius={12}
                style={StyleSheet.absoluteFill}
              />
              <Text
                style={[
                  styles.presetPercent,
                  isActive && styles.presetActiveText,
                ]}
              >
                {pct}%
              </Text>
              <Text
                style={[
                  styles.presetAmount,
                  isActive && styles.presetActiveText,
                ]}
              >
                {formatCents(Math.round(subtotalCents * (pct / 100)))}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* No tip */}
      <TouchableOpacity
        style={styles.noTipButton}
        onPress={() => {
          setSelectedPercent(null);
          setCustomTipCents(0);
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.noTipText}>No Tip</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Total summary */}
      <View style={styles.totalSection}>
        {tipCents > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalRowLabel}>Tip</Text>
            <Text style={styles.totalRowValue}>{formatCents(tipCents)}</Text>
          </View>
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCents(totalCents)}</Text>
        </View>
      </View>

      {/* Charge button */}
      <TouchableOpacity
        style={[styles.chargeButton, loading && styles.disabled]}
        onPress={() => onConfirm(tipCents)}
        activeOpacity={0.7}
        disabled={loading}
      >
        <GlassView
          {...liquidGlass.fillStrong}
          borderRadius={14}
          style={StyleSheet.absoluteFill}
          isInteractive
        />
        <Ionicons name="flash" size={18} color="#fff" />
        <Text style={styles.chargeText}>
          {loading ? "Processing..." : `Charge ${formatCents(totalCents)}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Native SwiftUI Sheet ───

function NativeTipSheet({
  visible,
  subtotalCents,
  onClose,
  onConfirm,
  loading,
  items,
}: CheckoutSheetProps) {
  return (
    <NativeSheet
      isPresented={visible}
      onDismiss={onClose}
      detents={["medium"]}
      rnContent
    >
      <TipContent
        subtotalCents={subtotalCents}
        onClose={onClose}
        onConfirm={onConfirm}
        loading={loading}
        items={items}
      />
    </NativeSheet>
  );
}

// ─── Gorhom Fallback Sheet ───

function GorhomTipSheet({
  visible,
  subtotalCents,
  onClose,
  onConfirm,
  loading,
  items,
}: CheckoutSheetProps) {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const scale = useSharedValue(0.92);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
      scale.value = withSpring(1, SPRING_CONFIG);
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      bottomSheetRef.current?.close();
      scale.value = withTiming(0.92, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      enableDynamicSizing
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{
        backgroundColor: "rgba(10,10,10,0.85)",
        borderRadius: RADIUS,
      }}
      handleIndicatorStyle={{
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: "rgba(255,255,255,0.3)",
      }}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView>
        <Animated.View style={animatedStyle}>
          <TipContent
            subtotalCents={subtotalCents}
            onClose={onClose}
            onConfirm={onConfirm}
            loading={loading}
            items={items}
          />
        </Animated.View>
      </BottomSheetView>
    </BottomSheet>
  );
}

// ─── Export: auto-select native or fallback ───

export function CheckoutSheet(props: CheckoutSheetProps) {
  if (canUseNativeSheet()) {
    return <NativeTipSheet {...props} />;
  }
  return <GorhomTipSheet {...props} />;
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  subtotal: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    marginTop: 4,
    marginBottom: 20,
  },
  orderSummary: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 6,
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderQty: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.4)",
    width: 28,
  },
  orderName: {
    flex: 1,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  orderPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
    marginLeft: 8,
  },
  orderDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 4,
  },
  orderSubtotalLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  orderSubtotalValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  presetsRow: {
    flexDirection: "row",
    gap: 8,
  },
  presetButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  presetButtonActive: {
    borderColor: "rgba(255,255,255,0.25)",
  },
  presetPercent: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
  },
  presetAmount: {
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
    marginTop: 2,
  },
  presetActiveText: {
    color: "#fff",
  },
  noTipButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  noTipText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 16,
  },
  totalSection: {
    gap: 6,
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalRowLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
  },
  totalRowValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  chargeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  chargeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  disabled: {
    opacity: 0.5,
  },
});
