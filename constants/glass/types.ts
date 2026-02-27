import type { ViewStyle, TextStyle } from 'react-native';

export type BlurIntensity = 'light' | 'medium' | 'strong' | 'maximum';

export type GlassFill = 'subtle' | 'light' | 'medium' | 'heavy' | 'frosted';

export type GlassBorder = 'subtle' | 'medium' | 'strong';

export type RadiusScale = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export type ShadowLevel = 'sm' | 'md' | 'lg' | 'xl';

export interface ShadowPreset {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export type TextHierarchy = 'primary' | 'secondary' | 'tertiary' | 'muted' | 'faint';

export type AccentColor = 'blue' | 'purple' | 'green' | 'red' | 'yellow';

export type FontWeight = 'light' | 'regular' | 'bold' | 'black';

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

export interface GradientConfig {
  colors: string[];
  locations?: number[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

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

export type GlassButtonVariant = 'glass' | 'frosted' | 'accent' | 'danger';
export type GlassButtonSize = 'sm' | 'md' | 'lg';
