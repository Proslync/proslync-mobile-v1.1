/**
 * Spacing scale — Linear-style closed 4px grid.
 * No arbitrary values: round to the nearest token before using.
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export type SpacingToken = keyof typeof Spacing;

export const Radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 9999,
} as const;

export type RadiusToken = keyof typeof Radius;
