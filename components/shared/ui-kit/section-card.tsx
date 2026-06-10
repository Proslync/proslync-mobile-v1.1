// ── SECTION CARD ──────────────────────────────────────────
// Dark-card section wrapper with a coloured Ionicon + title row.
// The card's title is its only label — no duplicated uppercase
// eyebrow outside (that was the two-line stagger trope).

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  CARD_BG,
  CARD_BORDER,
  RADIUS_MD,
  TONE_COLOR,
} from './tokens';

export interface SectionCardProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  children: React.ReactNode;
}

export function SectionCard({
  title,
  icon,
  iconColor = TONE_COLOR.accent,
  children,
}: SectionCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Ionicons name={icon} size={16} color={iconColor} />
        <Text style={styles.title}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    padding: 14,
  },
  head: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
