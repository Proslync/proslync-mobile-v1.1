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
import { terminalApi } from "@/lib/api/terminal";
import { useEventSocket } from "@/hooks/use-event-socket";
import { useTapToPay } from "@/hooks/use-tap-to-pay";
import { TerminalProvider } from "@/lib/providers/stripe-terminal-provider";
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

function statusLabel(status: string): string {
  switch (status) {
    case "idle":
      return "Initializing...";
    case "discovering":
      return "Finding reader...";
    case "connecting":
      return "Connecting...";
    case "ready":
      return "Ready";
    case "collecting":
      return "Waiting for tap...";
    case "processing":
      return "Processing...";
    case "success":
      return "Payment received!";
    case "error":
      return "Error";
    default:
      return "";
  }
}

function TapToPayContent() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { eventId: eventIdParam } = useLocalSearchParams<{ eventId: string }>();
  const eventId = eventIdParam ? Number(eventIdParam) : null;

  const { status, error, connect, charge, reset } = useTapToPay(eventId);

  const [guests, setGuests] = React.useState<UnpaidGuest[]>([]);
  const [eventData, setEventData] = React.useState<Omit<
    UnpaidAttendeesResponse,
    "guests"
  > | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [chargingGuestId, setChargingGuestId] = React.useState<number | null>(
    null,
  );

  // Fetch unpaid guests
  const fetchUnpaid = React.useCallback(async () => {
    if (!eventId) return;
    try {
      const res = await paymentsApi.getUnpaidAttendees(eventId);
      setGuests(res.guests);
      setEventData({
        defaultTierId: res.defaultTierId,
        defaultPricingId: res.defaultPricingId,
        defaultPrice: res.defaultPrice,
        currency: res.currency,
      });
    } catch (err: any) {
      console.error("[TapToPay] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

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
    onPaymentReceived: React.useCallback((data: { userId: number }) => {
      setGuests((prev) => prev.filter((g) => g.userId !== data.userId));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, []),
  });

  // Auto-connect reader when screen loads
  React.useEffect(() => {
    if (!eventId || status !== "idle") return;

    (async () => {
      try {
        const { locationId } = await terminalApi.getLocation(eventId);
        await connect(locationId);
      } catch (err: any) {
        console.error("[TapToPay] Connect error:", err);
      }
    })();
  }, [eventId, status, connect]);

  // Handle charge for a guest
  const handleCharge = React.useCallback(
    async (guest: UnpaidGuest) => {
      if (!eventId || !guest.canCollect || status !== "ready") return;

      setChargingGuestId(guest.id);

      try {
        await charge({
          guestId: guest.id,
          tierId: eventData?.defaultTierId,
          pricingId: eventData?.defaultPricingId,
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Optimistically remove from list
        setGuests((prev) => prev.filter((g) => g.id !== guest.id));

        // Reset to ready after a brief delay
        setTimeout(() => reset(), 1500);
      } catch (err: any) {
        console.error("[TapToPay] Charge error:", err);
        Alert.alert("Payment Failed", err?.message || "Something went wrong.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        reset();
      } finally {
        setChargingGuestId(null);
      }
    },
    [eventId, eventData, status, charge, reset],
  );

  const priceDisplay = React.useMemo(() => {
    if (!eventData?.defaultPrice) return null;
    const amount = eventData.defaultPrice / 100;
    const currency = (eventData.currency || "USD").toUpperCase();
    return `$${amount.toFixed(2)} ${currency}`;
  }, [eventData]);

  const isReaderBusy = status === "collecting" || status === "processing";

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
          {item.canCollect ? (
            <GlassButton
              label={isCharging ? "" : "Charge"}
              loading={isCharging}
              size="sm"
              variant="glass"
              onPress={() => handleCharge(item)}
              disabled={isCharging || isReaderBusy || status !== "ready"}
            />
          ) : (
            <View style={styles.disabledBadge}>
              <Text style={styles.disabledText}>No account</Text>
            </View>
          )}
        </Animated.View>
      );
    },
    [chargingGuestId, handleCharge, isReaderBusy, status],
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
          onPress={() => router.back()}
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
              backgroundColor:
                status === "ready"
                  ? "#34d399"
                  : status === "error"
                    ? "#f87171"
                    : status === "success"
                      ? "#34d399"
                      : "#fbbf24",
            },
          ]}
        />
        <Text style={styles.statusText}>{statusLabel(status)}</Text>
        {error && (
          <TouchableOpacity onPress={reset} activeOpacity={0.7}>
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

export default function TapToPayScreen() {
  return (
    <TerminalProvider>
      <TapToPayContent />
    </TerminalProvider>
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
    color: "#0095f6",
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
  disabledBadge: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  disabledText: {
    fontSize: 12,
    fontFamily: "Lato_400Regular",
    color: "rgba(255,255,255,0.25)",
  },
});
