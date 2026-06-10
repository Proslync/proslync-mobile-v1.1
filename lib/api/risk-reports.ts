// ── AD AUDIT-DEFENSE RISK REPORT API ─────────────────────
// Sprint 3.10 mock-first façade. Returns a hand-authored synthetic
// `RiskReport` per `schoolId`. Real backend swap will land once the
// AD rev-share / compliance objects ship in §3.1–3.4.

import { getMockRiskReport } from '@/lib/data/mock-risk-report';
import type { RiskReport } from '@/lib/types/risk-report.types';

export const riskReportsApi = {
  /**
   * Returns the AD audit-defense `RiskReport` for a school, or null
   * when no fixture exists for that id (UI renders empty state).
   */
  async getSchoolRiskReport(schoolId: string): Promise<RiskReport | null> {
    if (!schoolId) return null;
    return getMockRiskReport(schoolId);
  },
};
