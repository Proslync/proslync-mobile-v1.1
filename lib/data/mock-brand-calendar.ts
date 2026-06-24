// ── MOCK BRAND CALENDAR + CHECKLIST FIXTURE ──────────────
// Sprint 2.6 (PLAN.md §2.6 — Brand calendar + checklist W34/W35).
//
// Hand-authored packet for the Nike Hoops brand (`brand-puma-hoops`)
// spanning the next 21 days from the demo "now" (2026-05-10). Every
// row references an existing fixture id (campaign / deal / open-deal)
// so the source-ref discipline keeps end-to-end traceability:
//
//   - calendar items reference `BRAND_CAMPAIGNS` (`c-…`),
//     `BRAND_DEALS` (`d-…`), and `MOCK_OPEN_DEALS` (`od-…`)
//   - checklist rows reference per-deal `commitments[].id` strings
//     produced by `buildCommitments` in `mock-brand-data.ts`
//
// All `sourceRef.kind = 'synthetic'` per the precedent in
// `mock-deal-comps.ts` / `mock-open-deals.ts` — these are demo
// fixtures, not real disclosed commitments. Once the brand backend
// slice lands the packet will be derived from real records and these
// hand-authored rows fall away.

import type {
  BrandCalendarItem,
  BrandCalendarPacket,
  BrandChecklistRow,
} from '@/lib/types/brand-calendar.types';
import type { ComparableDealSourceRef } from '@/lib/types/comparable-deal.types';

export const BRAND_CALENDAR_BRAND_ID = 'brand-puma-hoops';

const NOW_ISO = '2026-05-10T09:00:00.000Z';
const PERIOD_START = '2026-05-10T00:00:00.000Z';
const PERIOD_END = '2026-05-31T23:59:59.000Z';

const SYNTHETIC_CAVEAT =
  'Synthetic fixture for the Proslync demo. Replace with reviewer-approved record before publishing.';

/** Build a synthetic source ref pointing back at an upstream fixture id. */
function syntheticRef(
  refId: string,
  label: string,
  freshnessDays: number,
): ComparableDealSourceRef {
  return {
    id: refId,
    label,
    kind: 'synthetic',
    retrievedAt: NOW_ISO,
    freshnessDays,
    caveat: SYNTHETIC_CAVEAT,
  };
}

/** Helper: ISO date `n` days from `NOW_ISO` at the given hour (UTC). */
function dayOffset(days: number, hourUtc = 17): string {
  const base = new Date(Date.parse(NOW_ISO));
  base.setUTCDate(base.getUTCDate() + days);
  base.setUTCHours(hourUtc, 0, 0, 0);
  return base.toISOString();
}

const CALENDAR_ITEMS: BrandCalendarItem[] = [
  // ── TODAY (day 0) ───────────────────────────────────────
  {
    id: 'bcal-001',
    brandId: BRAND_CALENDAR_BRAND_ID,
    kind: 'review-checkpoint',
    title: 'AI compliance review · Dylan Harper deal',
    subtitle: 'Negotiation track — NCAA + school + ethics sign-off',
    date: dayOffset(0, 16),
    ownerLabel: 'Tosan E. · brand owner',
    status: 'today',
    priority: 'urgent',
    sourceRef: syntheticRef(
      'd-1',
      'Brand deal d-1 · negotiation review',
      0,
    ),
    deepLink: '/deal/d-1?role=brand',
  },
  // ── DAY 2 ───────────────────────────────────────────────
  {
    id: 'bcal-002',
    brandId: BRAND_CALENDAR_BRAND_ID,
    kind: 'deal-commitment',
    title: 'Kiyan Anthony · two disclosed launch reels',
    subtitle: 'In-flight commitment for live deal d-4',
    date: dayOffset(2, 18),
    ownerLabel: 'Athlete + creative producer',
    status: 'upcoming',
    priority: 'high',
    sourceRef: syntheticRef(
      'd-4-commit-launch-reels',
      'Brand deal d-4 · commitment',
      0,
    ),
    deepLink: '/deal/d-4?role=brand',
  },
  // ── DAY 4 ───────────────────────────────────────────────
  {
    id: 'bcal-003',
    brandId: BRAND_CALENDAR_BRAND_ID,
    kind: 'campaign-launch',
    title: 'Future Unleashed · creator flight kickoff',
    subtitle: 'Campaign camp-future-unleashed enters launch phase',
    date: dayOffset(4, 14),
    ownerLabel: 'Brand creative pod · Boston',
    status: 'upcoming',
    priority: 'high',
    sourceRef: syntheticRef(
      'camp-future-unleashed',
      'Marketplace campaign · Future Unleashed',
      1,
    ),
  },
  // ── DAY 5 ───────────────────────────────────────────────
  {
    id: 'bcal-004',
    brandId: BRAND_CALENDAR_BRAND_ID,
    kind: 'deal-commitment',
    title: 'Usage-rights approval window · Ace Bailey deal',
    subtitle: 'Before any paid boost',
    date: dayOffset(5, 17),
    ownerLabel: 'Nike legal + athlete rep',
    status: 'upcoming',
    priority: 'normal',
    sourceRef: syntheticRef(
      'd-2-commit-rights',
      'Brand deal d-2 · commitment',
      0,
    ),
    deepLink: '/deal/d-2?role=brand',
  },
  // ── DAY 7 ───────────────────────────────────────────────
  {
    id: 'bcal-005',
    brandId: BRAND_CALENDAR_BRAND_ID,
    kind: 'open-deal-deadline',
    title: 'Signature Capsule · applications close',
    subtitle: 'Open deal od-1 — 6 applicants ready for review',
    date: dayOffset(7, 23),
    ownerLabel: 'Tosan E. · brand owner',
    status: 'upcoming',
    priority: 'high',
    sourceRef: syntheticRef(
      'od-1',
      'Open deal od-1 · application window',
      0,
    ),
    deepLink: '/brand/open-deals/od-1',
  },
  // ── DAY 10 ──────────────────────────────────────────────
  {
    id: 'bcal-006',
    brandId: BRAND_CALENDAR_BRAND_ID,
    kind: 'review-checkpoint',
    title: 'School disclosure pre-check · Naithan George deal',
    subtitle: 'Draft deal d-3 needs school NIL desk receipt',
    date: dayOffset(10, 18),
    ownerLabel: 'School NIL manager',
    status: 'upcoming',
    priority: 'normal',
    sourceRef: syntheticRef(
      'd-3-commit-school-precheck',
      'Brand deal d-3 · commitment',
      0,
    ),
    deepLink: '/deal/d-3?role=brand',
  },
  // ── DAY 14 ──────────────────────────────────────────────
  {
    id: 'bcal-007',
    brandId: BRAND_CALENDAR_BRAND_ID,
    kind: 'campaign-launch',
    title: 'Jordan Miles · Signature Capsule kickoff',
    subtitle: 'Campaign c-3 enters live phase',
    date: dayOffset(14, 14),
    ownerLabel: 'Maya L. · brand owner',
    status: 'upcoming',
    priority: 'normal',
    sourceRef: syntheticRef(
      'c-3',
      'Brand campaign c-3 · upcoming',
      2,
    ),
  },
  // ── DAY 18 ──────────────────────────────────────────────
  {
    id: 'bcal-008',
    brandId: BRAND_CALENDAR_BRAND_ID,
    kind: 'renewal-window',
    title: 'Cooper Flagg · renewal signature window',
    subtitle: 'Renewal d-6 · 2 yrs · exclusive + signature line',
    date: dayOffset(18, 20),
    ownerLabel: 'Tosan E. + Reed Smith NIL',
    status: 'upcoming',
    priority: 'urgent',
    sourceRef: syntheticRef(
      'd-6',
      'Brand deal d-6 · renewal window',
      0,
    ),
    deepLink: '/deal/d-6?role=brand',
  },
];

const CHECKLIST_ROWS: BrandChecklistRow[] = [
  {
    id: 'bchk-001',
    brandId: BRAND_CALENDAR_BRAND_ID,
    commitmentRef: { dealId: 'd-4', commitmentId: 'd-4-commit-launch-reels' },
    title: 'Kiyan Anthony · two disclosed launch reels',
    due: dayOffset(2, 18),
    status: 'active',
    assigneeLabel: 'Athlete + creative producer',
    sourceRef: syntheticRef(
      'd-4-commit-launch-reels',
      'Brand deal d-4 · commitment',
      0,
    ),
  },
  {
    id: 'bchk-002',
    brandId: BRAND_CALENDAR_BRAND_ID,
    commitmentRef: { dealId: 'd-1', commitmentId: 'd-1-commit-launch-reels' },
    title: 'Dylan Harper · two disclosed launch reels',
    due: dayOffset(8, 18),
    status: 'queued',
    assigneeLabel: 'Athlete + creative producer',
    sourceRef: syntheticRef(
      'd-1-commit-launch-reels',
      'Brand deal d-1 · commitment',
      0,
    ),
  },
  {
    id: 'bchk-003',
    brandId: BRAND_CALENDAR_BRAND_ID,
    commitmentRef: { dealId: 'd-3', commitmentId: 'd-3-commit-school-precheck' },
    title: 'School disclosure pre-check · Naithan George',
    due: dayOffset(10, 18),
    status: 'queued',
    assigneeLabel: 'School NIL manager',
    sourceRef: syntheticRef(
      'd-3-commit-school-precheck',
      'Brand deal d-3 · commitment',
      0,
    ),
  },
  {
    id: 'bchk-004',
    brandId: BRAND_CALENDAR_BRAND_ID,
    commitmentRef: { dealId: 'd-2', commitmentId: 'd-2-commit-rights' },
    title: 'Usage-rights approval window · Ace Bailey',
    due: dayOffset(5, 17),
    status: 'active',
    assigneeLabel: 'Nike legal + athlete rep',
    sourceRef: syntheticRef(
      'd-2-commit-rights',
      'Brand deal d-2 · commitment',
      0,
    ),
  },
  {
    id: 'bchk-005',
    brandId: BRAND_CALENDAR_BRAND_ID,
    commitmentRef: { dealId: 'd-6', commitmentId: 'd-6-commit-rights' },
    title: 'Cooper Flagg · usage-rights approval (renewal)',
    due: dayOffset(15, 17),
    status: 'queued',
    assigneeLabel: 'Nike legal + athlete rep',
    sourceRef: syntheticRef(
      'd-6-commit-rights',
      'Brand deal d-6 · commitment',
      0,
    ),
  },
  {
    id: 'bchk-006',
    brandId: BRAND_CALENDAR_BRAND_ID,
    commitmentRef: { dealId: 'd-5', commitmentId: 'd-5-commit-school-precheck' },
    title: 'School disclosure pre-check · Jordan Miles',
    due: dayOffset(-2, 17),
    status: 'blocked',
    assigneeLabel: 'School NIL manager',
    sourceRef: syntheticRef(
      'd-5-commit-school-precheck',
      'Brand deal d-5 · commitment',
      2,
    ),
  },
];

/** Compute the counts block from the in-fixture rows. */
function computeCounts(
  calendar: BrandCalendarItem[],
  checklist: BrandChecklistRow[],
  nowIso: string,
): BrandCalendarPacket['counts'] {
  const now = Date.parse(nowIso);
  const day = 24 * 60 * 60 * 1000;
  const startOfToday = new Date(now);
  startOfToday.setUTCHours(0, 0, 0, 0);
  const startOfTomorrow = startOfToday.getTime() + day;
  const endOfWeek = startOfToday.getTime() + 7 * day;

  let calendarToday = 0;
  let calendarUpcoming = 0;
  for (const item of calendar) {
    const t = Date.parse(item.date);
    if (Number.isNaN(t)) continue;
    if (t >= startOfToday.getTime() && t < startOfTomorrow) {
      calendarToday += 1;
    } else if (t >= startOfTomorrow && t < endOfWeek) {
      calendarUpcoming += 1;
    }
  }

  let checklistOpen = 0;
  let checklistOverdue = 0;
  for (const row of checklist) {
    if (row.status === 'queued' || row.status === 'active') {
      checklistOpen += 1;
    }
    const due = Date.parse(row.due);
    if (
      !Number.isNaN(due) &&
      due < now &&
      row.status !== 'done'
    ) {
      checklistOverdue += 1;
    }
  }

  return { calendarToday, calendarUpcoming, checklistOpen, checklistOverdue };
}

export const MOCK_BRAND_CALENDAR_PACKET: BrandCalendarPacket = {
  brandId: BRAND_CALENDAR_BRAND_ID,
  period: { startDate: PERIOD_START, endDate: PERIOD_END },
  calendar: CALENDAR_ITEMS,
  checklist: CHECKLIST_ROWS,
  counts: computeCounts(CALENDAR_ITEMS, CHECKLIST_ROWS, NOW_ISO),
  updatedAt: NOW_ISO,
};

/** Returns the demo packet for a given brand id, or `null` if unknown. */
export function getMockBrandCalendar(
  brandId: string,
): BrandCalendarPacket | null {
  if (brandId === BRAND_CALENDAR_BRAND_ID) {
    return MOCK_BRAND_CALENDAR_PACKET;
  }
  return null;
}
