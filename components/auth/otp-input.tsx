import { liquidGlass } from "@/constants/glass/liquid-glass";
import { useAppTheme } from "@/hooks/use-app-theme";
import { BlurView } from "expo-blur";
import * as ExpoClipboard from "expo-clipboard";
import { GlassView, isGlassEffectAPIAvailable } from "expo-glass-effect";
import * as React from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import Animated, {
  FadeIn,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const useNativeGlass = isGlassEffectAPIAvailable();

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
  error?: boolean;
  success?: boolean;
}

export function OTPInput({
  value,
  onChange,
  onComplete,
  maxLength = 6,
  disabled = false,
  error = false,
  success = false,
}: OTPInputProps) {
  const inputRef = React.useRef<TextInput>(null);
  const { isDark } = useAppTheme();

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, maxLength);
    onChange(digits);

    if (digits.length === maxLength) {
      onComplete(digits);
    }
  };

  const handleFocus = React.useCallback(async () => {
    try {
      const hasString = await ExpoClipboard.hasStringAsync();
      if (!hasString) return;
      const clipboardContent = await ExpoClipboard.getStringAsync();
      const digits = clipboardContent.replace(/\D/g, "").slice(0, maxLength);
      if (digits.length === maxLength && value.length === 0) {
        onChange(digits);
        onComplete(digits);
      }
    } catch {}
  }, [maxLength, onChange, onComplete, value.length]);

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      {/* Visual boxes */}
      <View style={styles.boxesContainer} pointerEvents="none">
        {Array.from({ length: maxLength }).map((_, index) => (
          <OTPBox
            key={index}
            index={index}
            digit={value[index] || ""}
            isFocused={value.length === index && !disabled}
            isFilled={index < value.length}
            error={error}
            success={success}
          />
        ))}
      </View>

      {/* Transparent TextInput on top — receives keyboard/paste/autofill, digits show through boxes */}
      <TextInput
        ref={inputRef}
        style={styles.realInput}
        value={value}
        onChangeText={handleChange}
        autoFocus
        onFocus={handleFocus}
        keyboardType="number-pad"
        keyboardAppearance={isDark ? "dark" : "light"}
        maxLength={maxLength}
        textContentType="oneTimeCode"
        editable={!disabled}
        caretHidden
        selectionColor="transparent"
        contextMenuHidden={false}
        selectTextOnFocus
      />
    </Pressable>
  );
}

interface OTPBoxProps {
  index: number;
  digit: string;
  isFocused: boolean;
  isFilled: boolean;
  error: boolean;
  success: boolean;
}

function OTPBox({
  index,
  digit,
  isFocused,
  isFilled,
  error,
  success,
}: OTPBoxProps) {
  const animatedValue = useSharedValue(0);
  const cursorOpacity = useSharedValue(0);
  const fillScale = useSharedValue(0);
  const { colors, isDark } = useAppTheme();

  React.useEffect(() => {
    if (error) {
      animatedValue.value = withTiming(1, { duration: 200 });
    } else if (success) {
      animatedValue.value = withTiming(2, { duration: 200 });
    } else {
      animatedValue.value = withTiming(0, { duration: 200 });
    }
  }, [error, success, animatedValue]);

  // Animate digit entry
  React.useEffect(() => {
    if (isFilled) {
      fillScale.value = withSpring(1, { damping: 20, stiffness: 400 });
    } else {
      fillScale.value = withTiming(0, { duration: 150 });
    }
  }, [isFilled, fillScale]);

  React.useEffect(() => {
    if (isFocused) {
      const interval = setInterval(() => {
        cursorOpacity.value = withTiming(cursorOpacity.value === 0 ? 1 : 0, {
          duration: 300,
        });
      }, 500);
      return () => clearInterval(interval);
    } else {
      cursorOpacity.value = 0;
    }
  }, [isFocused, cursorOpacity]);

  const defaultBorder = isDark
    ? "rgba(255, 255, 255, 0.12)"
    : "rgba(0, 0, 0, 0.1)";
  const focusBorder = isDark
    ? "rgba(255, 255, 255, 0.3)"
    : "rgba(0, 0, 0, 0.25)";

  const boxStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      animatedValue.value,
      [0, 1, 2],
      [isFocused ? focusBorder : defaultBorder, "#ff6b6b", "#4ade80"],
    );

    return {
      borderColor,
      borderWidth: isFocused || isFilled ? 1.5 : 1,
    };
  });

  const digitStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.8 + fillScale.value * 0.2 }],
    opacity: 0.6 + fillScale.value * 0.4,
  }));

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  const glassContent = (
    <>
      {digit ? (
        <Animated.Text
          style={[styles.digit, { color: colors.text }, digitStyle]}
        >
          {digit}
        </Animated.Text>
      ) : isFocused ? (
        <Animated.View
          style={[styles.cursor, { backgroundColor: "#fff" }, cursorStyle]}
        />
      ) : null}
    </>
  );

  if (useNativeGlass) {
    return (
      <Animated.View
        entering={FadeIn.duration(300).delay(index * 50)}
        style={[styles.boxWrapper, boxStyle]}
      >
        <GlassView {...liquidGlass.surface} style={styles.glassBox}>
          {glassContent}
        </GlassView>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300).delay(index * 50)}
      style={[styles.boxWrapper, boxStyle]}
    >
      <View style={styles.glassBox}>
        <BlurView
          intensity={isDark ? 20 : 15}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.03)",
            },
          ]}
        />
        {glassContent}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  boxesContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  boxWrapper: {
    borderRadius: 14,
    overflow: "hidden",
  },
  glassBox: {
    width: 50,
    height: 60,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  digit: {
    fontSize: 26,
  },
  cursor: {
    width: 2,
    height: 26,
    borderRadius: 1,
  },
  realInput: {
    ...StyleSheet.absoluteFillObject,
    fontSize: 24,
    letterSpacing: 20,
    color: "transparent",
    tintColor: "transparent",
  },
});
