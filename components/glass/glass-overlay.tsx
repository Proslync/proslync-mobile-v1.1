import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  blur as blurTokens,
  glassFill as glassFillTokens,
  glassBorder as glassBorderTokens,
} from '@/constants/glass/tokens';
import { absoluteFill } from '@/constants/glass/helpers';
import type { BlurIntensity, GlassFill, GlassBorder } from '@/constants/glass/types';

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
 * Matches the 3-layer pattern from inverted-button.tsx.
 */
export function GlassOverlay({
  blurIntensity = 'light',
  blurTint = 'light',
  fillLevel = 'subtle',
  borderLevel,
  borderRadius = 0,
  style,
  children,
}: GlassOverlayProps) {
  const borderStyle: ViewStyle | undefined = borderLevel
    ? {
        borderWidth: glassBorderTokens[borderLevel].borderWidth,
        borderColor: `rgba(0, 0, 0, ${glassBorderTokens[borderLevel].opacity})`,
      }
    : undefined;

  return (
    <View style={[styles.container, { borderRadius }, borderStyle, style]}>
      {/* Layer 1: Blur */}
      <BlurView
        intensity={blurTokens[blurIntensity]}
        tint={blurTint}
        style={styles.absolute}
      />

      {/* Layer 2: Color fill */}
      <View
        style={[
          styles.absolute,
          {
            backgroundColor: `rgba(0, 0, 0, ${glassFillTokens[fillLevel]})`,
            borderRadius,
          },
        ]}
      />

      {/* Content */}
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
