// components/athlete/truth-strip.tsx
// ── TRUTH STRIP ────────────────────────────────────────────────────────
// Compact always-visible strip at the top of AthleteStatsSection (default tab).
// Shows the NIL Go disclosure countdown (Row 1, copper, act-now only) and
// a one-line payment summary (Row 2, always).
//
// Laws (spec §6 E):
//   - Money: tabular numerals, never animated.
//   - Copper: countdown chip only (act-now). Not used elsewhere in this component.
//   - Touch targets: ≥44pt on the countdown chip (minHeight: 44).
//   - No new animations.
//   - Renders sanely with EMPTY_DEAL_TRUTH (defaults to fixture).
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useStableRouter } from '@/hooks/use-stable-router';
import { CARD_BG, CARD_BORDER } from '@/components/shared/ui-kit/tokens';
import {
  truthSummary,
  nextDisclosureDeadline,
  hoursUntilISO,
  thresholdForHours,
} from '@/lib/athlete/truth';
import { DEAL_TRUTH_FIXTURE } from '@/lib/data/mock-deal-truth';
import type { DealTruth } from '@/lib/athlete/truth';

const COPPER = '#EB621A';
const RED = '#FF3B30';
const AMBER = '#FFD60A';

function formatMoney(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString('en-US')}`;
}

function formatPaidDate(isoString: string): string {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCountdownLabel(hours: number | null): string {
  if (hours === null) return 'overdue';
  if (hours < 1) return '<1h left';
  if (hours < 24) return `${Math.floor(hours)}h left`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} left`;
}

interface TruthStripProps {
  deals?: DealTruth[];
}

export function TruthStrip({ deals = DEAL_TRUTH_FIXTURE }: TruthStripProps) {
  const router = useStableRouter();

  const urgentDeal = nextDisclosureDeadline(deals);
  const summary = truthSummary(deals);

  // ── Row 1: Disclosure countdown chip (only when an undisclosed deal exists) ──
  let disclosureChip: React.ReactNode = null;
  if (urgentDeal) {
    const hours = hoursUntilISO(urgentDeal.disclosure.deadlineISO ?? undefined);
    const threshold = thresholdForHours(hours);
    const textColor = threshold === 'red' ? RED : threshold === 'amber' ? AMBER : COPPER;
    const countdownLabel = formatCountdownLabel(hours);

    disclosureChip = (
      <Pressable
        style={styles.disclosureChip}
        onPress={() => router.push('/athlete/disclosures')}
        accessibilityRole="button"
        accessibilityLabel={`Report ${urgentDeal.brand} deal to NIL Go. ${countdownLabel}`}
      >
        <Ionicons name="time-outline" size={13} color={textColor} />
        <Text style={[styles.disclosureText, { color: textColor }]} numberOfLines={1}>
          {'Report '}
          {urgentDeal.brand}
          {' deal to NIL Go'}
          <Text style={styles.disclosureCountdown}>{' · '}{countdownLabel}</Text>
        </Text>
        <Ionicons name="chevron-forward" size={11} color={textColor} />
      </Pressable>
    );
  }

  // ── Row 2: Payment summary one-liner (always present) ──
  const segments: string[] = [];
  if (summary.expectedCents > 0) {
    segments.push(`${formatMoney(summary.expectedCents)} expected`);
  }
  if (summary.inReviewCount > 0) {
    segments.push(`${summary.inReviewCount} in CSC review`);
  }
  if (summary.lastPaid) {
    const dateStr = formatPaidDate(summary.lastPaid.dateISO);
    segments.push(`last paid ${dateStr} ✓`);
  }
  const summaryLine =
    segments.length > 0 ? segments.join(' · ') : 'No active deals — all clear';

  return (
    <View style={styles.strip}>
      {disclosureChip}
      <Text style={styles.summaryLine} numberOfLines={1}>
        {summaryLine}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 7,
  },
  disclosureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COPPER,
    backgroundColor: 'rgba(235,98,26,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    minHeight: 44, // ≥44pt touch target (spec §6 E)
  },
  disclosureText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
    fontVariant: ['tabular-nums'],
  },
  disclosureCountdown: {
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  summaryLine: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0,
  },
});
