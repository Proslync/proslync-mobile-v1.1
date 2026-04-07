// GlassBubbleButton — Animated liquid glass toggle button
// Bubble morphs between two states with liquid stretch animation + text crossfade
// Usage: Follow/Following, Join/Joined, Subscribe/Subscribed, etc.

import * as React from "react";
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

interface GlassBubbleButtonProps {
  /** Whether the button is in the active/toggled state */
  isActive: boolean;
  /** Label when inactive (e.g. "Follow") */
  label: string;
  /** Label when active (e.g. "Following") */
  activeLabel: string;
  /** Show loading spinner */
  isLoading?: boolean;
  /** Press handler */
  onPress: () => void;
  /** Width when showing inactive label (default 80) */
  inactiveWidth?: number;
  /** Width when showing active label (default 100) */
  activeWidth?: number;
  /** Glass intensity when inactive — brighter = more visible CTA (default 0.15) */
  inactiveGlassIntensity?: number;
  /** Glass intensity when active — subtler (default 0.08) */
  activeGlassIntensity?: number;
}

export function GlassBubbleButton({
  isActive,
  label,
  activeLabel,
  isLoading = false,
  onPress,
  inactiveWidth = 80,
  activeWidth = 100,
  inactiveGlassIntensity = 0.15,
  activeGlassIntensity = 0.08,
}: GlassBubbleButtonProps) {
  const bubbleWidth = useSharedValue(isActive ? activeWidth : inactiveWidth);
  const bubbleScaleY = useSharedValue(1);
  const bubbleScaleX = useSharedValue(1);
  const labelOpacity = useSharedValue(isActive ? 0 : 1);
  const activeLabelOpacity = useSharedValue(isActive ? 1 : 0);
  const glassIntensity = useSharedValue(isActive ? activeGlassIntensity : inactiveGlassIntensity);

  React.useEffect(() => {
    // Liquid bubble stretch
    bubbleScaleX.value = withSequence(
      withTiming(1.3, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
    bubbleScaleY.value = withSequence(
      withTiming(0.85, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );

    // Width morphs
    bubbleWidth.value = withSpring(isActive ? activeWidth : inactiveWidth, {
      damping: 14, stiffness: 160, mass: 0.8,
    });

    // Crossfade text
    labelOpacity.value = withTiming(isActive ? 0 : 1, { duration: 180 });
    activeLabelOpacity.value = withTiming(isActive ? 1 : 0, { duration: 180 });

    // Glass brightness
    glassIntensity.value = withTiming(
      isActive ? activeGlassIntensity : inactiveGlassIntensity,
      { duration: 250 },
    );
  }, [isActive]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const bubbleStyle = useAnimatedStyle(() => ({
    width: bubbleWidth.value,
    transform: [
      { scaleX: bubbleScaleX.value },
      { scaleY: bubbleScaleY.value },
    ],
  }));

  const glassStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(255,255,255,${glassIntensity.value})`,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ scale: 0.9 + labelOpacity.value * 0.1 }],
  }));

  const activeLabelStyle = useAnimatedStyle(() => ({
    opacity: activeLabelOpacity.value,
    transform: [{ scale: 0.9 + activeLabelOpacity.value * 0.1 }],
  }));

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={1}
      disabled={isLoading}
    >
      <Animated.View style={[styles.button, bubbleStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.glass, glassStyle]} />
        <View style={styles.inner}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View style={styles.textContainer}>
              <Animated.Text style={[styles.text, labelStyle]}>
                {label}
              </Animated.Text>
              <Animated.Text style={[styles.text, { opacity: 0.7 }, activeLabelStyle]}>
                {activeLabel}
              </Animated.Text>
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 34,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  glass: {
    borderRadius: 10,
  },
  inner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    height: 20,
    width: "100%",
  },
  text: {
    position: "absolute",
    fontSize: 14,
    fontFamily: "Lato_700Bold",
    color: "#1A1A1A",
  },
});
