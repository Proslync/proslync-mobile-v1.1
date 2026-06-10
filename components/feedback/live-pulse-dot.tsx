import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface LivePulseDotProps {
  color?: string;
  size?: number;
}

export function LivePulseDot({ color = '#FF4444', size = 6 }: LivePulseDotProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.8, { duration: 800, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 800, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value * 0.4,
  }));

  const r = size / 2;

  return (
    <View style={[styles.container, { width: size * 2, height: size * 2 }]}>
      <Animated.View
        style={[
          styles.ring,
          ringStyle,
          { width: size, height: size, borderRadius: r, backgroundColor: color },
        ]}
      />
      <View
        style={[
          styles.dot,
          { width: size, height: size, borderRadius: r, backgroundColor: color },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
  dot: {},
});
