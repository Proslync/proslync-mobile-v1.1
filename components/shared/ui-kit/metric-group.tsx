// ── METRIC GROUP ──────────────────────────────────────────
// 2-4 KpiTile composer. Replaces the hand-rolled `flexBasis: 47%`
// grid that breaks on awkward label lengths. Picks tile size from
// column count and truncates long labels so the value never gets
// pushed under the unit.

import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/spacing';

import {
  KpiTile,
  type KpiDelta,
  type KpiTileSize,
  type KpiTileTone,
} from './kpi-tile';

export interface MetricGroupItem {
  label: string;
  value: string | number;
  unit?: string;
  delta?: KpiDelta;
  tone?: KpiTileTone;
  sparkline?: number[];
}

export interface MetricGroupProps {
  items: MetricGroupItem[];
  columns?: 1 | 2 | 4;
}

const MAX_ITEMS = 4;
const LABEL_TRUNCATE_AT = 12;

const TILE_SIZE: Record<NonNullable<MetricGroupProps['columns']>, KpiTileSize> = {
  1: 'lg',
  2: 'md',
  4: 'sm',
};

const COLUMN_GAP: Record<NonNullable<MetricGroupProps['columns']>, number> = {
  1: Spacing.md,
  2: Spacing.sm,
  4: Spacing.xs,
};

// Truncate over-long labels at the column counts where the tile is
// narrow enough to clip awkwardly. Keeps the cut deterministic — no
// "split on the last space" cleverness that varies with copy.
function shortenLabel(label: string, columns: 1 | 2 | 4): string {
  if (columns === 1) return label;
  if (label.length <= LABEL_TRUNCATE_AT) return label;
  return `${label.slice(0, LABEL_TRUNCATE_AT)}…`;
}

export function MetricGroup({ items, columns = 2 }: MetricGroupProps) {
  const visible = items.slice(0, MAX_ITEMS);
  const gap = COLUMN_GAP[columns];
  const size = TILE_SIZE[columns];

  // Per-column width. Use explicit width + flexShrink:0 so items
  // wrap to the next row at the chosen column count instead of
  // collapsing onto one row when flexGrow tries to fill.
  // 48% × 2 + 4% gap = 100% (2-col); 23% × 4 + 4 × 2% gap = 100% (4-col).
  const itemWidth: '100%' | '48%' | '23%' =
    columns === 1 ? '100%' : columns === 2 ? '48%' : '23%';

  return (
    <View style={[styles.grid, { gap }]}>
      {visible.map((item, idx) => (
        <View
          key={`${item.label}-${idx}`}
          style={{ width: itemWidth, flexShrink: 0 }}
        >
          <KpiTile
            label={shortenLabel(item.label, columns)}
            value={item.value}
            unit={item.unit}
            delta={item.delta}
            sparkline={item.sparkline}
            tone={item.tone}
            size={size}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
