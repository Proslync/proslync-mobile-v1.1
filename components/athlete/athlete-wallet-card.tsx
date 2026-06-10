// ── ATHLETE WALLET CARD ──────────────────────────────────
// W31 (PLAN §5 P1) — visual card surfacing the athlete payout split
// (gross / tax-set-aside / net / pending) plus a yellow tax-warning
// banner, a category breakdown chip rail, and the 5 most-recent
// payout rows.
//
// TAX-ADVICE DISCIPLINE: the set-aside number is a SUGGESTION
// (`suggestedTaxRateBp`, hand-authored 24%). Banner copy must restate
// "estimate, this is not tax advice" — see `TAX_BANNER_COPY` below.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  CARD_BG,
  CARD_BG_INSET,
  CARD_BORDER,
  RADIUS_MD,
  RADIUS_SM,
  StatPill,
  StatusPill,
  TONE_COLOR,
} from '@/components/shared/ui-kit';
import type {
  AthletePayoutCategory,
  AthletePayoutItem,
  AthletePayoutItemStatus,
  AthletePayoutSummary,
} from '@/lib/types/athlete-payout.types';

const TAX_BANNER_COPY =
  'Set aside ~24% for federal + state. This estimate is not tax advice.';

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

function formatMoney(cents: number): string {
  const dollars = Math.round(cents / 100);
  return `$${dollars.toLocaleString()}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function rollByCategory(
  items: AthletePayoutItem[],
): { category: AthletePayoutCategory; cents: number }[] {
  const map = new Map<AthletePayoutCategory, number>();
  for (const item of items) {
    if (item.category === 'tax-withhold-reserve') continue;
    map.set(
      item.category,
      (map.get(item.category) ?? 0) + item.amountCents.cents,
    );
  }
  return Array.from(map.entries())
    .map(([category, cents]) => ({ category, cents }))
    .sort((a, b) => b.cents - a.cents);
}

export interface AthleteWalletCardProps {
  summary: AthletePayoutSummary;
}

export function AthleteWalletCard({ summary }: AthleteWalletCardProps) {
  const { totals, items, suggestedTaxRateBp, capContextNote } = summary;
  const taxPct = (suggestedTaxRateBp / 100).toFixed(0);
  const recent = React.useMemo(
    () =>
      [...items]
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 5),
    [items],
  );
  const categoryRoll = React.useMemo(() => rollByCategory(items), [items]);

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <Ionicons name="wallet-outline" size={16} color={TONE_COLOR.accent} />
        <Text style={styles.title}>Payout breakdown</Text>
        <Text style={styles.periodLabel}>{summary.period.label}</Text>
      </View>

      {/* Hero stats — 4 tiles */}
      <View style={styles.statsRow}>
        <StatPill
          value={formatMoney(totals.gross.cents)}
          label="Gross"
          size="sm"
        />
        <StatPill
          value={formatMoney(totals.taxSetAside.cents)}
          label={`Tax · ${taxPct}%`}
          tint={TONE_COLOR.warning}
          size="sm"
        />
        <StatPill
          value={formatMoney(totals.net.cents)}
          label="Net"
          tint={TONE_COLOR.success}
          size="sm"
        />
        <StatPill
          value={formatMoney(totals.pendingPayout.cents)}
          label="Pending"
          tint={TONE_COLOR.info}
          size="sm"
        />
      </View>

      {/* Tax warning banner — yellow tone */}
      <View style={styles.taxBanner}>
        <Ionicons name="warning-outline" size={15} color={TONE_COLOR.warning} />
        <Text style={styles.taxBannerText}>{TAX_BANNER_COPY}</Text>
      </View>

      {/* Category breakdown — horizontal-scroll chip rail */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>By category</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRail}
        >
          {categoryRoll.map((row) => (
            <View key={row.category} style={styles.chip}>
              <Text style={styles.chipLabel}>{CATEGORY_LABELS[row.category]}</Text>
              <Text style={styles.chipValue}>{formatMoney(row.cents)}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Recent payouts — 5 most recent rows */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Recent payouts</Text>
        <View style={styles.rows}>
          {recent.map((item) => (
            <View key={item.id} style={styles.row}>
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
          ))}
        </View>
      </View>

      <Text style={styles.capContextNote}>{capContextNote}</Text>
    </View>
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
  headRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    flex: 1,
  },
  periodLabel: {
    color: 'rgba(255,255,255,0.46)',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
  section: {
    gap: 8,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.46)',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  chipRail: {
    gap: 8,
  },
  chip: {
    gap: 2,
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG_INSET,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minWidth: 96,
  },
  chipLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  chipValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  rows: {
    gap: 8,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG_INSET,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
  rowBrand: {
    color: '#FFFFFF',
    fontSize: 13,
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
    fontSize: 13,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
  capContextNote: {
    color: 'rgba(255,255,255,0.46)',
    fontSize: 10.5,
    fontWeight: '500',
    fontStyle: 'italic',
    lineHeight: 14,
  },
});
