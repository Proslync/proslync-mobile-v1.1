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

// ── CANONICAL DESIGN SYSTEM (2026-06 cleanup) ────────────────────────────
// "Clean & simple" = consistency + restraint. Collapse the sprawl to these.
// Apply across screens; keep functionality identical.

// Canvas & text — soften the harsh extremes (no pure #000 / pure #FFF).
export const CANVAS = '#0E0E10';            // app background (was #000)
export const TEXT_PRIMARY = '#F5F5F6';      // headings / key values (was #FFF)
export const TEXT_SECONDARY = 'rgba(255,255,255,0.62)'; // labels / body-secondary
export const TEXT_TERTIARY = 'rgba(255,255,255,0.40)';  // captions / meta / disabled

// Surfaces — exactly 3 elevation levels (lightness, never shadow).
export const SURFACE = 'rgba(255,255,255,0.05)';        // default card/list fill
export const SURFACE_SUBTLE = 'rgba(255,255,255,0.035)'; // inset / input
export const SURFACE_RAISED = 'rgba(255,255,255,0.09)';  // sheet / popover / selected

// Borders — 2 only. Default to NO border; bound a region with EITHER a fill
// OR a hairline, never both.
export const HAIRLINE = 'rgba(255,255,255,0.10)';        // = CARD_BORDER
export const HAIRLINE_SUBTLE = 'rgba(255,255,255,0.07)'; // soft divider

// Radius — 4 steps. Snap everything to these (no 11/13/14/18/21/23).
export const RADIUS_LG = 16;   // modals / sheets
export const RADIUS_CARD = 12; // cards / buttons (modern iOS) — prefer over 10

// Accent — ONE accent. Copper is reserved for: the single primary action per
// screen, the active selection, and one focused/hot value. Everything else is
// neutral (TEXT_*). Green/red are SIGNALS only, never decoration.
export const ACCENT = Brand.colors.copper;
export const SIGNAL_POSITIVE = '#00C6B0';
export const SIGNAL_WARN = '#FFD60A';
export const SIGNAL_NEGATIVE = '#FF453A';

// Spacing — 4/8 rhythm. No arbitrary 5/7/9/11/13/18. Group tight (SP_SM),
// separate sections generously (SP_XL+).
export const SP_XS = 4;
export const SP_SM = 8;
export const SP_MD = 12;
export const SP_LG = 16;
export const SP_XL = 24;
export const SP_XXL = 32;

// Type scale — ~6 sizes. money/stats always tabular-nums.
export const TEXT = {
  caption: 12,
  label: 13,
  body: 15,
  title: 17,
  heading: 20,
  hero: 28,
} as const;
export const WEIGHT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '800',
} as const;
