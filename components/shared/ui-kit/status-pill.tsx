// ── STATUS PILL ───────────────────────────────────────────
// Uppercase tinted pill with optional left icon. Used across the
// deal-detail spine, Brand HQ open-deal card, NIL Manager review
// rows, and Explore (live indicator).

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  RADIUS_PILL,
  TONE_COLOR,
  type Tone,
} from './tokens';

export type StatusPillSize = 'sm' | 'md';

export interface StatusPillProps {
  label: string;
  /** One of the canonical tones. Pass `color` for one-off tints. */
  tone?: Tone;
  /** Explicit hex/rgba override — wins over `tone`. */
  color?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: StatusPillSize;
}

export function StatusPill({
  label,
  tone,
  color: colorOverride,
  icon,
  size = 'sm',
}: StatusPillProps) {
  const color = colorOverride ?? (tone ? TONE_COLOR[tone] : TONE_COLOR.muted);
  const padX = size === 'md' ? 9 : 8;
  const fontSize = size === 'md' ? 10.5 : 9.5;
  const iconSize = size === 'md' ? 13 : 12;

  return (
    <View
      style={[
        styles.pill,
        {
          paddingHorizontal: padX,
          borderColor: `${color}55`,
          backgroundColor: `${color}1C`,
        },
      ]}
    >
      {icon ? <Ionicons name={icon} size={iconSize} color={color} /> : null}
      <Text style={[styles.text, { color, fontSize }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: RADIUS_PILL,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 4,
  },
  text: {
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
