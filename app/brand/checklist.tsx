// ── BRAND CHECKLIST (full-screen route) ──────────────────
// Sprint 2.6 (PLAN.md §2.6 — W34/W35). Full checklist of per-deal
// commitments derived from the brand calendar packet, with filter
// chips for the four `BrandChecklistRowStatus` values. Each row taps
// through to its originating deal.

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
  BrandChecklistRow,
  BrandChecklistRowStatus,
} from '@/lib/types/brand-calendar.types';

const STATUS_FILTERS: {
  key: BrandChecklistRowStatus | 'all';
  label: string;
}[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'queued', label: 'Pending' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'done', label: 'Done' },
];

const STATUS_TONE: Record<BrandChecklistRowStatus, Tone> = {
  queued: 'muted',
  active: 'accent',
  done: 'success',
  blocked: 'danger',
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

function freshnessLabel(days: number): string {
  if (days <= 0) return 'TODAY';
  if (days === 1) return '1d OLD';
  return `${days}d OLD`;
}

export default function BrandChecklistScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useBrandCalendar(BRAND_CALENDAR_BRAND_ID);
  const [filter, setFilter] = React.useState<
    BrandChecklistRowStatus | 'all'
  >('all');

  const rows = React.useMemo(() => {
    const all = data?.checklist ?? [];
    const sorted = [...all].sort(
      (a, b) => Date.parse(a.due) - Date.parse(b.due),
    );
    return filter === 'all'
      ? sorted
      : sorted.filter((r) => r.status === filter);
  }, [data, filter]);

  const counts = data?.counts;

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
          <Text style={styles.headerTitle}>Checklist</Text>
          <Text style={styles.headerSub}>Nike Hoops · deal commitments</Text>
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
            value={String(counts?.checklistOpen ?? 0)}
            label="Open"
            tint="#FFFFFF"
            size="sm"
          />
          <StatPill
            value={String(counts?.checklistOverdue ?? 0)}
            label="Overdue"
            tint={TONE_COLOR.danger}
            size="sm"
          />
          <StatPill
            value={String(data?.checklist.length ?? 0)}
            label="Tracked"
            tint={TONE_COLOR.info}
            size="sm"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {STATUS_FILTERS.map((f) => {
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
            title="Loading checklist"
            body="Aggregating per-deal commitments across the brand pipeline."
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon="checkmark-done-circle-outline"
            title="Inbox zero"
            body="Try a different status filter, or wait for new deal commitments to land."
          />
        ) : (
          <View style={styles.list}>
            {rows.map((row) => (
              <ChecklistFullRow
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
      </ScrollView>
    </View>
  );
}

function ChecklistFullRow({
  row,
  onPress,
}: {
  row: BrandChecklistRow;
  onPress: () => void;
}) {
  const tone = STATUS_TONE[row.status];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel={`Open commitment ${row.title}`}
    >
      <Ionicons name="ellipse-outline" size={18} color={TONE_COLOR[tone]} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.rowDue}>Due {formatDay(row.due)}</Text>
        <Text style={styles.rowTitle}>{row.title}</Text>
        <Text style={styles.rowAssignee}>{row.assigneeLabel}</Text>
        <View style={styles.rowChipRow}>
          <StatusPill label={row.status} tone={tone} size="sm" />
          <View style={styles.kindChip}>
            <Text style={styles.kindChipText}>
              {row.commitmentRef.dealId.toUpperCase()}
            </Text>
          </View>
          <View style={styles.freshnessChip}>
            <Ionicons
              name="time-outline"
              size={9}
              color="rgba(255,255,255,0.6)"
            />
            <Text style={styles.freshnessChipText}>
              {freshnessLabel(row.sourceRef.freshnessDays)}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={16}
        color="rgba(255,255,255,0.4)"
      />
    </Pressable>
  );
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
    alignItems: 'flex-start',
    backgroundColor: CARD_BG_INSET,
    borderColor: CARD_BORDER,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  rowDue: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  rowTitle: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  rowAssignee: { color: 'rgba(255,255,255,0.62)', fontSize: 11 },
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
