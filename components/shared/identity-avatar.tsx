// components/shared/identity-avatar.tsx
// ── IDENTITY AVATAR ────────────────────────────────────────────────────────
// Renders a per-role avatar:
//   • If `photo` is provided → renders the real photo (ImageSourcePropType).
//   • Otherwise → renders a circle filled with `accent` (or a hash-derived
//     color from `name`), with the person's 1-2 char initials centered in
//     bold white. Clean, professional, distinct per role.
//
// Exports:
//   IdentityAvatar({ name, size, accent, photo? }) — the component
//   hashColor(seed: string) — deterministic hue → hex color

import * as React from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ── hashColor ──────────────────────────────────────────────────────────────

/**
 * Deterministic color derived from a string seed.
 * Returns a hex color in the muted-but-saturated range so it looks good
 * against a dark background.
 */
export function hashColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  // Map to hue 0-360, keep saturation/lightness at pleasant values.
  const hue = hash % 360;
  return hslToHex(hue, 60, 45);
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  function f(n: number) {
    const k = (n + h / 30) % 12;
    const color = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  }
  return `#${f(0)}${f(8)}${f(4)}`;
}

// ── initials helper ────────────────────────────────────────────────────────

function extractInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ── IdentityAvatar ─────────────────────────────────────────────────────────

export interface IdentityAvatarProps {
  /** Display name — used for initials extraction and hash fallback. */
  name: string;
  /** Pixel diameter of the circle. */
  size: number;
  /**
   * Accent hex color (e.g. '#EB621A').
   * Used as the fill when no photo is provided.
   * Falls back to hashColor(name) if omitted.
   */
  accent?: string;
  /**
   * When provided, renders the real photo instead of initials.
   * Pass the require()'d asset or an ImageSourcePropType URI object.
   */
  photo?: ImageSourcePropType;
}

export function IdentityAvatar({ name, size, accent, photo }: IdentityAvatarProps) {
  const radius = size / 2;

  if (photo) {
    return (
      <Image
        source={photo}
        style={{ width: size, height: size, borderRadius: radius }}
        resizeMode="cover"
      />
    );
  }

  const fill = accent ?? hashColor(name);
  const initials = extractInitials(name);
  const fontSize = size * (initials.length > 2 ? 0.32 : 0.42);

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: fill,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
