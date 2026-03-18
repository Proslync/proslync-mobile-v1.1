// Segmented Control - iOS-style segmented control for filtering

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { ConversationFilter } from '../../lib/types/messages.types';

interface SegmentedControlProps {
  selectedFilter: ConversationFilter;
  onFilterChange: (filter: ConversationFilter) => void;
  requestCount?: number;
}

const SEGMENTS: { key: ConversationFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'requests', label: 'Requests' },
  { key: 'events', label: 'Events' },
];

export function SegmentedControl({
  selectedFilter,
  onFilterChange,
  requestCount = 0,
}: SegmentedControlProps) {
  const selectedIndex = SEGMENTS.findIndex((s) => s.key === selectedFilter);
  const indicatorPosition = useSharedValue(selectedIndex);

  const handlePress = (filter: ConversationFilter, index: number) => {
    indicatorPosition.value = withSpring(index, {
      damping: 20,
      stiffness: 200,
    });
    onFilterChange(filter);
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: indicatorPosition.value * (styles.segment.width as number),
      },
    ],
  }));

  return (
    <View style={styles.container}>
      <GlassView {...liquidGlass.surface} borderRadius={10} style={StyleSheet.absoluteFillObject} />
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      {SEGMENTS.map((segment, index) => (
        <TouchableOpacity
          key={segment.key}
          style={styles.segment}
          onPress={() => handlePress(segment.key, index)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.label,
              selectedFilter === segment.key && styles.labelActive,
            ]}
          >
            {segment.label}
          </Text>
          {segment.key === 'requests' && requestCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {requestCount > 99 ? '99+' : requestCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const SEGMENT_WIDTH = 100;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    overflow: 'hidden',
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
    width: SEGMENT_WIDTH,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  segment: {
    width: SEGMENT_WIDTH,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
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
  badge: {
    marginLeft: 4,
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Lato_700Bold',
  },
});
