import * as React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useShimmer } from '@/lib/motion/use-shimmer';

interface ShimmerSkeletonProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function ShimmerSkeleton({
  width,
  height,
  borderRadius = 8,
  style,
}: ShimmerSkeletonProps) {
  const shimmerStyle = useShimmer();

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius },
        shimmerStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
