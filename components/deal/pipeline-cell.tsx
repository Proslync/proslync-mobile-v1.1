// ── PIPELINE CELL ──────────────────────────────────────────
// One cell in the 9-stage NIL deal pipeline row. Vertical mini-tile:
// uppercase stage label on top, count on the bottom. Used by Sprint 2
// Brand HQ pipeline strip and any screen that shows deal flow by stage.
//
// Caller composes cells into a horizontal row and is responsible for
// scroll / layout. This component renders a single cell only.

import * as React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Brand } from '@/constants/brand';
import { BaseColors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { DealStage } from '@/lib/types/nil-deal.types';

// ── Stable maps (exported) ───────────────────────────────────────────
export const PIPELINE_STAGE_LABEL: Record<DealStage, string> = {
  open: 'Open',
  applied: 'Applied',
  reviewing: 'Reviewing',
  negotiating: 'Negotiating',
  committed: 'Committed',
  live: 'Live',
  delivered: 'Delivered',
  settled: 'Settled',
  disputed: 'Disputed',
};

export type PipelineStageTone =
  | 'default'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger';

export const PIPELINE_STAGE_TONE: Record<DealStage, PipelineStageTone> = {
  open: 'default',
  applied: 'default',
  reviewing: 'brand',
  negotiating: 'brand',
  committed: 'brand',
  live: 'success',
  delivered: 'success',
  settled: 'success',
  disputed: 'danger',
};

// ── Component ────────────────────────────────────────────────────────
export type PipelineCellSize = 'sm' | 'md';

export interface PipelineCellProps {
  stage: DealStage;
  /** Deal count at this stage. */
  count?: number;
  /** Highlights as currently-selected. */
  active?: boolean;
  onPress?: () => void;
  size?: PipelineCellSize;
}

export function PipelineCell({
  stage,
  count = 0,
  active = false,
  onPress,
  size = 'md',
}: PipelineCellProps) {
  const { colors, isDark } = useAppTheme();
  const tone = PIPELINE_STAGE_TONE[stage];
  const label = PIPELINE_STAGE_LABEL[stage];
  const isEmpty = count === 0;

  // Resolve top-border accent + label tint for the active state per tone.
  const toneAccent = resolveToneAccent(tone, isDark);

  // Container chrome.
  const minWidth = size === 'sm' ? 64 : 80;
  const baseContainerStyle: ViewStyle = {
    minWidth,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: active ? colors.card : colors.cardElevated,
    borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
    borderColor: active && tone === 'default' ? colors.text : colors.border,
    opacity: isEmpty ? 0.6 : 1,
  };

  // For toned active state, the accent rides on the top border only.
  const accentTopBorder: ViewStyle | undefined =
    active && toneAccent
      ? {
          borderTopWidth: 1.5,
          borderTopColor: toneAccent,
        }
      : undefined;

  // Label color.
  let labelColor = colors.textSecondary;
  if (isEmpty) {
    labelColor = colors.textTertiary;
  } else if (active && toneAccent) {
    labelColor = toneAccent;
  }

  // Count color.
  const countColor = isEmpty ? colors.textTertiary : colors.text;

  // Typography for the count value (number).
  const countTypography =
    size === 'sm' ? Typography.callout : Typography.title;

  const content = (
    <>
      <Text
        style={[styles.label, { color: labelColor }]}
        numberOfLines={1}
        accessibilityRole="text"
      >
        {label}
      </Text>
      <Text
        style={[
          styles.count,
          {
            color: countColor,
            fontFamily: countTypography.fontFamily,
            fontSize: countTypography.fontSize,
            lineHeight: countTypography.lineHeight,
            letterSpacing: countTypography.letterSpacing,
          },
        ]}
        numberOfLines={1}
        accessibilityRole="text"
      >
        {count}
      </Text>
    </>
  );

  const a11yLabel = `${label}, ${count} ${count === 1 ? 'deal' : 'deals'}`;

  if (!onPress) {
    return (
      <View
        style={[styles.container, baseContainerStyle, accentTopBorder]}
        accessibilityLabel={a11yLabel}
        accessibilityState={{ selected: active, disabled: isEmpty }}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }): StyleProp<ViewStyle> => [
        styles.container,
        baseContainerStyle,
        accentTopBorder,
        pressed ? { opacity: 0.85 } : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ selected: active, disabled: isEmpty }}
      hitSlop={6}
    >
      {content}
    </Pressable>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────
function resolveToneAccent(
  tone: PipelineStageTone,
  isDark: boolean,
): string | null {
  switch (tone) {
    case 'brand':
      return isDark ? Brand.copperLight : Brand.copperDark;
    case 'success':
      return BaseColors.success;
    case 'warning':
      return BaseColors.warning;
    case 'danger':
      return BaseColors.error;
    case 'default':
    default:
      return null;
  }
}

// ── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  label: {
    fontFamily: Typography.micro.fontFamily,
    fontSize: Typography.micro.fontSize,
    lineHeight: Typography.micro.lineHeight,
    letterSpacing: Typography.micro.letterSpacing,
    textTransform: 'uppercase',
  },
  count: {
    fontWeight: '700',
  },
});
