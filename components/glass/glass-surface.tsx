import * as React from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';
import {
  glassFill as glassFillTokens,
  glassBorder as glassBorderTokens,
  radius as radiusTokens,
} from '@/constants/glass/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { GlassFill, GlassBorder, RadiusScale } from '@/constants/glass/types';

interface GlassSurfaceProps {
  fill?: GlassFill;
  border?: GlassBorder;
  cornerRadius?: RadiusScale;
  style?: ViewStyle;
  children?: React.ReactNode;
}

/**
 * Lightweight View with glass fill + border, NO blur.
 * Automatically adapts to light/dark theme.
 */
export function GlassSurface({
  fill = 'subtle',
  border,
  cornerRadius = 'md',
  style,
  children,
}: GlassSurfaceProps) {
  const { isDark } = useAppTheme();

  // Use theme-appropriate colors
  const fillColor = isDark
    ? `rgba(255, 255, 255, ${glassFillTokens[fill]})`
    : `rgba(0, 0, 0, ${glassFillTokens[fill]})`;

  const borderStyle: ViewStyle | undefined = border
    ? {
        borderWidth: glassBorderTokens[border].borderWidth,
        borderColor: isDark
          ? `rgba(255, 255, 255, ${glassBorderTokens[border].opacity})`
          : `rgba(0, 0, 0, ${glassBorderTokens[border].opacity})`,
      }
    : undefined;

  return (
    <View
      style={[
        {
          backgroundColor: fillColor,
          borderRadius: radiusTokens[cornerRadius],
        },
        borderStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}
