// Athlete Stats section — extracted from athlete-view.tsx for the R5 remix.
// The AthleteSocialReachCard moves to AthleteHome (Overview tab); keep this
// surface focused on performance analytics.
//
// Truth strip mounted at top per spec §4 (default tab, compact always-visible).
import * as React from 'react';
import { View } from 'react-native';

import { AthleteCalendarCta } from '@/components/athlete/athlete-calendar-card';
import {
  GameLogAnalytics,
  PeerCompareAnalytics,
  PlayerStatsAnalytics,
} from '@/components/athlete/athlete-stats-analytics';
import { TruthStrip } from '@/components/athlete/truth-strip';

export function AthleteStatsSection() {
  return (
    <View style={{ gap: 16 }}>
      {/* Thin truth layer — NIL Go countdown + payment summary (spec §4) */}
      <TruthStrip />
      {/* W28 + W29 (PLAN.md §5 P1) — auto-populated commitment calendar CTA;
          full view at `/athlete/calendar`. */}
      <AthleteCalendarCta athleteId="a-1" />
      <PlayerStatsAnalytics />
      <GameLogAnalytics />
      <PeerCompareAnalytics />
    </View>
  );
}
