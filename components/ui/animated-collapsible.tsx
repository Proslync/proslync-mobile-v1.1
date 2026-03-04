import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface AnimatedCollapsibleProps {
  expanded: boolean;
  children: React.ReactNode;
  duration?: number;
}

/**
 * Reusable animated collapsible wrapper.
 * Measures children height and smoothly animates open/close.
 *
 * Usage:
 *   <AnimatedCollapsible expanded={isOpen}>
 *     <YourContent />
 *   </AnimatedCollapsible>
 */
export function AnimatedCollapsible({
  expanded,
  children,
  duration = 250,
}: AnimatedCollapsibleProps) {
  const measuredHeight = React.useRef(0);
  const animatedHeight = useSharedValue(0);
  const isFirstRender = React.useRef(true);

  const onLayout = React.useCallback(
    (e: { nativeEvent: { layout: { height: number } } }) => {
      const h = Math.ceil(e.nativeEvent.layout.height);
      if (h === measuredHeight.current) return;
      measuredHeight.current = h;

      if (expanded) {
        // Update target height if content resized while expanded
        if (isFirstRender.current) {
          animatedHeight.value = h;
        } else {
          animatedHeight.value = withTiming(h, {
            duration,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          });
        }
      }
    },
    [expanded, duration],
  );

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timing = {
      duration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    };
    animatedHeight.value = withTiming(
      expanded ? measuredHeight.current : 0,
      timing,
    );
  }, [expanded, duration]);

  const containerStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    overflow: 'hidden' as const,
  }));

  return (
    <Animated.View style={containerStyle}>
      <View style={styles.inner} onLayout={onLayout}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  inner: {
    position: 'absolute',
    width: '100%',
  },
});
