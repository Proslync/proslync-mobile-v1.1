import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { GlassView } from "expo-glass-effect";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import { DarkGradientBg } from "@/components/shared/dark-gradient-bg";
import { useAppTheme } from "@/hooks/use-app-theme";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { paymentsApi } from "@/lib/api/payments";
import { TerminalProvider, useTerminalPayment } from "@/lib/providers/terminal-provider";

function readerStatusLabel(
  readerStatus: string,
  paymentStatus: string,
  isInitialized: boolean,
): string {
  if (paymentStatus === "collecting") return "Waiting for tap...";
  if (paymentStatus === "processing") return "Processing...";
  if (paymentStatus === "success") return "Payment received!";
  if (paymentStatus === "error") return "Error";

  switch (readerStatus) {
    case "disconnected":
      return isInitialized ? "Discovering reader..." : "Initializing SDK...";
    case "connecting":
      return "Connecting to reader...";
    case "connected":
      return "Ready";
    default:
      return "";
  }
}

const KEYPAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"];

function TapToChargeContent() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { eventId: eventIdParam } = useLocalSearchParams<{ eventId: string }>();
  const eventId = eventIdParam ? Number(eventIdParam) : null;

  const {
    readerStatus,
    isReaderConnected,
    isInitialized,
    initError,
    retryInit,
    connectReader,
    collectPayment,
  } = useTerminalPayment();

  const [amount, setAmount] = React.useState("0");
  const [paymentStatus, setPaymentStatus] = React.useState<
    "idle" | "collecting" | "processing" | "success" | "error"
  >("idle");
  const [paymentFailedAlert, setPaymentFailedAlert] = React.useState<string | null>(null);
  const [connectError, setConnectError] = React.useState<string | null>(null);
  const connectAttemptedRef = React.useRef(false);

  // Auto-connect reader when SDK is initialized
  React.useEffect(() => {
    if (!eventId || !isInitialized || isReaderConnected || connectAttemptedRef.current) return;
    if (readerStatus === "connecting") return;
    connectAttemptedRef.current = true;

    (async () => {
      try {
        setConnectError(null);
        await connectReader(eventId ?? undefined);
      } catch (err: any) {
        setConnectError(err?.message || "Failed to connect");
      }
    })();
  }, [eventId, isInitialized, isReaderConnected, readerStatus, connectReader]);

  const amountCents = React.useMemo(() => {
    const num = parseFloat(amount);
    return isNaN(num) ? 0 : Math.round(num * 100);
  }, [amount]);

  const displayAmount = React.useMemo(() => {
    if (amount === "0") return "$0.00";
    // If has decimal, format with exactly 2 decimal places for display
    if (amount.includes(".")) {
      const parts = amount.split(".");
      return `$${parts[0]}.${(parts[1] || "").padEnd(2, "0").slice(0, 2)}`;
    }
    return `$${amount}.00`;
  }, [amount]);

  const handleKeyPress = React.useCallback(
    (key: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (key === "del") {
        setAmount((prev) => {
          if (prev.length <= 1) return "0";
          return prev.slice(0, -1);
        });
        return;
      }

      if (key === ".") {
        setAmount((prev) => {
          if (prev.includes(".")) return prev;
          return prev + ".";
        });
        return;
      }

      setAmount((prev) => {
        // Limit decimal places to 2
        if (prev.includes(".")) {
          const decimalPart = prev.split(".")[1] || "";
          if (decimalPart.length >= 2) return prev;
        }
        // Limit total digits
        if (prev.replace(".", "").length >= 7) return prev;
        if (prev === "0") return key;
        return prev + key;
      });
    },
    [],
  );

  const handleCharge = React.useCallback(async () => {
    if (!eventId || amountCents <= 0 || !isReaderConnected) return;

    setPaymentStatus("collecting");

    try {
      const { clientSecret } = await paymentsApi.collectAtDoor(eventId, {
        customAmountCents: amountCents,
        useTerminal: true,
      });

      setPaymentStatus("processing");
      await collectPayment(clientSecret);

      setPaymentStatus("success");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Reset after brief delay
      setTimeout(() => {
        setPaymentStatus("idle");
        setAmount("0");
      }, 1500);
    } catch (err: any) {
      if (err?.message?.includes("canceled")) {
        setPaymentStatus("idle");
        return;
      }
      setPaymentStatus("error");
      setPaymentFailedAlert(err?.message || "Something went wrong.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => setPaymentStatus("idle"), 2000);
    }
  }, [eventId, amountCents, isReaderConnected, collectPayment]);

  const isProcessing = paymentStatus === "collecting" || paymentStatus === "processing";
  const canCharge = amountCents > 0 && isReaderConnected && !isProcessing;

  if (!eventId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <DarkGradientBg />
        <Text style={styles.errorText}>No event selected</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DarkGradientBg />
      <ConfirmModal
        visible={!!paymentFailedAlert}
        onClose={() => setPaymentFailedAlert(null)}
        title="Payment Failed"
        message={paymentFailedAlert || ""}
        alertOnly
        icon="card-outline"
      />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tap to Charge</Text>
        <View style={styles.backButton} />
      </Animated.View>

      {/* Reader Status Bar */}
      <View style={styles.statusBar}>
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor:
                initError || connectError || paymentStatus === "error"
                  ? "#f87171"
                  : isReaderConnected && !isProcessing
                    ? "#34d399"
                    : paymentStatus === "success"
                      ? "#34d399"
                      : "#fbbf24",
            },
          ]}
        />
        <Text style={styles.statusText} numberOfLines={1}>
          {initError
            ? `SDK error: ${initError}`
            : connectError
              ? `Connection failed: ${connectError}`
              : readerStatusLabel(readerStatus, paymentStatus, isInitialized)}
        </Text>
        {(initError || connectError) && (
          <TouchableOpacity
            onPress={() => {
              if (initError) {
                retryInit();
              } else {
                setConnectError(null);
                connectAttemptedRef.current = false;
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Amount Display */}
      <View style={styles.amountSection}>
        <Text
          style={[
            styles.amountText,
            paymentStatus === "success" && styles.amountSuccess,
          ]}
        >
          {displayAmount}
        </Text>
        {paymentStatus === "success" && (
          <Text style={styles.successLabel}>Charged</Text>
        )}
      </View>

      {/* Keypad */}
      <View style={[styles.keypad, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.keypadGrid}>
          {KEYPAD_KEYS.map((key) => (
            <TouchableOpacity
              key={key}
              style={styles.keypadKey}
              onPress={() => handleKeyPress(key)}
              activeOpacity={0.5}
              disabled={isProcessing}
            >
              {key === "del" ? (
                <Ionicons name="backspace-outline" size={24} color="rgba(255,255,255,0.7)" />
              ) : (
                <Text style={styles.keypadKeyText}>{key}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Charge Button */}
        <TouchableOpacity
          style={[
            styles.chargeButton,
            !canCharge && styles.chargeButtonDisabled,
          ]}
          onPress={handleCharge}
          disabled={!canCharge}
          activeOpacity={0.7}
        >
          <GlassView {...liquidGlass.fillMedium} borderRadius={14} style={StyleSheet.absoluteFill} />
          {isProcessing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="flash" size={20} color="#fff" />
              <Text style={styles.chargeButtonText}>
                Charge {displayAmount}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TapToChargeScreen() {
  return (
    <TerminalProvider>
      <TapToChargeContent />
    </TerminalProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Lato_700Bold",
    color: "#fff",
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
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
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    color: "rgba(255,255,255,0.6)",
  },
  retryText: {
    fontSize: 14,
    fontFamily: "Lato_700Bold",
    color: "#fff",
  },
  amountSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  amountText: {
    fontSize: 56,
    fontFamily: "Lato_700Bold",
    color: "#fff",
    letterSpacing: -1,
  },
  amountSuccess: {
    color: "#34d399",
  },
  successLabel: {
    fontSize: 16,
    fontFamily: "Lato_700Bold",
    color: "#34d399",
    marginTop: 8,
  },
  errorText: {
    fontSize: 15,
    fontFamily: "Lato_400Regular",
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginTop: 100,
  },
  keypad: {
    paddingHorizontal: 24,
  },
  keypadGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  keypadKey: {
    width: "33.33%",
    height: 64,
    justifyContent: "center",
    alignItems: "center",
  },
  keypadKeyText: {
    fontSize: 28,
    fontFamily: "Lato_400Regular",
    color: "#fff",
  },
  chargeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 18,
    marginTop: 12,
    overflow: "hidden" as const,
  },
  chargeButtonDisabled: {
    opacity: 0.3,
  },
  chargeButtonText: {
    fontSize: 17,
    fontFamily: "Lato_700Bold",
    color: "#fff",
  },
});
