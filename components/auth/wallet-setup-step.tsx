import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/hooks/use-app-theme";

interface WalletSetupStepProps {
  onSuccess: () => void;
}

export function WalletSetupStep({ onSuccess }: WalletSetupStepProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const router = useRouter();

  const handleContinue = () => {
    router.push('/stripe-onboarding?from=signup');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
        },
      ]}
    >
      <View style={styles.content}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.iconWrapper}>
          <View
            style={[
              styles.iconCircle,
              { overflow: 'hidden', borderColor: "rgba(255,255,255,0.25)" },
            ]}
          >
            <GlassView {...liquidGlass.fill} borderRadius={36} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="card-outline" size={28} color={colors.text} />
          </View>
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.duration(400).delay(100)}
          style={[styles.title, { color: colors.text }]}
        >
          Set Up Payouts
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.duration(400).delay(150)}
          style={[styles.subtitle, { color: colors.textSecondary }]}
        >
          Connect your account so you can receive earnings from your events
          directly into your bank via Stripe.
        </Animated.Text>

        <View style={styles.spacer} />

        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.bulletList}
        >
          <View style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
              Secure Stripe onboarding inside the app
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
              Required once per organizer account
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
              You can finish this later from Settings → Wallet
            </Text>
          </View>
        </Animated.View>
      </View>

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[
            styles.button,
            {
              overflow: 'hidden',
              borderColor: "rgba(255,255,255,0.25)",
            },
          ]}
          activeOpacity={0.7}
          onPress={handleContinue}
        >
          <GlassView {...liquidGlass.fill} borderRadius={12} style={StyleSheet.absoluteFillObject} />
          <Text style={[styles.buttonText, { color: colors.text }]}>
            Continue
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          activeOpacity={0.7}
          onPress={onSuccess}
        >
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            Skip for now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  iconWrapper: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  spacer: {
    height: 32,
  },
  bulletList: {
    gap: 10,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
  },
  bottomActions: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 10,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 17,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 14,
  },
});

