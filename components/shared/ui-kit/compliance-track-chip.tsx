// ── COMPLIANCE TRACK CHIP ─────────────────────────────────
// One of the three compliance review tracks (NCAA / school / ethics)
// rendered as a labeled pill. Use as the single-track primitive when
// `ComplianceTrack` (which renders all three side-by-side) is too
// heavy — e.g. inside a deal row, a sidebar, or a notification.

import * as React from 'react';

import { StatusPill, type StatusPillSize } from './status-pill';
import { type Tone } from './tokens';

export type ComplianceTrackKey = 'ncaa' | 'school' | 'ethics';
export type ComplianceTrackState =
  | 'pending'
  | 'approved'
  | 'flagged'
  | 'rejected'
  | 'not-required';

export const TRACK_LABEL: Record<ComplianceTrackKey, string> = {
  ncaa: 'NCAA',
  school: 'School',
  ethics: 'Ethics',
};

const STATE_TONE: Record<ComplianceTrackState, Tone> = {
  pending: 'info',
  approved: 'success',
  flagged: 'warning',
  rejected: 'danger',
  'not-required': 'muted',
};

const STATE_LABEL: Record<ComplianceTrackState, string> = {
  pending: 'Pending',
  approved: 'Approved',
  flagged: 'Flagged',
  rejected: 'Rejected',
  'not-required': 'N/A',
};

export interface ComplianceTrackChipProps {
  track: ComplianceTrackKey;
  state: ComplianceTrackState;
  /** When set and state is `pending`, label becomes `<TRACK> · <dueIn>`. */
  dueIn?: string;
  size?: StatusPillSize;
}

export function ComplianceTrackChip({ track, state, dueIn, size }: ComplianceTrackChipProps) {
  const label =
    state === 'pending' && dueIn
      ? `${TRACK_LABEL[track]} · ${dueIn}`
      : `${TRACK_LABEL[track]} · ${STATE_LABEL[state]}`;

  return <StatusPill label={label} tone={STATE_TONE[state]} size={size} />;
}
