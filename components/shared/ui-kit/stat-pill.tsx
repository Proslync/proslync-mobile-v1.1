// ── STAT PILL ─────────────────────────────────────────────
// ARGENT-QA-PASS-2026-05-12T06 [REVISE] §5e.1 target. Open `tint?: string`
// prop accepts any hex; ~30 callers across the cockpit + tab surfaces
// improvise. Migrate to closed `intent: 'neutral'|'positive'|'attention'
// |'critical'` enum; keep `tint` `@deprecated` until callers migrate.
// Small stat tile with a coloured value + uppercase label. Used in
// Explore (game counts) and the Deals tab metric row. Two sizes
// reflect the current call-site geometry — `sm` matches Explore
// (fontSize 18, padding 11), `md` matches the Deals tab (fontSize
// 20, padding 12). Default is `md`.

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { type Intent, resolveIntentColor } from '@/components/stats/intent-tokens';
import { CARD_BG, CARD_BORDER, RADIUS_MD } from './tokens';

export type StatPillSize = 'sm' | 'md';

export interface StatPillProps {
  value: string;
  label: string;
  /**
   * Closed semantic-intent enum (PLAN §5e.1). Preferred over `tint`.
   * - `neutral` (default): no state significance, just a number.
   * - `positive`: outcome confirmed (deal closed, compliance clear).
   * - `attention`: user action needed (overdue, pending review).
   * - `critical`: blocking / risk (rejected, escalated).
   */
  intent?: Intent;
  /**
   * @deprecated Use `intent` instead. Kept alive as an escape hatch for
   * callers still passing literal hex values; removed in a follow-up
   * round once cockpit-slice migration (E2) is done.
   */
  tint?: string;
  size?: StatPillSize;
}

export function StatPill({
  value,
  label,
  intent,
  tint,
  size = 'md',
}: StatPillProps) {
  const color = resolveIntentColor(intent, tint);
  const isMd = size === 'md';
  return (
    <View
      style={[
        styles.pill,
        {
          padding: isMd ? 12 : 11,
        },
      ]}
    >
      <Text
        style={[
          styles.value,
          {
            color,
            fontSize: isMd ? 20 : 18,
          },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.label,
          {
            marginTop: isMd ? 3 : 2,
            fontSize: isMd ? 10.5 : 10,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flex: 1,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
  },
  value: {
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  label: {
    color: 'rgba(255,255,255,0.50)',
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
});
