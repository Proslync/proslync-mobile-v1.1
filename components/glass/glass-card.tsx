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
 * Replaces the card pattern from feed-item.tsx.
 */
export function GlassCard({
  fill = 'subtle',
  border = 'subtle',
  cornerRadius = 'xl',
  shadowLevel = 'xl',
  blurIntensity = 'light',
  blurTint = 'light',
  style,
  children,
}: GlassCardProps) {
  const borderToken = glassBorderTokens[border];
  const r = radiusTokens[cornerRadius];

  return (
    <View
      style={[
        {
          backgroundColor: `rgba(0, 0, 0, ${glassFillTokens[fill]})`,
          borderRadius: r,
          borderWidth: borderToken.borderWidth,
          borderColor: `rgba(0, 0, 0, ${borderToken.opacity})`,
          overflow: 'hidden' as const,
          ...shadowTokens[shadowLevel],
        },
        style,
      ]}
    >
      {/* Blur background */}
      <BlurView
        intensity={blurTokens[blurIntensity]}
        tint={blurTint}
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
