// Tier header — gamification surface for fans-only users. Title +
// "Following N · X pts" subtitle + tier pill (Diamond/Platinum/Gold/etc.)
// Extracted from components/fan/fan-view.tsx during the
// fan-content-to-triad-2026-05-12 decomposition (Phase 2a). Hidden when
// the user has any pro role; see isFansOnlyUser.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FAN_FOLLOWING, FAN_PROFILE } from '@/lib/data/mock-fan-data';
import {
  FAN_ACCENT,
  FAN_ACCENT_BORDER,
  FAN_ACCENT_SOFT,
} from '@/constants/brand';

interface TierHeaderProps {
  title?: string;
}

export function TierHeader({ title = 'Fan Hub' }: TierHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>
          Following {FAN_FOLLOWING.length} athletes ·{' '}
          {FAN_PROFILE.superfanPoints.toLocaleString()} pts
        </Text>
      </View>
      <View style={styles.tierPill}>
        <Ionicons name="diamond" size={11} color={FAN_ACCENT} />
        <Text style={styles.tierPillText}>
          {FAN_PROFILE.superfanTier.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: FAN_ACCENT_SOFT,
    borderWidth: 1,
    borderColor: FAN_ACCENT_BORDER,
  },
  tierPillText: {
    fontSize: 10.5,
    color: FAN_ACCENT,
    letterSpacing: 0.8,
    fontWeight: '800',
  },
});
