import * as React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  Layout,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { DarkGradientBg } from "@/components/shared/dark-gradient-bg";
import { GlassButton } from "@/components/glass/glass-button";
import { paymentsApi } from "@/lib/api/payments";
import { useEventSocket } from "@/hooks/use-event-socket";
import { useTerminalPayment } from "@/lib/providers/terminal-provider";
import type {
  UnpaidGuest,
  UnpaidAttendeesResponse,
} from "@/lib/types/payments.types";

function formatTimeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type PaymentFlowStatus = "idle" | "collecting" | "processing" | "success";

function statusLabel(
  readerStatus: string,
  flowStatus: PaymentFlowStatus,
): string {
  if (flowStatus === "collecting") return "Waiting for tap...";
  if (flowStatus === "processing") return "Processing...";
  if (flowStatus === "success") return "Payment received!";

  switch (readerStatus) {
    case "connecting":
      return "Connecting to reader...";
    case "connected":
      return "Ready to accept payments";
    case "disconnected":
      return "Reader not connected";
    default:
      return "";
  }
}

function statusDotColor(
  readerStatus: string,
  flowStatus: PaymentFlowStatus,
): string {
  if (flowStatus === "success") return "#34d399";
  if (flowStatus === "collecting" || flowStatus === "processing")
    return "#fbbf24";

  switch (readerStatus) {
    case "connected":
      return "#34d399";
    case "connecting":
      return "#fbbf24";
    default:
      return "#f87171";
  }
}

export default function TapToPayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { eventId: eventIdParam } = useLocalSearchParams<{
    eventId: string;
  }>();
  const eventId = eventIdParam ? Number(eventIdParam) : null;

  const {
    readerStatus,
    isReaderConnected,
    isInitialized,
    connectReader,
    collectPayment,
    cancelCollect,
  } = useTerminalPayment();

  const [guests, setGuests] = React.useState<UnpaidGuest[]>([]);
  const [eventData, setEventData] = React.useState<Omit<
    UnpaidAttendeesResponse,
    "guests"
  > | null>(null);
  const terminalLocationIdRef = React.useRef<string | undefined>(undefined);
  const [loading, setLoading] = React.useState(true);
  const [chargingGuestId, setChargingGuestId] = React.useState<number | null>(
    null,
  );
  const [flowStatus, setFlowStatus] = React.useState<PaymentFlowStatus>("idle");

  // Fetch unpaid guests
  const fetchUnpaid = React.useCallback(async () => {
    if (!eventId) return;
    try {
      const res = await paymentsApi.getUnpaidAttendees(eventId);
      setGuests(res.guests);
      terminalLocationIdRef.current = res.terminalLocationId;
      setEventData({
        defaultTierId: res.defaultTierId,
        defaultPricingId: res.defaultPricingId,
        defaultPrice: res.defaultPrice,
        currency: res.currency,
        terminalLocationId: res.terminalLocationId,
      });
    } catch (err: any) {
      console.error("[TapToPay] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // Connect to Tap to Pay reader once SDK is initialized and locationId is known
  React.useEffect(() => {
    if (
      isInitialized &&
      readerStatus === "disconnected" &&
      terminalLocationIdRef.current
    ) {
      connectReader(terminalLocationIdRef.current).catch((err) => {
        console.warn("[TapToPay] Reader connect failed:", err?.message);
      });
    }
  }, [isInitialized, readerStatus, eventData]);

  // Initial load
  React.useEffect(() => {
    fetchUnpaid();
  }, [fetchUnpaid]);

  // Polling fallback every 30s
  React.useEffect(() => {
    if (!eventId) return;
    const interval = setInterval(fetchUnpaid, 30000);
    return () => clearInterval(interval);
  }, [eventId, fetchUnpaid]);

  // WebSocket live updates
  useEventSocket({
    eventId,
    onGuestCheckedIn: React.useCallback(() => {
      fetchUnpaid();
    }, [fetchUnpaid]),
    onPaymentReceived: React.useCallback(
      (data: { userId?: number | null; guestId?: number | null }) => {
        setGuests((prev) =>
          prev.filter((g) => {
            if (data.guestId && g.id === data.guestId) return false;
            if (data.userId && g.userId && g.userId === data.userId)
              return false;
            return true;
          }),
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
      [],
    ),
  });

  // Handle charge for a guest via Tap to Pay
  const handleCharge = React.useCallback(
    async (guest: UnpaidGuest) => {
      if (!eventId || !isReaderConnected) return;

      setChargingGuestId(guest.id);
      setFlowStatus("collecting");

      try {
        // 1. Create payment intent on the backend with terminal flag
        const result = await paymentsApi.collectAtDoor(eventId, {
          guestId: guest.id,
          tierId: eventData?.defaultTierId,
          pricingId: eventData?.defaultPricingId,
          useTerminal: true,
        });

        // 2. Collect and confirm payment via Terminal (NFC tap)
        setFlowStatus("processing");
        await collectPayment(result.clientSecret);

        // 3. Success!
        setFlowStatus("success");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setGuests((prev) => prev.filter((g) => g.id !== guest.id));

        // Reset after a brief delay
        setTimeout(() => setFlowStatus("idle"), 1500);
      } catch (err: any) {
        if (
          err?.message?.includes("canceled") ||
          err?.message?.includes("Canceled")
        ) {
          setChargingGuestId(null);
          setFlowStatus("idle");
          return;
        }
        console.error("[TapToPay] Payment error:", err);
        Alert.alert("Payment Failed", err?.message || "Something went wrong.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setFlowStatus("idle");
      } finally {
        setChargingGuestId(null);
      }
    },
    [eventId, eventData, isReaderConnected, collectPayment],
  );

  const handleRetryConnect = React.useCallback(() => {
    connectReader(eventData?.terminalLocationId).catch((err) => {
      Alert.alert(
        "Connection Failed",
        err?.message || "Could not connect to reader.",
      );
    });
  }, [connectReader, eventData?.terminalLocationId]);

  const priceDisplay = React.useMemo(() => {
    if (!eventData?.defaultPrice) return null;
    const amount = eventData.defaultPrice / 100;
    const currency = (eventData.currency || "USD").toUpperCase();
    return `$${amount.toFixed(2)} ${currency}`;
  }, [eventData]);

  const isReaderBusy = flowStatus === "collecting" || flowStatus === "processing";

  const renderGuest = React.useCallback(
    ({ item }: { item: UnpaidGuest }) => {
      const isCharging = chargingGuestId === item.id;
      const initials =
        `${item.firstName?.[0] || ""}${item.lastName?.[0] || ""}`.toUpperCase();

      return (
        <Animated.View
          entering={FadeInDown.duration(300)}
          exiting={FadeOut.duration(200)}
          layout={Layout.springify()}
          style={styles.guestRow}
        >
          {/* Avatar */}
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}

          {/* Info */}
          <View style={styles.guestInfo}>
            <Text style={styles.guestName} numberOfLines={1}>
              {item.firstName} {item.lastName}
            </Text>
            <View style={styles.guestMeta}>
              {!item.userId && (
                <Text style={styles.guestMetaText}>Walk-in</Text>
              )}
              {item.age != null && (
                <Text style={styles.guestMetaText}>Age {item.age}</Text>
              )}
              {item.checkedInAt && (
                <Text style={styles.guestMetaText}>
                  {formatTimeAgo(item.checkedInAt)}
                </Text>
              )}
            </View>
          </View>

          {/* Charge Button */}
          <GlassButton
            label={isCharging ? "" : "Collect"}
            loading={isCharging}
            size="sm"
            variant="glass"
            onPress={() => handleCharge(item)}
            disabled={isCharging || isReaderBusy || !isReaderConnected}
          />
        </Animated.View>
      );
    },
    [chargingGuestId, handleCharge, isReaderBusy, isReaderConnected],
  );

  const keyExtractor = React.useCallback(
    (item: UnpaidGuest) => String(item.id),
    [],
  );

  if (!eventId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <DarkGradientBg />
        <Text style={styles.errorText}>No event selected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DarkGradientBg />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            cancelCollect();
            router.back();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Tap to Pay</Text>
          <Text style={styles.headerSubtitle}>
            {guests.length} unpaid guest{guests.length !== 1 ? "s" : ""}
          </Text>
        </View>
        {priceDisplay ? (
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{priceDisplay}</Text>
          </View>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </Animated.View>

      {/* Reader Status Bar */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.statusBar}>
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: statusDotColor(readerStatus, flowStatus),
            },
          ]}
        />
        <Text style={styles.statusText}>
          {statusLabel(readerStatus, flowStatus)}
        </Text>
        {readerStatus === "disconnected" && flowStatus === "idle" && (
          <TouchableOpacity onPress={handleRetryConnect} activeOpacity={0.7}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading guests...</Text>
        </View>
      ) : guests.length === 0 ? (
        <Animated.View
          entering={FadeIn.duration(500)}
          style={styles.centerContent}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={64}
            color="rgba(255,255,255,0.4)"
          />
          <Text style={styles.emptyTitle}>All guests have paid</Text>
          <Text style={styles.emptySubtitle}>
            New unpaid guests will appear here automatically
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          data={guests}
          renderItem={renderGuest}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Lato_700Bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  priceBadge: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  priceText: {
    fontSize: 13,
    fontFamily: "Lato_700Bold",
    color: "#fff",
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Lato_400Regular",
    color: "rgba(255,255,255,0.7)",
  },
  retryText: {
    fontSize: 14,
    fontFamily: "Lato_700Bold",
    color: "#fff",
    textDecorationLine: "underline",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
    color: "rgba(255,255,255,0.5)",
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Lato_700Bold",
    color: "rgba(255,255,255,0.6)",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
  },
  errorText: {
    fontSize: 15,
    fontFamily: "Lato_400Regular",
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginTop: 100,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  guestRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 15,
    fontFamily: "Lato_700Bold",
    color: "rgba(255,255,255,0.6)",
  },
  guestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  guestName: {
    fontSize: 15,
    fontFamily: "Lato_700Bold",
    color: "#fff",
  },
  guestMeta: {
    flexDirection: "row",
    gap: 8,
    marginTop: 3,
  },
  guestMetaText: {
    fontSize: 12,
    fontFamily: "Lato_400Regular",
    color: "rgba(255,255,255,0.4)",
  },
});
