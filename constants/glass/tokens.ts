import type {
  BlurIntensity,
  GlassFill,
  GlassBorder,
  RadiusScale,
  ShadowLevel,
  ShadowPreset,
  TextHierarchy,
  AccentColor,
  FontWeight,
  SpacingScale,
} from './types';

// ── Blur Intensities ──────────────────────────────────────────────────
export const blur: Record<BlurIntensity, number> = {
  light: 25,
  medium: 30,
  strong: 60,
  maximum: 80,
};

// ── Glass Fill ────────────────────────────────────────────────────────
// Dark-alpha overlays on white backgrounds
export const glassFill: Record<GlassFill, number> = {
  subtle: 0.03,
  light: 0.05,
  medium: 0.08,
  heavy: 0.12,
  frosted: 0.85,
};

// ── Glass Border ──────────────────────────────────────────────────────
export const glassBorder: Record<GlassBorder, { opacity: number; borderWidth: number }> = {
  subtle: { opacity: 0.08, borderWidth: 1 },
  medium: { opacity: 0.12, borderWidth: 1 },
  strong: { opacity: 0.18, borderWidth: 1 },
};

// ── Radius Scale ──────────────────────────────────────────────────────
export const radius: Record<RadiusScale, number> = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
};

// ── Shadow Presets ────────────────────────────────────────────────────
export const shadow: Record<ShadowLevel, ShadowPreset> = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
  },
};

// ── Text Colors ───────────────────────────────────────────────────────
export const textColor: Record<TextHierarchy, string> = {
  primary: '#1a1a1a',
  secondary: 'rgba(0, 0, 0, 0.6)',
  tertiary: 'rgba(0, 0, 0, 0.4)',
  muted: 'rgba(0, 0, 0, 0.3)',
  faint: 'rgba(0, 0, 0, 0.15)',
};

// ── Accent Colors ─────────────────────────────────────────────────────
export const accent: Record<AccentColor, string> = {
  blue: '#0095f6',
  purple: '#8b5cf6',
  green: '#34c759',
  red: '#ff3b30',
  yellow: '#fbbf24',
};

// ── Background Colors ─────────────────────────────────────────────────
export const background = {
  pure: '#ffffff',
  elevated: '#f8f8f8',
  surface: '#f2f2f2',
  card: '#f5f5f5',
} as const;

// ── Font Family ───────────────────────────────────────────────────────
export const fontFamily: Record<FontWeight, string> = {
  light: 'Lato_300Light',
  regular: 'Lato_400Regular',
  bold: 'Lato_700Bold',
  black: 'Lato_900Black',
};

// ── Spacing Scale ─────────────────────────────────────────────────────
export const spacing: Record<SpacingScale, number> = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};
