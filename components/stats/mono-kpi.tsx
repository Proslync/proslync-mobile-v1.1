// ── MONO KPI ──────────────────────────────────────────────
// Single vertical mono-numeric KPI — label on top, big value, optional hint.
// Used standalone or arranged in grids by the caller. No borders, no shadows,
// no card chrome. Mirrors the per-item visual contract of `StatRail`.

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  MONO_FAMILY,
  Spacing,
  StatsColors,
  StatusColors,
} from './tokens';

export type MonoKpiTone = 'default' | 'accent' | 'success' | 'danger';
export type MonoKpiAlignment = 'start' | 'center' | 'end';

export interface MonoKpiProps {
  label: string;
  value: string;
  hint?: string;
  tone?: MonoKpiTone;
  alignment?: MonoKpiAlignment;
  accessibilityLabel?: string;
}

const toneToValueColor = (tone: MonoKpiTone | undefined): string => {
  switch (tone) {
    case 'accent':
      return StatsColors.accent;
    case 'success':
      return StatusColors.success;
    case 'danger':
      return StatusColors.danger;
    default:
      return StatsColors.text;
  }
};

const toneToHintColor = (tone: MonoKpiTone | undefined): string => {
  switch (tone) {
    case 'accent':
      return StatsColors.accent;
    case 'success':
      return StatusColors.success;
    case 'danger':
      return StatusColors.danger;
    default:
      return StatsColors.muted;
  }
};

const alignmentToFlex = (
  alignment: MonoKpiAlignment | undefined,
): 'flex-start' | 'center' | 'flex-end' => {
  switch (alignment) {
    case 'center':
      return 'center';
    case 'end':
      return 'flex-end';
    default:
      return 'flex-start';
  }
};

const alignmentToText = (
  alignment: MonoKpiAlignment | undefined,
): 'left' | 'center' | 'right' => {
  switch (alignment) {
    case 'center':
      return 'center';
    case 'end':
      return 'right';
    default:
      return 'left';
  }
};

export function MonoKpi({
  label,
  value,
  hint,
  tone = 'default',
  alignment = 'start',
  accessibilityLabel,
}: MonoKpiProps) {
  const valueColor = toneToValueColor(tone);
  const hintColor = toneToHintColor(tone);
  const itemsAlign = alignmentToFlex(alignment);
  const textAlign = alignmentToText(alignment);

  const composed =
    accessibilityLabel ?? `${label}: ${value}${hint ? `, ${hint}` : ''}`;

  return (
    <View
      style={[styles.container, { alignItems: itemsAlign }]}
      accessibilityRole="text"
      accessibilityLabel={composed}
    >
      <Text style={[styles.label, { textAlign }]} numberOfLines={1}>
        {label}
      </Text>
      <Text
        style={[styles.value, { color: valueColor, textAlign }]}
        numberOfLines={1}
      >
        {value}
      </Text>
      {hint ? (
        <Text
          style={[styles.hint, { color: hintColor, textAlign }]}
          numberOfLines={1}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-start',
  },
  label: {
    fontFamily: MONO_FAMILY,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.3,
    color: StatsColors.muted,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  value: {
    fontFamily: MONO_FAMILY,
    fontWeight: '700',
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  hint: {
    fontFamily: MONO_FAMILY,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.6,
    marginTop: Spacing.xs,
    fontVariant: ['tabular-nums'],
  },
});
