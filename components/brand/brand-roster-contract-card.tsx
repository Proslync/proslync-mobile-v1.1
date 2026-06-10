// ── BRAND ROSTER CONTRACT CARD (Sprint 2.5 · W33) ────────
// Visual card rendering of `BrandContractTerm`. Used by
// `app/brand/athlete/[id].tsx` to drill into a single athlete's
// per-brand contract record from the Brand HQ roster table.
//
// Sections (top → bottom):
//   1. Hero — athlete name + school, total contract value, status pill,
//      renewal-window chip
//   2. StatPill row × 4 — Duration / Deliverables / Payouts paid /
//      Next deliverable
//   3. Deliverables — row per deliverable with status pill, due date,
//      owner, proof type chip
//   4. Payouts — row per payout with amount, trigger chip, due date,
//      status pill
//   5. Clauses — chip-row per clause with kind + summary + source
//      freshness chip
//   6. Trust footer — `lastVerifiedAt` + synthetic source caveat
//
// Anchors:
//   - PLAN.md §2.5 / W33
//   - lib/types/brand-contract.types.ts
//   - components/shared/ui-kit (StatPill, StatusPill, SectionCard,
//     TONE_COLOR, RADIUS_*, CARD_*)

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CARD_BG,
  CARD_BG_INSET,
  CARD_BORDER,
  RADIUS_MD,
  RADIUS_PILL,
  RADIUS_SM,
  SectionCard,
  StatPill,
  StatusPill,
  TONE_COLOR,
  type Tone,
} from '@/components/shared/ui-kit';
import type {
  BrandContractClause,
  BrandContractClauseKind,
  BrandContractDeliverable,
  BrandContractDeliverableProofType,
  BrandContractDeliverableStatus,
  BrandContractPayout,
  BrandContractPayoutStatus,
  BrandContractPayoutTrigger,
  BrandContractStatus,
  BrandContractTerm,
} from '@/lib/types/brand-contract.types';

const ACCENT = '#EB621A';
const TEAL = '#00C6B0';
const VIOLET = '#C8A2FF';

// ───────────────────────────────────────────────────────────
// Formatters

function formatMoney(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`;
  }
  if (dollars >= 1_000) {
    return `$${Math.round(dollars / 1_000)}K`;
  }
  return `$${dollars.toFixed(0)}`;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatVerifiedAgo(iso: string): string {
  const days = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(iso)) / (24 * 60 * 60 * 1000)),
  );
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function titleCase(value: string): string {
  return value
    .split('-')
    .map((part) => (part.length > 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' ');
}

// ───────────────────────────────────────────────────────────
// Tone maps

const STATUS_TONE: Record<BrandContractStatus, Tone> = {
  draft: 'muted',
  negotiating: 'warning',
  live: 'success',
  expired: 'muted',
  renewing: 'accent',
};

const DELIVERABLE_TONE: Record<BrandContractDeliverableStatus, Tone> = {
  queued: 'muted',
  active: 'accent',
  done: 'success',
  blocked: 'danger',
};

const PAYOUT_TONE: Record<BrandContractPayoutStatus, Tone> = {
  projected: 'muted',
  paid: 'success',
  held: 'warning',
};

const PROOF_ICON: Record<BrandContractDeliverableProofType, keyof typeof Ionicons.glyphMap> = {
  screenshot: 'image-outline',
  video: 'videocam-outline',
  attestation: 'document-text-outline',
  'metrics-report': 'stats-chart-outline',
};

const CLAUSE_ICON: Record<BrandContractClauseKind, keyof typeof Ionicons.glyphMap> = {
  exclusivity: 'lock-closed-outline',
  morality: 'shield-half-outline',
  'usage-rights': 'film-outline',
  termination: 'close-circle-outline',
  audit: 'reader-outline',
  'tax-withhold': 'cash-outline',
  'force-majeure': 'thunderstorm-outline',
};

const TRIGGER_ICON: Record<BrandContractPayoutTrigger, keyof typeof Ionicons.glyphMap> = {
  signature: 'create-outline',
  milestone: 'flag-outline',
  cadence: 'repeat-outline',
  completion: 'checkmark-done-outline',
};

// ───────────────────────────────────────────────────────────
// Component

export interface BrandRosterContractCardProps {
  contract: BrandContractTerm;
  /** Display label for the athlete (e.g. "Kiyan Anthony"). */
  athleteName: string;
  /** Subtext (school, position, etc.). */
  athleteSubtext: string;
  /** Optional press-handler for a single deliverable row (visual-only). */
  onDeliverablePress?: (deliverable: BrandContractDeliverable) => void;
}

export function BrandRosterContractCard({
  contract,
  athleteName,
  athleteSubtext,
  onDeliverablePress,
}: BrandRosterContractCardProps) {
  const totalLabel = formatMoney(contract.cap.totalCents.cents);
  const statusTone = STATUS_TONE[contract.status];

  const payoutsPaid = contract.payoutSchedule.filter((p) => p.status === 'paid').length;
  const nextDeliverable = React.useMemo(() => {
    const upcoming = contract.deliverables
      .filter((d) => d.status === 'queued' || d.status === 'active')
      .sort((a, b) => a.due.localeCompare(b.due));
    return upcoming[0] ?? null;
  }, [contract.deliverables]);

  const renewalChipLabel =
    contract.status === 'renewing'
      ? 'Renewal in window'
      : contract.renewable
        ? 'Renewable'
        : 'Non-renewable';
  const renewalChipTone: Tone =
    contract.status === 'renewing' ? 'accent' : contract.renewable ? 'success' : 'muted';

  return (
    <View style={styles.outer}>
      {/* ─── Hero ───────────────────────────── */}
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>CONTRACT · {titleCase(contract.cap.structure)}</Text>
        <Text style={styles.athleteName} numberOfLines={1}>{athleteName}</Text>
        <Text style={styles.athleteSubtext} numberOfLines={1}>{athleteSubtext}</Text>

        <View style={styles.heroValueRow}>
          <Text style={styles.totalValue}>{totalLabel}</Text>
          <Text style={styles.totalLabel}>total contract value</Text>
        </View>

        <View style={styles.heroPillRow}>
          <StatusPill
            label={contract.status.toUpperCase()}
            tone={statusTone}
            size="md"
            icon="briefcase-outline"
          />
          <StatusPill
            label={renewalChipLabel.toUpperCase()}
            tone={renewalChipTone}
            size="md"
            icon="refresh-outline"
          />
        </View>

        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaItem}>
            <Ionicons name="calendar-outline" size={11} color="rgba(255,255,255,0.55)" />
            <Text style={styles.heroMetaText}>
              {formatShortDate(contract.startDate)} → {formatShortDate(contract.endDate)}
            </Text>
          </View>
          <View style={styles.heroMetaItem}>
            <Ionicons name="lock-closed-outline" size={11} color="rgba(255,255,255,0.55)" />
            <Text style={styles.heroMetaText} numberOfLines={1}>
              {contract.exclusivityScope}
            </Text>
          </View>
        </View>
      </View>

      {/* ─── Stat row ───────────────────────── */}
      <View style={styles.statRow}>
        <StatPill value={`${contract.durationDays}d`} label="Duration" tint={TEAL} size="sm" />
        <StatPill
          value={`${contract.deliverables.length}`}
          label="Deliverables"
          tint="#FFFFFF"
          size="sm"
        />
        <StatPill
          value={`${payoutsPaid}/${contract.payoutSchedule.length}`}
          label="Payouts paid"
          tint={TONE_COLOR.success}
          size="sm"
        />
        <StatPill
          value={nextDeliverable ? formatShortDate(nextDeliverable.due).split(',')[0] ?? '—' : '—'}
          label="Next due"
          tint={ACCENT}
          size="sm"
        />
      </View>

      {/* ─── Rights granted chip row ────────── */}
      {contract.rightsGranted.length > 0 ? (
        <SectionCard title="Rights granted" icon="ribbon-outline" iconColor={VIOLET}>
          <View style={styles.chipRow}>
            {contract.rightsGranted.map((right) => (
              <View key={right} style={styles.rightChip}>
                <Text style={styles.rightChipText}>{right}</Text>
              </View>
            ))}
          </View>
        </SectionCard>
      ) : null}

      {/* ─── Deliverables ───────────────────── */}
      <SectionCard title="Deliverables" icon="film-outline" iconColor={ACCENT}>
        {contract.deliverables.length === 0 ? (
          <Text style={styles.bodyText}>No deliverables on this contract.</Text>
        ) : (
          contract.deliverables.map((deliverable) => (
            <DeliverableRow
              key={deliverable.id}
              deliverable={deliverable}
              onPress={onDeliverablePress}
            />
          ))
        )}
      </SectionCard>

      {/* ─── Payouts ───────────────────────── */}
      <SectionCard title="Payouts" icon="cash-outline" iconColor={TEAL}>
        {contract.payoutSchedule.length === 0 ? (
          <Text style={styles.bodyText}>No payouts scheduled.</Text>
        ) : (
          contract.payoutSchedule.map((payout) => (
            <PayoutRow key={payout.id} payout={payout} />
          ))
        )}
      </SectionCard>

      {/* ─── Clauses ───────────────────────── */}
      <SectionCard title="Clauses" icon="reader-outline" iconColor={VIOLET}>
        {contract.clauses.length === 0 ? (
          <Text style={styles.bodyText}>No clauses captured.</Text>
        ) : (
          contract.clauses.map((clause) => <ClauseRow key={clause.id} clause={clause} />)
        )}
      </SectionCard>

      {/* ─── Trust footer ──────────────────── */}
      <View style={styles.trustFooter}>
        <Ionicons name="flask-outline" size={11} color="rgba(255,255,255,0.55)" />
        <Text style={styles.trustText}>
          {contract.trustMeta.sourceRef.label} · verified {formatVerifiedAgo(contract.trustMeta.lastVerifiedAt)}
        </Text>
        {contract.trustMeta.sourceRef.caveat ? (
          <Text style={styles.trustCaveat} numberOfLines={3}>
            {contract.trustMeta.sourceRef.caveat}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ───────────────────────────────────────────────────────────
// Sub-rows

function DeliverableRow({
  deliverable,
  onPress,
}: {
  deliverable: BrandContractDeliverable;
  onPress?: (deliverable: BrandContractDeliverable) => void;
}) {
  const tone = DELIVERABLE_TONE[deliverable.status];
  const proofIcon = PROOF_ICON[deliverable.proofType];
  const handlePress = React.useCallback(() => {
    if (onPress) onPress(deliverable);
  }, [deliverable, onPress]);

  // When an onPress handler is provided we render a Pressable wrapper
  // (task spec: visual-only tap — caller can no-op the handler).
  const content = (
    <>
      <View style={styles.rowLead}>
        <View style={styles.rowIcon}>
          <Ionicons name={proofIcon} size={14} color={ACCENT} />
        </View>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={2}>{deliverable.title}</Text>
        <View style={styles.rowMetaRow}>
          <Ionicons name="calendar-outline" size={10} color="rgba(255,255,255,0.55)" />
          <Text style={styles.rowMetaText}>{formatShortDate(deliverable.due)}</Text>
          <Text style={styles.rowMetaDot}>·</Text>
          <Text style={styles.rowMetaText} numberOfLines={1}>{deliverable.ownerLabel}</Text>
        </View>
      </View>
      <View style={styles.rowTrail}>
        <StatusPill label={deliverable.status.toUpperCase()} tone={tone} size="sm" />
        <View style={styles.proofChip}>
          <Text style={styles.proofChipText}>{titleCase(deliverable.proofType)}</Text>
        </View>
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        style={styles.row}
        accessibilityRole="button"
        accessibilityLabel={`Deliverable: ${deliverable.title}`}
      >
        {content}
      </Pressable>
    );
  }
  return <View style={styles.row}>{content}</View>;
}

function PayoutRow({ payout }: { payout: BrandContractPayout }) {
  const tone = PAYOUT_TONE[payout.status];
  const triggerIcon = TRIGGER_ICON[payout.trigger];
  return (
    <View style={styles.row}>
      <View style={styles.rowLead}>
        <View style={[styles.rowIcon, { borderColor: `${TEAL}55`, backgroundColor: `${TEAL}14` }]}>
          <Ionicons name={triggerIcon} size={14} color={TEAL} />
        </View>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{formatMoney(payout.amountCents.cents)}</Text>
        <View style={styles.rowMetaRow}>
          <Ionicons name="calendar-outline" size={10} color="rgba(255,255,255,0.55)" />
          <Text style={styles.rowMetaText}>{formatShortDate(payout.due)}</Text>
          <Text style={styles.rowMetaDot}>·</Text>
          <Text style={styles.rowMetaText}>{titleCase(payout.trigger)}</Text>
        </View>
        {payout.note ? (
          <Text style={styles.rowNote} numberOfLines={2}>{payout.note}</Text>
        ) : null}
      </View>
      <View style={styles.rowTrail}>
        <StatusPill label={payout.status.toUpperCase()} tone={tone} size="sm" />
      </View>
    </View>
  );
}

function ClauseRow({ clause }: { clause: BrandContractClause }) {
  const icon = CLAUSE_ICON[clause.kind];
  const freshness = clause.sourceRef.freshnessDays;
  const freshnessTone: Tone =
    freshness <= 30 ? 'success' : freshness <= 90 ? 'warning' : 'danger';
  const freshnessLabel =
    freshness <= 0
      ? 'Fresh today'
      : freshness === 1
        ? '1 day ago'
        : `${freshness}d old`;
  return (
    <View style={styles.clauseRow}>
      <View style={styles.clauseHead}>
        <View style={[styles.rowIcon, { borderColor: `${VIOLET}55`, backgroundColor: `${VIOLET}14` }]}>
          <Ionicons name={icon} size={14} color={VIOLET} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.rowTitle} numberOfLines={2}>{clause.label}</Text>
          <Text style={styles.clauseKind}>{titleCase(clause.kind)}</Text>
        </View>
        <StatusPill label={freshnessLabel.toUpperCase()} tone={freshnessTone} size="sm" />
      </View>
      <Text style={styles.clauseSummary}>{clause.summary}</Text>
      <View style={styles.clauseSourceRow}>
        <Ionicons name="link-outline" size={10} color="rgba(255,255,255,0.45)" />
        <Text style={styles.clauseSourceText} numberOfLines={1}>
          {clause.sourceRef.label}
        </Text>
      </View>
    </View>
  );
}

// ───────────────────────────────────────────────────────────
// Styles

const styles = StyleSheet.create({
  outer: {
    gap: 12,
  },
  flex: { flex: 1 },
  hero: {
    gap: 10,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    padding: 16,
  },
  eyebrow: {
    color: ACCENT,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  athleteName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  athleteSubtext: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12.5,
    fontWeight: '700',
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 2,
  },
  totalValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroPillRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  heroMetaRow: {
    gap: 6,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMetaText: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 11.5,
    fontWeight: '700',
    flex: 1,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  rightChip: {
    borderRadius: RADIUS_PILL,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${VIOLET}55`,
    backgroundColor: `${VIOLET}14`,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  rightChipText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  bodyText: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 12.5,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG_INSET,
    padding: 10,
  },
  rowLead: {
    justifyContent: 'flex-start',
  },
  rowIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${ACCENT}55`,
    backgroundColor: `${ACCENT}14`,
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  rowMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  rowMetaText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '700',
  },
  rowMetaDot: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
  },
  rowNote: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11.5,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  rowTrail: {
    alignItems: 'flex-end',
    gap: 6,
    minWidth: 78,
  },
  proofChip: {
    borderRadius: RADIUS_PILL,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  proofChipText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  clauseRow: {
    gap: 8,
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG_INSET,
    padding: 10,
  },
  clauseHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clauseKind: {
    color: VIOLET,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  clauseSummary: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    lineHeight: 17,
  },
  clauseSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  clauseSourceText: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 10.5,
    fontWeight: '700',
    flex: 1,
  },
  trustFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG_INSET,
    padding: 10,
  },
  trustText: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 10.5,
    fontWeight: '800',
  },
  trustCaveat: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 10,
    fontStyle: 'italic',
    flexBasis: '100%',
  },
});
