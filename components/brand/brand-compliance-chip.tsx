// ── BRAND COMPLIANCE CHIP (Sprint 2.8 / W37) ──────────────
// Small dot-and-label indicator rendered on each athlete row of the
// brand-dashboard roster. Sources its state from
// `summarizeAthleteCompliance(athleteId)` (which reads `MOCK_DISCLOSURES`
// and `NIL_MANAGER_ATHLETES`). Visual-only — pressing logs the rolled-up
// counts for now; a tooltip / drawer can replace the press handler later
// without changing the surface.

import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { StatusPill, TONE_COLOR, type Tone } from '@/components/shared/ui-kit';
import {
  summarizeAthleteCompliance,
  type BrandAthleteComplianceStatus,
} from '@/lib/utils/brand-athlete-compliance';

export interface BrandComplianceChipProps {
  athleteId: string;
  size?: 'sm' | 'md';
}

interface StatusViz {
  label: string;
  tone: Tone;
}

const STATUS_VIZ: Record<BrandAthleteComplianceStatus, StatusViz> = {
  cleared: { label: 'CLEARED', tone: 'success' },
  review: { label: 'REVIEW', tone: 'warning' },
  flagged: { label: 'FLAGGED', tone: 'danger' },
  unknown: { label: 'UNKNOWN', tone: 'muted' },
};

export function BrandComplianceChip({
  athleteId,
  size = 'sm',
}: BrandComplianceChipProps) {
  const summary = React.useMemo(
    () => summarizeAthleteCompliance(athleteId),
    [athleteId],
  );
  const viz = STATUS_VIZ[summary.status];
  const dotColor = TONE_COLOR[viz.tone];

  const handlePress = React.useCallback(() => {
    // Tooltip / drawer replaces this in a follow-up slice.
    console.log('[BrandComplianceChip]', athleteId, summary);
  }, [athleteId, summary]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Compliance status for athlete ${athleteId}: ${viz.label}`}
      style={styles.row}
      hitSlop={6}
    >
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <StatusPill label={viz.label} tone={viz.tone} size={size} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
