import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface IdFallbackStepProps {
  onSuccess: (method: "face-id" | "id-upload") => void;
  onBack: () => void;
}

async function pickImage(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert("Camera required", "Grant camera access to capture your ID.");
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    allowsEditing: false,
  });
  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

export function IdFallbackStep({ onSuccess, onBack }: IdFallbackStepProps) {
  const insets = useSafeAreaInsets();
  const [front, setFront] = React.useState<string | null>(null);
  const [back, setBack] = React.useState<string | null>(null);
  const [selfie, setSelfie] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const captureFront = async () => {
    const uri = await pickImage();
    if (uri) {
      setFront(uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  const captureBack = async () => {
    const uri = await pickImage();
    if (uri) {
      setBack(uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  const captureSelfie = async () => {
    const uri = await pickImage();
    if (uri) {
      setSelfie(uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const canSubmit = !!front && !!back && !!selfie;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Mock verification — real backend would run liveness + doc match here.
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    onSuccess("id-upload");
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={10} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ID verification</Text>
        <View style={{ width: 28 }} />
      </View>

      <Text style={styles.subtitle}>
        Capture both sides of a government-issued photo ID, plus a selfie for the liveness check.
      </Text>

      <View style={styles.grid}>
        <CaptureCard
          label="ID front"
          uri={front}
          onPress={captureFront}
          icon="card-outline"
        />
        <CaptureCard
          label="ID back"
          uri={back}
          onPress={captureBack}
          icon="card-outline"
        />
        <CaptureCard
          label="Selfie"
          uri={selfie}
          onPress={captureSelfie}
          icon="happy-outline"
          fullWidth
        />
      </View>

      <View style={styles.spacer} />

      <TouchableOpacity
        style={[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit || submitting}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryBtnText}>
          {submitting ? "Verifying…" : "Continue"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function CaptureCard({
  label,
  uri,
  onPress,
  icon,
  fullWidth,
}: {
  label: string;
  uri: string | null;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, fullWidth && styles.cardFull]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Capture ${label}`}
    >
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : null}
      <View style={[StyleSheet.absoluteFill, styles.cardScrim, uri && styles.cardScrimDone]}>
        <Ionicons
          name={uri ? "checkmark-circle" : icon}
          size={28}
          color={uri ? "#34C759" : "rgba(255,255,255,0.65)"}
        />
        <Text style={styles.cardLabel}>
          {uri ? `${label} captured` : `Tap to capture ${label.toLowerCase()}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  subtitle: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    flexBasis: "48%",
    flexGrow: 1,
    aspectRatio: 1.4,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  cardFull: { flexBasis: "100%", aspectRatio: 2.4 },
  cardScrim: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.30)",
  },
  cardScrimDone: { backgroundColor: "rgba(0,0,0,0.45)" },
  cardLabel: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  spacer: { flex: 1 },
  primaryBtn: {
    backgroundColor: "#FF6F3C",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: "#FFF", fontSize: 17, fontWeight: "700" },
});
