// ── STAGE BAND BACKGROUND ─────────────────────────────────
// Subtle full-row background tint that signals which "band" a deal
// stage belongs to in the canonical 9-state pipeline:
//
//   prospecting → open / applied / reviewing      (muted / info)
//   active      → negotiating / committed / live  (copper progression)
//   terminal    → delivered / settled / disputed  (success / success / critical)
//
// Wraps a `<DealRow>` (or any block) and adds a quiet horizontal stripe
// in the band's color so an agent scrolling a long pipeline gets a
// peripheral cue about where the row lives without reading the chip.
//
// Lifts from app/agent/pipeline.tsx where rows scroll past in band
// groups today with no visual band marker. Subtle by default — the
// `intensity` knob is a ceiling, not a fill.

import * as React from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Pipeline } from '@/constants/colors';
import { Radius } from '@/constants/spacing';
import type { PipelineStage } from './pipeline-chip';

export type StageBand = 'prospecting' | 'active' | 'terminal';

export const STAGE_TO_BAND: Record<PipelineStage, StageBand> = {
  open: 'prospecting',
  applied: 'prospecting',
  reviewing: 'prospecting',
  negotiating: 'active',
  committed: 'active',
  live: 'active',
  delivered: 'terminal',
  settled: 'terminal',
  disputed: 'terminal',
};

// Each band picks the canonical Pipeline-palette entry whose semantic
// matches the band's "feeling". Soft variant = tinted background; the
// actual stripe alpha is further moderated by `intensity`.
const BAND_TONE_KEY: Record<StageBand, keyof typeof Pipeline> = {
  prospecting: 'reviewing', // info / slate-blue
  active: 'committed',      // copper
  terminal: 'delivered',    // muted sage success
};

export type StageBandIntensity = 'subtle' | 'standard';

export interface StageBandBackgroundProps {
  /** The pipeline stage of the wrapped row — drives the band color. */
  stage: PipelineStage;
  /**
   * Background intensity. `subtle` (default) reads as a peripheral cue;
   * `standard` is closer to a chip-soft fill. Keep `subtle` on dense
   * lists — anything stronger fights the row content.
   */
  intensity?: StageBandIntensity;
  /** When true, the stripe spans only the left edge as a 4px rail. */
  asLeftRail?: boolean;
  /** Container style passthrough — applied OUTSIDE the band tint. */
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function StageBandBackground({
  stage,
  intensity = 'subtle',
  asLeftRail = false,
  style,
  children,
}: StageBandBackgroundProps) {
  const band = STAGE_TO_BAND[stage];
  const tone = Pipeline[BAND_TONE_KEY[band]];

  // Subtle keeps the stripe well below content noise; standard reads
  // as a clearly tinted band but stays under the soft-token ceiling.
  const fillColor =
    intensity === 'standard' ? tone.soft : `${tone.fill}10`;

  if (asLeftRail) {
    return (
      <View style={[styles.railWrap, style]}>
        <View
          style={[styles.rail, { backgroundColor: tone.fill }]}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <View style={styles.railContent}>{children}</View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.band,
        { backgroundColor: fillColor },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    borderRadius: Radius.lg,
  },
  railWrap: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  rail: {
    width: 4,
  },
  railContent: {
    flex: 1,
  },
});
