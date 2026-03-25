import * as React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

interface QuantityBadgeProps {
  count: number;
  size?: number;
}

export function QuantityBadge({ count, size = 22 }: QuantityBadgeProps) {
  const scale = useSharedValue(1);
  const prevCount = React.useRef(count);

  React.useEffect(() => {
    if (count !== prevCount.current && count > 0) {
      scale.value = withSequence(
        withSpring(1.1, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 180 }),
      );
    }
    prevCount.current = count;
  }, [count, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (count <= 0) return null;

  return (
    <Animated.View
      entering={FadeIn.springify()}
      exiting={FadeOut.duration(100)}
      style={[
        styles.badge,
        animatedStyle,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.55 }]}>{count}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  text: {
    color: '#fff',
    fontWeight: '700',
  },
});
