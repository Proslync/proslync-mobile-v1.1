// SegmentedControl - Generic animated tab control with glass styling

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface SegmentedControlProps {
  segments: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
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

  const handlePress = (index: number) => {
    indicatorPosition.value = withSpring(index, {
      damping: 20,
      stiffness: 200,
    });
    onSelect(index);
  };

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
        <TouchableOpacity
          key={label}
          style={[styles.segment, { width: segmentWidth || undefined, flex: segmentWidth ? undefined : 1 }]}
          onPress={() => handlePress(index)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.label,
              selectedIndex === index && styles.labelActive,
            ]}
          >
            {label}
          </Text>
        </TouchableOpacity>
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
    color: 'rgba(255, 255, 255, 0.6)',
  },
  labelActive: {
    color: '#fff',
    fontFamily: 'Lato_700Bold',
  },
});
