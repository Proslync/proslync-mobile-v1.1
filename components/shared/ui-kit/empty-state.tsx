// ── EMPTY STATE ───────────────────────────────────────────
// Large centred icon + title + body, dark-glass border. Used in
// Explore today, candidate for any list-or-feed surface that needs
// a graceful empty / loading-empty state.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { RADIUS_MD } from './tokens';

export interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}

export function EmptyState({ icon, title, body }: EmptyStateProps) {
  return (
    <View style={styles.box}>
      <Ionicons name={icon} size={28} color="rgba(255,255,255,0.52)" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 28,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  body: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    textAlign: 'center',
    maxWidth: 280,
  },
});
