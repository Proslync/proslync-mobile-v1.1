// Liquid Glass — Single source of truth for all GlassView props across the app.
// Change values here to update every glass element at once.

// ─── Core settings ───────────────────────────────────────────────
// These apply to every glass element unless overridden by a preset.
const EFFECT_STYLE = 'regular' as const;
const COLOR_SCHEME = 'dark' as const;

// ─── Tint palette ────────────────────────────────────────────────
// Opacity controls how much background content bleeds through.
// Higher opacity → more opaque, less color-shifting from content behind.
export const glassTint = {
  /** Primary dark surface (tab bar, sheets, cards, overlays) */
  surface: 'rgba(10, 10, 10, 0.55)',
  /** Subtle white fill (buttons, inputs, emoji pickers) */
  fill: 'rgba(255, 255, 255, 0.08)',
  /** Medium white fill (active buttons, modal headers, close icons) */
  fillMedium: 'rgba(255, 255, 255, 0.12)',
  /** Strong white fill (highlighted toggles, active selections) */
  fillStrong: 'rgba(255, 255, 255, 0.15)',
  /** Very faint white fill (subtle CTAs, add-account icon) */
  fillFaint: 'rgba(255, 255, 255, 0.06)',
  /** Danger (call decline, destructive) */
  danger: 'rgba(255, 59, 48, 0.5)',
  /** Success (call accept, positive) */
  success: 'rgba(52, 199, 89, 0.5)',
} as const;

// ─── Presets ─────────────────────────────────────────────────────
// Spread onto <GlassView>: <GlassView {...liquidGlass.surface} borderRadius={28} />

export const liquidGlass = {
  /** Panels — tab bar, bottom sheets, cards, overlays, modal backgrounds */
  surface: {
    glassEffectStyle: EFFECT_STYLE,
    colorScheme: COLOR_SCHEME,
    tintColor: glassTint.surface,
  },
  /** Buttons & inputs — subtle white fill */
  fill: {
    glassEffectStyle: EFFECT_STYLE,
    colorScheme: COLOR_SCHEME,
    tintColor: glassTint.fill,
  },
  /** Active / elevated — medium emphasis for headers, active states */
  fillMedium: {
    glassEffectStyle: EFFECT_STYLE,
    colorScheme: COLOR_SCHEME,
    tintColor: glassTint.fillMedium,
  },
  /** Highlighted — strong emphasis for selected toggles */
  fillStrong: {
    glassEffectStyle: EFFECT_STYLE,
    colorScheme: COLOR_SCHEME,
    tintColor: glassTint.fillStrong,
  },
  /** Faint — very subtle fill for secondary elements */
  fillFaint: {
    glassEffectStyle: EFFECT_STYLE,
    colorScheme: COLOR_SCHEME,
    tintColor: glassTint.fillFaint,
  },
  /** Interactive — responds to touch (for GlassButton, action buttons) */
  interactive: {
    glassEffectStyle: EFFECT_STYLE,
    colorScheme: COLOR_SCHEME,
    tintColor: glassTint.surface,
    isInteractive: true as const,
  },
  /** Danger — destructive actions (call decline) */
  danger: {
    glassEffectStyle: EFFECT_STYLE,
    colorScheme: COLOR_SCHEME,
    tintColor: glassTint.danger,
  },
  /** Success — positive actions (call accept) */
  success: {
    glassEffectStyle: EFFECT_STYLE,
    colorScheme: COLOR_SCHEME,
    tintColor: glassTint.success,
  },
} as const;
