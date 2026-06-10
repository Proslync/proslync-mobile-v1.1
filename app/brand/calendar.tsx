// ── BRAND CALENDAR (full-screen route) ───────────────────
// Sprint 2.6 (PLAN.md §2.6 — W34/W35). Full calendar list, ordered
// chronologically from today, with filter chips for the five
// `BrandCalendarItemKind` values. Pulls from `useBrandCalendar` so
// it stays in sync with the HQ-tab card.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import {
  CARD_BG,
  CARD_BG_INSET,
  CARD_BORDER,
  EmptyState,
  RADIUS_MD,
  RADIUS_PILL,
  StatPill,
  StatusPill,
  TONE_COLOR,
  type Tone,
} from '@/components/shared/ui-kit';
import { useBrandCalendar } from '@/hooks/use-brand-calendar';
import { BRAND_CALENDAR_BRAND_ID } from '@/lib/data/mock-brand-calendar';
import type {
  BrandCalendarItem,
  BrandCalendarItemKind,
  BrandCalendarItemPriority,
  BrandCalendarItemStatus,
} from '@/lib/types/brand-calendar.types';

const KIND_FILTERS: { key: BrandCalendarItemKind | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'campaign-launch', label: 'Campaigns' },
  { key: 'deal-commitment', label: 'Commitments' },
  { key: 'open-deal-deadline', label: 'Open deals' },
  { key: 'renewal-window', label: 'Renewals' },
  { key: 'review-checkpoint', label: 'Reviews' },
];

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

function formatDay(iso: string): string {
  return new Date(iso)
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

function freshnessLabel(days: number): string {
  if (days <= 0) return 'TODAY';
  if (days === 1) return '1d OLD';
  return `${days}d OLD`;
}

export default function BrandCalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useBrandCalendar(BRAND_CALENDAR_BRAND_ID);
  const [filter, setFilter] = React.useState<
    BrandCalendarItemKind | 'all'
  >('all');

  const items = React.useMemo(() => {
    const all = data?.calendar ?? [];
    const sorted = [...all].sort(
      (a, b) => Date.parse(a.date) - Date.parse(b.date),
    );
    return filter === 'all'
      ? sorted
      : sorted.filter((i) => i.kind === filter);
  }, [data, filter]);

  return (
    <View style={styles.container}>
      <DarkGradientBg />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Calendar</Text>
          <Text style={styles.headerSub}>Nike Hoops · next 21 days</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statRow}>
          <StatPill
            value={String(data?.counts.calendarToday ?? 0)}
            label="Today"
            tint={TONE_COLOR.accent}
            size="sm"
          />
          <StatPill
            value={String(data?.counts.calendarUpcoming ?? 0)}
            label="Next 7d"
            tint={TONE_COLOR.info}
            size="sm"
          />
          <StatPill
            value={String(data?.calendar.length ?? 0)}
            label="In window"
            tint="#FFFFFF"
            size="sm"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {KIND_FILTERS.map((f) => {
            const isActive = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <EmptyState
            icon="hourglass-outline"
            title="Loading calendar"
            body="Aggregating campaign launches, deal commitments, and open-deal deadlines."
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon="calendar-clear-outline"
            title="Nothing in this view"
            body="Try a different kind filter, or pull more activity into the brand pipeline."
          />
        ) : (
          <View style={styles.list}>
            {items.map((item) => (
              <FullRow
                key={item.id}
                item={item}
                onPress={
                  item.deepLink
                    ? () => router.push(item.deepLink as never)
                    : undefined
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function FullRow({
  item,
  onPress,
}: {
  item: BrandCalendarItem;
  onPress?: () => void;
}) {
  const priorityColor = TONE_COLOR[PRIORITY_TONE[item.priority]];

  const inner = (
    <>
      <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />
      <Ionicons
        name={KIND_ICON[item.kind]}
        size={18}
        color="rgba(255,255,255,0.82)"
        style={{ marginTop: 2 }}
      />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.rowDate}>
          {formatDay(item.date)} · {formatTime(item.date)}
        </Text>
        <Text style={styles.rowTitle}>{item.title}</Text>
        {item.subtitle ? (
          <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
        ) : null}
        <Text style={styles.rowOwner}>{item.ownerLabel}</Text>
        <View style={styles.rowChipRow}>
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
      {onPress ? (
        <Ionicons
          name="chevron-forward"
          size={16}
          color="rgba(255,255,255,0.4)"
        />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
      >
        {inner}
      </Pressable>
    );
  }

  return <View style={styles.row}>{inner}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  header: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  backBtn: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  headerSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 2,
  },

  content: { gap: 16, paddingHorizontal: 16, paddingTop: 8 },

  statRow: { flexDirection: 'row', gap: 8 },

  filterRow: { gap: 8, paddingRight: 8 },
  filterChip: {
    backgroundColor: CARD_BG,
    borderColor: CARD_BORDER,
    borderRadius: RADIUS_PILL,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipActive: {
    backgroundColor: 'rgba(255,111,60,0.16)',
    borderColor: 'rgba(255,111,60,0.4)',
  },
  filterChipText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11,
    fontWeight: '700',
  },
  filterChipTextActive: { color: TONE_COLOR.accent },

  list: { gap: 10 },
  row: {
    backgroundColor: CARD_BG_INSET,
    borderColor: CARD_BORDER,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  priorityBar: {
    borderRadius: 2,
    height: '100%',
    width: 3,
  },
  rowDate: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  rowTitle: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  rowSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  rowOwner: { color: 'rgba(255,255,255,0.55)', fontSize: 11 },
  rowChipRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
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
});
