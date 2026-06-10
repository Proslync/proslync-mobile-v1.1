// ── AD AUDIT-DEFENSE RISK REPORT HOOK ────────────────────
// Sprint 3.10 React-Query hook. 2-min stale, 10-min gc — matches the
// analytics + comparable-deal + open-deal cadence elsewhere.

import { useQuery } from '@tanstack/react-query';

import { riskReportsApi } from '@/lib/api/risk-reports';

export const RISK_REPORT_KEY = 'risk-report';

export function useRiskReport(schoolId: string | null | undefined) {
  return useQuery({
    queryKey: [RISK_REPORT_KEY, schoolId],
    queryFn: () => riskReportsApi.getSchoolRiskReport(schoolId ?? ''),
    enabled: Boolean(schoolId),
    staleTime: 120_000,
    gcTime: 600_000,
  });
}
