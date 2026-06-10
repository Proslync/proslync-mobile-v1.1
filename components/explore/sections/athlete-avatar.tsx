// Shared athlete avatar with gradient fallback.
//
// When `headshotUrl` resolves, renders an <Image>. When it doesn't, renders
// a 2-stop linear gradient tile in the athlete's accent color with white
// initials — a deliberate placeholder, not a "broken image" fallback.
//
// Used by feed cards (small, ~40pt) and the following strip (larger, ~54pt).
// Optional `isLive` red badge for athletes currently in a live game.

import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface AthleteAvatarProps {
  size: number;
  /** Hex color for the athlete's accent. */
  color: string;
  /** 1–3 character initials shown when no image is available. */
  initials: string;
  headshotUrl?: string | null;
  /** Render a small red dot in the corner indicating the athlete is live. */
  isLive?: boolean;
  /** Border ring width in pt. Default 1.5. */
  borderWidth?: number;
}

export function AthleteAvatar({
  size,
  color,
  initials,
  headshotUrl,
  isLive,
  borderWidth = 1.5,
}: AthleteAvatarProps) {
  const radius = size / 2;
  const innerSize = size - borderWidth * 2;
  const fontSize = Math.max(10, Math.round(size / 3));

  return (
    <View
      style={[
        styles.outer,
        {
          width: size,
          height: size,
          borderRadius: radius,
          borderWidth,
          borderColor: isLive ? '#FF4444' : `${color}60`,
          backgroundColor: `${color}20`,
        },
      ]}
    >
      {headshotUrl ? (
        <Image
          source={{ uri: headshotUrl }}
          style={{
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
          }}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: innerSize, height: innerSize, borderRadius: innerSize / 2 },
          ]}
        >
          <LinearGradient
            colors={[`${color}80`, `${color}30`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text
            style={[styles.initials, { fontSize, color: '#FFFFFF' }]}
            numberOfLines={1}
          >
            {initials}
          </Text>
        </View>
      )}
      {isLive && <View style={[styles.liveDot, { right: -2, bottom: -2 }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  fallback: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  liveDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF4444',
    borderWidth: 2,
    borderColor: '#000',
  },
});
