// ── COACH · NIL WATCH (full-screen route) ────────────────
// Sprint 4 — full roster NIL surface for the coach. Shares
// the same data join as `<CoachNilWatchCard />` but adds
// status-filter chips so the coach can scope to flagged /
// pending rows during a film session.
//
// Read-only — no mutate CTAs anywhere on this surface.

import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CARD_BG,
  CARD_BG_INSET,
  CARD_BORDER,
  EmptyDealsState,
  RADIUS_MD,
  RADIUS_PILL,
  SectionCard,
  StatPill,
  StatusPill,
  TONE_COLOR,
  type Tone,
} from '@/components/shared/ui-kit';
import { useCoachRoster } from '@/hooks/use-coach-roster';
import { BRAND_ATHLETES, BRAND_DEALS } from '@/lib/data/mock-brand-data';
import { listMockDisclosuresForAthlete } from '@/lib/data/mock-disclosures';
import {
  DEMO_COACH_ID,
  type CoachRosterNilStatus,
} from '@/lib/data/mock-coach-roster';
import {
  buildCoachNilRows,
  countByNilStatus,
  type CoachNilRow,
} from '@/lib/coach/coach-nil-watch-model';

type FilterKey = 'all' | CoachRosterNilStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'pending-disclosure', label: 'Pending' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'cleared', label: 'Cleared' },
];

const NIL_STATUS_TONE: Record<CoachRosterNilStatus, Tone> = {
  active: 'success',
  'pending-disclosure': 'warning',
  flagged: 'danger',
  cleared: 'info',
};

const NIL_STATUS_LABEL: Record<CoachRosterNilStatus, string> = {
  active: 'Active',
  'pending-disclosure': 'Pending',
  flagged: 'Flagged',
  cleared: 'Cleared',
};

export default function CoachNilWatchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = React.useState<FilterKey>('all');

  const { data: roster } = useCoachRoster(DEMO_COACH_ID);

  const allRows = React.useMemo<CoachNilRow[]>(
    () =>
      buildCoachNilRows({
        entries: roster?.entries ?? [],
        athletes: BRAND_ATHLETES,
        deals: BRAND_DEALS,
        listDisclosures: listMockDisclosuresForAthlete,
      }),
    [roster],
  );

  const counts = React.useMemo(() => countByNilStatus(allRows), [allRows]);

  const visibleRows = React.useMemo(() => {
    if (filter === 'all') return allRows;
    return allRows.filter((r) => r.nilStatus === filter);
  }, [allRows, filter]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>NIL WATCH</Text>
          <Text style={styles.title}>Roster NIL activity</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero stats */}
        <View style={styles.heroRow}>
          <StatPill value={String(allRows.length)} label="Roster" />
          <StatPill
            value={String(counts.active)}
            label="Active"
            tint={TONE_COLOR.success}
          />
          <StatPill
            value={String(counts['pending-disclosure'])}
            label="Pending"
            tint={TONE_COLOR.warning}
          />
          <StatPill
            value={String(counts.flagged)}
            label="Flagged"
            tint={TONE_COLOR.danger}
          />
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.chip, isActive && styles.chipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`Filter by ${f.label}`}
              >
                <Text
                  style={[
                    styles.chipText,
                    isActive && styles.chipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ marginTop: 4 }}>
          <SectionCard title="Athletes" icon="people-outline">
            {allRows.length === 0 ? (
              <EmptyDealsState
                role="coach"
                cta={{
                  label: 'Invite roster',
                  onPress: () => router.push('/coach/practice-plan' as any),
                }}
              />
            ) : visibleRows.length === 0 ? (
              <Text style={styles.empty}>
                No roster athletes match this filter.
              </Text>
            ) : (
              visibleRows.map((row, i) => (
                <Pressable
                  key={row.athleteId}
                  onPress={() =>
                    router.push({
                      pathname: '/athlete/disclosures',
                      params: { athleteId: row.athleteId },
                    })
                  }
                  style={({ pressed }) => [
                    styles.row,
                    i !== visibleRows.length - 1 && styles.rowDivider,
                    pressed && { opacity: 0.6 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Open NIL disclosures for ${row.athleteName}`}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{row.initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.rowHead}>
                      <Text style={styles.athleteName} numberOfLines={1}>
                        #{row.jerseyNumber} · {row.athleteName}
                      </Text>
                      <StatusPill
                        label={NIL_STATUS_LABEL[row.nilStatus]}
                        tone={NIL_STATUS_TONE[row.nilStatus]}
                      />
                    </View>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {row.position} · {row.classYear} · {row.school}
                    </Text>
                    <View style={styles.rowFootRow}>
                      <Text style={styles.rowFootLabel}>Last deal</Text>
                      <Text style={styles.rowFootValue}>
                        {row.lastDealValue ?? '—'}
                      </Text>
                      <Text style={styles.rowFootLabel}>· Disclosure</Text>
                      <Text style={styles.rowFootValue}>
                        {row.lastDisclosureLabel ?? '—'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color="rgba(255,255,255,0.35)"
                  />
                </Pressable>
              ))
            )}
          </SectionCard>
        </View>

        <View style={styles.caveat}>
          <Ionicons
            name="information-circle-outline"
            size={13}
            color="rgba(255,255,255,0.55)"
          />
          <Text style={styles.caveatText}>
            Coach view is read-only. NIL deals are athlete + brand-driven.
            Contact the NIL Manager for compliance escalation.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD_BG_INSET,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.46)',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  heroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS_PILL,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
  },
  chipActive: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.32)',
  },
  chipText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  empty: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CARD_BORDER,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: RADIUS_MD,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD_BG_INSET,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
  },
  athleteName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  rowMeta: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    marginTop: 2,
  },
  rowFootRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  rowFootLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '600',
  },
  rowFootValue: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11.5,
    fontWeight: '700',
  },
  caveat: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 10,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    marginTop: 8,
  },
  caveatText: {
    flex: 1,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11.5,
    lineHeight: 16,
  },
});
