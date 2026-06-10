import { useEffect } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

export function useShimmer(durationMs = 1200) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: durationMs, easing: Easing.linear }),
      -1,
      false,
    );
  }, [durationMs]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.3, 0.5, 0.7, 1],
      [0.3, 0.6, 0.8, 0.6, 0.3],
    ),
  }));

  return shimmerStyle;
}
