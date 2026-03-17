// SegmentedControl - Glass bubble indicator matching the bottom nav bar style

import React, { useState, useEffect } from 'react';
import { View, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass, glassTint } from '@/constants/glass/liquid-glass';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolateColor,
  interpolate,
} from 'react-native-reanimated';

// Same spring config as the bottom nav bar bubble
const SPRING_CONFIG = { damping: 14, stiffness: 160, mass: 0.8 };
const SETTLE_SPRING = { damping: 10, stiffness: 200 };

interface SegmentedControlProps {
  segments: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

function SegmentLabel({ label, index, selectedIndex }: {
  label: string;
  index: number;
  selectedIndex: number;
}) {
  const progress = useSharedValue(index === selectedIndex ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(index === selectedIndex ? 1 : 0, { damping: 20, stiffness: 200 });
  }, [selectedIndex, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 1)']
    ),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.03]) }],
  }));

  return (
    <Animated.Text style={[styles.label, animatedStyle, index === selectedIndex && styles.labelActive]}>
      {label}
    </Animated.Text>
  );
}

export function SegmentedControl({
  segments,
  selectedIndex,
  onSelect,
}: SegmentedControlProps) {
  const bubbleProgress = useSharedValue(selectedIndex);
  const bubbleScaleX = useSharedValue(1);
  const bubbleScaleY = useSharedValue(1);
  const [segmentWidth, setSegmentWidth] = useState(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    const containerWidth = e.nativeEvent.layout.width - 6; // subtract padding (3 each side)
    setSegmentWidth(containerWidth / segments.length);
  };

  useEffect(() => {
    // Liquid stretch: elongate horizontally, squish vertically, then spring back
    bubbleProgress.value = withSpring(selectedIndex, SPRING_CONFIG);
    bubbleScaleX.value = withSequence(
      withTiming(1.4, { duration: 100 }),
      withSpring(1, SETTLE_SPRING),
    );
    bubbleScaleY.value = withSequence(
      withTiming(0.88, { duration: 100 }),
      withSpring(1, SETTLE_SPRING),
    );
  }, [selectedIndex]);

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: bubbleProgress.value * segmentWidth },
      { scaleX: bubbleScaleX.value },
      { scaleY: bubbleScaleY.value },
    ],
    width: segmentWidth,
  }));

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <GlassView
        {...liquidGlass.surface}
        borderRadius={10}
        style={styles.containerGlass}
        pointerEvents="none"
      />
      {segmentWidth > 0 && (
        <Animated.View style={[styles.bubbleWrapper, bubbleStyle]} pointerEvents="none">
          <GlassView
            {...liquidGlass.interactive}
            tintColor={glassTint.fillStrong}
            borderRadius={8}
            style={styles.bubbleGlass}
          />
        </Animated.View>
      )}
      {segments.map((label, index) => (
        <Pressable
          key={label}
          style={[styles.segment, { width: segmentWidth || undefined, flex: segmentWidth ? undefined : 1 }]}
          onPress={() => onSelect(index)}
        >
          <SegmentLabel
            label={label}
            index={index}
            selectedIndex={selectedIndex}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    marginHorizontal: 16,
    marginVertical: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  containerGlass: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
  },
  bubbleWrapper: {
    position: 'absolute',
    top: 3,
    left: 3,
    height: 32,
    overflow: 'hidden',
    borderRadius: 8,
  },
  bubbleGlass: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  segment: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  labelActive: {
    fontFamily: 'Lato_700Bold',
  },
});
