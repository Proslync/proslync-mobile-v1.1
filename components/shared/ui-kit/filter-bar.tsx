// ── FILTER BAR ────────────────────────────────────────────
// Horizontal scrollable pill-row for facet filters. Lifts the recurring
// pattern from app/brand/casting.tsx, app/admin/users.tsx,
// app/agent/pipeline.tsx (and several persona index screens) where each
// surface re-implements its own ScrollView + FilterChip set.
//
// Single-select by default; pass `mode="multi"` for multi-select.
// `leading` lets a screen prepend a non-pill action chip (e.g. "Filters"
// trigger that opens a sheet).

import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAppTheme } from '@/hooks/use-app-theme';

export interface FilterBarOption<V extends string = string> {
  value: V;
  label: string;
  /** Numeric badge after the label ("42" → "Basketball · 42"). */
  count?: number;
}

export type FilterBarMode = 'single' | 'multi';

export interface FilterBarProps<V extends string = string> {
  options: ReadonlyArray<FilterBarOption<V>>;
  /** Selected value(s). Single → string|null. Multi → string[]. */
  value: V | V[] | null;
  onChange: (next: V | V[] | null) => void;
  mode?: FilterBarMode;
  /** Render a non-toggle node before the pills (e.g. open-sheet button). */
  leading?: React.ReactNode;
  /** Style passthrough for the outer container. */
  style?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md';
}

export function FilterBar<V extends string = string>({
  options,
  value,
  onChange,
  mode = 'single',
  leading,
  style,
  size = 'md',
}: FilterBarProps<V>) {
  const { colors } = useAppTheme();

  const isActive = (v: V): boolean => {
    if (mode === 'multi') {
      return Array.isArray(value) ? value.includes(v) : false;
    }
    return value === v;
  };

  const handlePress = (v: V): void => {
    if (mode === 'multi') {
      const arr = Array.isArray(value) ? value : [];
      const next = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
      onChange(next);
      return;
    }
    onChange(value === v ? null : v);
  };

  const padV = size === 'sm' ? 6 : 8;
  const padH = size === 'sm' ? 10 : 14;
  const fontSize = size === 'sm' ? 12 : 13;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={style}
      contentContainerStyle={styles.row}
    >
      {leading ? <View style={styles.leadingSlot}>{leading}</View> : null}
      {options.map((opt) => {
        const active = isActive(opt.value);
        return (
          <Pressable
            key={opt.value}
            onPress={() => handlePress(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={
              opt.count !== undefined ? `${opt.label}, ${opt.count}` : opt.label
            }
            hitSlop={4}
            style={({ pressed }) => [
              styles.pill,
              {
                paddingVertical: padV,
                paddingHorizontal: padH,
                backgroundColor: active ? colors.text : 'rgba(255, 255, 255, 0.04)',
                borderColor: active ? colors.text : colors.border,
              },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: active ? colors.background : colors.text,
                  fontSize,
                  fontFamily: Typography.callout.fontFamily,
                },
              ]}
              numberOfLines={1}
            >
              {opt.label}
              {opt.count !== undefined ? (
                <Text
                  style={{
                    color: active ? colors.background : colors.textSecondary,
                    fontWeight: '500',
                  }}
                >{`  ${opt.count}`}</Text>
              ) : null}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
  leadingSlot: {
    marginRight: Spacing.xs,
  },
  pill: {
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
