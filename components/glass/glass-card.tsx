import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  glassFill as glassFillTokens,
  glassBorder as glassBorderTokens,
  radius as radiusTokens,
  shadow as shadowTokens,
  blur as blurTokens,
} from '@/constants/glass/tokens';
import { absoluteFill } from '@/constants/glass/helpers';
import { useAppTheme } from '@/hooks/use-app-theme';
import type {
  GlassFill,
  GlassBorder,
  RadiusScale,
  ShadowLevel,
  BlurIntensity,
} from '@/constants/glass/types';

interface GlassCardProps {
  fill?: GlassFill;
  border?: GlassBorder;
  cornerRadius?: RadiusScale;
  shadowLevel?: ShadowLevel;
  blurIntensity?: BlurIntensity;
  blurTint?: 'light' | 'dark' | 'default';
  style?: ViewStyle;
  children?: React.ReactNode;
}

/**
 * Pre-composed card: blur background + glass fill + border + shadow.
 * Automatically adapts to light/dark theme.
 */
export function GlassCard({
  fill = 'subtle',
  border = 'subtle',
  cornerRadius = 'xl',
  shadowLevel = 'xl',
  blurIntensity = 'light',
  blurTint,
  style,
  children,
}: GlassCardProps) {
  const { isDark } = useAppTheme();
  const borderToken = glassBorderTokens[border];
  const r = radiusTokens[cornerRadius];

  // Use theme-appropriate colors
  const fillColor = isDark
    ? `rgba(255, 255, 255, ${glassFillTokens[fill]})`
    : `rgba(0, 0, 0, ${glassFillTokens[fill]})`;
  const borderColor = isDark
    ? `rgba(255, 255, 255, ${borderToken.opacity})`
    : `rgba(0, 0, 0, ${borderToken.opacity})`;

  // Auto-select blur tint based on theme if not specified
  const effectiveBlurTint = blurTint ?? (isDark ? 'dark' : 'light');

  return (
    <View
      style={[
        {
          backgroundColor: fillColor,
          borderRadius: r,
          borderWidth: borderToken.borderWidth,
          borderColor: borderColor,
          overflow: 'hidden' as const,
          ...shadowTokens[shadowLevel],
        },
        style,
      ]}
    >
      {/* Blur background */}
      <BlurView
        intensity={blurTokens[blurIntensity]}
        tint={effectiveBlurTint}
        style={styles.absolute}
      />

      {/* Content */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  absolute: absoluteFill(),
});
