import * as React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useAppTheme } from '@/hooks/use-app-theme';

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
    const digits = text.replace(/\D/g, '').slice(0, maxLength);
    onChange(digits);

    if (digits.length === maxLength) {
      onComplete(digits);
    }
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      {/* Visual boxes behind the input */}
      <View style={styles.boxesContainer} pointerEvents="none">
        {Array.from({ length: maxLength }).map((_, index) => (
          <OTPBox
            key={index}
            digit={value[index] || ''}
            isFocused={value.length === index && !disabled}
            isFilled={index < value.length}
            error={error}
            success={success}
          />
        ))}
      </View>

      {/* Real visible TextInput on top — transparent text so digits show through boxes */}
      <TextInput
        ref={inputRef}
        style={[styles.realInput, { fontSize: 24 }]}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        keyboardAppearance={isDark ? 'dark' : 'light'}
        maxLength={maxLength}
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        editable={!disabled}
        caretHidden
        selectionColor="transparent"
        autoFocus
      />
    </Pressable>
  );
}

interface OTPBoxProps {
  digit: string;
  isFocused: boolean;
  isFilled: boolean;
  error: boolean;
  success: boolean;
}

function OTPBox({ digit, isFocused, isFilled, error, success }: OTPBoxProps) {
  const animatedValue = useSharedValue(0);
  const cursorOpacity = useSharedValue(0);
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

  const defaultBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';

  const boxStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      animatedValue.value,
      [0, 1, 2],
      [defaultBorder, '#ff6b6b', '#4ade80']
    );

    return {
      borderColor,
      borderWidth: isFocused || isFilled ? 2 : 1,
    };
  });

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  return (
    <Animated.View style={[styles.box, { backgroundColor: colors.input }, boxStyle]}>
      {digit ? (
        <Animated.Text style={[styles.digit, { color: colors.text }]}>{digit}</Animated.Text>
      ) : isFocused ? (
        <Animated.View style={[styles.cursor, { backgroundColor: colors.text }, cursorStyle]} />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  boxesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  box: {
    width: 48,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontSize: 24,
    fontWeight: '600',
  },
  cursor: {
    width: 2,
    height: 24,
    borderRadius: 1,
  },
  realInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    color: 'transparent',
  },
});
