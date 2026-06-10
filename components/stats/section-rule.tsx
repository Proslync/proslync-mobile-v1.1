// ── SECTION RULE ──────────────────────────────────────────
// Thin horizontal rule with an optional mono-caps label centred mid-line.
// Used to break sections on dense surfaces without resorting to a heavy
// heading. Renders as either:
//
//   ───────────────────────────────────────────────
//
//   ─────────── THIS MONTH ───────────
//
// Tone `accent` swaps the label color to brand orange. Rule color stays on
// StatsColors.border so the divider itself never shouts.

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MONO_FAMILY, Spacing, StatsColors } from './tokens';

export type SectionRuleTone = 'default' | 'accent';

export interface SectionRuleProps {
  label?: string;
  tone?: SectionRuleTone;
  accessibilityLabel?: string;
}

export function SectionRule({
  label,
  tone = 'default',
  accessibilityLabel,
}: SectionRuleProps) {
  if (!label) {
    return (
      <View
        style={styles.bareRule}
        accessibilityRole="none"
        accessibilityLabel={accessibilityLabel}
      />
    );
  }

  const labelColor = tone === 'accent' ? StatsColors.accent : StatsColors.muted;

  return (
    <View
      style={styles.row}
      accessibilityRole="header"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <View style={styles.line} />
      <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  bareRule: {
    height: 1,
    width: '100%',
    backgroundColor: StatsColors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: StatsColors.border,
  },
  label: {
    fontFamily: MONO_FAMILY,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    paddingHorizontal: Spacing.md,
  },
});
