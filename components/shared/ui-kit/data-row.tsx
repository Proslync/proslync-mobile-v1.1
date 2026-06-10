// ── DATA ROW ──────────────────────────────────────────────
// Label-left / value-right row used across settings, deal detail,
// and Brand HQ. Optional leading icon, trailing element, and press
// affordance. Separator is on by default; opt-out for the last row
// in a group.

import * as React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { BaseColors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAppTheme } from '@/hooks/use-app-theme';

export type DataRowTone = 'default' | 'muted' | 'success' | 'warning' | 'danger';

export interface DataRowProps {
  label: string;
  value: string | React.ReactNode;
  icon?: React.ReactNode;
  onPress?: () => void;
  tone?: DataRowTone;
  trailing?: React.ReactNode;
  isLastInGroup?: boolean;
}

export function DataRow({
  label,
  value,
  icon,
  onPress,
  tone = 'default',
  trailing,
  isLastInGroup = false,
}: DataRowProps) {
  const { colors } = useAppTheme();

  const valueColor =
    tone === 'muted'
      ? colors.textSecondary
      : tone === 'success'
        ? BaseColors.success
        : tone === 'warning'
          ? BaseColors.warning
          : tone === 'danger'
            ? BaseColors.error
            : colors.text;

  const containerStyle: ViewStyle = {
    ...styles.row,
    borderBottomColor: colors.separator,
    borderBottomWidth: isLastInGroup ? 0 : StyleSheet.hairlineWidth,
  };

  const content = (
    <>
      <View style={styles.left}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <View style={styles.right}>
        {trailing ?? (
          typeof value === 'string' ? (
            <Text style={[styles.value, { color: valueColor }]} numberOfLines={1}>
              {value}
            </Text>
          ) : (
            value
          )
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  left: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: Spacing.sm,
  },
  right: {
    alignItems: 'flex-end',
    flexShrink: 0,
    maxWidth: '60%',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...Typography.callout,
  },
  value: {
    ...Typography.body,
    textAlign: 'right',
  },
  pressed: {
    opacity: 0.7,
  },
});
