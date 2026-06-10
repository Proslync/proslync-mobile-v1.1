// ── AD HOME RISK REPORT SUMMARY TILE ─────────────────────
// Sprint 3.10 surfacing companion to `rev-share-summary-tile.tsx`.
// Compact rollup of the AD audit-defense risk report — overall
// severity + worst-category headline + tap-through to the full
// `/school/risk-report` screen. Renders inside the AD Home cockpit
// (the school role's `RoleDashboard`).
//
// PLAN anchor: §4 step 2 — AD Home cockpit must surface "one
// risk-report rollup tile" so the AD walk completes without
// digging into the Compliance sub-tab.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  severityColor,
  severityLabel,
} from '@/components/school/risk-report-card';
import {
  CARD_BG,
  CARD_BORDER,
  RADIUS_MD,
  StatusPill,
  TONE_COLOR,
} from '@/components/shared/ui-kit';
import { useRiskReport } from '@/hooks/use-risk-report';
import type { RiskSeverity } from '@/lib/types/risk-report.types';

const ACCENT = TONE_COLOR.accent;

// Pick the worst category to surface as the row-level headline.
const SEVERITY_RANK: Record<RiskSeverity, number> = {
  clear: 0,
  watch: 1,
  flagged: 2,
  critical: 3,
};

export interface RiskReportSummaryTileProps {
  schoolId?: string;
}

export function RiskReportSummaryTile({
  schoolId = 'school:syracuse',
}: RiskReportSummaryTileProps) {
  const router = useRouter();
  const { data: report } = useRiskReport(schoolId);

  const handlePress = React.useCallback(() => {
    router.push('/school/risk-report');
  }, [router]);

  if (!report) return null;

  const worstCategory = [...report.categories].sort(
    (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity],
  )[0];

  const overallColor = severityColor(report.overallSeverity);
  const overallLabel = severityLabel(report.overallSeverity);
  const flaggedCount = report.categories.filter(
    (c) => SEVERITY_RANK[c.severity] >= SEVERITY_RANK.flagged,
  ).length;

  return (
    <Pressable
      style={styles.tile}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Open AD audit-defense risk report"
    >
      <View style={styles.head}>
        <View style={styles.iconBubble}>
          <Ionicons name="shield-checkmark" size={13} color={ACCENT} />
        </View>
        <Text style={styles.eyebrow}>AUDIT-DEFENSE</Text>
        <Ionicons
          name="chevron-forward"
          size={14}
          color="rgba(255,255,255,0.45)"
        />
      </View>

      <Text style={[styles.severityNumber, { color: overallColor }]}>
        {overallLabel}
      </Text>
      <Text style={styles.sub} numberOfLines={2}>
        {worstCategory ? worstCategory.summary : 'No findings yet.'}
      </Text>

      <View style={styles.pillRow}>
        <StatusPill
          label={`${flaggedCount} flagged · ${report.categories.length} categories`}
          tone={flaggedCount > 0 ? 'warning' : 'success'}
          icon="layers-outline"
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    gap: 6,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBubble: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,111,60,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,111,60,0.30)',
  },
  eyebrow: {
    flex: 1,
    color: 'rgba(255,255,255,0.62)',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  severityNumber: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  sub: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 11,
    lineHeight: 15,
  },
  pillRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
});
