// Light gradient background — subtle top shadow on white
// Place as first child inside any flex:1 container with backgroundColor: '#fff'

import * as React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function DarkGradientBg() {
  return (
    <LinearGradient
      colors={[
        'rgba(0, 0, 0, 0.02)',
        'rgba(0, 0, 0, 0.008)',
        'transparent',
      ]}
      locations={[0, 0.35, 0.7]}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}
