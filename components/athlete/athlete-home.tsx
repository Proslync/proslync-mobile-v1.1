// components/athlete/athlete-home.tsx
// ── ATHLETE OWNER HOME ─────────────────────────────────────────────────────
// Charter §A — thin three-module owner screen. NO vanity, NO hub commands.
// Modules: MONEY · DUE FROM YOU · DEAL STATUS
// All data from DEAL_TRUTH_FIXTURE selectors + DEMO_DEAL engine milestones.
// No animations (charter law).

import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

import {
  truthSummary,
  upcomingDeliverables,
  nextDisclosureDeadline,
  hoursUntilISO,
  thresholdForHours,
} from '@/lib/athlete/truth';
import { DEAL_TRUTH_FIXTURE } from '@/lib/data/mock-deal-truth';
import { DEAL_ENGINE_STORAGE_KEY, DEMO_DEAL } from '@/lib/data/mock-deal-engine';
import type { EngineDeal } from '@/lib/types/deal-engine.types';
import type { DealTruth } from '@/lib/athlete/truth';

const COPPER = '#EB621A';
const RED = '#FF3B30';
const AMBER = '#FFD60A';
const GREEN = '#34C759';
const CARD_BG = '#1C1C1E';
const CARD_BORDER = 'rgba(255,255,255,0.07)';
const MUTED = 'rgba(255,255,255,0.55)';

// ── Helpers ───────────────────────────────────────────────────────────────

function formatMoney(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString('en-US')}`;
}

function formatShortDate(isoString: string): string {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function countdownLabel(hours: number | null): string {
  if (hours === null) return 'overdue';
  if (hours < 1) return '<1h';
  if (hours < 24) return `${Math.floor(hours)}h`;
  return `${Math.floor(hours / 24)}d`;
}

// ── Section header — 4px copper bar + caps label ──────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionBar} />
      <Text style={s.sectionLabel}>{label}</Text>
    </View>
  );
}

// ── MODULE 1: MONEY ────────────────────────────────────────────────────────

function MoneyModule({ deals }: { deals: DealTruth[] }) {
  const summary = truthSummary(deals);

  // Build the one-line sub-text (mirrors TruthStrip summaryLine but never animated)
  const segments: string[] = [];
  if (summary.expectedCents > 0) {
    segments.push(`${formatMoney(summary.expectedCents)} expected`);
  }
  if (summary.inReviewCount > 0) {
    segments.push(`${summary.inReviewCount} in CSC review`);
  }
  if (summary.lastPaid) {
    segments.push(`last paid ${formatShortDate(summary.lastPaid.dateISO)} ✓`);
  }
  const summaryLine =
    segments.length > 0 ? segments.join(' · ') : 'No active deals — all clear';

  // Paid-this-season: sum all paid deals (paymentState === 'paid')
  const paidThisSeason = deals
    .filter((d) => d.paymentState === 'paid')
    .reduce((acc, d) => acc + d.amountCents, 0);

  // Tax set-aside: sum taxSetAsideCents on paid deals (charter fixture §7)
  const taxSetAside = deals
    .filter((d) => d.paymentState === 'paid' && d.taxSetAsideCents)
    .reduce((acc, d) => acc + (d.taxSetAsideCents ?? 0), 0);

  return (
    <View style={s.card}>
      <SectionHeader label="MONEY" />
      {/* Big paid-this-season figure — tabular, never animated (charter law) */}
      <Text style={s.moneyBig}>{formatMoney(paidThisSeason)}</Text>
      <Text style={s.moneyLabel}>paid this season</Text>
      {/* One-line summary: expected · CSC review · last paid */}
      <Text style={s.moneySubLine} numberOfLines={1}>{summaryLine}</Text>
      {/* Tax set-aside line */}
      {taxSetAside > 0 && (
        <Text style={s.taxLine}>
          Set aside ~{formatMoney(taxSetAside)} for taxes
        </Text>
      )}
    </View>
  );
}

// ── MODULE 2: DUE FROM YOU ─────────────────────────────────────────────────

interface DueRow {
  key: string;
  label: string;
  subLabel: string;
  hours: number | null;
  urgency: 'red' | 'amber' | 'green';
}

function buildDueRows(deals: DealTruth[], engineDeals: EngineDeal[]): DueRow[] {
  const rows: DueRow[] = [];

  // 1. NIL Go disclosure countdowns (undisclosed deals)
  const urgentDisclosure = nextDisclosureDeadline(deals);
  if (urgentDisclosure) {
    const hours = hoursUntilISO(urgentDisclosure.disclosure.deadlineISO ?? undefined);
    rows.push({
      key: `disclosure-${urgentDisclosure.dealId}`,
      label: `Report ${urgentDisclosure.brand} to NIL Go`,
      subLabel: `${countdownLabel(hours)} left`,
      hours,
      urgency: thresholdForHours(hours),
    });
  }

  // 2. Upcoming deliverables (not done, from truth fixture)
  const upcoming = upcomingDeliverables(deals, 3);
  for (const del of upcoming) {
    const hours = hoursUntilISO(del.dueISO);
    rows.push({
      key: `del-${del.dealId}-${del.label}`,
      label: del.label,
      subLabel: `${del.brand} · due ${formatShortDate(del.dueISO)}`,
      hours,
      urgency: thresholdForHours(hours),
    });
  }

  // 3. Engine deal submitted milestones (waiting brand review)
  for (const deal of engineDeals) {
    for (const ms of deal.milestones) {
      if (ms.status === 'submitted') {
        rows.push({
          key: `ms-${ms.id}`,
          label: ms.description.length > 50 ? ms.description.slice(0, 47) + '…' : ms.description,
          subLabel: `${deal.brand} · submitted, awaiting review`,
          hours: null,
          urgency: 'green',
        });
      }
    }
  }

  // Charter: max 4 rows
  return rows.slice(0, 4);
}

function DueFromYouModule({
  deals,
  engineDeals,
  onNavigateToDeals,
}: {
  deals: DealTruth[];
  engineDeals: EngineDeal[];
  onNavigateToDeals: () => void;
}) {
  const rows = buildDueRows(deals, engineDeals);

  return (
    <View style={s.card}>
      <SectionHeader label="DUE FROM YOU" />
      {rows.length === 0 ? (
        <Text style={s.emptyText}>Nothing due — you're clear.</Text>
      ) : (
        rows.map((row) => {
          const dotColor =
            row.urgency === 'red' ? RED : row.urgency === 'amber' ? AMBER : COPPER;
          return (
            <Pressable
              key={row.key}
              style={s.dueRow}
              onPress={onNavigateToDeals}
              accessibilityRole="button"
              accessibilityLabel={`${row.label} — tap to view deals`}
            >
              <View style={[s.dueDot, { backgroundColor: dotColor }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.dueLabel} numberOfLines={1}>{row.label}</Text>
                <Text style={s.dueSub} numberOfLines={1}>{row.subLabel}</Text>
              </View>
              <Ionicons name="chevron-forward" size={13} color={MUTED} />
            </Pressable>
          );
        })
      )}
    </View>
  );
}

// ── MODULE 3: DEAL STATUS ──────────────────────────────────────────────────

type PaymentStateAlias = DealTruth['paymentState'];

function paymentStateChip(state: PaymentStateAlias): { label: string; color: string; bg: string } {
  switch (state) {
    case 'expected': return { label: 'EXPECTED', color: COPPER, bg: 'rgba(235,98,26,0.14)' };
    case 'in-review': return { label: 'CSC REVIEW', color: AMBER, bg: 'rgba(255,214,10,0.14)' };
    case 'cleared': return { label: 'CLEARED', color: GREEN, bg: 'rgba(52,199,89,0.14)' };
    case 'paid': return { label: 'PAID', color: GREEN, bg: 'rgba(52,199,89,0.14)' };
    default: return { label: (state as string).toUpperCase(), color: MUTED, bg: 'rgba(255,255,255,0.07)' };
  }
}

function disclosureNilGoChip(deal: DealTruth): { label: string; color: string } | null {
  if (deal.disclosure.state !== 'undisclosed') return null;
  const hours = hoursUntilISO(deal.disclosure.deadlineISO ?? undefined);
  const urgency = thresholdForHours(hours);
  const color = urgency === 'red' ? RED : urgency === 'amber' ? AMBER : COPPER;
  const label =
    hours === null
      ? 'NIL Go OVERDUE'
      : hours < 24
        ? `NIL Go ${Math.floor(hours)}h`
        : `NIL Go ${Math.floor(hours / 24)}d`;
  return { label, color };
}

function DealStatusModule({
  deals,
  onNavigateToDeals,
}: {
  deals: DealTruth[];
  onNavigateToDeals: () => void;
}) {
  const activeDeals = deals.filter((d) => d.paymentState !== 'paid');

  return (
    <View style={s.card}>
      <SectionHeader label="DEAL STATUS" />
      {activeDeals.length === 0 ? (
        <Text style={s.emptyText}>No active deals.</Text>
      ) : (
        activeDeals.map((deal, idx) => {
          const pmtChip = paymentStateChip(deal.paymentState);
          const nilGoChip = disclosureNilGoChip(deal);
          return (
            <Pressable
              key={deal.dealId}
              style={[s.dealRow, idx > 0 && s.dealRowBorder]}
              onPress={onNavigateToDeals}
              accessibilityRole="button"
              accessibilityLabel={`${deal.brand} — tap to view deals`}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.dealBrand} numberOfLines={1}>{deal.brand}</Text>
                <Text style={s.dealTitle} numberOfLines={1}>{deal.title}</Text>
              </View>
              <View style={s.chipsRow}>
                <View style={[s.chip, { backgroundColor: pmtChip.bg }]}>
                  <Text style={[s.chipText, { color: pmtChip.color }]}>{pmtChip.label}</Text>
                </View>
                {nilGoChip && (
                  <View style={[s.chip, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                    <Text style={[s.chipText, { color: nilGoChip.color }]}>{nilGoChip.label}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────

export interface AthleteHomeProps {
  onNavigateToDeals: () => void;
  onScroll?: React.ComponentProps<typeof Animated.ScrollView>['onScroll'];
  scrollEventThrottle?: number;
}

export function AthleteHome({ onNavigateToDeals, onScroll, scrollEventThrottle }: AthleteHomeProps) {
  const [engineDeals, setEngineDeals] = React.useState<EngineDeal[]>([DEMO_DEAL]);

  // Hydrate stored deals from AsyncStorage on focus (same pattern as athlete-deals-section)
  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      AsyncStorage.getItem(DEAL_ENGINE_STORAGE_KEY)
        .then((raw) => {
          if (cancelled) return;
          const stored: EngineDeal[] = raw ? JSON.parse(raw) : [];
          // Always include DEMO_DEAL so the screen is non-empty in dev
          const ids = new Set(stored.map((d) => d.dealId));
          const merged = ids.has(DEMO_DEAL.dealId) ? stored : [DEMO_DEAL, ...stored];
          setEngineDeals(merged);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const deals = DEAL_TRUTH_FIXTURE;

  return (
    <Animated.ScrollView
      style={s.scroll}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
    >
      <MoneyModule deals={deals} />
      <DueFromYouModule
        deals={deals}
        engineDeals={engineDeals}
        onNavigateToDeals={onNavigateToDeals}
      />
      <DealStatusModule deals={deals} onNavigateToDeals={onNavigateToDeals} />
    </Animated.ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  sectionBar: {
    width: 4,
    height: 14,
    borderRadius: 2,
    backgroundColor: COPPER,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: COPPER,
  },
  // MONEY
  moneyBig: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
    lineHeight: 44,
  },
  moneyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: -4,
  },
  moneySubLine: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  taxLine: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,214,10,0.8)',
    marginTop: 2,
  },
  // DUE FROM YOU
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    color: MUTED,
    paddingVertical: 4,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CARD_BORDER,
  },
  dueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  dueLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  dueSub: {
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
    marginTop: 1,
  },
  // DEAL STATUS
  dealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  dealRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CARD_BORDER,
  },
  dealBrand: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  dealTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
    marginTop: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    maxWidth: 140,
  },
  chip: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
