// ── DEAL ROW ──────────────────────────────────────────────
// Canonical row primitive for any "one NIL deal" surface — brand HQ,
// agent pipeline, NIL Manager queue, school approval queue. Composes
// PipelineChip + athlete/brand identity + value + optional 3-track
// compliance row + optional trailing slot.
//
// Lifts the recurring shape from app/(tabs)/deals.tsx DealCard,
// app/agent/pipeline.tsx, app/coach/nil-watch.tsx,
// app/nil-manager/athlete/[id].tsx — every persona that lists deals
// reimplements it. Use this; pass screen-specific extras as children.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ComplianceTrackChip } from './compliance-track-chip';
import { PipelineChip, type PipelineStage } from './pipeline-chip';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAppTheme } from '@/hooks/use-app-theme';

export type DealRowComplianceState =
  | 'pending'
  | 'approved'
  | 'flagged'
  | 'rejected'
  | 'not-required';

export interface DealRowComplianceProps {
  ncaa: DealRowComplianceState;
  school: DealRowComplianceState;
  ethics: DealRowComplianceState;
}

export interface DealRowProps {
  /** Pipeline stage. Drives the leading chip's color band. */
  stage: PipelineStage;
  /** Athlete display name. Required — the row is per-athlete-deal. */
  athlete: string;
  /** Brand display name or short context (e.g. "Rutgers", "Puma"). */
  brand?: string;
  /** Money value as a presentation string ("$380K", "$1.2M"). */
  value?: string;
  /** Term string ("2 yrs · exclusive"). Falls under athlete name. */
  term?: string;
  /** When provided, renders the 3-track compliance chip row below. */
  compliance?: DealRowComplianceProps;
  /** Tap handler. Renders chevron when set. */
  onPress?: () => void;
  /** Tightens chrome for dense lists. */
  density?: 'comfortable' | 'compact';
  /** Slot below the spine for screen-specific extensions (evidence
   *  packet, source state, commitment row, etc.). */
  children?: React.ReactNode;
  /** Container style passthrough. */
  style?: StyleProp<ViewStyle>;
}

export function DealRow({
  stage,
  athlete,
  brand,
  value,
  term,
  compliance,
  onPress,
  density = 'comfortable',
  children,
  style,
}: DealRowProps) {
  const { colors } = useAppTheme();

  const isCompact = density === 'compact';
  const padV = isCompact ? Spacing.sm : Spacing.md;
  const padH = isCompact ? Spacing.md : Spacing.lg;

  const containerStyle: ViewStyle = {
    backgroundColor: colors.cardElevated,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: padV,
    paddingHorizontal: padH,
    gap: Spacing.sm,
  };

  const a11yLabel = `${athlete}${brand ? ` · ${brand}` : ''}${value ? ` · ${value}` : ''}, ${stage}`;

  const content = (
    <>
      {/* Top row — stage chip on the left, value + chevron on the right */}
      <View style={styles.row}>
        <PipelineChip stage={stage} size={isCompact ? 'sm' : 'md'} />
        <View style={styles.rowRight}>
          {value ? (
            <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
              {value}
            </Text>
          ) : null}
          {onPress ? (
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.textSecondary}
            />
          ) : null}
        </View>
      </View>

      {/* Identity — athlete (primary) + brand/context (secondary) */}
      <View>
        <Text
          style={[styles.athlete, { color: colors.text }]}
          numberOfLines={1}
        >
          {athlete}
        </Text>
        {brand || term ? (
          <Text
            style={[styles.subtitle, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {[brand, term].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
      </View>

      {/* 3-track compliance row */}
      {compliance ? (
        <View style={styles.complianceRow}>
          <ComplianceTrackChip track="ncaa" state={compliance.ncaa} size="sm" />
          <ComplianceTrackChip track="school" state={compliance.school} size="sm" />
          <ComplianceTrackChip track="ethics" state={compliance.ethics} size="sm" />
        </View>
      ) : null}

      {/* Screen-specific extension slot */}
      {children}
    </>
  );

  if (!onPress) {
    return (
      <View
        style={[containerStyle, style]}
        accessibilityRole="text"
        accessibilityLabel={a11yLabel}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        containerStyle,
        pressed && { opacity: 0.85 },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      hitSlop={4}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  value: {
    fontFamily: Typography.title.fontFamily,
    fontSize: Typography.title.fontSize,
    fontWeight: '700',
  },
  athlete: {
    fontFamily: Typography.heading.fontFamily,
    fontSize: Typography.heading.fontSize,
    lineHeight: Typography.heading.lineHeight,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: Typography.body.fontFamily,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  complianceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
});
