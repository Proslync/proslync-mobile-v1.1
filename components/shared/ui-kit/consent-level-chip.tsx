// ── CONSENT LEVEL CHIP ────────────────────────────────────
// Single-chip representation of an athlete's per-athlete NIL consent
// level (`full | summary | withheld`). NIL-domain semantic — gates
// what the NIL-manager / school / coach surface can drill into for
// any given athlete row.
//
// Shape mirrors `ConsentLevel` in lib/data/mock-nil-manager-data.ts.
// Tone routes through Status tokens so the chip stays in sync with
// the rest of the chip vocabulary; the icon makes the gate semantic
// readable at a glance without relying on color alone.
//
// Usage today is inline `<View>` + hard-coded label per surface in
// app/nil-manager/* and nil-manager-related cards under
// components/nil-manager/. Lift here so a single legend covers every
// surface.

import * as React from 'react';

import { StatusPill, type StatusPillSize } from './status-pill';
import { type Tone } from './tokens';

export type ConsentLevel = 'full' | 'summary' | 'withheld';

const LEVEL_TONE: Record<ConsentLevel, Tone> = {
  full: 'success',     // sage — open access
  summary: 'info',     // slate — partial
  withheld: 'muted',   // gray — no signal
};

const LEVEL_LABEL: Record<ConsentLevel, string> = {
  full: 'Full access',
  summary: 'Summary only',
  withheld: 'Withheld',
};

const LEVEL_ICON: Record<
  ConsentLevel,
  React.ComponentProps<typeof StatusPill>['icon']
> = {
  full: 'lock-open-outline',
  summary: 'eye-outline',
  withheld: 'lock-closed-outline',
};

export interface ConsentLevelChipProps {
  level: ConsentLevel;
  /** Override the default label (rare — keep canonical for legend consistency). */
  label?: string;
  size?: StatusPillSize;
  /** When true, hides the leading icon. Defaults to false. */
  hideIcon?: boolean;
}

export function ConsentLevelChip({
  level,
  label,
  size,
  hideIcon = false,
}: ConsentLevelChipProps) {
  return (
    <StatusPill
      label={label ?? LEVEL_LABEL[level]}
      tone={LEVEL_TONE[level]}
      icon={hideIcon ? undefined : LEVEL_ICON[level]}
      size={size}
    />
  );
}
