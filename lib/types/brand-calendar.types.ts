// ── BRAND CALENDAR + CHECKLIST TYPES ─────────────────────
// Sprint 2.6 (PLAN.md §2.6, Mrs. Wilson asks W34 + W35): the brand
// dashboard needs ONE auto-populated calendar that aggregates every
// upcoming brand-side obligation — campaign launches, deal-level
// commitments, open-deal application deadlines, renewal windows, and
// scheduled review checkpoints — and a parallel checklist that pulls
// the per-deal `commitments` rows so the brand never has to retype
// what's already inside an existing deal packet.
//
// Mirrors `athlete-calendar.types.ts` (Sprint 2.4 W28/W29) so the
// brand surface stays cross-readable with the athlete surface. Source
// discipline is identical: every row carries a `ComparableDealSourceRef`
// so reviewers can audit *where* a calendar row was derived from and
// whether it's `synthetic` (demo only) vs. backed by a real downstream
// record.
//
// Schema attribution: original to Proslync. Naming mirrors
// `CalendarItem*` and `ComparableDeal*` for cross-screen readability.

import type { ComparableDealSourceRef } from './comparable-deal.types';

/** What kind of brand-side obligation / event a calendar row represents. */
export type BrandCalendarItemKind =
  | 'campaign-launch'        // a marketplace campaign goes live / launches a phase
  | 'deal-commitment'        // a per-deal commitment with a due window
  | 'open-deal-deadline'     // an open-deal posting closes for applications
  | 'renewal-window'         // a signed deal enters its renewal review window
  | 'review-checkpoint';     // an internal compliance / brand-side review beat

/**
 * Brand-side priority — separate from `status` because `status` is
 * calendar-time and `priority` is "how much should the brand care if
 * this row slips".
 */
export type BrandCalendarItemPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Lifecycle of a single calendar row. Computed by comparing the row's
 * `date` to "today" so the UI only renders what's true at view time.
 */
export type BrandCalendarItemStatus =
  | 'upcoming'
  | 'today'
  | 'overdue'
  | 'done';

/** Lifecycle of a single checklist row (parallel to commitment status). */
export type BrandChecklistRowStatus =
  | 'queued'
  | 'active'
  | 'done'
  | 'blocked';

/** One row on the brand calendar. */
export interface BrandCalendarItem {
  id: string;
  brandId: string;
  kind: BrandCalendarItemKind;
  title: string;
  subtitle?: string;
  /** ISO 8601 datetime — the thing is owed *by* this moment. */
  date: string;
  /**
   * Display label for who owns the row (e.g. "Tosan E. · brand owner",
   * "Maya L. + athlete rep", "Nike legal"). Free-form because the
   * underlying records vary in shape — campaigns name a brand pod,
   * commitments name a role pair.
   */
  ownerLabel: string;
  status: BrandCalendarItemStatus;
  priority: BrandCalendarItemPriority;
  /**
   * Where this row came from. Reuses the `ComparableDealSourceRef`
   * shape so the reviewer can audit freshness + caveat the same way
   * they do across the comparable-deal evidence packet.
   */
  sourceRef: ComparableDealSourceRef;
  /** Optional in-app deep link (e.g. `/brand/open-deals/od-1`). */
  deepLink?: string;
}

/** One row on the brand checklist — derived from per-deal commitments. */
export interface BrandChecklistRow {
  id: string;
  brandId: string;
  /** Anchor reference back to the originating deal commitment. */
  commitmentRef: {
    dealId: string;
    commitmentId: string;
  };
  title: string;
  /** ISO 8601 datetime — the thing is owed *by* this moment. */
  due: string;
  status: BrandChecklistRowStatus;
  /** Display label for the assignee (free-form, mirrors commitment owner). */
  assigneeLabel: string;
  /** Source-of-record provenance — same shape as calendar items. */
  sourceRef: ComparableDealSourceRef;
}

/** Aggregated calendar payload for one brand over a date window. */
export interface BrandCalendarPacket {
  brandId: string;
  period: {
    /** ISO 8601 — inclusive lower bound. */
    startDate: string;
    /** ISO 8601 — inclusive upper bound. */
    endDate: string;
  };
  calendar: BrandCalendarItem[];
  checklist: BrandChecklistRow[];
  counts: {
    /** Calendar items dated today. */
    calendarToday: number;
    /** Calendar items in the next 7 days (excl. today). */
    calendarUpcoming: number;
    /** Checklist rows in `queued` or `active`. */
    checklistOpen: number;
    /** Checklist rows past `due` and not `done`. */
    checklistOverdue: number;
  };
  /** ISO 8601 — when the packet was last (re)derived. */
  updatedAt: string;
}
