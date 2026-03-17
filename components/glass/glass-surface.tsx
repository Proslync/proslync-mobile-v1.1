import * as React from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import {
  glassFill as glassFillTokens,
  glassBorder as glassBorderTokens,
  radius as radiusTokens,
} from '@/constants/glass/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import type { GlassFill, GlassBorder, RadiusScale } from '@/constants/glass/types';

const useNativeGlass = isGlassEffectAPIAvailable();

interface GlassSurfaceProps {
  fill?: GlassFill;
  border?: GlassBorder;
  cornerRadius?: RadiusScale;
  style?: ViewStyle;
  children?: React.ReactNode;
}

/**
 * Lightweight View with glass fill + border.
 * Uses Apple's native Liquid Glass on iOS 26+, falls back to themed rgba on older platforms.
 */
export function GlassSurface({
  fill = 'subtle',
  border,
  cornerRadius = 'md',
  style,
  children,
}: GlassSurfaceProps) {
  const { isDark } = useAppTheme();

  const borderStyle: ViewStyle | undefined = border
    ? {
        borderWidth: glassBorderTokens[border].borderWidth,
        borderColor: isDark
          ? `rgba(255, 255, 255, ${glassBorderTokens[border].opacity})`
          : `rgba(0, 0, 0, ${glassBorderTokens[border].opacity})`,
      }
    : undefined;

  if (useNativeGlass) {
    return (
      <GlassView
        {...liquidGlass.surface}
        glassEffectStyle="clear"
        style={[
          {
            borderRadius: radiusTokens[cornerRadius],
            overflow: 'hidden' as const,
          },
          borderStyle,
          style,
        ]}
      >
        {children}
      </GlassView>
    );
  }

  const fillColor = isDark
    ? `rgba(255, 255, 255, ${glassFillTokens[fill]})`
    : `rgba(0, 0, 0, ${glassFillTokens[fill]})`;

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
