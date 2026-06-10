// Athlete Stats section — extracted from athlete-view.tsx for the R5 remix.
// The AthleteSocialReachCard moves to AthleteHome (Overview tab); keep this
// surface focused on performance analytics.
import * as React from 'react';
import { View } from 'react-native';

import { AthleteCalendarCta } from '@/components/athlete/athlete-calendar-card';
import {
  GameLogAnalytics,
  PeerCompareAnalytics,
  PlayerStatsAnalytics,
} from '@/components/athlete/athlete-stats-analytics';

export function AthleteStatsSection() {
  return (
    <View style={{ gap: 16 }}>
      {/* W28 + W29 (PLAN.md §5 P1) — auto-populated commitment calendar CTA;
          full view at `/athlete/calendar`. */}
      <AthleteCalendarCta athleteId="a-1" />
      <PlayerStatsAnalytics />
      <GameLogAnalytics />
      <PeerCompareAnalytics />
    </View>
  );
}
