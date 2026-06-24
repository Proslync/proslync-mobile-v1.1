import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  FadeOut,
  ZoomIn,
} from "react-native-reanimated";

// Conditional import so the bundle doesn't crash if the native module
// hasn't been linked yet (pre-rebuild).
let LocalAuthentication: typeof import("expo-local-authentication") | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  LocalAuthentication = require("expo-local-authentication");
} catch {
  LocalAuthentication = null;
}

interface FaceIdStepProps {
  onSuccess: (method: "face-id" | "id-upload") => void;
  onFallback: () => void;
}

type Phase = "idle" | "authenticating" | "countdown" | "success" | "error";

export function FaceIdStep({ onSuccess, onFallback }: FaceIdStepProps) {
  const insets = useSafeAreaInsets();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("front");

  const [phase, setPhase] = React.useState<Phase>("idle");
  const [count, setCount] = React.useState(3);
  const [errMsg, setErrMsg] = React.useState<string | null>(null);

  const pulse = useSharedValue(1);

  React.useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [pulse]);

  const ovalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const start = async () => {
    setErrMsg(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!LocalAuthentication) {
      // Native module not linked — route to fallback transparently.
      Alert.alert(
        "Face ID unavailable",
        "Face ID isn't available on this device. Use ID upload instead.",
        [{ text: "OK", onPress: onFallback }]
      );
      return;
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          "Face ID unavailable",
          "Your device can't run Face ID right now. Use ID upload instead.",
          [{ text: "Use ID upload", onPress: onFallback }]
        );
        return;
      }

      setPhase("countdown");
      setCount(3);
      for (let i = 3; i > 0; i--) {
        setCount(i);
        await new Promise((r) => setTimeout(r, 700));
      }

      setPhase("authenticating");
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Verify it's you",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });

      if (result.success) {
        setPhase("success");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => onSuccess("face-id"), 900);
      } else {
        setPhase("error");
        setErrMsg("Verification failed. Try again or upload your ID.");
      }
    } catch (e) {
      setPhase("error");
      setErrMsg("Something went wrong. Try again or upload your ID.");
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.cameraWrap}>
        {hasPermission && device ? (
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive
            video={false}
            audio={false}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.cameraFallback]}>
            <Ionicons name="person-outline" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.cameraFallbackText}>
              {hasPermission
                ? "Camera unavailable on this device"
                : "Grant camera access to continue"}
            </Text>
          </View>
        )}

        {/* Dim outside the oval */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.dim} />
        </View>

        {/* Oval overlay */}
        <Animated.View style={[styles.ovalWrap, ovalStyle]} pointerEvents="none">
          <View style={styles.oval} />
        </Animated.View>

        {/* Countdown bubble */}
        {phase === "countdown" ? (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.countdownWrap} pointerEvents="none">
            <Text style={styles.countdownText}>{count}</Text>
          </Animated.View>
        ) : null}

        {/* Success check */}
        {phase === "success" ? (
          <Animated.View entering={ZoomIn.springify()} style={styles.checkWrap} pointerEvents="none">
            <View style={styles.checkRing}>
              <Ionicons name="checkmark" size={48} color="#FFF" />
            </View>
          </Animated.View>
        ) : null}

        {/* Loading */}
        {phase === "authenticating" ? (
          <View style={styles.loadingWrap} pointerEvents="none">
            <ActivityIndicator color="#FFF" />
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Text style={styles.title}>Verify it's you</Text>
        <Text style={styles.subtitle}>
          Look directly at the camera. Hold steady for 3 seconds.
        </Text>

        {errMsg ? <Text style={styles.errorText}>{errMsg}</Text> : null}

        <TouchableOpacity
          style={[
            styles.primaryBtn,
            (phase === "countdown" || phase === "authenticating" || phase === "success") &&
              styles.primaryBtnDisabled,
          ]}
          onPress={start}
          disabled={phase === "countdown" || phase === "authenticating" || phase === "success"}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Start Face ID scan"
        >
          <Text style={styles.primaryBtnText}>
            {phase === "idle" || phase === "error" ? "Start scan" : "Scanning…"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onFallback} activeOpacity={0.7}>
          <Text style={styles.fallbackLink}>Can't use Face ID? Upload an ID instead</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24, alignItems: "center" },
  cameraWrap: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#0a0a0a",
    marginBottom: 24,
  },
  cameraFallback: { alignItems: "center", justifyContent: "center", gap: 12 },
  cameraFallbackText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
  ovalWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  oval: {
    width: "70%",
    aspectRatio: 0.8,
    borderWidth: 3,
    borderColor: "#FF6F3C",
    borderRadius: 9999,
  },
  countdownWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  countdownText: { color: "#FFF", fontSize: 88, fontWeight: "800" },
  checkWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  checkRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#34C759",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: { width: "100%", gap: 12 },
  title: { color: "#FFF", fontSize: 24, fontWeight: "700", textAlign: "center" },
  subtitle: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },
  errorText: { color: "#ef4444", fontSize: 13, textAlign: "center" },
  primaryBtn: {
    backgroundColor: "#FF6F3C",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: "#FFF", fontSize: 17, fontWeight: "700" },
  fallbackLink: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    textAlign: "center",
    textDecorationLine: "underline",
    paddingVertical: 6,
  },
});
