import { MenuItemCard } from "@/components/bar/menu-item-card";
import { CheckoutSheet } from "@/components/bar/checkout-sheet";
import { DarkGradientBg } from "@/components/shared/dark-gradient-bg";
import { useToast } from "@/components/shared/toast";
import { FloatingCartBar } from "@/components/ui/floating-cart-bar";
import { GlassChipBar, type ChipItem } from "@/components/ui/glass-chip-bar";
import { useEvent, useVenueMenu } from "@/hooks";
import {
  useCancelOrder,
  useCreateOrder,
  usePayOrder,
} from "@/hooks/use-bar-orders";
import { useStableRouter } from "@/hooks/use-stable-router";
import { useTerminalPayment } from "@/lib/providers/terminal-provider";
import type { VenueMenuItem } from "@/lib/types/menu.types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import * as React from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ALL_CATEGORY = "all";
const NUM_COLUMNS = 2;

interface CartItem {
  menuItemId: number;
  name: string;
  priceCents: number;
  quantity: number;
}

type ScreenState = "ordering" | "tipping" | "processing" | "receipt";

export default function BarQuickOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = id ? Number(id) : undefined;
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const toast = useToast();
  const { collectPayment, connectReader, isReaderConnected } =
    useTerminalPayment();

  // Data
  const { data: event } = useEvent(eventId);
  const venueId = event?.venueId;
  const { data: menu, isLoading: menuLoading } = useVenueMenu(venueId);

  // Mutations (guard against undefined eventId)
  const createOrder = useCreateOrder(eventId ?? 0);
  const payOrder = usePayOrder(eventId ?? 0);
  const cancelOrder = useCancelOrder(eventId ?? 0);

  // Terminal reader connects lazily — on first checkout, not on mount

  // Local state
  const [cart, setCart] = React.useState<Map<number, CartItem>>(new Map());
  const [selectedCategory, setSelectedCategory] = React.useState(ALL_CATEGORY);
  const [screenState, setScreenState] = React.useState<ScreenState>("ordering");
  const [paidAmountCents, setPaidAmountCents] = React.useState(0);
  const pendingOrderRef = React.useRef<{
    orderId: number;
    paymentIntentId: string;
  } | null>(null);

  // Derived
  const itemCount = React.useMemo(
    () =>
      Array.from(cart.values()).reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );
  const subtotalCents = React.useMemo(
    () =>
      Array.from(cart.values()).reduce(
        (sum, item) => sum + item.priceCents * item.quantity,
        0,
      ),
    [cart],
  );

  // Categories for chip bar
  const categories: ChipItem[] = React.useMemo(() => {
    if (!menu) return [];
    const active = menu.filter(
      (cat) => cat.isActive && cat.items?.some((i) => i.isActive),
    );
    return [
      { id: ALL_CATEGORY, label: "All" },
      ...active.map((cat) => ({ id: String(cat.id), label: cat.name })),
    ];
  }, [menu]);

  // Filtered menu items
  const menuItems: VenueMenuItem[] = React.useMemo(() => {
    if (!menu) return [];
    const active = menu.filter((cat) => cat.isActive);
    if (selectedCategory === ALL_CATEGORY) {
      return active.flatMap(
        (cat) => cat.items?.filter((i) => i.isActive) || [],
      );
    }
    const cat = active.find((c) => String(c.id) === selectedCategory);
    return cat?.items?.filter((i) => i.isActive) || [];
  }, [menu, selectedCategory]);

  // Cart actions
  const addToCart = React.useCallback((item: VenueMenuItem) => {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(item.id);
      if (existing) {
        next.set(item.id, { ...existing, quantity: existing.quantity + 1 });
      } else {
        next.set(item.id, {
          menuItemId: item.id,
          name: item.name,
          priceCents: item.price,
          quantity: 1,
        });
      }
      return next;
    });
  }, []);

  const removeFromCart = React.useCallback((itemId: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(itemId);
      if (existing && existing.quantity > 1) {
        next.set(itemId, { ...existing, quantity: existing.quantity - 1 });
      } else {
        next.delete(itemId);
      }
      return next;
    });
  }, []);

  const setCartQuantity = React.useCallback(
    (item: VenueMenuItem, qty: number) => {
      setCart((prev) => {
        const next = new Map(prev);
        if (qty <= 0) {
          next.delete(item.id);
        } else {
          next.set(item.id, {
            menuItemId: item.id,
            name: item.name,
            priceCents: item.price,
            quantity: qty,
          });
        }
        return next;
      });
    },
    [],
  );

  const clearCartItem = React.useCallback((itemId: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      next.delete(itemId);
      return next;
    });
  }, []);

  const resetOrder = React.useCallback(() => {
    setCart(new Map());
    setScreenState("ordering");
    setPaidAmountCents(0);
    pendingOrderRef.current = null;
  }, []);

  // Checkout flow
  const handleCheckout = () => {
    setScreenState("tipping");
  };

  const handleTipConfirm = async (tipCents: number) => {
    setScreenState("processing");
    try {
      // 1. Create order + PaymentIntent
      const items = Array.from(cart.values()).map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      }));
      const result = await createOrder.mutateAsync({ items, tipCents });
      pendingOrderRef.current = {
        orderId: result.order.id,
        paymentIntentId: result.paymentIntentId,
      };

      // 2. Connect reader if not already connected, then collect
      if (!isReaderConnected) {
        await connectReader(eventId);
      }
      await collectPayment(result.clientSecret);

      // 3. Mark order paid
      await payOrder.mutateAsync({
        orderId: result.order.id,
        data: { paymentIntentId: result.paymentIntentId },
      });

      // 4. Success
      setPaidAmountCents(result.order.totalCents);
      setScreenState("receipt");
    } catch (error) {
      // Cancel the pending order if it was created
      if (pendingOrderRef.current) {
        try {
          await cancelOrder.mutateAsync(pendingOrderRef.current.orderId);
        } catch {
          // Webhook fallback will handle it
        }
        pendingOrderRef.current = null;
      }
      setScreenState("ordering");
      toast.showError(
        error instanceof Error ? error.message : "Payment failed",
      );
    }
  };

  const handleTipClose = () => {
    setScreenState("ordering");
  };

  // ─── Render ─────────────────────────────────────────────────

  if (!venueId && !menuLoading) {
    return (
      <View style={styles.root}>
        <DarkGradientBg />
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bar</Text>
          <View style={styles.headerButton} />
        </Animated.View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            This event does not have a venue with a menu.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <DarkGradientBg />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bar</Text>
        <View style={styles.headerButton} />
      </Animated.View>

      {menuLoading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator color="#fff" size="large" />
        </View>
      ) : menuItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No menu items configured.</Text>
        </View>
      ) : (
        <View style={styles.menuContainer}>
          {/* Category chips */}
          <GlassChipBar
            items={categories}
            selectedId={selectedCategory}
            onSelect={setSelectedCategory}
          />

          {/* Menu grid */}
          <FlatList
            data={menuItems}
            numColumns={NUM_COLUMNS}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[
              styles.grid,
              { paddingBottom: itemCount > 0 ? 140 + insets.bottom : 20 },
            ]}
            renderItem={({ item }) => (
              <MenuItemCard
                name={item.name}
                priceCents={item.price}
                quantity={cart.get(item.id)?.quantity || 0}
                onAdd={() => addToCart(item)}
                onRemove={() => removeFromCart(item.id)}
                onSetQuantity={(qty) => setCartQuantity(item, qty)}
                onClear={() => clearCartItem(item.id)}
              />
            )}
          />
        </View>
      )}

      {/* Floating cart / receipt bar */}
      <FloatingCartBar
        itemCount={itemCount}
        totalCents={subtotalCents}
        onCheckout={handleCheckout}
        loading={screenState === "processing"}
        receiptMode={screenState === "receipt"}
        paidAmountCents={paidAmountCents}
        onNewOrder={resetOrder}
      />

      {/* Tip entry sheet */}
      <CheckoutSheet
        visible={screenState === "tipping"}
        subtotalCents={subtotalCents}
        onClose={handleTipClose}
        onConfirm={handleTipConfirm}
        loading={screenState === "processing"}
        items={Array.from(cart.values()).map((item) => ({
          name: item.name,
          quantity: item.quantity,
          priceCents: item.priceCents,
        }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 16,
    textAlign: "center",
  },
  grid: {
    paddingHorizontal: 12,
    paddingTop: 4,
  },
});
