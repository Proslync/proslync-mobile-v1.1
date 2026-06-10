// ── ATHLETE PAYOUT API ───────────────────────────────────
// W31 (PLAN §5 P1) — mock-first façade. Returns a hand-authored
// `AthletePayoutSummary` for a given athleteId (optionally scoped to a
// `periodId`). Real backend swap will land alongside the disbursement
// service.

import { getMockAthletePayoutSummary } from '@/lib/data/mock-athlete-payouts';
import type { AthletePayoutSummary } from '@/lib/types/athlete-payout.types';

export const athletePayoutsApi = {
  /**
   * Returns the payout summary for an athlete, or `null` when no
   * fixture exists for that id (UI renders an empty state).
   *
   * `periodId` is reserved for the multi-period swap — the mock
   * fixture currently exposes a single period per athlete.
   */
  async getAthletePayouts(
    athleteId: string,
    periodId?: string,
  ): Promise<AthletePayoutSummary | null> {
    if (!athleteId) return null;
    return getMockAthletePayoutSummary(athleteId, periodId);
  },
};
