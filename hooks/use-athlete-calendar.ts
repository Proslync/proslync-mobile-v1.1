// ── ATHLETE CALENDAR HOOK ────────────────────────────────
// React-Query wrapper around `buildAthleteCalendar` (Mrs. Wilson
// W28 + W29, PLAN.md §5 P1). Composes the existing brand-deal
// detail fixtures + `useAthleteDisclosures` so every calendar
// row keeps its source-of-record discipline.
//
// 5-min stale (per spec). The underlying fixtures are static for
// now; the staleTime keeps render churn quiet when the user
// flips between the home dashboard and the full calendar route.

import { useQuery } from '@tanstack/react-query';

import { useAthleteDisclosures } from '@/hooks/use-disclosures';
import {
  BRAND_DEALS,
  BRAND_DEAL_DETAILS,
  type BrandDealDetail,
} from '@/lib/data/mock-brand-data';
import type { AthleteCalendar } from '@/lib/types/athlete-calendar.types';
import type { ComplianceDisclosure } from '@/lib/types/compliance-disclosure.types';
import {
  buildAthleteCalendar,
  type CalendarGameInput,
} from '@/lib/utils/athlete-calendar-builder';

export const ATHLETE_CALENDAR_KEY = 'athlete-calendar';

// Demo mapping. Once the real session athlete id is wired, this
// table goes away — the hook will receive the canonical name from
// the actor context. Kept tiny so it's obvious which fixtures back
// the demo (a-1 → Kiyan Anthony per `mock-disclosures.ts`).
const ATHLETE_DISPLAY_NAME: Record<string, string> = {
  'a-1': 'Kiyan Anthony',
};

function dealsForAthlete(athleteId: string): BrandDealDetail[] {
  const display = ATHLETE_DISPLAY_NAME[athleteId];
  // BRAND_DEAL_DETAILS isn't ported yet (Phase 2 stub ships only the
  // lightweight BRAND_DEALS pipeline rows) — bail before indexing undefined.
  if (!display || !BRAND_DEAL_DETAILS) return [];
  return BRAND_DEALS.filter((d) => d.athlete.startsWith(display))
    .map((d) => BRAND_DEAL_DETAILS[d.id])
    .filter((d): d is BrandDealDetail => Boolean(d));
}

export interface UseAthleteCalendarOptions {
  /** Optional roster game schedule. Defaults to none. */
  games?: CalendarGameInput[];
  /** Override `now` for tests / storyboards. */
  now?: Date;
}

export interface UseAthleteCalendarResult {
  data: AthleteCalendar | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
}

/**
 * Composes the calendar from the existing brand-deal + disclosure
 * fixtures. The query key includes the upstream `dataUpdatedAt`
 * stamps so the calendar re-derives whenever its inputs refresh.
 */
export function useAthleteCalendar(
  athleteId: string | null | undefined,
  options: UseAthleteCalendarOptions = {},
): UseAthleteCalendarResult {
  const disclosuresQuery = useAthleteDisclosures(athleteId);
  const disclosures: ComplianceDisclosure[] = disclosuresQuery.data ?? [];
  const deals = athleteId ? dealsForAthlete(athleteId) : [];

  const query = useQuery<AthleteCalendar>({
    queryKey: [
      ATHLETE_CALENDAR_KEY,
      athleteId,
      disclosuresQuery.dataUpdatedAt,
      // games array length used as a cheap signature — the hook
      // caller is expected to memoize the array reference.
      options.games?.length ?? 0,
    ],
    queryFn: () =>
      buildAthleteCalendar(
        athleteId ?? '',
        deals,
        disclosures,
        options.games,
        { now: options.now },
      ),
    enabled: Boolean(athleteId),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading || disclosuresQuery.isLoading,
    isFetching: query.isFetching || disclosuresQuery.isFetching,
    error: (query.error as Error | null) ?? null,
  };
}
