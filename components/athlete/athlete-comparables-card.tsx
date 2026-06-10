// ── ATHLETE COMPARABLES CARD ─────────────────────────────
// Athlete-framed render of `ComparableDealEvidence`. The
// brand-lens analogue lives inside `components/deal/deal-detail-spine.tsx`
// (`ComparableDealsCard` / `ComparableDealRowView`); this file deliberately
// re-renders the same primitive instead of importing those internals so
// the athlete surface can carry its own tone, accent, and rights-literacy
// framing without coupling to a much larger deal-detail tree.
//
// Differences from the brand lens:
//   • Headline "Comparable offers" (not "Comparable deals")
//   • Athlete accent (#EB621A) replaces the brand info chip tint
//   • Empowering blurb above the rows: negotiate from evidence, not vibes
//   • Footer rights-literacy banner sourced from PLAN.md (athlete owns /
//     exclusivity / duration / rep fee / workload / values fit)
//   • Estimate rendered as midpoint + confidence chip
//
// Source: PLAN.md §2.9 + §5 P1 (athlete-side evidence packet) + the
// rights-literacy field set added in queue_item:01KR7YJ9EA01WJVK9R7Y6AXP1R.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { StatusPill } from '@/components/shared/ui-kit';
import type {
  ComparableDealEvidence,
  ComparableDealRow,
} from '@/lib/types/comparable-deal.types';

const ATHLETE_ACCENT = '#EB621A';
const SUCCESS = '#00C6B0';
const WARNING = '#FFD60A';
const DANGER = '#FF453A';
const MUTED = '#9CA3AF';

const REVIEWER_STATE_LABELS: Record<ComparableDealRow['reviewerState'], string> =
  {
    'approved': 'Approved',
    'rejected': 'Rejected',
    'pending-review': 'In review',
    'auto-suggested': 'Suggested',
  };

type Tone = 'success' | 'warning' | 'danger' | 'muted';

function reviewerTone(state: ComparableDealRow['reviewerState']): Tone {
  if (state === 'approved') return 'success';
  if (state === 'rejected') return 'danger';
  if (state === 'pending-review') return 'warning';
  return 'muted';
}

function toneColor(tone: Tone): string {
  if (tone === 'success') return SUCCESS;
  if (tone === 'warning') return WARNING;
  if (tone === 'danger') return DANGER;
  return MUTED;
}

// Mirrors the `formatFreshness` helper used in deal-detail-spine; redefined
// locally per the brief so we don't reach into that file's internals.
function formatFreshness(days: number): string {
  if (days <= 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  return months <= 1 ? '1mo ago' : `${months}mo ago`;
}

// Same shape as the brand-lens `formatMoney` so amounts read consistently
// across surfaces. Redefined locally to avoid importing private helpers.
function formatMoney(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(2).replace(/\.00$/, '')}M`;
  }
  if (dollars >= 1_000) {
    return `$${Math.round(dollars / 1_000)}K`;
  }
  return `$${dollars.toFixed(0)}`;
}

export interface AthleteComparablesCardProps {
  evidence: ComparableDealEvidence;
}

export function AthleteComparablesCard({ evidence }: AthleteComparablesCardProps) {
  const { summary, rows, attribution } = evidence;
  const visibleRows = rows.slice(0, 3);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { borderColor: `${ATHLETE_ACCENT}55`, backgroundColor: `${ATHLETE_ACCENT}1C` }]}>
          <Ionicons name="trending-up" size={16} color={ATHLETE_ACCENT} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>Comparable offers</Text>
          <Text style={styles.title}>What similar athletes are getting paid</Text>
        </View>
      </View>

      <Text style={styles.blurb}>
        Use this to negotiate from evidence, not vibes. Anonymized rows show what athletes in
        your tier accepted for similar deals — including caveats and reviewer state.
      </Text>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryText}>{summary.summary}</Text>
        {summary.estimate ? (
          <View style={styles.estimateRow}>
            <Text style={styles.estimateValue}>{formatMoney(summary.estimate.cents)}</Text>
            {summary.range ? (
              <Text style={styles.estimateRange}>
                {`${formatMoney(summary.range.low.cents)} – ${formatMoney(summary.range.high.cents)}`}
              </Text>
            ) : null}
            <View style={styles.confidenceChip}>
              <Text style={styles.confidenceText}>{`${summary.confidence} confidence`}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.fallbackText}>
            {`Not enough comps for a midpoint yet (${summary.confidence} confidence).`}
          </Text>
        )}
      </View>

      {visibleRows.map((row) => (
        <ComparableOfferRow key={row.id} row={row} />
      ))}

      <RightsLiteracyBanner />

      <Text style={styles.microLabel}>Schema attribution</Text>
      <Text style={styles.microNote}>
        {`${attribution.schemaSource} (${attribution.schemaLicense}). ${attribution.note}`}
      </Text>
    </View>
  );
}

function ComparableOfferRow({ row }: { row: ComparableDealRow }) {
  const tone = reviewerTone(row.reviewerState);
  const sourceKindLabel = row.source.kind.replace(/-/g, ' ');
  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <View style={styles.flex}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {row.athlete.displayName}
          </Text>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {`${row.brand.displayName}  ·  ${row.nilCategory}  ·  ${row.dealReportedAt}`}
          </Text>
        </View>
        <Text style={[styles.rowAmount, { color: toneColor(tone) }]}>
          {formatMoney(row.amount.cents)}
        </Text>
      </View>
      <Text style={styles.rowRationale}>{row.rationale}</Text>
      {row.caveats.length > 0 ? (
        <View style={styles.caveatBox}>
          {row.caveats.map((caveat) => (
            <View key={caveat} style={styles.inlineRow}>
              <Ionicons name="warning-outline" size={12} color={WARNING} />
              <Text style={styles.caveatText}>{caveat}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={styles.rowFooter}>
        <StatusPill
          label={REVIEWER_STATE_LABELS[row.reviewerState]}
          tone={tone}
          icon={tone === 'success' ? 'checkmark-circle-outline' : 'shield-outline'}
        />
        <Text style={styles.rowMeta} numberOfLines={1}>
          {`${sourceKindLabel}  ·  ${formatFreshness(row.source.freshnessDays)}`}
        </Text>
      </View>
    </View>
  );
}

// PLAN.md (line 274 + queue_item:01KR7YJ9EA01WJVK9R7Y6AXP1R) calls out the
// athlete rights-literacy fields that should travel with any deal/disclosure
// packet: ownership, exclusivity, duration, representative fees, workload
// (season windows), values fit. Surface them here as a reminder so athletes
// don't share the row externally without checking reviewer state.
function RightsLiteracyBanner() {
  const fields = [
    'Athlete owns',
    'Exclusivity',
    'Duration',
    'Rep fee',
    'Workload',
    'Values fit',
  ];
  return (
    <View style={styles.banner}>
      <View style={styles.bannerHead}>
        <Ionicons name="shield-half-outline" size={14} color={ATHLETE_ACCENT} />
        <Text style={styles.bannerTitle}>Your rights matter</Text>
      </View>
      <Text style={styles.bannerBody}>
        Comparables are evidence, not a contract. Verify each row&apos;s reviewer state before
        sharing it outside Proslync, and check that the offer respects:
      </Text>
      <View style={styles.fieldChipWrap}>
        {fields.map((field) => (
          <View key={field} style={styles.fieldChip}>
            <Text style={styles.fieldChipText}>{field}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${ATHLETE_ACCENT}42`,
    backgroundColor: 'rgba(255,255,255,0.055)',
    padding: 14,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 11,
  },
  iconBadge: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  flex: { flex: 1 },
  eyebrow: {
    color: ATHLETE_ACCENT,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
  },
  blurb: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 18,
  },
  summaryBox: {
    gap: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(0,0,0,0.18)',
    padding: 12,
  },
  summaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  estimateRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  estimateValue: {
    color: ATHLETE_ACCENT,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  estimateRange: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 12,
    fontWeight: '700',
  },
  confidenceChip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${ATHLETE_ACCENT}55`,
    backgroundColor: `${ATHLETE_ACCENT}1C`,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  confidenceText: {
    color: ATHLETE_ACCENT,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  fallbackText: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12.5,
    lineHeight: 18,
  },
  row: {
    gap: 7,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(0,0,0,0.18)',
    padding: 12,
  },
  rowTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  rowTitle: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 12.5,
    fontWeight: '900',
    lineHeight: 17,
  },
  rowMeta: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 10.5,
    fontWeight: '700',
    lineHeight: 15,
    marginTop: 2,
  },
  rowAmount: {
    fontSize: 14,
    fontWeight: '900',
  },
  rowRationale: {
    color: 'rgba(255,255,255,0.64)',
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 4,
  },
  caveatBox: {
    gap: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,214,10,0.07)',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  inlineRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 7,
  },
  caveatText: {
    color: 'rgba(255,255,255,0.70)',
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
  },
  rowFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginTop: 4,
  },
  banner: {
    gap: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${ATHLETE_ACCENT}42`,
    backgroundColor: `${ATHLETE_ACCENT}10`,
    padding: 12,
  },
  bannerHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  bannerTitle: {
    color: ATHLETE_ACCENT,
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  bannerBody: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  fieldChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  fieldChip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${ATHLETE_ACCENT}55`,
    backgroundColor: `${ATHLETE_ACCENT}14`,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  fieldChipText: {
    color: ATHLETE_ACCENT,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  microLabel: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  microNote: {
    color: 'rgba(255,255,255,0.54)',
    fontSize: 10.5,
    lineHeight: 15,
  },
});
