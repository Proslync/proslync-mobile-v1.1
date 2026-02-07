import * as React from 'react';
import { Text } from 'react-native';
import type { TextStyle } from 'react-native';
import { textColor, fontFamily } from '@/constants/glass/tokens';
import type { TextHierarchy, FontWeight } from '@/constants/glass/types';

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
 */
export function GlassText({
  hierarchy = 'primary',
  weight = 'regular',
  size = 16,
  style,
  numberOfLines,
  children,
}: GlassTextProps) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          color: textColor[hierarchy],
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
