// Module-level smoke test — caught at `tsc --noEmit` (no Jest runner).
// Asserts the tokens contract every ui-kit primitive depends on.

import {
  CARD_BG,
  CARD_BG_INSET,
  CARD_BORDER,
  RADIUS_MD,
  RADIUS_PILL,
  RADIUS_SM,
  TONE_COLOR,
  type Tone,
} from '../index';

const expectedTones: Tone[] = [
  'success',
  'warning',
  'danger',
  'muted',
  'accent',
  'info',
];

const COLOR_RE = /^(#[0-9A-Fa-f]{3,8}|rgba?\([^)]+\))$/;

for (const tone of expectedTones) {
  const hex = TONE_COLOR[tone];
  if (typeof hex !== 'string' || !COLOR_RE.test(hex)) {
    throw new Error(`TONE_COLOR.${tone} must be a hex/rgba string, got ${String(hex)}`);
  }
}

if (Object.keys(TONE_COLOR).length !== expectedTones.length) {
  throw new Error('TONE_COLOR drifted from the canonical six-tone palette');
}

if (RADIUS_MD !== 10) throw new Error('RADIUS_MD must stay 10');
if (RADIUS_SM !== 8) throw new Error('RADIUS_SM must stay 8');
if (RADIUS_PILL !== 999) throw new Error('RADIUS_PILL must stay 999');

for (const [name, value] of [
  ['CARD_BG', CARD_BG],
  ['CARD_BORDER', CARD_BORDER],
  ['CARD_BG_INSET', CARD_BG_INSET],
] as const) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${name} must be a non-empty string`);
  }
}
