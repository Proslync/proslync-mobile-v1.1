// ── PIPELINE STAGE BAR ────────────────────────────────────
// Horizontal composer over `PipelineCell`. Renders all 9 NIL deal
// stages as a scrollable row with per-stage counts and an active
// selection. Lifts the inline `ScrollView + PIPELINE_STAGES.map`
// pattern that lived in `app/(tabs)/deals.tsx` and a few persona
// surfaces. Use this — don't reimplement the row.

import * as React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  PipelineCell,
  type PipelineCellSize,
} from '@/components/deal/pipeline-cell';
import { Spacing } from '@/constants/spacing';
import type { DealStage } from '@/lib/types/nil-deal.types';

// Canonical stage order. Mirrors `PIPELINE_STAGES` in lib/types so the
// bar always renders the band sequence (prospecting → active → terminal).
export const PIPELINE_STAGE_ORDER: readonly DealStage[] = [
  'open',
  'applied',
  'reviewing',
  'negotiating',
  'committed',
  'live',
  'delivered',
  'settled',
  'disputed',
] as const;

export interface PipelineStageBarProps {
  /** Deal counts per stage. Missing keys render as 0. */
  counts: Partial<Record<DealStage, number>>;
  /** Currently-selected stage. Pass `null` for "no selection". */
  active?: DealStage | null;
  /** Selection callback. Omit to render a read-only bar. */
  onSelect?: (stage: DealStage) => void;
  /** Subset / reorder. Defaults to the canonical 9 in band order. */
  stages?: readonly DealStage[];
  size?: PipelineCellSize;
  /** Style passthrough for the outer ScrollView. */
  style?: StyleProp<ViewStyle>;
  /** Style passthrough for the row content. */
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}

export function PipelineStageBar({
  counts,
  active = null,
  onSelect,
  stages = PIPELINE_STAGE_ORDER,
  size = 'md',
  style,
  contentContainerStyle,
}: PipelineStageBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={style}
      contentContainerStyle={[styles.row, contentContainerStyle]}
    >
      {stages.map((stage) => (
        <PipelineCell
          key={stage}
          stage={stage}
          count={counts[stage] ?? 0}
          active={active === stage}
          onPress={onSelect ? () => onSelect(stage) : undefined}
          size={size}
        />
      ))}
    </ScrollView>
  );
}

// ── Compact preview helper ──────────────────────────────────
// For surfaces that want a non-interactive read-only mini-bar (e.g.
// athlete row tooltip showing where their last 3 deals live).
export interface PipelineStageBarMiniProps {
  counts: Partial<Record<DealStage, number>>;
  stages?: readonly DealStage[];
  style?: StyleProp<ViewStyle>;
}

export function PipelineStageBarMini({
  counts,
  stages = PIPELINE_STAGE_ORDER,
  style,
}: PipelineStageBarMiniProps) {
  return (
    <View style={[styles.row, styles.mini, style]}>
      {stages.map((stage) => (
        <PipelineCell key={stage} stage={stage} count={counts[stage] ?? 0} size="sm" />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  mini: {
    paddingHorizontal: 0,
    flexWrap: 'wrap',
    rowGap: Spacing.xs,
  },
});
