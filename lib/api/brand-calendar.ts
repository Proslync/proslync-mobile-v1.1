// ── BRAND CALENDAR API (Sprint 2.6) ──────────────────────
// Mock-first façade for the brand calendar + checklist packet
// (W34/W35). Real backend swap will land alongside the brand backend
// slice that persists per-deal commitments and campaign schedules.
// Until then, every call resolves from `lib/data/mock-brand-calendar.ts`.

import { getMockBrandCalendar } from '@/lib/data/mock-brand-calendar';
import type { BrandCalendarPacket } from '@/lib/types/brand-calendar.types';

export const brandCalendarApi = {
  /**
   * Fetch the auto-derived brand calendar packet for `brandId`. Returns
   * `null` for unknown brands rather than throwing — callers render an
   * empty-state surface in that case.
   */
  async getBrandCalendar(
    brandId: string,
  ): Promise<BrandCalendarPacket | null> {
    if (!brandId) return null;
    return getMockBrandCalendar(brandId);
  },
};
