// ── ATHLETE PAYOUTS — FULL LIST ──────────────────────────
// W31 (PLAN §5 P1) — full-screen list of every payout row, with
// status filter chips (All / Projected / Pending / Paid / Held).
//
// Deep-link target: `proslync://athlete/payouts?athleteId=a-1`.
// Default athlete is `a-1` (Kiyan Anthony) so the demo deep-link works
// without a query param.
//
// TAX-ADVICE DISCIPLINE: footer footnote restates the not-tax-advice
// caveat. The set-aside totals are SUGGESTIONS, not enforced
// withholding.

import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import {
  CARD_BG,
  CARD_BG_INSET,
  CARD_BORDER,
  RADIUS_MD,
  RADIUS_PILL,
  RADIUS_SM,
  StatPill,
  StatusPill,
  TONE_COLOR,
} from '@/components/shared/ui-kit';
import { useAthletePayouts } from '@/hooks/use-athlete-payouts';
import type {
  AthletePayoutCategory,
  AthletePayoutItem,
  AthletePayoutItemStatus,
} from '@/lib/types/athlete-payout.types';

const DEFAULT_ATHLETE_ID = 'a-1';

const TAX_FOOTNOTE =
  'Tax set-aside is a suggested estimate (~24% federal + state). Not enforced withholding, not tax advice — verify with your accountant.';

const CATEGORY_LABELS: Record<AthletePayoutCategory, string> = {
  guaranteed: 'Guaranteed',
  performance: 'Performance',
  'usage-rights': 'Usage rights',
  appearance: 'Appearance',
  royalty: 'Royalty',
  'tax-withhold-reserve': 'Tax reserve',
};

const STATUS_TONE: Record<
  AthletePayoutItemStatus,
  React.ComponentProps<typeof StatusPill>['tone']
> = {
  projected: 'info',
  pending: 'warning',
  paid: 'success',
  held: 'muted',
};

const STATUS_LABEL: Record<AthletePayoutItemStatus, string> = {
  projected: 'Projected',
  pending: 'Pending',
  paid: 'Paid',
  held: 'Held',
};

type StatusFilter = 'all' | AthletePayoutItemStatus;

const FILTER_TABS: readonly { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'projected', label: 'Projected' },
  { id: 'pending', label: 'Pending' },
  { id: 'paid', label: 'Paid' },
  { id: 'held', label: 'Held' },
];

function normalizeParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatMoney(cents: number): string {
  const dollars = Math.round(cents / 100);
  return `$${dollars.toLocaleString()}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AthletePayoutsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ athleteId?: string }>();
  const athleteId = normalizeParam(params.athleteId) ?? DEFAULT_ATHLETE_ID;
  const insets = useSafeAreaInsets();

  const { data: summary, isLoading } = useAthletePayouts(athleteId);
  const [filter, setFilter] = React.useState<StatusFilter>('all');

  const onBack = React.useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/athlete');
    }
  }, [router]);

  const filteredItems = React.useMemo(() => {
    if (!summary) return [];
    const sorted = [...summary.items].sort((a, b) => (a.date < b.date ? 1 : -1));
    return filter === 'all' ? sorted : sorted.filter((i) => i.status === filter);
  }, [summary, filter]);

  const taxPct = summary
    ? (summary.suggestedTaxRateBp / 100).toFixed(0)
    : '24';

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
              <Text style={styles.kicker}>Payouts</Text>
              <Text style={styles.headerTitle} numberOfLines={2}>
                {summary
                  ? `${summary.period.label} · ${summary.items.length} items`
                  : 'Athlete payouts'}
              </Text>
            </View>
          </View>

          {isLoading && !summary ? (
            <View style={styles.emptyBox}>
              <Ionicons
                name="hourglass-outline"
                size={28}
                color="rgba(255,255,255,0.62)"
              />
              <Text style={styles.emptyTitle}>Loading payouts</Text>
            </View>
          ) : !summary ? (
            <View style={styles.emptyBox}>
              <Ionicons
                name="wallet-outline"
                size={28}
                color="rgba(255,255,255,0.62)"
              />
              <Text style={styles.emptyTitle}>No payouts on record</Text>
              <Text style={styles.emptyBody}>
                Once a deal disburses to this athlete, the row appears here with
                full source attribution.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.statsRow}>
                <StatPill
                  value={formatMoney(summary.totals.gross.cents)}
                  label="Gross"
                  size="sm"
                />
                <StatPill
                  value={formatMoney(summary.totals.taxSetAside.cents)}
                  label={`Tax · ${taxPct}%`}
                  tint={TONE_COLOR.warning}
                  size="sm"
                />
                <StatPill
                  value={formatMoney(summary.totals.net.cents)}
                  label="Net"
                  tint={TONE_COLOR.success}
                  size="sm"
                />
              </View>

              <View style={styles.statsRow}>
                <StatPill
                  value={formatMoney(summary.totals.paidYtd.cents)}
                  label="Paid YTD"
                  tint={TONE_COLOR.success}
                  size="sm"
                />
                <StatPill
                  value={formatMoney(summary.totals.pendingPayout.cents)}
                  label="Pending"
                  tint={TONE_COLOR.info}
                  size="sm"
                />
              </View>

              <View style={styles.taxBanner}>
                <Ionicons
                  name="warning-outline"
                  size={15}
                  color={TONE_COLOR.warning}
                />
                <Text style={styles.taxBannerText}>
                  Set aside ~{taxPct}% for federal + state. This estimate is not tax advice.
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRail}
              >
                {FILTER_TABS.map((tab) => {
                  const isActive = tab.id === filter;
                  return (
                    <Pressable
                      key={tab.id}
                      onPress={() => setFilter(tab.id)}
                      style={[
                        styles.filterChip,
                        isActive && styles.filterChipActive,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      accessibilityLabel={`Filter by ${tab.label}`}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          isActive && styles.filterChipTextActive,
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.rows}>
                {filteredItems.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyTitle}>No items match</Text>
                    <Text style={styles.emptyBody}>
                      Try a different filter — or wait for the next disbursement.
                    </Text>
                  </View>
                ) : (
                  filteredItems.map((item) => <PayoutRow key={item.id} item={item} />)
                )}
              </View>

              <Text style={styles.footnote}>{TAX_FOOTNOTE}</Text>
            </>
          )}
        </ScrollView>
      </View>
    </>
  );
}

function PayoutRow({ item }: { item: AthletePayoutItem }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHead}>
        <View style={styles.rowMain}>
          <Text style={styles.rowBrand} numberOfLines={1}>
            {item.brandLabel}
          </Text>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {CATEGORY_LABELS[item.category]} · {formatDate(item.date)}
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.rowAmount}>
            {formatMoney(item.amountCents.cents)}
          </Text>
          <StatusPill
            label={STATUS_LABEL[item.status]}
            tone={STATUS_TONE[item.status]}
            size="sm"
          />
        </View>
      </View>
      {item.note ? <Text style={styles.rowNote}>{item.note}</Text> : null}
    </View>
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
    alignItems: 'center',
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
    letterSpacing: -0.3,
    lineHeight: 26,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  taxBanner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${TONE_COLOR.warning}55`,
    backgroundColor: `${TONE_COLOR.warning}1C`,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  taxBannerText: {
    color: TONE_COLOR.warning,
    fontSize: 11.5,
    fontWeight: '700',
    flex: 1,
    lineHeight: 15,
  },
  filterRail: {
    gap: 8,
  },
  filterChip: {
    borderRadius: RADIUS_PILL,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipActive: {
    borderColor: `${TONE_COLOR.accent}88`,
    backgroundColor: `${TONE_COLOR.accent}26`,
  },
  filterChipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  rows: {
    gap: 8,
  },
  row: {
    gap: 8,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    padding: 12,
  },
  rowHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
  rowBrand: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  rowMeta: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '600',
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  rowAmount: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
  rowNote: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    paddingHorizontal: 2,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CARD_BG_INSET,
  },
  emptyBox: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 28,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  emptyBody: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    textAlign: 'center',
  },
  footnote: {
    color: 'rgba(255,255,255,0.46)',
    fontSize: 10.5,
    fontWeight: '500',
    fontStyle: 'italic',
    lineHeight: 14,
    marginTop: 4,
  },
});
