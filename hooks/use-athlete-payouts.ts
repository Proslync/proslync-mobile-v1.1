// ── ATHLETE PAYOUT HOOK ──────────────────────────────────
// W31 (PLAN §5 P1) — React-Query hook backing the athlete wallet card
// and the full `app/athlete/payouts` route. 5-min stale, 10-min gc —
// matches the rev-share ledger cadence (settlements are batched, not
// per-tick).

import { useQuery } from '@tanstack/react-query';

import { athletePayoutsApi } from '@/lib/api/athlete-payouts';

export const ATHLETE_PAYOUTS_KEY = 'athlete-payouts';

export function useAthletePayouts(
  athleteId: string | null | undefined,
  periodId?: string,
) {
  return useQuery({
    queryKey: [ATHLETE_PAYOUTS_KEY, athleteId, periodId ?? null],
    queryFn: () => athletePayoutsApi.getAthletePayouts(athleteId ?? '', periodId),
    enabled: Boolean(athleteId),
    staleTime: 300_000,
    gcTime: 600_000,
  });
}
