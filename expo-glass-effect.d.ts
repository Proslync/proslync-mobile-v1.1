// Type override for expo-glass-effect
// GlassViewProps is a type alias (not interface) so it can't be augmented.
// We redeclare the module to add borderRadius which exists at runtime but not in types.

declare module 'expo-glass-effect' {
  import type { PropsWithChildren, Ref } from 'react';
  import type { View, ViewProps } from 'react-native';

  export type GlassStyle = 'clear' | 'regular' | 'none';
  export type GlassEffectStyleConfig = {
    style: GlassStyle;
    animate?: boolean;
    animationDuration?: number;
  };
  export type GlassColorScheme = 'auto' | 'light' | 'dark';

  export type GlassViewProps = {
    glassEffectStyle?: GlassStyle | GlassEffectStyleConfig;
    tintColor?: string;
    isInteractive?: boolean;
    colorScheme?: GlassColorScheme;
    borderRadius?: number;
    ref?: Ref<View>;
  } & ViewProps;

  export type GlassContainerProps = {
    spacing?: number;
    ref?: Ref<View>;
  } & ViewProps;

  export function GlassView(props: PropsWithChildren<GlassViewProps>): JSX.Element;
  export function GlassContainer(props: PropsWithChildren<GlassContainerProps>): JSX.Element;
  export function isGlassEffectAPIAvailable(): boolean;
  export function isLiquidGlassAvailable(): boolean;
}
