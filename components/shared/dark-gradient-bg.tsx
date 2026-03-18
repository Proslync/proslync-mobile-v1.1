// Dark gradient background — subtle white ambient glow at top fading to black
// Place as first child inside any flex:1 container with backgroundColor: '#000'

import * as React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function DarkGradientBg() {
  return (
    <LinearGradient
      colors={[
        'rgba(255, 255, 255, 0.025)',
        'rgba(255, 255, 255, 0.01)',
        'transparent',
      ]}
      locations={[0, 0.3, 0.65]}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}
