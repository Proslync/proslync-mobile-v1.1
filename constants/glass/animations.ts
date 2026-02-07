import {
  withSequence,
  withTiming,
  withSpring,
  withRepeat,
  type SharedValue,
} from 'react-native-reanimated';

/**
 * Button press animation — scale down then spring back.
 * Matches the pattern in inverted-button.tsx.
 */
export const buttonPress = {
  sequence: (scale: SharedValue<number>) => {
    'worklet';
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 15, stiffness: 400 })
    );
  },
};

/**
 * Shimmer animation — infinite horizontal sweep.
 * Matches the pattern in feed-skeleton.tsx.
 */
export const shimmer = (position: SharedValue<number>) => {
  'worklet';
  position.value = withRepeat(
    withTiming(1, { duration: 1500 }),
    -1,
    false
  );
};

/**
 * Floating animation — gentle up-and-down hover.
 */
export const floating = (
  translateY: SharedValue<number>,
  distance: number = 6
) => {
  'worklet';
  translateY.value = withRepeat(
    withSequence(
      withTiming(-distance, { duration: 2000 }),
      withTiming(distance, { duration: 2000 })
    ),
    -1,
    true
  );
};

/**
 * Border pulse animation — opacity oscillation.
 */
export const borderPulse = (
  opacity: SharedValue<number>,
  min: number = 0.15,
  max: number = 0.35
) => {
  'worklet';
  opacity.value = withRepeat(
    withSequence(
      withTiming(max, { duration: 1500 }),
      withTiming(min, { duration: 1500 })
    ),
    -1,
    true
  );
};
