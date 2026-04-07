import * as React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { liquidGlass } from '@/constants/glass/liquid-glass';

export interface ChipItem {
  id: string;
  label: string;
}

interface GlassChipBarProps {
  items: ChipItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  style?: ViewStyle;
}

export function GlassChipBar({
  items,
  selectedId,
  onSelect,
  style,
}: GlassChipBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={style}
    >
      {items.map((item) => {
        const isSelected = item.id === selectedId;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(item.id);
            }}
            activeOpacity={0.7}
            style={styles.chipWrapper}
          >
            <GlassView
              {...(isSelected
                ? liquidGlass.fillStrong
                : liquidGlass.fillMedium)}
              borderRadius={20}
              style={styles.chip}
            >
              <Text
                style={[styles.label, isSelected && styles.labelSelected]}
              >
                {item.label}
              </Text>
            </GlassView>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 8,
  },
  chipWrapper: {
    overflow: 'hidden',
    borderRadius: 20,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  labelSelected: {
    color: '#1A1A1A',
  },
});
