// components/deal/deal-enrichment-card.tsx
// ── LIVE-PRIMITIVE ENRICHMENT (Step 3) ──────────────────────────────────────
// Joins the deal-detail packet to the live money/FMV/clearance/escrow engines
// via the id-bridge in lib/data/deal-enrichment.ts and renders the matches as
// a cohesive section inside the deal spine. Every sub-block is conditional —
// when the bridge has no match the block is omitted (no empty/broken UI).
//
// Styled with the canonical design tokens: copper is the single accent;
// green/red are SIGNALS only; money is tabular-nums.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SectionCard } from '@/components/shared/ui-kit';
import {
  ACCENT,
  HAIRLINE_SUBTLE,
  RADIUS_SM,
  SIGNAL_NEGATIVE,
  SIGNAL_POSITIVE,
  SIGNAL_WARN,
  SP_XS,
  SP_SM,
  SP_MD,
  SURFACE_SUBTLE,
  TEXT,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
} from '@/components/shared/ui-kit/tokens';
import type { BrandDealDetail } from '@/lib/data/mock-brand-data';
import { buildDealEnrichment, type DealEnrichment } from '@/lib/data/deal-enrichment';

export function DealEnrichmentCard({ detail }: { detail: BrandDealDetail }) {
  const enrichment: DealEnrichment = React.useMemo(
    () => buildDealEnrichment(detail),
    [detail],
  );

  // Nothing bridged → render nothing (the spine stays clean).
  if (
    !enrichment.payment &&
    !enrichment.fmv &&
    !enrichment.nilGo &&
    !enrichment.escrow &&
    !enrichment.clearanceStatus
  ) {
    return null;
  }

  return (
    <SectionCard title="Live deal intelligence" icon="pulse-outline">
      <Text style={styles.intro}>
        Joined from the live payment-truth, fair-market, and escrow engines for this deal.
      </Text>

      {enrichment.payment ? <PaymentTruthBlock data={enrichment.payment} /> : null}
      {enrichment.fmv ? <FmvBlock data={enrichment.fmv} /> : null}
      {enrichment.clearanceStatus ? <ClearanceStatusBlock data={enrichment.clearanceStatus} /> : null}
      {enrichment.nilGo ? <NilGoBlock data={enrichment.nilGo} /> : null}
      {enrichment.escrow ? <EscrowBlock data={enrichment.escrow} /> : null}
    </SectionCard>
  );
}

function paymentTone(state: string): string {
  if (state === 'paid' || state === 'cleared') return SIGNAL_POSITIVE;
  if (state === 'in-review') return SIGNAL_WARN;
  return ACCENT;
}

function PaymentTruthBlock({ data }: { data: NonNullable<DealEnrichment['payment']> }) {
  const tone = paymentTone(data.state);
  return (
    <View style={styles.block}>
      <View style={styles.blockHead}>
        <Text style={styles.microLabel}>Payment truth</Text>
        <View style={[styles.pill, { borderColor: `${tone}55`, backgroundColor: `${tone}1A` }]}>
          <View style={[styles.dot, { backgroundColor: tone }]} />
          <Text style={[styles.pillText, { color: tone }]}>{data.stateLabel}</Text>
        </View>
      </View>
      <View style={styles.kvRow}>
        <Text style={styles.kvLabel}>Amount</Text>
        <Text style={styles.kvValue}>{data.amount}</Text>
      </View>
      {data.taxSetAside ? (
        <View style={styles.kvRow}>
          <Text style={styles.kvLabel}>Tax set-aside</Text>
          <Text style={styles.kvValue}>{data.taxSetAside}</Text>
        </View>
      ) : null}
      {data.paidAt ? (
        <View style={styles.kvRow}>
          <Text style={styles.kvLabel}>Settled</Text>
          <Text style={styles.kvValueMuted}>{formatDate(data.paidAt)}</Text>
        </View>
      ) : null}
    </View>
  );
}

function FmvBlock({ data }: { data: NonNullable<DealEnrichment['fmv']> }) {
  const tone =
    data.bandLabel === 'Likely to clear'
      ? SIGNAL_POSITIVE
      : data.bandLabel === 'Unlikely to clear as written'
        ? SIGNAL_NEGATIVE
        : SIGNAL_WARN;
  return (
    <View style={styles.block}>
      <View style={styles.blockHead}>
        <Text style={styles.microLabel}>FMV band + clearance read</Text>
        <View style={[styles.pill, { borderColor: `${tone}55`, backgroundColor: `${tone}1A` }]}>
          <Text style={[styles.pillText, { color: tone }]}>{data.bandLabel}</Text>
        </View>
      </View>
      <View style={styles.kvRow}>
        <Text style={styles.kvLabel}>Deal amount</Text>
        <Text style={styles.kvValue}>{data.amount}</Text>
      </View>
      <View style={styles.kvRow}>
        <Text style={styles.kvLabel}>Modeled band</Text>
        <Text style={styles.kvValue}>{data.band}</Text>
      </View>
      <View style={styles.kvRow}>
        <Text style={styles.kvLabel}>Midpoint</Text>
        <Text style={styles.kvValueMuted}>
          {data.point} · {data.confidence} confidence
        </Text>
      </View>
      <Text style={styles.reason}>{data.reason}</Text>
      <View style={styles.disclaimerBox}>
        <Ionicons name="information-circle-outline" size={13} color={TEXT_TERTIARY} />
        <Text style={styles.disclaimerText}>{data.disclaimer}</Text>
      </View>
    </View>
  );
}

function ClearanceStatusBlock({ data }: { data: NonNullable<DealEnrichment['clearanceStatus']> }) {
  const tone = data.cleared ? SIGNAL_POSITIVE : ACCENT;
  return (
    <View style={styles.block}>
      <View style={styles.blockHead}>
        <Text style={styles.microLabel}>Clearance status</Text>
        <View style={[styles.pill, { borderColor: `${tone}55`, backgroundColor: `${tone}1A` }]}>
          {data.cleared ? <Ionicons name="checkmark-circle" size={12} color={tone} /> : null}
          <Text style={[styles.pillText, { color: tone }]}>{data.label}</Text>
        </View>
      </View>
      <Text style={styles.reason}>
        This deal is executed — clearance is settled, so the forward-looking
        fair-market read no longer applies. Payment and escrow status below stay live.
      </Text>
    </View>
  );
}

function NilGoBlock({ data }: { data: NonNullable<DealEnrichment['nilGo']> }) {
  const hrs = data.hoursRemaining;
  const tone = hrs === null ? TEXT_TERTIARY : hrs <= 24 ? SIGNAL_NEGATIVE : hrs <= 72 ? SIGNAL_WARN : SIGNAL_POSITIVE;
  const remaining =
    hrs === null
      ? 'Deadline set'
      : hrs <= 0
        ? 'Overdue'
        : hrs < 48
          ? `${Math.round(hrs)}h left`
          : `${Math.round(hrs / 24)}d left`;
  return (
    <View style={styles.block}>
      <View style={styles.blockHead}>
        <Text style={styles.microLabel}>NIL Go deadline</Text>
        <View style={[styles.pill, { borderColor: `${tone}55`, backgroundColor: `${tone}1A` }]}>
          <Ionicons name="time-outline" size={12} color={tone} />
          <Text style={[styles.pillText, { color: tone }]}>{remaining}</Text>
        </View>
      </View>
      <Text style={styles.reason}>
        This deal is undisclosed — it must be filed with the school NIL portal by{' '}
        {formatDateTime(data.deadlineISO)} to stay eligible.
      </Text>
    </View>
  );
}

function escrowTone(state: string): string {
  if (state === 'released') return SIGNAL_POSITIVE;
  if (state === 'unfunded') return SIGNAL_NEGATIVE;
  return ACCENT;
}

function milestoneTone(status: string): string {
  if (status === 'paid' || status === 'approved') return SIGNAL_POSITIVE;
  if (status === 'submitted') return SIGNAL_WARN;
  if (status === 'rejected') return SIGNAL_NEGATIVE;
  return TEXT_TERTIARY;
}

function EscrowBlock({ data }: { data: NonNullable<DealEnrichment['escrow']> }) {
  const tone = escrowTone(data.state);
  return (
    <View style={styles.block}>
      <View style={styles.blockHead}>
        <Text style={styles.microLabel}>Escrow + milestones</Text>
        <View style={[styles.pill, { borderColor: `${tone}55`, backgroundColor: `${tone}1A` }]}>
          <Text style={[styles.pillText, { color: tone }]}>{titleCase(data.state)}</Text>
        </View>
      </View>
      <View style={styles.kvRow}>
        <Text style={styles.kvLabel}>Funded</Text>
        <Text style={styles.kvValue}>{data.funded}</Text>
      </View>
      <View style={styles.kvRow}>
        <Text style={styles.kvLabel}>Released</Text>
        <Text style={styles.kvValue}>{data.released}</Text>
      </View>
      <View style={styles.milestoneStack}>
        {data.milestones.map((m) => {
          const mt = milestoneTone(m.status);
          return (
            <View key={m.id} style={styles.milestoneRow}>
              <View style={[styles.dot, { backgroundColor: mt }]} />
              <Text style={styles.milestoneText} numberOfLines={2}>
                {m.description}
              </Text>
              <Text style={styles.milestoneAmount}>{m.amount}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function titleCase(value: string): string {
  return value
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric' });
}

const styles = StyleSheet.create({
  intro: {
    color: TEXT_SECONDARY,
    fontSize: TEXT.caption,
    lineHeight: 17,
  },
  block: {
    gap: SP_SM,
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE_SUBTLE,
    backgroundColor: SURFACE_SUBTLE,
    padding: SP_MD,
  },
  blockHead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SP_SM,
  },
  microLabel: {
    color: TEXT_TERTIARY,
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  pill: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: SP_XS,
    paddingHorizontal: SP_SM,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  dot: {
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  kvRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SP_MD,
  },
  kvLabel: {
    color: TEXT_SECONDARY,
    fontSize: TEXT.caption,
    fontWeight: '700',
  },
  kvValue: {
    color: TEXT_PRIMARY,
    fontSize: TEXT.label,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  kvValueMuted: {
    color: TEXT_SECONDARY,
    fontSize: TEXT.caption,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  reason: {
    color: TEXT_SECONDARY,
    fontSize: 11.5,
    lineHeight: 16,
  },
  disclaimerBox: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: SP_XS,
    borderRadius: RADIUS_SM,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: SP_SM,
  },
  disclaimerText: {
    color: TEXT_TERTIARY,
    flex: 1,
    fontSize: 10.5,
    lineHeight: 14,
  },
  milestoneStack: {
    gap: SP_SM,
    marginTop: SP_XS,
  },
  milestoneRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SP_SM,
  },
  milestoneText: {
    color: TEXT_SECONDARY,
    flex: 1,
    fontSize: 11.5,
    lineHeight: 15,
  },
  milestoneAmount: {
    color: TEXT_PRIMARY,
    fontSize: TEXT.caption,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
});
