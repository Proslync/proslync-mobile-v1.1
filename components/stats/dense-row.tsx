// ── DENSE ROW ─────────────────────────────────────────────
// Single horizontal data row for tables / ledgers / audit lists. No card
// chrome.
//
//   [primary / secondary]   [optional status chip]   [value(s)]
//   ───────────────────────── divider hairline ─────────────────────────
//
// Numerics use the mono family with `fontVariant: ['tabular-nums']` so
// columns line up vertically across rows. Pressed state is a single
// opacity drop — no transform, no spring, no scale.

import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  BODY_FAMILY,
  MONO_FAMILY,
  Radius,
  Spacing,
  StatsColors,
  StatusColors,
} from './tokens';

export type DenseRowStatusTone = 'neutral' | 'success' | 'warning' | 'danger';

export interface DenseRowStatus {
  label: string;
  tone: DenseRowStatusTone;
}

export interface DenseRowValue {
  value: string;
  label?: string;
}

export interface DenseRowProps {
  primary: string;
  secondary?: string;
  status?: DenseRowStatus;
  values: DenseRowValue[]; // 1–3
  onPress?: () => void;
  accessibilityLabel?: string;
}

const statusToneToColors = (
  tone: DenseRowStatusTone,
): { fg: string; bg: string } => {
  switch (tone) {
    case 'success':
      return { fg: StatusColors.success, bg: StatusColors.successMuted };
    case 'warning':
      return { fg: StatusColors.warning, bg: StatusColors.warningMuted };
    case 'danger':
      return { fg: StatusColors.danger, bg: StatusColors.dangerMuted };
    default:
      return { fg: StatusColors.neutral, bg: StatusColors.neutralMuted };
  }
};

const composeAccessibilityLabel = (props: DenseRowProps): string => {
  const parts: string[] = [props.primary];
  if (props.secondary) parts.push(props.secondary);
  if (props.status) parts.push(props.status.label);
  for (const v of props.values) {
    parts.push(v.label ? `${v.label} ${v.value}` : v.value);
  }
  return parts.join(', ');
};

function RowBody({ primary, secondary, status, values }: DenseRowProps) {
  const statusColors = status ? statusToneToColors(status.tone) : null;

  return (
    <View style={styles.row}>
      <View style={styles.leftCell}>
        <Text style={styles.primary} numberOfLines={1}>
          {primary}
        </Text>
        {secondary ? (
          <Text style={styles.secondary} numberOfLines={1}>
            {secondary}
          </Text>
        ) : null}
      </View>

      {status && statusColors ? (
        <View
          style={[styles.statusChip, { backgroundColor: statusColors.bg }]}
        >
          <Text
            style={[styles.statusLabel, { color: statusColors.fg }]}
            numberOfLines={1}
          >
            {status.label}
          </Text>
        </View>
      ) : null}

      <View style={styles.valuesCell}>
        {values.map((v, idx) => (
          <View key={`${v.value}-${idx}`} style={styles.valueGroup}>
            <Text style={styles.valueText} numberOfLines={1}>
              {v.value}
            </Text>
            {v.label ? (
              <Text style={styles.valueLabel} numberOfLines={1}>
                {v.label}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

export function DenseRow(props: DenseRowProps) {
  const { onPress, accessibilityLabel } = props;
  const a11y = accessibilityLabel ?? composeAccessibilityLabel(props);

  if (!onPress) {
    return (
      <View
        style={styles.container}
        accessibilityRole="text"
        accessibilityLabel={a11y}
      >
        <RowBody {...props} />
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({ pressed }) => [
        styles.container,
        pressed ? styles.pressed : null,
      ]}
    >
      <RowBody {...props} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: StatsColors.divider,
  },
  pressed: {
    opacity: 0.88,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  leftCell: {
    flex: 1,
    minWidth: 0,
  },
  primary: {
    fontFamily: BODY_FAMILY,
    fontSize: 13,
    lineHeight: 18,
    color: StatsColors.text,
  },
  secondary: {
    fontFamily: BODY_FAMILY,
    fontSize: 11,
    lineHeight: 14,
    color: StatsColors.textSecondary,
    marginTop: 2,
  },
  statusChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  statusLabel: {
    fontFamily: MONO_FAMILY,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  valuesCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  valueGroup: {
    alignItems: 'flex-end',
  },
  valueText: {
    fontFamily: MONO_FAMILY,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 16,
    color: StatsColors.text,
    fontVariant: ['tabular-nums'],
  },
  valueLabel: {
    fontFamily: MONO_FAMILY,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: StatsColors.muted,
    marginTop: 2,
  },
});
