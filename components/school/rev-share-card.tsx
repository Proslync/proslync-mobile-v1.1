// ── AD REVENUE-SHARE CARD ────────────────────────────────
// Sprint 3.1 buyer-side surface. Renders inside the School view
// (Compliance sub-tab) and as the hero on the full /school/rev-share
// route. Visual tokens match `risk-report-card.tsx` (radius 10,
// hairline borders, dark glass) so the AD cockpit reads as one cluster.
//
// PLAN anchors:
//   - §3.1   AD revenue-share data model + ledger primitive
//   - P3     Differentiate on rev-share with the AD (vs SaaS / per-deal)
//   - P4     Encode House-v.-NCAA cap; keep platform rev-share
//            *separate* from school↔athlete rev-share

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CARD_BG,
  CARD_BG_INSET,
  CARD_BORDER,
  RADIUS_MD,
  RADIUS_SM,
  SectionCard,
  StatPill,
  StatusPill,
  TONE_COLOR,
  type Tone,
} from '@/components/shared/ui-kit';
import type {
  PlatformFeeStructure,
  RevShareLedger,
  RevShareLedgerEntry,
  RevShareLedgerEntryStatus,
} from '@/lib/types/rev-share.types';

const ACCENT = TONE_COLOR.accent;
const TEAL = TONE_COLOR.success;
const VIOLET = '#C8A2FF';
const LIGHT_BLUE = TONE_COLOR.info;

const PREVIEW_ROW_COUNT = 5;

// ── Money formatting ─────────────────────────────────────
// Local helper because the AD cockpit consistently formats compactly
// ("$12.4M", "$340K"). Money lives in integer cents (MoneyAmount).
export function formatMoney(cents: number): string {
  if (cents === 0) return '$0';
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const dollars = abs / 100;
  let body: string;
  if (dollars >= 1_000_000) {
    const value = dollars / 1_000_000;
    const formatted = value >= 10 ? value.toFixed(1) : value.toFixed(2);
    body = `$${formatted.replace(/\.?0+$/, '')}M`;
  } else if (dollars >= 1_000) {
    body = `$${Math.round(dollars / 1_000)}K`;
  } else {
    body = `$${dollars.toFixed(0)}`;
  }
  return negative ? `-${body}` : body;
}

function formatRecordedAt(iso: string): string {
  return iso.slice(0, 10);
}

const STATUS_LABEL: Record<RevShareLedgerEntryStatus, string> = {
  projected: 'Projected',
  recorded: 'Recorded',
  disbursed: 'Disbursed',
  disputed: 'Disputed',
};

const STATUS_TONE: Record<RevShareLedgerEntryStatus, Tone> = {
  projected: 'info',
  recorded: 'muted',
  disbursed: 'success',
  disputed: 'danger',
};

// ── Cap utilization tone (PLAN P4) ────────────────────────
//   < 80%   → clear
//   80–95%  → watch
//   >= 95%  → flagged
function capUtilizationTone(usedCents: number, capCents: number): Tone {
  if (capCents <= 0) return 'muted';
  const pct = usedCents / capCents;
  if (pct >= 0.95) return 'danger';
  if (pct >= 0.8) return 'warning';
  return 'success';
}

function capUtilizationLabel(usedCents: number, capCents: number): string {
  if (capCents <= 0) return 'No cap reference';
  const pct = Math.round((usedCents / capCents) * 100);
  if (pct >= 95) return `${pct}% · cap flagged`;
  if (pct >= 80) return `${pct}% · watch`;
  return `${pct}% · clear`;
}

// ── Fee-structure label ──────────────────────────────────
function feeStructureLabel(structure: PlatformFeeStructure): string {
  const rate =
    structure.percentageBp !== undefined
      ? `${(structure.percentageBp / 100).toFixed(structure.percentageBp % 100 === 0 ? 0 : 1)}%`
      : '';
  switch (structure.tier) {
    case 'flat':
      return rate ? `Flat · ${rate}` : 'Flat';
    case 'tiered': {
      const brackets = structure.brackets ?? [];
      if (brackets.length > 0) {
        const rates = brackets.map((b) => `${b.rateBp / 100}%`);
        const low = rates[rates.length - 1];
        const high = rates[0];
        return `Tiered · ${low}–${high}`;
      }
      return rate ? `Tiered · ${rate}` : 'Tiered';
    }
    case 'negotiated':
      return 'Negotiated';
  }
}

// ── Card ─────────────────────────────────────────────────

type RevShareCardProps = {
  ledger: RevShareLedger;
  /** Tapping the entry list footer routes to the full screen. */
  onPressViewAll?: () => void;
  /** Number of recent entries to inline. Defaults to 5. */
  previewCount?: number;
};

export function RevShareCard({
  ledger,
  onPressViewAll,
  previewCount = PREVIEW_ROW_COUNT,
}: RevShareCardProps) {
  const recentEntries = React.useMemo(() => {
    return [...ledger.entries]
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
      .slice(0, previewCount);
  }, [ledger.entries, previewCount]);

  const capTone = capUtilizationTone(
    ledger.capContext.capUsed.cents,
    ledger.capContext.annualCap.cents,
  );
  const capLabel = capUtilizationLabel(
    ledger.capContext.capUsed.cents,
    ledger.capContext.annualCap.cents,
  );

  return (
    <SectionCard title="Revenue share" icon="cash-outline" iconColor={ACCENT}>
      {/* Hero stats */}
      <View style={styles.statRow}>
        <StatPill
          value={formatMoney(ledger.totals.grossCents.cents)}
          label="Gross"
          size="sm"
        />
        <StatPill
          value={formatMoney(ledger.totals.platformFeeCents.cents)}
          label="Platform fee"
          tint={ACCENT}
          size="sm"
        />
        <StatPill
          value={formatMoney(ledger.totals.schoolDisbursementCents.cents)}
          label="School share"
          tint={TEAL}
          size="sm"
        />
        <StatPill
          value={formatMoney(ledger.totals.athletePayoutCents.cents)}
          label="Athlete payout"
          tint={VIOLET}
          size="sm"
        />
      </View>

      {/* Period + fee-structure chips */}
      <View style={styles.metaRow}>
        <StatusPill
          label={ledger.period.label}
          icon="calendar-outline"
          tone="muted"
        />
        <StatusPill
          label={ledger.period.fiscalYear}
          icon="business-outline"
          tone="muted"
        />
        <StatusPill
          label={feeStructureLabel(ledger.feeStructure)}
          icon="trending-up-outline"
          tone="accent"
        />
      </View>

      {/* Clear separation block — PLAN P4 */}
      <View style={styles.separationBlock}>
        <View style={styles.separationHead}>
          <Ionicons name="git-branch-outline" size={13} color={LIGHT_BLUE} />
          <Text style={styles.separationHeadText}>Two separate rev-share legs</Text>
        </View>

        <View style={styles.separationCard}>
          <View style={styles.separationRowHead}>
            <View style={[styles.separationDot, { backgroundColor: ACCENT }]} />
            <Text style={styles.separationLabel}>Proslync ↔ AD platform fee</Text>
          </View>
          <Text style={styles.separationAmount}>
            {formatMoney(ledger.totals.platformFeeCents.cents)}
          </Text>
          <Text style={styles.separationNote}>
            Separate · not capped by House-v.-NCAA.
          </Text>
        </View>

        <View style={styles.separationCard}>
          <View style={styles.separationRowHead}>
            <View style={[styles.separationDot, { backgroundColor: VIOLET }]} />
            <Text style={styles.separationLabel}>School ↔ athlete payout</Text>
          </View>
          <Text style={styles.separationAmount}>
            {formatMoney(ledger.totals.athletePayoutCents.cents)}
          </Text>
          <View style={styles.separationCapRow}>
            <Text style={styles.separationNote}>
              Counted against {formatMoney(ledger.capContext.annualCap.cents)}/yr cap.
            </Text>
            <StatusPill label={capLabel} tone={capTone} />
          </View>
        </View>
      </View>

      {/* Recent ledger entries */}
      {recentEntries.length > 0 ? (
        <View style={styles.entriesBlock}>
          <View style={styles.entriesHead}>
            <Text style={styles.entriesKicker}>Recent activity</Text>
            <Text style={styles.entriesCount}>
              {ledger.entries.length} row{ledger.entries.length === 1 ? '' : 's'}
            </Text>
          </View>
          {recentEntries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
          {onPressViewAll ? (
            <Pressable
              style={styles.viewAllRow}
              onPress={onPressViewAll}
              accessibilityRole="button"
              accessibilityLabel="View full revenue-share ledger"
            >
              <Text style={styles.viewAllText}>View full ledger</Text>
              <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.6)" />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Footer caveat */}
      <View style={styles.footerCaveat}>
        <Ionicons name="information-circle-outline" size={13} color={LIGHT_BLUE} />
        <Text style={styles.footerCaveatText}>
          Platform fee is for using Proslync, not a share of athlete NIL income.
          House-v.-NCAA cap math is the school&apos;s responsibility.
        </Text>
      </View>
    </SectionCard>
  );
}

// ── Entry row ────────────────────────────────────────────

type EntryRowProps = {
  entry: RevShareLedgerEntry;
};

export function EntryRow({ entry }: EntryRowProps) {
  const tone = STATUS_TONE[entry.status];
  return (
    <View style={styles.entryRow}>
      <View style={styles.entryHead}>
        <View style={styles.entryHeadCol}>
          <Text style={styles.entryParties} numberOfLines={1}>
            {entry.brandId.replace(/^brand:/, '')} ·{' '}
            <Text style={styles.entryAthlete}>
              {entry.athleteId.replace(/^a-/, 'Athlete ')}
            </Text>
          </Text>
          <Text style={styles.entryMeta} numberOfLines={1}>
            {entry.dealId} · {formatRecordedAt(entry.recordedAt)}
          </Text>
        </View>
        <StatusPill label={STATUS_LABEL[entry.status]} tone={tone} />
      </View>
      <View style={styles.entrySplitRow}>
        <View style={styles.entrySplitCol}>
          <Text style={styles.entrySplitLabel}>Gross</Text>
          <Text style={styles.entrySplitValue}>
            {formatMoney(entry.grossDealCents.cents)}
          </Text>
        </View>
        <View style={styles.entrySplitCol}>
          <Text style={styles.entrySplitLabel}>Platform</Text>
          <Text style={[styles.entrySplitValue, { color: ACCENT }]}>
            {formatMoney(entry.platformFeeCents.cents)}
          </Text>
        </View>
        <View style={styles.entrySplitCol}>
          <Text style={styles.entrySplitLabel}>School</Text>
          <Text style={[styles.entrySplitValue, { color: TEAL }]}>
            {formatMoney(entry.schoolDisbursementCents.cents)}
          </Text>
        </View>
        <View style={styles.entrySplitCol}>
          <Text style={styles.entrySplitLabel}>Athlete</Text>
          <Text style={[styles.entrySplitValue, { color: VIOLET }]}>
            {formatMoney(entry.athletePayoutCents.cents)}
          </Text>
        </View>
      </View>
      {entry.note ? (
        <Text style={styles.entryNote} numberOfLines={2}>
          {entry.note}
        </Text>
      ) : null}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  statRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  separationBlock: {
    gap: 8,
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG_INSET,
    padding: 12,
  },
  separationHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  separationHeadText: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  separationCard: {
    gap: 4,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  separationRowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  separationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  separationLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    flex: 1,
  },
  separationAmount: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  separationNote: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 11,
    lineHeight: 15,
  },
  separationCapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 4,
  },

  entriesBlock: {
    gap: 8,
  },
  entriesHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entriesKicker: {
    flex: 1,
    color: 'rgba(255,255,255,0.46)',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  entriesCount: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10.5,
    fontWeight: '800',
  },

  entryRow: {
    gap: 8,
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.16)',
    padding: 11,
  },
  entryHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  entryHeadCol: {
    flex: 1,
    gap: 2,
  },
  entryParties: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '900',
  },
  entryAthlete: {
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '800',
  },
  entryMeta: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 10.5,
    fontWeight: '700',
  },
  entrySplitRow: {
    flexDirection: 'row',
    gap: 8,
  },
  entrySplitCol: {
    flex: 1,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: CARD_BG,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  entrySplitLabel: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  entrySplitValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  entryNote: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 11,
    lineHeight: 15,
  },

  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 2,
  },
  viewAllText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  footerCaveat: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(123,175,212,0.20)',
    backgroundColor: 'rgba(123,175,212,0.06)',
    padding: 10,
  },
  footerCaveatText: {
    flex: 1,
    color: 'rgba(255,255,255,0.70)',
    fontSize: 11,
    lineHeight: 15,
  },
});

