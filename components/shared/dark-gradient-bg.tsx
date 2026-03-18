// Glass gradient background — uses activeGradient from liquid glass design system.
// Place as first child inside any flex:1 container.
// Automatically adapts to light/dark theme.

import * as React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/hooks/use-app-theme';
import { activeGradient, activeGradientLight } from '@/constants/glass/liquid-glass';

export function DarkGradientBg() {
  const { isDark } = useAppTheme();
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
