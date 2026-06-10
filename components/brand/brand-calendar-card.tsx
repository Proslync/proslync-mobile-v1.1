// ── BRAND CALENDAR CARD (Sprint 2.6) ─────────────────────
// Visual rendering of the auto-populated brand calendar + checklist
// packet (PLAN.md §2.6 — W34/W35). Two consumers in this file:
//
//   - `BrandCalendarCard` — full HQ-tab card with hero stats, a
//     7-day calendar list (day-grouped), and a top-5 checklist
//     mini-rail. Each row carries a source-freshness chip.
//   - `BrandCalendarCta` — compact mini-card meant to live near the
//     top of an existing surface. Shows today + open counts and
//     taps through to `/brand/calendar`.
//
// Both pull from `useBrandCalendar` so they stay in sync. Empty
// packets fall back to `EmptyState`.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';

import {
  CARD_BG,
  CARD_BG_INSET,
  CARD_BORDER,
  EmptyState,
  RADIUS_MD,
  RADIUS_PILL,
  RADIUS_SM,
  SectionCard,
  StatPill,
  StatusPill,
  TONE_COLOR,
  type Tone,
} from '@/components/shared/ui-kit';
import { useBrandCalendar } from '@/hooks/use-brand-calendar';
import type {
  BrandCalendarItem,
  BrandCalendarItemKind,
  BrandCalendarItemPriority,
  BrandCalendarItemStatus,
  BrandCalendarPacket,
  BrandChecklistRow,
  BrandChecklistRowStatus,
} from '@/lib/types/brand-calendar.types';

// ─── Visual maps ──────────────────────────────────────────

const KIND_ICON: Record<
  BrandCalendarItemKind,
  React.ComponentProps<typeof Ionicons>['name']
> = {
  'campaign-launch': 'rocket-outline',
  'deal-commitment': 'list-circle-outline',
  'open-deal-deadline': 'flag-outline',
  'renewal-window': 'refresh-circle-outline',
  'review-checkpoint': 'shield-checkmark-outline',
};

const KIND_LABEL: Record<BrandCalendarItemKind, string> = {
  'campaign-launch': 'Campaign launch',
  'deal-commitment': 'Deal commitment',
  'open-deal-deadline': 'Open-deal deadline',
  'renewal-window': 'Renewal window',
  'review-checkpoint': 'Review checkpoint',
};

const PRIORITY_TONE: Record<BrandCalendarItemPriority, Tone> = {
  low: 'muted',
  normal: 'info',
  high: 'accent',
  urgent: 'danger',
};

const STATUS_TONE: Record<BrandCalendarItemStatus, Tone> = {
  upcoming: 'info',
  today: 'accent',
  overdue: 'danger',
  done: 'success',
};

const CHECKLIST_TONE: Record<BrandChecklistRowStatus, Tone> = {
  queued: 'muted',
  active: 'accent',
  done: 'success',
  blocked: 'danger',
};

// ─── Date helpers ─────────────────────────────────────────

function formatDayHeader(iso: string): string {
  const d = new Date(iso);
  return d
    .toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
    .toUpperCase();
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

function dayKeyUtc(iso: string): string {
  return iso.slice(0, 10);
}

function freshnessLabel(days: number): string {
  if (days <= 0) return 'TODAY';
  if (days === 1) return '1d OLD';
  return `${days}d OLD`;
}

// ─── Data slicing ─────────────────────────────────────────

interface DayBucket {
  key: string;
  iso: string;
  items: BrandCalendarItem[];
}

function bucketByDay(items: BrandCalendarItem[]): DayBucket[] {
  const map = new Map<string, DayBucket>();
  const ordered = [...items].sort(
    (a, b) => Date.parse(a.date) - Date.parse(b.date),
  );
  for (const item of ordered) {
    const key = dayKeyUtc(item.date);
    const bucket = map.get(key);
    if (bucket) {
      bucket.items.push(item);
    } else {
      map.set(key, { key, iso: item.date, items: [item] });
    }
  }
  return Array.from(map.values());
}

function pickNext7Days(
  items: BrandCalendarItem[],
  nowMs: number,
): BrandCalendarItem[] {
  const horizon = nowMs + 7 * 24 * 60 * 60 * 1000;
  return items.filter((item) => {
    const t = Date.parse(item.date);
    if (Number.isNaN(t)) return false;
    return t >= nowMs - 24 * 60 * 60 * 1000 && t <= horizon;
  });
}

function pickTopOpenChecklist(
  rows: BrandChecklistRow[],
  limit: number,
): BrandChecklistRow[] {
  return rows
    .filter((r) => r.status === 'queued' || r.status === 'active' || r.status === 'blocked')
    .sort((a, b) => Date.parse(a.due) - Date.parse(b.due))
    .slice(0, limit);
}

// ─── Components ───────────────────────────────────────────

export interface BrandCalendarCardProps {
  brandId: string;
  /** Override "now" for tests / storyboards. */
  now?: Date;
}

export function BrandCalendarCard({ brandId, now }: BrandCalendarCardProps) {
  const router = useRouter();
  const { data, isLoading } = useBrandCalendar(brandId);
  const nowMs = (now ?? new Date()).getTime();

  if (isLoading) {
    return (
      <SectionCard title="Calendar + checklist" icon="calendar-outline">
        <EmptyState
          icon="hourglass-outline"
          title="Loading calendar"
          body="Aggregating campaign launches, deal commitments, and open-deal deadlines."
        />
      </SectionCard>
    );
  }

  if (!data) {
    return (
      <SectionCard title="Calendar + checklist" icon="calendar-outline">
        <EmptyState
          icon="calendar-clear-outline"
          title="No calendar yet"
          body="Calendar items appear once campaigns or deals are scheduled for this brand."
        />
      </SectionCard>
    );
  }

  const next7 = pickNext7Days(data.calendar, nowMs);
  const buckets = bucketByDay(next7);
  const topChecklist = pickTopOpenChecklist(data.checklist, 5);

  return (
    <SectionCard title="Calendar + checklist" icon="calendar-outline">
      <View style={styles.statRow}>
        <StatPill
          value={String(data.counts.calendarToday)}
          label="Today"
          tint={TONE_COLOR.accent}
          size="sm"
        />
        <StatPill
          value={String(data.counts.calendarUpcoming)}
          label="Next 7d"
          tint={TONE_COLOR.info}
          size="sm"
        />
        <StatPill
          value={String(data.counts.checklistOpen)}
          label="Open"
          tint="#FFFFFF"
          size="sm"
        />
        <StatPill
          value={String(data.counts.checklistOverdue)}
          label="Overdue"
          tint={TONE_COLOR.danger}
          size="sm"
        />
      </View>

      <View style={styles.subhead}>
        <Text style={styles.subheadTitle}>Next 7 days</Text>
        <Pressable
          onPress={() => router.push('/brand/calendar')}
          accessibilityRole="button"
          accessibilityLabel="Open full calendar"
          hitSlop={8}
        >
          <Text style={styles.subheadLink}>View all</Text>
        </Pressable>
      </View>

      {buckets.length === 0 ? (
        <EmptyState
          icon="checkmark-done-circle-outline"
          title="Clear week ahead"
          body="No campaign launches or commitments are scheduled in the next seven days."
        />
      ) : (
        <View style={styles.dayList}>
          {buckets.map((bucket) => (
            <View key={bucket.key} style={styles.dayBucket}>
              <Text style={styles.dayHeader}>{formatDayHeader(bucket.iso)}</Text>
              <View style={styles.dayItems}>
                {bucket.items.map((item) => (
                  <CalendarRow key={item.id} item={item} />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.subhead}>
        <Text style={styles.subheadTitle}>Top open commitments</Text>
        <Pressable
          onPress={() => router.push('/brand/checklist')}
          accessibilityRole="button"
          accessibilityLabel="Open full checklist"
          hitSlop={8}
        >
          <Text style={styles.subheadLink}>View all</Text>
        </Pressable>
      </View>

      {topChecklist.length === 0 ? (
        <EmptyState
          icon="checkmark-circle-outline"
          title="Inbox zero"
          body="Every active commitment is closed or done."
        />
      ) : (
        <View style={styles.checklistRail}>
          {topChecklist.map((row) => (
            <ChecklistRailRow
              key={row.id}
              row={row}
              onPress={() =>
                router.push(
                  `/brand/deals/${row.commitmentRef.dealId}` as never,
                )
              }
            />
          ))}
        </View>
      )}
    </SectionCard>
  );
}

function CalendarRow({ item }: { item: BrandCalendarItem }) {
  const priorityColor = TONE_COLOR[PRIORITY_TONE[item.priority]];
  return (
    <View style={styles.calRow}>
      <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
      <Ionicons
        name={KIND_ICON[item.kind]}
        size={16}
        color="rgba(255,255,255,0.78)"
        style={styles.kindIcon}
      />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.calTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.calMetaRow}>
          <Text style={styles.calMeta}>
            {formatTime(item.date)} · {item.ownerLabel}
          </Text>
        </View>
        <View style={styles.calChipRow}>
          <StatusPill
            label={item.status}
            tone={STATUS_TONE[item.status]}
            size="sm"
          />
          <View style={styles.kindChip}>
            <Text style={styles.kindChipText}>{KIND_LABEL[item.kind]}</Text>
          </View>
          <View style={styles.freshnessChip}>
            <Ionicons
              name="time-outline"
              size={9}
              color="rgba(255,255,255,0.6)"
            />
            <Text style={styles.freshnessChipText}>
              {freshnessLabel(item.sourceRef.freshnessDays)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function ChecklistRailRow({
  row,
  onPress,
}: {
  row: BrandChecklistRow;
  onPress: (e: GestureResponderEvent) => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.checkRow,
        pressed && { opacity: 0.7 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open commitment ${row.title}`}
    >
      <Ionicons
        name="ellipse-outline"
        size={14}
        color={TONE_COLOR[CHECKLIST_TONE[row.status]]}
      />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.checkTitle} numberOfLines={1}>
          {row.title}
        </Text>
        <Text style={styles.checkMeta} numberOfLines={1}>
          {formatDayHeader(row.due)} · {row.assigneeLabel}
        </Text>
      </View>
      <StatusPill
        label={row.status}
        tone={CHECKLIST_TONE[row.status]}
        size="sm"
      />
    </Pressable>
  );
}

// ─── Compact CTA mini-card ────────────────────────────────

export interface BrandCalendarCtaProps {
  brandId: string;
}

export function BrandCalendarCta({ brandId }: BrandCalendarCtaProps) {
  const router = useRouter();
  const { data } = useBrandCalendar(brandId);

  const today = data?.counts.calendarToday ?? 0;
  const open = data?.counts.checklistOpen ?? 0;
  const overdue = data?.counts.checklistOverdue ?? 0;

  return (
    <Pressable
      onPress={() => router.push('/brand/calendar')}
      accessibilityRole="button"
      accessibilityLabel="Open brand calendar"
      style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.ctaIcon}>
        <Ionicons name="calendar-outline" size={16} color={TONE_COLOR.accent} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.ctaTitle}>Calendar + checklist</Text>
        <Text style={styles.ctaMeta}>
          {today} today · {open} open · {overdue} overdue
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={16}
        color="rgba(255,255,255,0.5)"
      />
    </Pressable>
  );
}

// ─── Re-export for callers that need the packet shape ─────
export type { BrandCalendarPacket };

// ─── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  statRow: {
    flexDirection: 'row',
    gap: 8,
  },
  subhead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subheadTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  subheadLink: {
    color: TONE_COLOR.accent,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  dayList: {
    gap: 12,
  },
  dayBucket: {
    gap: 6,
  },
  dayHeader: {
    color: 'rgba(255,255,255,0.46)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  dayItems: {
    backgroundColor: CARD_BG_INSET,
    borderColor: CARD_BORDER,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  calRow: {
    alignItems: 'flex-start',
    borderBottomColor: 'rgba(255,255,255,0.06)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    padding: 10,
  },
  priorityDot: {
    borderRadius: 4,
    height: 8,
    marginTop: 6,
    width: 8,
  },
  kindIcon: {
    marginTop: 2,
  },
  calTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  calMetaRow: {
    flexDirection: 'row',
  },
  calMeta: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  calChipRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  kindChip: {
    backgroundColor: CARD_BG,
    borderColor: CARD_BORDER,
    borderRadius: RADIUS_PILL,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  kindChipText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  freshnessChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: RADIUS_PILL,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  freshnessChipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  checklistRail: {
    backgroundColor: CARD_BG_INSET,
    borderColor: CARD_BORDER,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  checkRow: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.06)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    padding: 10,
  },
  checkTitle: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  checkMeta: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderColor: CARD_BORDER,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  ctaIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,111,60,0.14)',
    borderColor: 'rgba(255,111,60,0.32)',
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  ctaTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  ctaMeta: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11,
    fontWeight: '600',
  },
});
