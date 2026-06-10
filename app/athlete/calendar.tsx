// ── ATHLETE CALENDAR · FULL-SCREEN ROUTE ─────────────────
// Mrs. Wilson W28 + W29 (PLAN.md §5 P1) — full-screen, filterable
// view of the auto-populated commitment calendar. Reuses
// `useAthleteCalendar` and the `CalendarRow` primitive from
// `components/athlete/athlete-calendar-card.tsx` so the full view
// and the home-tab card share visual + data discipline.
//
// Deep-link target: `status://athlete/calendar`.

import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AthleteCalendarCard,
  CalendarRow,
} from '@/components/athlete/athlete-calendar-card';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import {
  CARD_BG,
  CARD_BORDER,
  EmptyState,
  RADIUS_PILL,
} from '@/components/shared/ui-kit';
import { useAthleteCalendar } from '@/hooks/use-athlete-calendar';
import type { CalendarItemKind } from '@/lib/types/athlete-calendar.types';

const ATHLETE_ACCENT = '#EB621A';
const DEMO_ATHLETE_ID = 'a-1';

type FilterKey = 'all' | CalendarItemKind;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'deal-commitment', label: 'Deals' },
  { key: 'disclosure-deadline', label: 'Disclosures' },
  { key: 'game', label: 'Games' },
  { key: 'workout', label: 'Workouts' },
  { key: 'media', label: 'Media' },
];

export default function AthleteCalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useAthleteCalendar(DEMO_ATHLETE_ID);
  const [filter, setFilter] = React.useState<FilterKey>('all');

  const onBack = React.useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/athlete');
    }
  }, [router]);

  const items = data?.items ?? [];
  // Reverse-chronological from today: today / overdue first, then
  // upcoming sorted by soonest-first. Spec says reverse-chrono from
  // today — i.e. today on top, then walks forward.
  const filtered = React.useMemo(() => {
    const subset = filter === 'all' ? items : items.filter((it) => it.kind === filter);
    return [...subset].sort((a, b) => {
      // Today / overdue rank above upcoming.
      const rank: Record<typeof a.status, number> = {
        today: 0,
        overdue: 1,
        upcoming: 2,
        done: 3,
      };
      const r = rank[a.status] - rank[b.status];
      if (r !== 0) return r;
      return a.date.localeCompare(b.date);
    });
  }, [items, filter]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <DarkGradientBg />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
          ]}
        >
          <View style={styles.topRow}>
            <Pressable
              onPress={onBack}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>
            <View style={styles.flex}>
              <Text style={styles.kicker}>My calendar</Text>
              <Text style={styles.headerTitle} numberOfLines={2}>
                Commitments + disclosures + games
              </Text>
              <Text style={styles.headerSub} numberOfLines={3}>
                Auto-populated from every brand-deal commitment, disclosure deadline,
                and roster game on your schedule. Every row carries a source ref.
              </Text>
            </View>
          </View>

          <AthleteCalendarCard athleteId={DEMO_ATHLETE_ID} />

          {/* Filter chips */}
          <View style={styles.filterScrollWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => setFilter(f.key)}
                    style={[styles.chip, active && styles.chipActive]}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter: ${f.label}`}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {filtered.length === 0 ? (
            <EmptyState
              icon={isLoading ? 'hourglass-outline' : 'calendar-outline'}
              title={isLoading ? 'Loading calendar' : 'Nothing in this view'}
              body={
                isLoading
                  ? 'Pulling commitments, disclosures, and your team schedule.'
                  : 'No calendar items match this filter in the next 14 days.'
              }
            />
          ) : (
            <View style={styles.list}>
              {filtered.map((it) => (
                <CalendarRow
                  key={it.id}
                  item={it}
                  onPress={() => {
                    if (it.deepLink) router.push(it.deepLink as never);
                  }}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    gap: 14,
    paddingHorizontal: 16,
  },
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  flex: { flex: 1 },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    height: 34,
    justifyContent: 'center',
    width: 34,
    marginTop: 2,
  },
  kicker: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginTop: 4,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    marginTop: 6,
  },
  filterScrollWrap: {
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 12,
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
    borderColor: ATHLETE_ACCENT,
    backgroundColor: 'rgba(255,111,60,0.18)',
  },
  chipText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  chipTextActive: {
    color: ATHLETE_ACCENT,
  },
  list: {
    gap: 8,
  },
});
