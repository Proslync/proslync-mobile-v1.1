// ── ATHLETE COMMITMENT CALENDAR TYPES ────────────────────
// Mrs. Wilson W28 + W29 (PLAN.md §5 P1): the athlete needs ONE
// auto-populated commitment calendar that aggregates every "thing
// I owe somebody on a date" across NIL deal commitments, school
// disclosure deadlines, and the roster game schedule. No manual
// entry — every item is *derived* from an existing record so the
// athlete never has to retype a brand commitment they already
// agreed to in a deal packet.
//
// Source-ref discipline: every `CalendarItem` carries the exact
// `ComparableDealSourceRef` shape used by comparable-deal evidence,
// risk reports, and disclosure packets. The reviewer can always
// audit *where* a calendar entry came from, what its freshness is,
// and whether it's `synthetic` (demo-only) or sourced from a real
// downstream record.
//
// Schema attribution: original to Proslync. Naming mirrors
// `ComparableDeal*` and `ComplianceDisclosure*` for cross-screen
// readability.

import type { ComparableDealSourceRef } from './comparable-deal.types';

/** What kind of obligation / event a calendar row represents. */
export type CalendarItemKind =
  | 'deal-commitment'      // brand-deal commitment with a due window
  | 'disclosure-deadline'  // school / NIL Go disclosure attestation due
  | 'game'                 // roster game from the team schedule
  | 'workout'              // strength / film / practice block
  | 'media';               // media day, press, content shoot

/**
 * Athlete-side priority — separate from `status` because `status`
 * is calendar-time and `priority` is "how much should the athlete
 * care if they slip this row".
 */
export type CalendarItemPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Lifecycle of a single calendar row. The builder computes this
 * by comparing the row's `date` to "today" so the UI only renders
 * what's true at view time.
 */
export type CalendarItemStatus = 'upcoming' | 'today' | 'overdue' | 'done';

/** One row on the athlete calendar. */
export interface CalendarItem {
  id: string;
  athleteId: string;
  kind: CalendarItemKind;
  title: string;
  subtitle?: string;
  /** ISO 8601 datetime — the thing is owed *by* this moment. */
  date: string;
  /** Block duration (workouts, games, shoots) — undefined for tasks. */
  durationMin?: number;
  /**
   * Where this row came from. Reuses the `ComparableDealSourceRef`
   * shape so the reviewer can audit freshness + caveat the same
   * way they do across the comparable-deal evidence packet.
   */
  sourceRef: ComparableDealSourceRef;
  priority: CalendarItemPriority;
  status: CalendarItemStatus;
  /** Optional in-app deep link (e.g. `/athlete/disclosures/dr-001`). */
  deepLink?: string;
}

/** Aggregated calendar payload for one athlete over a date window. */
export interface AthleteCalendar {
  athleteId: string;
  period: {
    /** ISO 8601 — inclusive lower bound. */
    startDate: string;
    /** ISO 8601 — inclusive upper bound. */
    endDate: string;
  };
  items: CalendarItem[];
  counts: Record<CalendarItemStatus, number>;
  updatedAt: string;
}
