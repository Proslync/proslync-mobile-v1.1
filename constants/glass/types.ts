import type { ViewStyle, TextStyle } from 'react-native';

// ── Blur ──────────────────────────────────────────────────────────────
export type BlurIntensity = 'light' | 'medium' | 'strong' | 'maximum';

// ── Glass Fill ────────────────────────────────────────────────────────
export type GlassFill = 'subtle' | 'light' | 'medium' | 'heavy' | 'frosted';

// ── Glass Border ──────────────────────────────────────────────────────
export type GlassBorder = 'subtle' | 'medium' | 'strong';

// ── Radius ────────────────────────────────────────────────────────────
export type RadiusScale = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

// ── Shadow ────────────────────────────────────────────────────────────
export type ShadowLevel = 'sm' | 'md' | 'lg' | 'xl';

export interface ShadowPreset {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

// ── Text ──────────────────────────────────────────────────────────────
export type TextHierarchy = 'primary' | 'secondary' | 'tertiary' | 'muted' | 'faint';

// ── Accent Colors ─────────────────────────────────────────────────────
export type AccentColor = 'blue' | 'purple' | 'green' | 'red' | 'yellow';

// ── Font Weight ───────────────────────────────────────────────────────
export type FontWeight = 'light' | 'regular' | 'bold' | 'black';

// ── Spacing ───────────────────────────────────────────────────────────
export type SpacingScale =
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl';

// ── Gradients ─────────────────────────────────────────────────────────
export interface GradientConfig {
  colors: string[];
  locations?: number[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

// ── Style builder option types ────────────────────────────────────────
export interface GlassCardStyleOptions {
  fill?: GlassFill;
  border?: GlassBorder;
  cornerRadius?: RadiusScale;
  shadowLevel?: ShadowLevel;
}

export interface GlassButtonStyleOptions {
  fill?: GlassFill;
  border?: GlassBorder;
  cornerRadius?: RadiusScale;
}

export interface GlassTextStyleOptions {
  hierarchy?: TextHierarchy;
  weight?: FontWeight;
  size?: number;
}

// ── Component prop types ──────────────────────────────────────────────
export type GlassButtonVariant = 'glass' | 'frosted' | 'accent' | 'danger';
export type GlassButtonSize = 'sm' | 'md' | 'lg';
