// SegmentedControl - Generic animated tab control with glass styling

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  interpolate,
  Easing,
} from 'react-native-reanimated';

const ANIMATION_CONFIG = {
  duration: 300,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

interface SegmentedControlProps {
  segments: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

function SegmentLabel({ label, index, selectedIndex, segmentCount }: {
  label: string;
  index: number;
  selectedIndex: number;
  segmentCount: number;
}) {
  const progress = useSharedValue(index === selectedIndex ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(index === selectedIndex ? 1 : 0, ANIMATION_CONFIG);
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
  const indicatorPosition = useSharedValue(selectedIndex);
  const [segmentWidth, setSegmentWidth] = useState(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    const containerWidth = e.nativeEvent.layout.width - 6; // subtract padding (3 each side)
    setSegmentWidth(containerWidth / segments.length);
  };

  useEffect(() => {
    indicatorPosition.value = withTiming(selectedIndex, ANIMATION_CONFIG);
  }, [selectedIndex]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value * segmentWidth }],
    width: segmentWidth,
  }));

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {segmentWidth > 0 && (
        <Animated.View style={[styles.indicator, indicatorStyle]} />
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
            segmentCount={segments.length}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 3,
    marginHorizontal: 16,
    marginVertical: 8,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 3,
    left: 3,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
