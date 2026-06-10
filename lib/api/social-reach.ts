// ── ATHLETE SOCIAL REACH API ─────────────────────────────
// W25 (PLAN.md §5 P1) — mock-first façade for cross-platform follower
// counts surfaced on the athlete bio. Mirrors the shape of
// `nilCompsApi.getDealComparables` and `athletePayoutsApi.getAthletePayouts`
// so a future backend swap (likely a `/api/athletes/:id/social-reach`
// endpoint that fans out to platform OAuth handles) drops in without
// changing the consumer hook.

import { getMockAthleteSocialReach } from '@/lib/data/mock-social-reach';
import type { AthleteSocialReach } from '@/lib/types/social-reach.types';

export const socialReachApi = {
  /**
   * Returns the cross-platform social reach packet for an athlete, or
   * `null` when no fixture / record exists (UI renders an empty state).
   */
  async getAthleteSocialReach(
    athleteId: string,
  ): Promise<AthleteSocialReach | null> {
    if (!athleteId) return null;
    return getMockAthleteSocialReach(athleteId);
  },
};
