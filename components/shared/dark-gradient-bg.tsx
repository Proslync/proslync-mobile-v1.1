// Light background with subtle grey-to-transparent gradient at top.
// Place as first child inside any flex:1 container.

import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const TOP_COLORS = [
  'rgba(140,140,148,0.5)',
  'rgba(180,180,186,0.25)',
  'rgba(220,220,224,0.08)',
  'transparent',
] as const;

export function DarkGradientBg() {
  return (
    <View style={styles.bg} pointerEvents="none">
      <LinearGradient
        colors={[...TOP_COLORS]}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.topGradient}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
});
