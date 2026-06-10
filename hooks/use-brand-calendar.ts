// ── BRAND CALENDAR HOOK (Sprint 2.6) ─────────────────────
// React-Query wrapper around `brandCalendarApi.getBrandCalendar`
// (PLAN.md §2.6 — Mrs. Wilson W34/W35). 5-min stale per spec.
//
// The packet is auto-derived from existing campaigns + per-deal
// commitments + open-deal deadlines, so the hook stays parameterless
// beyond `brandId`. Pass a falsy id to keep the query disabled.

import { useQuery } from '@tanstack/react-query';

import { brandCalendarApi } from '@/lib/api/brand-calendar';
import type { BrandCalendarPacket } from '@/lib/types/brand-calendar.types';

export const BRAND_CALENDAR_KEY = 'brand-calendar';

export interface UseBrandCalendarResult {
  data: BrandCalendarPacket | null | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
}

export function useBrandCalendar(
  brandId: string | null | undefined,
): UseBrandCalendarResult {
  const query = useQuery<BrandCalendarPacket | null>({
    queryKey: [BRAND_CALENDAR_KEY, brandId],
    queryFn: () => brandCalendarApi.getBrandCalendar(brandId ?? ''),
    enabled: Boolean(brandId),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: (query.error as Error | null) ?? null,
  };
}
