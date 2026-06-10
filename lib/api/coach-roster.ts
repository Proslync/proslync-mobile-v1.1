// ── COACH ROSTER API ─────────────────────────────────────
// Sprint 4 — coach NIL Watch surface. Mock-first façade that
// resolves a coach's roster (athlete ids + light NIL rollups)
// from `lib/data/mock-coach-roster.ts`. Real-backend swap will
// land alongside the school-roster sync slice.

import {
  getMockCoachRoster,
  type CoachRoster,
} from '@/lib/data/mock-coach-roster';

export const coachRosterApi = {
  /** Fetch the coach's roster, or `null` if the coach id is unknown. */
  async getCoachRoster(coachId: string): Promise<CoachRoster | null> {
    if (!coachId) return null;
    return getMockCoachRoster(coachId);
  },
};
