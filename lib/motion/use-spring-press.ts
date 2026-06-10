import { useCallback } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface SpringPressOptions {
  scale?: number;
  opacity?: number;
}

const SPRING_CONFIG = { damping: 15, stiffness: 200, mass: 0.6 };

export function useSpringPress(options: SpringPressOptions = {}) {
  const { scale: targetScale = 0.96, opacity: targetOpacity = 0.92 } = options;
  const pressed = useSharedValue(0);

  const onPressIn = useCallback(() => {
    pressed.value = withSpring(1, SPRING_CONFIG);
  }, []);

  const onPressOut = useCallback(() => {
    pressed.value = withSpring(0, SPRING_CONFIG);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - targetScale) }],
    opacity: 1 - pressed.value * (1 - targetOpacity),
  }));

  return { onPressIn, onPressOut, animStyle };
}
