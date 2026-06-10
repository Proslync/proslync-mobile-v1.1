// ── LIVE SIGNAL RAIL ──────────────────────────────────────
// Three-column status bead row. Each cell carries an icon (in a tinted
// chip) + a mono-caps label + a short value/state string. Used as the
// per-role pulse strip directly under the hero greeting — answers
// "what's true about my world right now?" in 3 glances.
//
// Pairs with StatRail (`components/stats/stat-rail`) — StatRail is
// numeric KPIs, LiveSignalRail is status / health / state. Use both on
// the same dashboard for a complete picture.
//
// Tone palette stays inside StatusColors so the bead doesn't shout louder
// than the rest of the role accent vocabulary.
//
// Spec: atlas/design/2026-04-15/stat-rail-library-2026-04-15.md
//       arshia demo-ready-2026-04-15: AthleteHomeScreen.LiveSignal cells

import Ionicons from '@expo/vector-icons/Ionicons';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  MONO_FAMILY,
  Spacing,
  StatsColors,
  StatusColors,
} from '@/components/stats/tokens';

export type LiveSignalTone =
  | 'default'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger';

export interface LiveSignalItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tone?: LiveSignalTone;
}

export interface LiveSignalRailProps {
  items: LiveSignalItem[];
  accessibilityLabel?: string;
}

function toneToColor(tone: LiveSignalTone | undefined): string {
  switch (tone) {
    case 'accent':
      return StatsColors.accent;
    case 'success':
      return StatusColors.success;
    case 'warning':
      return StatusColors.warning;
    case 'danger':
      return StatusColors.danger;
    default:
      return StatsColors.text;
  }
}

function composeA11yLabel(items: LiveSignalItem[]): string {
  return items.map((i) => `${i.label}: ${i.value}`).join('. ');
}

export function LiveSignalRail({
  items,
  accessibilityLabel,
}: LiveSignalRailProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View
      style={styles.row}
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel ?? composeA11yLabel(items)}
    >
      {items.map((it, idx) => {
        const c = toneToColor(it.tone);
        const isLast = idx === items.length - 1;
        return (
          <View
            key={`${it.label}-${idx}`}
            style={[styles.cell, !isLast && styles.cellWithRule]}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${c}1F` }]}>
              <Ionicons name={it.icon} size={14} color={c} />
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {it.label}
            </Text>
            <Text style={[styles.value, { color: c }]} numberOfLines={1}>
              {it.value}
            </Text>
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
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    gap: 6,
  },
  cellWithRule: {
    borderRightWidth: 1,
    borderRightColor: StatsColors.border,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: MONO_FAMILY,
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 1.3,
    color: StatsColors.muted,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  value: {
    fontFamily: MONO_FAMILY,
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
