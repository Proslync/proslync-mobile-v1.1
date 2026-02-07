import * as React from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';
import {
  glassFill as glassFillTokens,
  glassBorder as glassBorderTokens,
  radius as radiusTokens,
} from '@/constants/glass/tokens';
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
 * Use for option rows, field items, badges, and other lightweight surfaces.
 */
export function GlassSurface({
  fill = 'subtle',
  border,
  cornerRadius = 'md',
  style,
  children,
}: GlassSurfaceProps) {
  const borderStyle: ViewStyle | undefined = border
    ? {
        borderWidth: glassBorderTokens[border].borderWidth,
        borderColor: `rgba(0, 0, 0, ${glassBorderTokens[border].opacity})`,
      }
    : undefined;

  return (
    <View
      style={[
        {
          backgroundColor: `rgba(0, 0, 0, ${glassFillTokens[fill]})`,
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
