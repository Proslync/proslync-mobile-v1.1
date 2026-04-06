// Light background — solid #f2f2f2 to match the feed screen.
// Place as first child inside any flex:1 container.

import * as React from 'react';
import { View, StyleSheet } from 'react-native';

export function DarkGradientBg() {
  return (
    <View
      style={styles.bg}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f2f2f2',
  },
});
