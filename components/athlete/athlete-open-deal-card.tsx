// ── ATHLETE · OPEN DEAL CARD ──────────────────────────────
// Sprint 2.3 athlete-side row representation for an OpenDeal. Visually
// related to `components/brand/open-deal-card.tsx` but reframed for the
// athlete viewer: surfaces match reasons + an APPLY-or-OPEN affordance
// instead of brand-side review CTA.
//
// Tap → routes to `/athlete/opportunities/[id]`.
//
// Visual tokens match `deal-detail-spine`:
//   radius 10, border rgba(255,255,255,0.10), bg rgba(255,255,255,0.055)
//   accent #EB621A (orange), teal #00C6B0, violet #C8A2FF

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusPill } from '@/components/shared/ui-kit';
import type { OpenDealSurfaceRecord } from '@/lib/types/open-deal.types';

const ACCENT = '#EB621A';
const TEAL = '#00C6B0';
const VIOLET = '#C8A2FF';

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

export interface AthleteOpenDealCardProps {
  record: OpenDealSurfaceRecord;
  /** First match reason for the inline preview ("Why this matches you"). */
  primaryReason?: string;
  onPress?: (id: string) => void;
}

export function AthleteOpenDealCard({
  record,
  primaryReason,
  onPress,
}: AthleteOpenDealCardProps) {
  const { deal, brandLabel, budget, slots, deadline } = record;
  const budgetBand = `${formatMoney(budget.low.cents)}–${formatMoney(budget.high.cents)}`;
  const slotsLabel = slots === 1 ? '1 slot' : `${slots} slots`;
  const exclusivityLabel = deal.exclusivityRequired ? 'Exclusive' : 'Non-exclusive';

  return (
    <Pressable
      onPress={() => onPress?.(deal.id)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Open deal ${deal.title} from ${brandLabel}`}
    >
      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>OPEN DEAL · {deal.category.toUpperCase()}</Text>
          <Text style={styles.title} numberOfLines={2}>{deal.title}</Text>
          <Text style={styles.brand} numberOfLines={1}>{brandLabel}</Text>
        </View>
        <StatusPill label="Match" color={TEAL} />
      </View>

      <View style={styles.metricRow}>
        <Metric label="Budget" value={budgetBand} accent={ACCENT} />
        <Metric label="Slots" value={slotsLabel} accent={TEAL} />
        <Metric label="Deadline" value={formatDeadline(deadline)} accent={VIOLET} />
      </View>

      {primaryReason ? (
        <View style={styles.reasonRow}>
          <Ionicons name="sparkles-outline" size={12} color={VIOLET} />
          <Text style={styles.reasonText} numberOfLines={2}>{primaryReason}</Text>
        </View>
      ) : null}

      <View style={styles.metaRow}>
        <Ionicons name="lock-closed-outline" size={12} color="rgba(255,255,255,0.55)" />
        <Text style={styles.metaText}>{exclusivityLabel}</Text>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.gateBadge}>
          <Ionicons name="shield-half-outline" size={11} color={ACCENT} />
          <Text style={styles.gateText}>AI rank + human approval</Text>
        </View>
        <View style={styles.openCta}>
          <Text style={styles.openCtaText}>View & apply</Text>
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
  brand: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 4,
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
  reasonRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(200,162,255,0.32)',
    backgroundColor: 'rgba(200,162,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  reasonText: {
    flex: 1,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11.5,
    fontWeight: '600',
    lineHeight: 15,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: 'rgba(255,255,255,0.60)',
    fontSize: 11,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  gateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${ACCENT}55`,
    backgroundColor: `${ACCENT}14`,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  gateText: {
    color: ACCENT,
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
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
