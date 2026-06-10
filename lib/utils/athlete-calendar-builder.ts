// ── ATHLETE COMMITMENT CALENDAR BUILDER ──────────────────
// Pure aggregator that turns brand-deal commitments + school
// disclosure deadlines + roster game schedule into the canonical
// `AthleteCalendar` shape consumed by `useAthleteCalendar` and
// `<AthleteCalendarCard />`.
//
// Mrs. Wilson W28 + W29 (PLAN.md §5 P1): the athlete should NOT
// be retyping anything they already agreed to in a deal packet
// or a disclosure form. Every calendar item points back at the
// upstream record via `sourceRef` (reusing the comparable-deal
// `ComparableDealSourceRef` shape), so a reviewer can audit
// origin + freshness without leaving the screen.
//
// Demo mix: builder synthesizes ~10 items spanning the next ~14
// days. Synthesized rows carry `kind: 'synthetic'` on their
// `sourceRef` and the UI must NOT promote them into an external
// attestation.

import type { ComplianceDisclosure } from '@/lib/types/compliance-disclosure.types';
import type { ComparableDealSourceRef } from '@/lib/types/comparable-deal.types';
import type {
  AthleteCalendar,
  CalendarItem,
  CalendarItemPriority,
  CalendarItemStatus,
} from '@/lib/types/athlete-calendar.types';
import type { BrandDealDetail } from '@/lib/data/mock-brand-data';

const DAY_MS = 24 * 60 * 60 * 1000;

const SYNTHETIC_CAVEAT =
  'Synthesized for the athlete-calendar demo — not an external attestation.';

function syntheticSource(
  id: string,
  label: string,
  freshnessDays: number,
  caveat = SYNTHETIC_CAVEAT,
): ComparableDealSourceRef {
  return {
    id,
    label,
    kind: 'synthetic',
    retrievedAt: new Date().toISOString(),
    freshnessDays,
    caveat,
  };
}

function statusFor(date: Date, now: Date): CalendarItemStatus {
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) return 'today';
  return date.getTime() < now.getTime() ? 'overdue' : 'upcoming';
}

function isoAtHour(base: Date, daysAhead: number, hour: number): string {
  const d = new Date(base.getTime() + daysAhead * DAY_MS);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

/** Roster-shaped game input (matches `ScheduleGame` in `athlete-view.tsx`). */
export interface CalendarGameInput {
  id: string;
  /** ISO 8601 datetime. */
  date: string;
  opponent: string;
  home: boolean;
  venue: string;
}

export interface BuildAthleteCalendarOptions {
  /** Override for "now" — useful in tests. Defaults to `new Date()`. */
  now?: Date;
  /** Lookahead window in days. Defaults to 14. */
  windowDays?: number;
}

/**
 * Aggregate every athlete-owed obligation into a single sorted
 * `AthleteCalendar`. The function is pure — caller is responsible
 * for fetching `deals` (brand-deal details), `disclosures`, and
 * optional `games`.
 */
export function buildAthleteCalendar(
  athleteId: string,
  deals: BrandDealDetail[],
  disclosures: ComplianceDisclosure[],
  games: CalendarGameInput[] = [],
  options: BuildAthleteCalendarOptions = {},
): AthleteCalendar {
  const now = options.now ?? new Date();
  const windowDays = options.windowDays ?? 14;
  const startDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate.getTime() + windowDays * DAY_MS);

  const items: CalendarItem[] = [];

  // ── Deal commitments ────────────────────────────────────
  // The brand-deal `commitments` rows carry a free-form `due` string.
  // For the calendar we synthesize a concrete due date from the
  // commitment's index inside its parent deal so the demo always
  // has dates that fall inside the lookahead window.
  deals.forEach((deal, dealIdx) => {
    deal.commitments.forEach((c, i) => {
      // Skip commitments already marked done — they don't owe time.
      if (c.status === 'done') return;
      const daysAhead = (dealIdx + i) % windowDays;
      const date = isoAtHour(startDate, daysAhead, 10 + ((dealIdx + i) % 6));
      const dt = new Date(date);
      const priority: CalendarItemPriority =
        c.status === 'blocked' ? 'critical' : c.status === 'active' ? 'high' : 'normal';
      items.push({
        id: `cal-deal-${c.id}`,
        athleteId,
        kind: 'deal-commitment',
        title: c.title,
        subtitle: `${deal.deal.athlete.split(' · ')[0]} · ${c.owner}`,
        date,
        sourceRef: syntheticSource(
          `src-${c.id}`,
          `Deal commitment · ${deal.deal.id}`,
          0,
        ),
        priority,
        status: statusFor(dt, now),
        deepLink: `/deal/${deal.id}`,
      });
    });
  });

  // ── Disclosure deadlines ────────────────────────────────
  // Each non-terminal disclosure earns a "deadline" row. We bucket
  // them across the next 7 days so the demo lands a few near-today.
  const openDisclosures = disclosures.filter(
    (d) => d.reviewState !== 'approved',
  );
  openDisclosures.forEach((d, i) => {
    const daysAhead = i % 7;
    const date = isoAtHour(startDate, daysAhead, 17);
    const dt = new Date(date);
    const priority: CalendarItemPriority =
      d.reviewState === 'flagged'
        ? 'critical'
        : d.reviewState === 'school-review'
          ? 'high'
          : 'normal';
    items.push({
      id: `cal-disc-${d.id}`,
      athleteId,
      kind: 'disclosure-deadline',
      title: `Disclose ${d.counterparties.brand.name}`,
      subtitle: `${d.counterparties.brand.category} · ${d.reviewState.replace('-', ' ')}`,
      date,
      sourceRef: syntheticSource(
        `src-${d.id}`,
        `Disclosure packet · ${d.id}`,
        0,
        d.cscNote,
      ),
      priority,
      status: statusFor(dt, now),
      deepLink: `/athlete/disclosures/${d.id}`,
    });
  });

  // ── Games ───────────────────────────────────────────────
  games.forEach((g) => {
    const dt = new Date(g.date);
    if (Number.isNaN(dt.getTime())) return;
    if (dt < startDate || dt > endDate) return;
    items.push({
      id: `cal-game-${g.id}`,
      athleteId,
      kind: 'game',
      title: `${g.home ? 'vs' : '@'} ${g.opponent}`,
      subtitle: g.venue,
      date: g.date,
      durationMin: 150,
      sourceRef: syntheticSource(
        `src-${g.id}`,
        `Roster schedule · ${g.id}`,
        0,
      ),
      priority: 'high',
      status: statusFor(dt, now),
    });
  });

  // ── Synthetic workout + media filler so the demo always ──
  // shows a healthy mix of kinds across the 14-day window.
  type FillerRow = Pick<
    CalendarItem,
    'kind' | 'title' | 'subtitle' | 'priority' | 'durationMin'
  > & { daysAhead: number; hour: number };
  const filler: FillerRow[] = [
    { kind: 'workout', title: 'Strength + lift', subtitle: 'Coach Mahoney · weight room', priority: 'normal', durationMin: 75, daysAhead: 0, hour: 7 },
    { kind: 'media', title: 'Brand content shoot', subtitle: 'Nike Hoops · campus studio', priority: 'high', durationMin: 180, daysAhead: 2, hour: 14 },
    { kind: 'workout', title: 'Film review', subtitle: 'Coaching staff · video room', priority: 'normal', durationMin: 60, daysAhead: 4, hour: 9 },
    { kind: 'media', title: 'School media day', subtitle: 'Athletic comms · arena floor', priority: 'normal', durationMin: 120, daysAhead: 6, hour: 11 },
    { kind: 'workout', title: 'Recovery + treatment', subtitle: 'Training staff · sports medicine', priority: 'low', durationMin: 45, daysAhead: 1, hour: 16 },
  ];
  filler.forEach((f, i) => {
    const date = isoAtHour(startDate, f.daysAhead, f.hour);
    const dt = new Date(date);
    items.push({
      id: `cal-fill-${i}`,
      athleteId,
      kind: f.kind,
      title: f.title,
      subtitle: f.subtitle,
      date,
      durationMin: f.durationMin,
      sourceRef: syntheticSource(
        `src-fill-${i}`,
        `Synthetic ${f.kind} block`,
        0,
      ),
      priority: f.priority,
      status: statusFor(dt, now),
    });
  });

  items.sort((a, b) => a.date.localeCompare(b.date));

  const counts: Record<CalendarItemStatus, number> = {
    upcoming: 0,
    today: 0,
    overdue: 0,
    done: 0,
  };
  items.forEach((it) => {
    counts[it.status] += 1;
  });

  return {
    athleteId,
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    items,
    counts,
    updatedAt: now.toISOString(),
  };
}
