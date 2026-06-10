/**
 * ProSlync brand tokens — single source of truth.
 *
 * Derived from the official brand guide (logo grid, May 2026).
 * All other color files (colors.ts, xcassets colorsets) reference these values.
 */

// ── Brand palette ──────────────────────────────────────────────────────
export const Brand = {
  colors: {
    copper: '#EB621A',
    gray: '#6B656B',
    white: '#FFFFFF',
    black: '#000000',
  },

  // Derived tints / shades for UI use.
  // NOTE: `copperLight` / `copperDark` are aliases for `copperScale.300` /
  // `copperScale.600`. New code should reference the 10-step `copperScale`
  // ramp directly instead of these legacy aliases.
  copperLight: '#F0854D',
  copperDark: '#C44E10',
  grayLight: '#8A848A',
  grayDark: '#4A454A',

  // RGB breakdowns (for rgba() usage)
  rgb: {
    copper: { r: 235, g: 98, b: 26 },
    gray: { r: 107, g: 101, b: 107 },
  },

  // 10-step copper ramp (LCH-derived for perceptual evenness).
  // 500 is the canonical brand copper. Do not interpolate linearly in hex.
  copperScale: {
    '50':  '#FCF2EC',  // tint backgrounds
    '100': '#F8DFD0',
    '200': '#F3BE9C',
    '300': '#EE9F6A',
    '400': '#EC8442',
    '500': '#EB621A',  // = Brand.colors.copper (canonical)
    '600': '#C44E10',  // = current copperDark
    '700': '#9B3D0C',
    '800': '#722C08',
    '900': '#4A1C05',
    '950': '#2A0F02',
  },

  // 10-step warm-gray ramp (LCH-derived). 500 keeps the brand asset's
  // slight cool drift to honour the official gray (#6B656B).
  warmGrayScale: {
    '50':  '#FAF7F4',  // light-mode page base (warmer than current #FFFFFF)
    '100': '#F0EBE6',
    '200': '#DBD4CC',
    '300': '#BFB6AD',
    '400': '#9C928B',
    '500': '#6B656B',  // = Brand.colors.gray (canonical)
    '600': '#544F54',
    '700': '#3D393D',
    '800': '#2B2826',
    '900': '#1B1816',  // dark-mode page base (warmer than current #121212)
    '950': '#0E0C0B',
  },

  // ── Signal palette ─────────────────────────────────────────
  // Status hues chosen to NOT compete with copper. Copper is THE brand
  // signal — these are the secondary, semantic-only signals (success,
  // info, danger, neutral). `warning` deliberately delegates to copper
  // because adding a yellow-orange would clash hue with the brand mark.
  //
  // Mid is the canonical chip-fill for dark surfaces. Soft is a tinted
  // background. Deep is a high-contrast variant for light-mode chips.
  // All values picked at LCH lightness 50/72/35 with chroma capped at
  // 38 so nothing out-saturates copper.
  signal: {
    success: { mid: '#3FA889', soft: '#1F4A3D', deep: '#256B57' }, // muted teal-green
    info:    { mid: '#5B7CA8', soft: '#1F2C3D', deep: '#3D5777' }, // slate blue (pairs with athlete role accent)
    danger:  { mid: '#B53A2B', soft: '#3A150F', deep: '#82281C' }, // brick red (different value than copper)
    neutral: { mid: '#8A848A', soft: '#2B2826', deep: '#544F54' }, // = warmGray.{500, 800, 600}
  },

  // Typography
  fonts: {
    heading: 'Lato_700Bold',
    body: 'Lato_400Regular',
    caption: 'Lato_300Light',
    display: 'Lato_900Black',
  },

  // Logo usage
  logo: {
    minClearSpace: 16,
    primaryOnDark: 'assets/brand/logo-on-dark.png',
    primaryOnLight: 'assets/brand/logo-on-light.png',
    markOnly: 'assets/brand/logo-mark.png',
    lockup: 'assets/brand/logo-lockup.png',
    flash: 'assets/brand/logo-flash.png',
  },
} as const;

export type BrandColor = keyof typeof Brand.colors;
export type CopperShade = keyof typeof Brand.copperScale;
export type WarmGrayShade = keyof typeof Brand.warmGrayScale;

// ── Role accents — pastel-professional lock (2026-04-15) ─────────────────
// Quiet identity markers, not shouty fills. Orange (Brand.colors.copper) is
// THE one signal color — these pastels mark *which role* you're in without
// competing with it. Treat them like a textSecondary for hierarchy:
// emphasis moves to typography weight or orange, never to a pastel fill.
//
// Spec: atlas/design/2026-04-15/design-pastel-shift-2026-04-15.md
export const RoleAccent = {
  athlete: '#8FA3BF',  // dusty slate blue
  agent:   '#BFA97C',  // warm sand
  fan:     '#C79AA5',  // muted rose
  admin:   '#8B92A3',  // cool slate
  brand:   '#EB621A',  // brand lane carries the primary signal
  coach:   '#8FA3BF',  // shares athlete tone (coach context is athlete-adjacent)
  school:  '#8B92A3',  // shares admin tone (org-level oversight)
} as const;

export type Role = keyof typeof RoleAccent;

// ── Fan accent — universal fan-content surface ─────────────────────────
// Single source of truth for any pixel that previously used the off-brand
// platinum-purple (#A855F7). Tracks RoleAccent.fan today; will outlive the
// 'fan' ProfileRole entry when Phase 6 dissolution lands.
export const FAN_ACCENT = '#C79AA5';
export const FAN_ACCENT_SOFT = 'rgba(199,154,165,0.14)';
export const FAN_ACCENT_BORDER = 'rgba(199,154,165,0.30)';
// Neutral slate used for the POST feed-card type label, replacing the
// purple that competed visually with the brand copper and amber types.
export const FEED_POST_TYPE_COLOR = '#8B92A3';

// ── Design guard-rails — pastel-professional lock (2026-04-15) ───────────
// Ceilings, not floors. Any new component MUST stay at or below these
// values. The primary CTA on a screen is the ONE allowed exception to the
// shadow ceiling.
//
// Spec: atlas/design/2026-04-15/design-pastel-shift-2026-04-15.md
export const DesignCeilings = {
  // Shadow caps. Default surfaces stay quiet; only primary CTA may bloom.
  shadow: {
    defaultOpacity: 0.12,
    defaultRadius: 6,
    defaultElevation: 8,
    ctaOpacity: 0.20,        // primary CTA only, one per screen
    ctaRadius: 8,
    ctaElevation: 8,
  },
  // Glass-surface alpha ceilings — anything stacked above these reads as
  // card-in-card. Card-in-card is banned.
  glass: {
    base: 0.06,
    hover: 0.05,
    active: 0.07,
  },
  // Accent atmosphere — orange bloom on backgrounds, never on content.
  accent: {
    glow: 0.04,
    muted: 0.08,
  },
  // Orange count per screen. Hard ceiling, not a suggestion.
  orangeElementsPerScreen: 2,
  // Charts per screen. Replace decorative charts with StatRail / MonoKpi.
  chartsPerScreen: 2,
} as const;
