// ── ATHLETE COMMITMENT CALENDAR CARD ─────────────────────
// Mrs. Wilson W28 + W29 (PLAN.md §5 P1) — auto-populated commitment
// calendar surfaced as a single card. Pulls everything from
// `useAthleteCalendar`; never asks the athlete to retype something
// already captured in a deal packet or disclosure form.
//
// Two render modes:
//   - <AthleteCalendarCard />        — full card with stat row + day-grouped list
//   - <AthleteCalendarCta />         — mini summary CTA used inside the home tab
//
// Source-ref discipline: every row carries an upstream
// `ComparableDealSourceRef`; a freshness chip renders next to the
// title so the reviewer can audit origin without leaving the screen.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAthleteCalendar } from '@/hooks/use-athlete-calendar';
import {
  CARD_BG,
  CARD_BG_INSET,
  CARD_BORDER,
  EmptyState,
  RADIUS_MD,
  RADIUS_PILL,
  RADIUS_SM,
  StatPill,
  StatusPill,
  TONE_COLOR,
  type Tone,
} from '@/components/shared/ui-kit';
import type {
  CalendarItem,
  CalendarItemKind,
  CalendarItemPriority,
  CalendarItemStatus,
} from '@/lib/types/athlete-calendar.types';

const ATHLETE_ACCENT = '#EB621A';
const MUTED = 'rgba(255,255,255,0.52)';

const KIND_ICON: Record<CalendarItemKind, keyof typeof Ionicons.glyphMap> = {
  'deal-commitment': 'briefcase-outline',
  'disclosure-deadline': 'document-text-outline',
  game: 'basketball-outline',
  workout: 'barbell-outline',
  media: 'videocam-outline',
};

const KIND_LABEL: Record<CalendarItemKind, string> = {
  'deal-commitment': 'Deal',
  'disclosure-deadline': 'Disclose',
  game: 'Game',
  workout: 'Workout',
  media: 'Media',
};

const PRIORITY_DOT: Record<CalendarItemPriority, string> = {
  low: 'rgba(255,255,255,0.30)',
  normal: '#7BAFD4',
  high: '#FFD60A',
  critical: '#FF453A',
};

const STATUS_TONE: Record<CalendarItemStatus, Tone> = {
  upcoming: 'info',
  today: 'accent',
  overdue: 'danger',
  done: 'success',
};

const STATUS_LABEL: Record<CalendarItemStatus, string> = {
  upcoming: 'Upcoming',
  today: 'Today',
  overdue: 'Overdue',
  done: 'Done',
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDayHeader(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return 'TODAY';
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate()
  ) {
    return 'TOMORROW';
  }
  return d
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    .toUpperCase();
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function freshnessLabel(days: number): string {
  if (days <= 0) return 'today';
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  const m = Math.round(days / 30);
  return m <= 1 ? '1mo' : `${m}mo`;
}

function groupByDay(items: CalendarItem[]): { key: string; iso: string; rows: CalendarItem[] }[] {
  const buckets = new Map<string, { iso: string; rows: CalendarItem[] }>();
  items.forEach((it) => {
    const key = dayKey(it.date);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.rows.push(it);
    } else {
      buckets.set(key, { iso: it.date, rows: [it] });
    }
  });
  return Array.from(buckets.entries()).map(([key, value]) => ({ key, ...value }));
}

function countUpcomingNext7(items: CalendarItem[], now = new Date()): number {
  const cutoff = now.getTime() + 7 * 24 * 60 * 60 * 1000;
  return items.filter((it) => {
    if (it.status !== 'upcoming') return false;
    const t = new Date(it.date).getTime();
    return t <= cutoff;
  }).length;
}

export interface AthleteCalendarCardProps {
  /** Demo defaults to `a-1` (Kiyan Anthony). */
  athleteId?: string;
}

export function AthleteCalendarCard({ athleteId = 'a-1' }: AthleteCalendarCardProps) {
  const router = useRouter();
  const { data, isLoading } = useAthleteCalendar(athleteId);

  if (isLoading && !data) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <ActivityIndicator color={ATHLETE_ACCENT} />
      </View>
    );
  }

  const items = data?.items ?? [];
  const counts = data?.counts ?? { upcoming: 0, today: 0, overdue: 0, done: 0 };
  const upcomingNext7 = countUpcomingNext7(items);
  const grouped = groupByDay(items);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconWrap}>
            <Ionicons name="calendar" size={16} color={ATHLETE_ACCENT} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Commitment calendar</Text>
            <Text style={styles.sub}>Auto-populated from deals + disclosures</Text>
          </View>
        </View>
      </View>

      <View style={styles.statRow}>
        <StatPill value={`${counts.today}`} label="Today" tint={ATHLETE_ACCENT} size="sm" />
        <StatPill value={`${upcomingNext7}`} label="Next 7" tint="#FFFFFF" size="sm" />
        <StatPill value={`${counts.overdue}`} label="Overdue" tint={counts.overdue > 0 ? '#FF453A' : '#FFFFFF'} size="sm" />
        <StatPill value={`${counts.done}`} label="Done" tint="#00C6B0" size="sm" />
      </View>

      {items.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="Calendar is clear"
          body="No upcoming commitments or disclosure deadlines in the next 14 days."
        />
      ) : (
        <View style={styles.dayList}>
          {grouped.map((group) => (
            <DayBlock
              key={group.key}
              iso={group.iso}
              rows={group.rows}
              onRowPress={(it) => {
                if (it.deepLink) router.push(it.deepLink as never);
              }}
            />
          ))}
        </View>
      )}

      <Pressable
        style={styles.footerCta}
        onPress={() => router.push('/athlete/calendar')}
        accessibilityRole="button"
        accessibilityLabel="Open full calendar"
      >
        <Text style={styles.footerCtaText}>Open full calendar</Text>
        <Ionicons name="chevron-forward" size={14} color={ATHLETE_ACCENT} />
      </Pressable>
    </View>
  );
}

function DayBlock({
  iso,
  rows,
  onRowPress,
}: {
  iso: string;
  rows: CalendarItem[];
  onRowPress: (item: CalendarItem) => void;
}) {
  return (
    <View style={styles.dayBlock}>
      <Text style={styles.dayLabel}>{formatDayHeader(iso)}</Text>
      <View style={styles.dayRows}>
        {rows.map((it) => (
          <CalendarRow key={it.id} item={it} onPress={() => onRowPress(it)} />
        ))}
      </View>
    </View>
  );
}

export function CalendarRow({
  item,
  onPress,
}: {
  item: CalendarItem;
  onPress?: () => void;
}) {
  const time = formatTime(item.date);
  const fresh = freshnessLabel(item.sourceRef.freshnessDays);
  const tappable = Boolean(item.deepLink && onPress);

  const inner = (
    <>
      <View style={[styles.priorityDot, { backgroundColor: PRIORITY_DOT[item.priority] }]} />
      <View style={styles.kindIcon}>
        <Ionicons name={KIND_ICON[item.kind]} size={14} color={ATHLETE_ACCENT} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {item.title}
        </Text>
        {item.subtitle ? (
          <Text style={styles.rowSub} numberOfLines={1}>
            {item.subtitle}
          </Text>
        ) : null}
        <View style={styles.rowMeta}>
          <Text style={styles.rowMetaText}>{KIND_LABEL[item.kind]}</Text>
          <Text style={styles.rowMetaDot}>·</Text>
          <Text style={styles.rowMetaText}>{time}</Text>
          <Text style={styles.rowMetaDot}>·</Text>
          <View style={styles.freshnessChip}>
            <Ionicons name="time-outline" size={10} color={MUTED} />
            <Text style={styles.freshnessText}>{fresh}</Text>
          </View>
        </View>
      </View>
      <StatusPill tone={STATUS_TONE[item.status]} label={STATUS_LABEL[item.status]} size="sm" />
    </>
  );

  if (tappable) {
    return (
      <Pressable
        style={styles.row}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
      >
        {inner}
      </Pressable>
    );
  }
  return <View style={styles.row}>{inner}</View>;
}

// ── Mini CTA used inside the home Stats tab ──────────────
export interface AthleteCalendarCtaProps {
  athleteId?: string;
}

export function AthleteCalendarCta({ athleteId = 'a-1' }: AthleteCalendarCtaProps) {
  const router = useRouter();
  const { data, isLoading } = useAthleteCalendar(athleteId);
  const counts = data?.counts ?? { upcoming: 0, today: 0, overdue: 0, done: 0 };
  const upcomingNext7 = countUpcomingNext7(data?.items ?? []);

  return (
    <Pressable
      style={styles.ctaCard}
      onPress={() => router.push('/athlete/calendar')}
      accessibilityRole="button"
      accessibilityLabel="Open commitment calendar"
    >
      <View style={styles.ctaIcon}>
        <Ionicons name="calendar" size={18} color={ATHLETE_ACCENT} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.ctaTitle}>Commitment calendar</Text>
        <Text style={styles.ctaSub} numberOfLines={1}>
          {isLoading
            ? 'Building your week…'
            : `${counts.today} today · ${upcomingNext7} in next 7 days${counts.overdue > 0 ? ` · ${counts.overdue} overdue` : ''}`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.45)" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    padding: 14,
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: RADIUS_SM,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,111,60,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,111,60,0.32)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  sub: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dayList: {
    gap: 14,
  },
  dayBlock: {
    gap: 8,
  },
  dayLabel: {
    color: MUTED,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  dayRows: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG_INSET,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  kindIcon: {
    width: 26,
    height: 26,
    borderRadius: RADIUS_SM,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,111,60,0.10)',
  },
  rowTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  rowSub: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11,
    fontWeight: '600',
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  rowMetaText: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  rowMetaDot: {
    color: 'rgba(255,255,255,0.30)',
    fontSize: 10,
  },
  freshnessChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS_PILL,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },
  freshnessText: {
    color: MUTED,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  footerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  footerCtaText: {
    color: ATHLETE_ACCENT,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
  },
  ctaIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS_SM,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,111,60,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,111,60,0.32)',
  },
  ctaTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: -0.1,
  },
  ctaSub: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '600',
  },
});
