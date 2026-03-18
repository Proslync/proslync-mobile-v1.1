// Skeleton Loader - Shimmer loading placeholder for conversations

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';

function SkeletonRow() {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.avatar, animatedStyle]}>
        <GlassView {...liquidGlass.fillFaint} borderRadius={28} style={StyleSheet.absoluteFillObject} />
      </Animated.View>
      <View style={styles.content}>
        <Animated.View style={[styles.name, animatedStyle]}>
          <GlassView {...liquidGlass.fillFaint} borderRadius={4} style={StyleSheet.absoluteFillObject} />
        </Animated.View>
        <Animated.View style={[styles.message, animatedStyle]}>
          <GlassView {...liquidGlass.fillFaint} borderRadius={4} style={StyleSheet.absoluteFillObject} />
        </Animated.View>
      </View>
      <Animated.View style={[styles.time, animatedStyle]}>
        <GlassView {...liquidGlass.fillFaint} borderRadius={4} style={StyleSheet.absoluteFillObject} />
      </Animated.View>
    </View>
  );
}

interface SkeletonLoaderProps {
  count?: number;
}

export function SkeletonLoader({ count = 8 }: SkeletonLoaderProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonRow key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  name: {
    width: '60%',
    height: 16,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  message: {
    width: '80%',
    height: 14,
    borderRadius: 4,
    overflow: 'hidden',
  },
  time: {
    width: 40,
    height: 12,
    borderRadius: 4,
    overflow: 'hidden',
    marginLeft: 8,
  },
});
