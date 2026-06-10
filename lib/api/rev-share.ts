// ── AD REVENUE-SHARE LEDGER API ──────────────────────────
// Sprint 3.1 mock-first façade. Returns a hand-authored synthetic
// `RevShareLedger` per `schoolId` (optionally scoped to a `periodId`).
// Real backend swap will land alongside the Sprint-3.2 AD dashboard.

import { getMockRevShareLedger } from '@/lib/data/mock-rev-share';
import type { RevShareLedger } from '@/lib/types/rev-share.types';

export const revShareApi = {
  /**
   * Returns the AD platform-fee `RevShareLedger` for a school, or
   * `null` when no fixture exists for that id (UI renders empty state).
   *
   * `periodId` is reserved for the multi-period swap — the mock fixture
   * currently exposes a single period per school.
   */
  async getSchoolLedger(
    schoolId: string,
    periodId?: string,
  ): Promise<RevShareLedger | null> {
    if (!schoolId) return null;
    return getMockRevShareLedger(schoolId, periodId);
  },
};
