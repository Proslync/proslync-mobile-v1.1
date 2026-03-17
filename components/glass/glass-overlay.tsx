import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import {
  blur as blurTokens,
  glassFill as glassFillTokens,
  glassBorder as glassBorderTokens,
} from '@/constants/glass/tokens';
import { absoluteFill } from '@/constants/glass/helpers';
import { useAppTheme } from '@/hooks/use-app-theme';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import type { BlurIntensity, GlassFill, GlassBorder } from '@/constants/glass/types';

const useNativeGlass = isGlassEffectAPIAvailable();

interface GlassOverlayProps {
  blurIntensity?: BlurIntensity;
  blurTint?: 'light' | 'dark' | 'default';
  fillLevel?: GlassFill;
  borderLevel?: GlassBorder;
  borderRadius?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}

/**
 * Lowest-level glass primitive: BlurView + color fill + optional border.
 * Automatically adapts to light/dark theme.
 */
export function GlassOverlay({
  blurIntensity = 'light',
  blurTint,
  fillLevel = 'subtle',
  borderLevel,
  borderRadius = 0,
  style,
  children,
}: GlassOverlayProps) {
  const { isDark } = useAppTheme();

  // Use theme-appropriate colors
  const fillColor = isDark
    ? `rgba(255, 255, 255, ${glassFillTokens[fillLevel]})`
    : `rgba(0, 0, 0, ${glassFillTokens[fillLevel]})`;

  // Auto-select blur tint based on theme if not specified
  const effectiveBlurTint = blurTint ?? (isDark ? 'dark' : 'light');

  const borderStyle: ViewStyle | undefined = borderLevel
    ? {
        borderWidth: glassBorderTokens[borderLevel].borderWidth,
        borderColor: isDark
          ? `rgba(255, 255, 255, ${glassBorderTokens[borderLevel].opacity})`
          : `rgba(0, 0, 0, ${glassBorderTokens[borderLevel].opacity})`,
      }
    : undefined;

  if (useNativeGlass) {
    return (
      <GlassView
        {...liquidGlass.surface}
        style={[styles.container, { borderRadius }, borderStyle, style]}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View style={[styles.container, { borderRadius }, borderStyle, style]}>
      <BlurView
        intensity={blurTokens[blurIntensity]}
        tint={effectiveBlurTint}
        style={styles.absolute}
      />
      <View
        style={[
          styles.absolute,
          {
            backgroundColor: fillColor,
            borderRadius,
          },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  absolute: absoluteFill(),
});
