// Type augmentation for expo-glass-effect — adds borderRadius prop
// The native iOS module accepts borderRadius as a direct prop, but the
// published types don't include it yet.
import 'expo-glass-effect';

declare module 'expo-glass-effect' {
  import { type Ref } from 'react';
  import { View, type ViewProps } from 'react-native';

  type GlassStyle = 'clear' | 'regular' | 'none';
  type GlassEffectStyleConfig = {
    style: GlassStyle;
    animate?: boolean;
    animationDuration?: number;
  };
  type GlassColorScheme = 'auto' | 'light' | 'dark';

  interface GlassViewProps extends ViewProps {
    glassEffectStyle?: GlassStyle | GlassEffectStyleConfig;
    tintColor?: string;
    isInteractive?: boolean;
    colorScheme?: GlassColorScheme;
    borderRadius?: number;
    ref?: Ref<View>;
  }

  export function GlassView(props: GlassViewProps): JSX.Element;
  export function GlassContainer(props: GlassViewProps): JSX.Element;
  export function isLiquidGlassAvailable(): boolean;
}
