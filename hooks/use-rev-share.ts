// ── AD REVENUE-SHARE LEDGER HOOK ─────────────────────────
// Sprint 3.1 React-Query hook. 5-min stale, 10-min gc — slightly longer
// than the risk-report cadence because the ledger settles less often.

import { useQuery } from '@tanstack/react-query';

import { revShareApi } from '@/lib/api/rev-share';

export const REV_SHARE_LEDGER_KEY = 'rev-share-ledger';

export function useSchoolRevShareLedger(
  schoolId: string | null | undefined,
  periodId?: string,
) {
  return useQuery({
    queryKey: [REV_SHARE_LEDGER_KEY, schoolId, periodId ?? null],
    queryFn: () => revShareApi.getSchoolLedger(schoolId ?? '', periodId),
    enabled: Boolean(schoolId),
    staleTime: 300_000,
    gcTime: 600_000,
  });
}
