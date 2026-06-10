import { useEffect } from 'react';
import {
  useDerivedValue,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export function useCountUp(target: number, durationMs = 600) {
  const animated = useSharedValue(0);

  useEffect(() => {
    animated.value = withTiming(target, {
      duration: durationMs,
      easing: Easing.out(Easing.cubic),
    });
  }, [target, durationMs]);

  const display = useDerivedValue(() => Math.round(animated.value));

  return display;
}
