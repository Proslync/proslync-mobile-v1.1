// ── BRAND · OPEN DEAL CARD ────────────────────────────────
// Sprint 2.3 row representation for an OpenDeal. Used in the Brand HQ
// Pipeline tab and (later) any other listing surface. Tap → routes to
// `/brand/open-deals/[id]`.
//
// Visual tokens match `deal-detail-spine`:
//   radius 10, border rgba(255,255,255,0.10), bg rgba(255,255,255,0.055)
//   accent #EB621A (orange), teal #00C6B0, violet #C8A2FF

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusPill } from '@/components/shared/ui-kit';
import type {
  OpenDealStatus,
  OpenDealSurfaceRecord,
} from '@/lib/types/open-deal.types';

const ACCENT = '#EB621A';
const TEAL = '#00C6B0';
const VIOLET = '#C8A2FF';
const WARN = '#FFD60A';

type StatusTone = 'live' | 'reviewing' | 'awarded' | 'closed' | 'draft';

function statusTone(status: OpenDealStatus): StatusTone {
  switch (status) {
    case 'live':
    case 'open':
      return 'live';
    case 'reviewing':
      return 'reviewing';
    case 'awarded':
      return 'awarded';
    case 'closed':
    case 'closed-filled':
    case 'closed-cancelled':
      return 'closed';
    case 'draft':
    default:
      return 'draft';
  }
}

function statusLabel(status: OpenDealStatus): string {
  const tone = statusTone(status);
  return tone === 'live'
    ? 'Live'
    : tone === 'reviewing'
      ? 'Reviewing'
      : tone === 'awarded'
        ? 'Awarded'
        : tone === 'closed'
          ? 'Closed'
          : 'Draft';
}

function statusColor(status: OpenDealStatus): string {
  const tone = statusTone(status);
  return tone === 'live'
    ? TEAL
    : tone === 'reviewing'
      ? ACCENT
      : tone === 'awarded'
        ? VIOLET
        : tone === 'closed'
          ? 'rgba(255,255,255,0.45)'
          : WARN;
}

function formatMoney(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(2).replace(/\.00$/, '')}M`;
  if (dollars >= 1_000) return `$${Math.round(dollars / 1_000)}K`;
  return `$${dollars.toFixed(0)}`;
}

function formatDeadline(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export interface OpenDealCardProps {
  record: OpenDealSurfaceRecord;
  onPress?: (id: string) => void;
}

export function OpenDealCard({ record, onPress }: OpenDealCardProps) {
  const { deal, budget, slots, applicants, source, deadline } = record;
  const color = statusColor(deal.status);
  const label = statusLabel(deal.status);
  const budgetBand = `${formatMoney(budget.low.cents)}–${formatMoney(budget.high.cents)}`;
  const applicantCount = applicants.length;
  const slotsLabel = slots === 1 ? '1 slot' : `${slots} slots`;
  const exclusivityLabel = deal.exclusivityRequired ? 'Exclusive' : 'Non-exclusive';

  return (
    <Pressable
      onPress={() => onPress?.(deal.id)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Open deal ${deal.title}`}
    >
      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>OPEN DEAL · {deal.category.toUpperCase()}</Text>
          <Text style={styles.title} numberOfLines={2}>{deal.title}</Text>
        </View>
        <StatusPill label={label} color={color} />
      </View>

      <View style={styles.metricRow}>
        <Metric label="Budget" value={budgetBand} accent={ACCENT} />
        <Metric label="Slots" value={slotsLabel} accent={TEAL} />
        <Metric label="Applicants" value={String(applicantCount)} accent={VIOLET} />
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.55)" />
        <Text style={styles.metaText}>Deadline {formatDeadline(deadline)}</Text>
        <View style={styles.metaDot} />
        <Ionicons name="lock-closed-outline" size={12} color="rgba(255,255,255,0.55)" />
        <Text style={styles.metaText}>{exclusivityLabel}</Text>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.sourceBadge}>
          <Ionicons name="flask-outline" size={11} color="rgba(255,255,255,0.55)" />
          <Text style={styles.sourceText}>{source.label}</Text>
        </View>
        <View style={styles.openCta}>
          <Text style={styles.openCtaText}>Review</Text>
          <Ionicons name="chevron-forward" size={14} color={ACCENT} />
        </View>
      </View>
    </Pressable>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color: accent }]} numberOfLines={1}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.055)',
    padding: 14,
  },
  cardPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  flex: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metric: {
    flex: 1,
    gap: 4,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaText: {
    color: 'rgba(255,255,255,0.60)',
    fontSize: 11,
    fontWeight: '700',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.28)',
    marginHorizontal: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sourceText: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 10,
    fontWeight: '800',
  },
  openCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  openCtaText: {
    color: ACCENT,
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
