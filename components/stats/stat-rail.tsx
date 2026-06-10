// ── STAT RAIL ─────────────────────────────────────────────
// ARGENT-QA-PASS-2026-05-12T06 [REVISE] §5e.1 target. toneToValueColor /
// toneToHintColor admit unlimited tones with no semantic rule. Migrate to
// closed `intent` enum + map intent→color centrally. [CLARITY] Sole
// consumer (role-dashboard.tsx) dropped its render usage in r1; the rail
// awaits E3 hero-block reintroduction as the "one prominent metric" slot.
// Horizontal row of 3–5 mono-numeric KPIs separated by vertical hairlines.
// No card chrome, no shadow, no glow. Bloomberg-terminal density on a quiet
// graphite base. Caller controls horizontal padding; this component only
// owns vertical rhythm.
//
// Spec: atlas/design/2026-04-15/stat-rail-library-2026-04-15.md

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { type Intent } from './intent-tokens';
import {
  BODY_FAMILY,
  MONO_FAMILY,
  Spacing,
  StatsColors,
  StatusColors,
} from './tokens';

export type StatRailTone = 'default' | 'accent' | 'success' | 'danger';

/**
 * Maps closed `intent` enum (PLAN §5e.1) to internal StatRailTone.
 *   neutral  → default
 *   positive → success
 *   attention → accent  (copper)
 *   critical → danger
 */
function intentToStatRailTone(intent: Intent | undefined): StatRailTone {
  switch (intent) {
    case 'positive':
      return 'success';
    case 'attention':
      return 'accent';
    case 'critical':
      return 'danger';
    case 'neutral':
    case undefined:
    default:
      return 'default';
  }
}

export interface StatRailItem {
  label: string;
  value: string;
  hint?: string;
  /**
   * Closed semantic-intent enum (PLAN §5e.1). Preferred over `tone`.
   */
  intent?: Intent;
  /**
   * @deprecated Use `intent` instead. Kept alive for callers still
   * passing tone literals (e.g. role-dashboard-configs.ts). Removed
   * in a future round after caller migration (PLAN §5e E2).
   */
  tone?: StatRailTone;
}

export interface StatRailProps {
  items: StatRailItem[];
  accessibilityLabel?: string;
}

const toneToValueColor = (tone: StatRailTone | undefined): string => {
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

const toneToHintColor = (tone: StatRailTone | undefined): string => {
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

const composeAccessibilityLabel = (items: StatRailItem[]): string =>
  items
    .map((it) => {
      const hint = it.hint ? `, ${it.hint}` : '';
      return `${it.label}: ${it.value}${hint}`;
    })
    .join('. ');

export function StatRail({ items, accessibilityLabel }: StatRailProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View
      style={styles.row}
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel ?? composeAccessibilityLabel(items)}
    >
      {items.map((item, idx) => {
        // §5e.1: intent wins over tone (deprecated). Resolve effective
        // tone from either source for the existing color mappings.
        const effectiveTone = item.tone ?? intentToStatRailTone(item.intent);
        const valueColor = toneToValueColor(effectiveTone);
        const hintColor = toneToHintColor(effectiveTone);
        const isLast = idx === items.length - 1;

        return (
          <View
            key={`${item.label}-${idx}`}
            style={[styles.cell, !isLast && styles.cellWithRule]}
          >
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={[styles.value, { color: valueColor }]} numberOfLines={1}>
              {item.value}
            </Text>
            {item.hint ? (
              <Text style={[styles.hint, { color: hintColor }]} numberOfLines={1}>
                {item.hint}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: Spacing.md,
  },
  cell: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    justifyContent: 'flex-start',
  },
  cellWithRule: {
    borderRightWidth: 1,
    borderRightColor: StatsColors.border,
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

// Re-export BODY_FAMILY for downstream consumers that want to align body
// text with the StatRail row's vertical rhythm.
export { BODY_FAMILY };
