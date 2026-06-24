import * as React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { GlassView } from "expo-glass-effect";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface WelcomeStepProps {
  onRegisterAthlete: () => void;
}

export function WelcomeStep({ onRegisterAthlete }: WelcomeStepProps) {
  const insets = useSafeAreaInsets();

  const onAthlete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRegisterAthlete();
  };

  const onBrand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Brand registration", "Brand registration will open soon — check back shortly.");
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
        <View style={styles.logoDot} />
        <Text style={styles.brandName}>Proslync</Text>
        <Text style={styles.tagline}>Your Brand. Your Platform. Your Power.</Text>
      </Animated.View>

      <View style={styles.spacer} />

      <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.ctas}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onAthlete}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Register as Athlete"
        >
          <Text style={styles.primaryBtnText}>Register as Athlete</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onBrand}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Register as Brand"
        >
          <GlassView
            glassEffectStyle="regular"
            style={[StyleSheet.absoluteFill, { borderRadius: 999 }]}
          />
          <Text style={styles.secondaryBtnText}>Register as Brand</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          By continuing you agree to our Terms and Privacy Policy.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24, alignItems: "center" },
  hero: { alignItems: "center", gap: 10 },
  logoDot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FF6F3C",
    marginBottom: 12,
  },
  brandName: { color: "#FFF", fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  tagline: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 15,
    textAlign: "center",
    marginTop: 2,
  },
  spacer: { flex: 1 },
  ctas: { width: "100%", gap: 12 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FF6F3C",
    paddingVertical: 16,
    borderRadius: 999,
  },
  primaryBtnText: { color: "#FFF", fontSize: 17, fontWeight: "700" },
  secondaryBtn: {
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  secondaryBtnText: { color: "#FFF", fontSize: 17, fontWeight: "600" },
  footerText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
});
