// ── SKELETON ──────────────────────────────────────────────
// Loading placeholder. `pulse` oscillates opacity; `sweep` is kept as
// an alias for back-compat but renders the same pulse — the shimmer
// gradient was AI-slop trope and got pulled.

import * as React from 'react';
import { Animated, Easing, type ViewStyle } from 'react-native';

import { Radius } from '@/constants/spacing';
import { Duration } from '@/constants/motion';
import { useAppTheme } from '@/hooks/use-app-theme';

export type SkeletonVariant = 'pulse' | 'sweep';

export interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  radius?: number;
  variant?: SkeletonVariant;
  style?: ViewStyle;
}

export function Skeleton({
  width,
  height,
  radius = Radius.md,
  style,
}: SkeletonProps) {
  const { colors } = useAppTheme();
  const progress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    progress.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: Duration.slow,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: Duration.slow,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const opacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const base: ViewStyle = {
    width,
    height,
    borderRadius: radius,
    backgroundColor: colors.skeleton,
    overflow: 'hidden',
  };

  return <Animated.View style={[base, { opacity }, style]} />;
}
