// Glass background — renders either a gradient or wallpaper image based on
// backgroundMode in the liquid glass design system.
// Place as first child inside any flex:1 container.
// Automatically adapts to light/dark theme.

import * as React from 'react';
import { Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/hooks/use-app-theme';
import {
  activeGradient,
  activeGradientLight,
  activeImageDark,
  activeImageLight,
  backgroundMode,
} from '@/constants/glass/liquid-glass';

export function DarkGradientBg() {
  const { isDark } = useAppTheme();

  if (backgroundMode === 'image') {
    const source = isDark ? activeImageDark : activeImageLight;
    return (
      <Image
        source={source}
        style={styles.image}
        resizeMode="cover"
      />
    );
  }

  const gradient = isDark ? activeGradient : activeGradientLight;
  return (
    <LinearGradient
      colors={[...gradient.colors]}
      locations={[...gradient.locations]}
      start={gradient.start}
      end={gradient.end}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
});
