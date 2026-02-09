import * as React from 'react';
import { Text } from 'react-native';
import type { TextStyle } from 'react-native';
import { fontFamily } from '@/constants/glass/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { TextHierarchy, FontWeight } from '@/constants/glass/types';

// Light theme text colors
const lightTextColor: Record<TextHierarchy, string> = {
  primary: '#1a1a1a',
  secondary: 'rgba(0, 0, 0, 0.6)',
  tertiary: 'rgba(0, 0, 0, 0.4)',
  muted: 'rgba(0, 0, 0, 0.3)',
  faint: 'rgba(0, 0, 0, 0.15)',
};

// Dark theme text colors
const darkTextColor: Record<TextHierarchy, string> = {
  primary: '#ffffff',
  secondary: 'rgba(255, 255, 255, 0.7)',
  tertiary: 'rgba(255, 255, 255, 0.5)',
  muted: 'rgba(255, 255, 255, 0.4)',
  faint: 'rgba(255, 255, 255, 0.2)',
};

interface GlassTextProps {
  hierarchy?: TextHierarchy;
  weight?: FontWeight;
  size?: number;
  style?: TextStyle;
  numberOfLines?: number;
  children: React.ReactNode;
}

/**
 * Text component with glass hierarchy and Lato font support.
 * Automatically adapts to light/dark theme.
 */
export function GlassText({
  hierarchy = 'primary',
  weight = 'regular',
  size = 16,
  style,
  numberOfLines,
  children,
}: GlassTextProps) {
  const { isDark } = useAppTheme();
  const textColors = isDark ? darkTextColor : lightTextColor;

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          color: textColors[hierarchy],
          fontFamily: fontFamily[weight],
          fontSize: size,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
