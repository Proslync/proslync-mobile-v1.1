import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

interface FeedBottomCTAProps {
  onRsvp: () => void;
  isPaid?: boolean;
  isRsvpd?: boolean;
  isEvent?: boolean;
}

function CTAButton({
  label,
  onPress,
  isSuccess,
  disabled,
}: {
  label: string;
  onPress: () => void;
  isSuccess?: boolean;
  disabled?: boolean;
}) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (disabled) return;
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 15, stiffness: 400 })
    );
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={disabled ? 1 : 0.8}
      style={styles.buttonTouchable}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.button,
          isSuccess ? styles.successButton : styles.primaryButton,
          animatedStyle,
        ]}
      >
        <Text style={[styles.buttonText, isSuccess ? styles.successText : styles.primaryText]}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export function FeedBottomCTA({ onRsvp, isPaid, isRsvpd, isEvent = true }: FeedBottomCTAProps) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 50 + insets.bottom - 8;

  // Don't show CTA for non-event posts
  if (!isEvent) {
    return null;
  }

  // Determine button label and state
  let label = 'RSVP';
  if (isRsvpd) {
    label = "RSVP'd";
  } else if (isPaid) {
    label = 'Buy';
  }

  return (
    <View style={[styles.container, { bottom: tabBarHeight }]}>
      <View style={styles.buttonContainer}>
        <CTAButton
          label={label}
          onPress={onRsvp}
          isSuccess={isRsvpd}
          disabled={isRsvpd}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonTouchable: {
    flex: 1,
  },
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#fff',
  },
  successButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 0.5,
  },
  primaryText: {
    color: '#000',
  },
  successText: {
    color: '#22c55e',
  },
});
