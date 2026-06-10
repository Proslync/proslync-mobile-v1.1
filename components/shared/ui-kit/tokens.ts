// ── UI-KIT TOKENS ─────────────────────────────────────────
// ARGENT-QA-PASS-2026-05-12T06 [CLARITY] *Canonical* token source for the
// shared primitives. But: components/stats/tokens.ts redefines CARD_BG at
// 0.055 (vs role-views' local 0.05), constants/colors.ts has overlapping
// hex palette, and lib/design/role-visuals.ts duplicates rgbaFromHex().
// Long-term: consolidate spacing/radius/color into lib/design/tokens/ as
// the single registry; this file becomes a re-export shim.
// Single source of truth for the small set of values the four shared
// primitives (`StatusPill`, `SectionCard`, `EmptyState`, `StatPill`)
// share. Keep this file tiny — anything screen-specific stays in the
// screen's local StyleSheet.
//
// Tone palette aligned with `components/deal/deal-detail-model.ts`
// `toneColor()` so the spine, the brand HQ, and the explore surface
// all read from one map.
import { Brand } from '@/constants/brand';
import { Status } from '@/constants/colors';

export type Tone =
  | 'success'
  | 'warning'
  | 'danger'
  | 'muted'
  | 'accent'
  | 'info';

export const TONE_COLOR: Record<Tone, string> = {
  success: Status.success.fill,
  warning: Status.warning.fill,
  danger: Status.critical.fill,
  muted: Status.muted.fill,
  accent: Brand.colors.copper,
  info: Status.info.fill,
} as const;

export const CARD_BG = 'rgba(255,255,255,0.055)';
export const CARD_BORDER = 'rgba(255,255,255,0.10)';
export const CARD_BG_INSET = 'rgba(0,0,0,0.18)';

export const RADIUS_MD = 10;
export const RADIUS_SM = 8;
export const RADIUS_PILL = 999;
