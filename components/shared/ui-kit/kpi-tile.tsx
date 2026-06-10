// ── KPI TILE ──────────────────────────────────────────────
// ARGENT-QA-PASS-2026-05-12T06 [REVISE] §5e.1 target. `tone?: KpiTileTone`
// enum exists (brand/success/warning/danger/default) but no rule binds it
// to outcome. Migrate to closed `intent` enum to match StatPill + StatRail.
// [REUSE] This is the natural primitive for the E3 hero block — single
// prominent metric + delta + caption. Wire to NIL Manager AD Home.
// Textual KPI workhorse for AD dashboard, Brand HQ, and analytics
// surfaces. Replaces decorative charts where DesignCeilings.chartsPerScreen
// (= 2) is already spent. Renders: label, value (+unit), optional delta
// arrow + sparkline + caption.
//
// Tokens only — never hard-code a hex. Consumes:
//   - useAppTheme() → colors + isDark
//   - Brand.copperScale (brand tone)
//   - BaseColors.{success,warning,error} (semantic tones)
//   - Typography, Spacing, Radius, Brand.DesignCeilings.shadow

import * as React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

import { Brand, DesignCeilings } from '@/constants/brand';
import { BaseColors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { type Intent } from '@/components/stats/intent-tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

export type KpiTileTone = 'default' | 'brand' | 'success' | 'warning' | 'danger';
export type KpiTileSize = 'sm' | 'md' | 'lg';

/**
 * Maps the closed `intent` enum (PLAN §5e.1) to the existing internal
 * `KpiTileTone`. Lets new callers pass `intent='attention'` while the
 * tone-based color/border resolution below keeps working unchanged.
 *
 *   intent      →   tone
 *   neutral     →   default
 *   positive    →   success
 *   attention   →   brand    (copper)
 *   critical    →   danger
 */
function intentToKpiTone(intent: Intent | undefined): KpiTileTone {
  switch (intent) {
    case 'positive':
      return 'success';
    case 'attention':
      return 'brand';
    case 'critical':
      return 'danger';
    case 'neutral':
    case undefined:
    default:
      return 'default';
  }
}

export interface KpiDelta {
  value: number;
  unit?: string;
  direction?: 'up' | 'down' | 'flat';
  // For inverted metrics (errors, churn, etc.) — `down` is good.
  // Defaults to 'up' so positive movement reads green.
  positiveIs?: 'up' | 'down';
}

export interface KpiTileProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: KpiDelta;
  sparkline?: number[];
  /**
   * Closed semantic-intent enum (PLAN §5e.1). Preferred over `tone`.
   * Resolves internally via `intentToKpiTone`.
   */
  intent?: Intent;
  /**
   * @deprecated Use `intent` instead. Kept alive for callers that still
   * pass tone literals (e.g. `tone="success"`); removed in a future
   * round after caller migration (PLAN §5e E2).
   */
  tone?: KpiTileTone;
  size?: KpiTileSize;
  onPress?: () => void;
  caption?: string;
}

// Min widths are floors, not preferred widths. Tuned so a 2-column
// MetricGroup inside a card with Spacing.lg inset always fits at 'md':
// (393 - 2×16 card gutter - 2×12 card inset - 8 inter-col gap) / 2 ≈ 162.
const MIN_WIDTHS: Record<KpiTileSize, number> = {
  sm: 120,
  md: 150,
  lg: 200,
};

const SPARK_W = 60;
const SPARK_H = 18;
const SPARK_STROKE = 1.5;
const SPARK_MAX_POINTS = 24;

function resolveDirection(d: KpiDelta): 'up' | 'down' | 'flat' {
  if (d.direction) return d.direction;
  const sign = Math.sign(d.value);
  if (sign > 0) return 'up';
  if (sign < 0) return 'down';
  return 'flat';
}

function arrowFor(direction: 'up' | 'down' | 'flat'): string {
  if (direction === 'up') return '▲';
  if (direction === 'down') return '▼';
  return '–';
}

export function KpiTile({
  label,
  value,
  unit,
  delta,
  sparkline,
  intent,
  tone,
  size = 'md',
  onPress,
  caption,
}: KpiTileProps) {
  const { colors, isDark } = useAppTheme();
  // §5e.1: intent is preferred; tone is the @deprecated escape hatch.
  // Resolve the effective tone: explicit tone wins (back-compat), then
  // intent-mapped tone, then default.
  const effectiveTone: KpiTileTone = tone ?? intentToKpiTone(intent);

  // ── Tone → value color + accent (top border) ────────────
  const toneColor: string | undefined = (() => {
    switch (effectiveTone) {
      case 'brand':
        return isDark ? Brand.copperScale[400] : Brand.copperScale[600];
      case 'success':
        return BaseColors.success;
      case 'warning':
        return BaseColors.warning;
      case 'danger':
        return BaseColors.error;
      default:
        return undefined;
    }
  })();

  const accentColor: string | undefined = (() => {
    switch (effectiveTone) {
      case 'brand':
        return Brand.copperScale[500];
      case 'success':
        return BaseColors.success;
      case 'warning':
        return BaseColors.warning;
      case 'danger':
        return BaseColors.error;
      default:
        return undefined;
    }
  })();

  const valueTypography =
    size === 'lg' ? Typography.display : size === 'sm' ? Typography.title : Typography.heading;

  // ── Delta resolution ────────────────────────────────────
  let deltaDirection: 'up' | 'down' | 'flat' = 'flat';
  let deltaColor: string = colors.textSecondary;
  if (delta) {
    deltaDirection = resolveDirection(delta);
    if (deltaDirection === 'flat') {
      deltaColor = colors.textSecondary;
    } else {
      // Inverted-metric resolution: a metric where "up" is bad
      // (errors, churn, latency) flips the green/red mapping.
      const positiveIs = delta.positiveIs ?? 'up';
      const aligned = deltaDirection === positiveIs;
      deltaColor = aligned ? BaseColors.success : BaseColors.error;
    }
  }

  // ── Sparkline points ───────────────────────────────────
  const sparkPoints = React.useMemo(() => {
    if (!sparkline || sparkline.length < 2) return null;
    const series = sparkline.slice(-SPARK_MAX_POINTS);
    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = max - min || 1;
    const stepX = SPARK_W / (series.length - 1);
    return series
      .map((n, i) => {
        const x = i * stepX;
        const y = SPARK_H - ((n - min) / range) * SPARK_H;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  }, [sparkline]);

  const sparkColor = delta ? deltaColor : Brand.copperScale[400];

  const containerStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minWidth: MIN_WIDTHS[size],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: DesignCeilings.shadow.defaultOpacity,
    shadowRadius: DesignCeilings.shadow.defaultRadius,
    elevation: DesignCeilings.shadow.defaultElevation,
    // Tone accent — 2px top border in the tone color
    ...(accentColor ? { borderTopWidth: 2, borderTopColor: accentColor } : null),
  };

  const content = (
    <View style={containerStyle}>
      {/* Label row */}
      <Text
        numberOfLines={1}
        style={[styles.label, Typography.micro, { color: colors.textSecondary }]}
      >
        {label}
      </Text>

      {/* Value row */}
      <View style={styles.valueRow}>
        <Text
          numberOfLines={1}
          style={[valueTypography, { color: toneColor ?? colors.text, fontWeight: '900' }]}
        >
          {String(value)}
        </Text>
        {unit ? (
          <Text
            style={[
              Typography.title,
              {
                color: colors.textSecondary,
                marginLeft: Spacing.xs,
              },
            ]}
          >
            {unit}
          </Text>
        ) : null}
      </View>

      {/* Delta + sparkline row */}
      {(delta || sparkPoints) && (
        <View style={styles.metaRow}>
          {delta ? (
            <Text style={[Typography.caption, { color: deltaColor }]}>
              {`${arrowFor(deltaDirection)} ${delta.value}${delta.unit ?? ''}`}
            </Text>
          ) : (
            <View />
          )}
          {sparkPoints ? (
            <Svg width={SPARK_W} height={SPARK_H}>
              <Polyline
                points={sparkPoints}
                fill="none"
                stroke={sparkColor}
                strokeWidth={SPARK_STROKE}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          ) : null}
        </View>
      )}

      {/* Caption */}
      {caption ? (
        <Text
          numberOfLines={1}
          style={[Typography.caption, { color: colors.textSecondary, marginTop: Spacing.xs }]}
        >
          {caption}
        </Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}${unit ?? ''}`}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  label: {
    marginBottom: Spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metaRow: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
});
