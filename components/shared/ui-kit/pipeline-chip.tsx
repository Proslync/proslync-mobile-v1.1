// ── PIPELINE CHIP ─────────────────────────────────────────
// Renders one of the 9 NIL deal-pipeline stages as a labeled pill.
// Stage → tone mapping is canonical; override only via the `tone`
// escape hatch when a specific surface needs to bend the band rules
// (rare — usually a sign the surface should adopt the canonical
// pipeline color instead).

import * as React from 'react';

import { StatusPill, type StatusPillSize } from './status-pill';
import { type Tone } from './tokens';

export type PipelineStage =
  | 'open'
  | 'applied'
  | 'reviewing'
  | 'negotiating'
  | 'committed'
  | 'live'
  | 'delivered'
  | 'settled'
  | 'disputed';

export const PIPELINE_LABEL: Record<PipelineStage, string> = {
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

// Maps the 9-state pipeline onto the 6 ui-kit tones. Three visual bands:
//   prospecting → muted/info, active → accent, terminal → success/danger.
const STAGE_TONE: Record<PipelineStage, Tone> = {
  open: 'muted',
  applied: 'info',
  reviewing: 'info',
  negotiating: 'accent',
  committed: 'accent',
  live: 'accent',
  delivered: 'success',
  settled: 'success',
  disputed: 'danger',
};

export interface PipelineChipProps {
  stage: PipelineStage;
  /** Override the canonical label (rare — e.g. "Live · 3d"). */
  label?: string;
  /** Override the canonical tone (escape hatch; prefer canonical). */
  tone?: Tone;
  size?: StatusPillSize;
}

export function PipelineChip({ stage, label, tone, size }: PipelineChipProps) {
  return (
    <StatusPill
      label={label ?? PIPELINE_LABEL[stage]}
      tone={tone ?? STAGE_TONE[stage]}
      size={size}
    />
  );
}
