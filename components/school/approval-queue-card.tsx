// ── APPROVAL QUEUE PREVIEW CARD ───────────────────────────
// Sprint 3.9 governance preview (PLAN.md §3.9). Renders inside
// the School view → Compliance sub-tab as an entry card under
// the AD AUDIT-DEFENSE risk-report block.
//
// Trust posture re-uses `AiTrustMeta` from `lib/api/ai-review.ts`
// — the inline `TrustBand` sub-component renders provider /
// confidence / reviewer-state in one line and is shared with the
// full-screen route (`app/school/approval-queue.tsx`) by export.
//
// Visual tokens match `deal-detail-spine` and `risk-report-card`:
// radius 10, hairline borders, dark glass `rgba(255,255,255,0.055)`.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ComplianceRing,
  type ComplianceRingState,
  SectionCard,
  StatPill,
  StatusPill,
  TONE_COLOR,
  type Tone,
} from '@/components/shared/ui-kit';
import type { AiTrustMeta } from '@/lib/api/ai-review';
import type {
  ApprovalQueue,
  ApprovalQueueItem,
  ApprovalQueueItemKind,
  ApprovalQueueItemPriority,
  ApprovalQueueItemState,
} from '@/lib/types/approval-queue.types';

// ─────────────────────────────────────────────────────────
// SYNTHETIC 3-track derivation. The `ApprovalQueueItem` type
// carries a single reviewer-state (`pending|approved|rejected|
// blocked|expired`), not the per-track `ncaaReview / schoolReview /
// ethicsReview` triple that <ComplianceRing> wants. Until the queue
// payload exposes per-track state directly, mirror the row-level
// state across all three tracks so the ring renders deterministically:
//   pending  → all three pending      (ring lit dim)
//   approved → all three approved     (ring lit success)
//   rejected → all three rejected     (ring lit danger)
//   blocked  → all three not-required (ring stays muted; row is
//              gated upstream of any review-track decision)
//   expired  → all three not-required (decision window closed)
// This is a faithful summary, not a per-track signal — once the
// payload grows per-track fields, swap this for the real values.
function deriveRingState(state: ApprovalQueueItemState): ComplianceRingState {
  if (state === 'pending') return 'pending';
  if (state === 'approved') return 'approved';
  if (state === 'rejected') return 'rejected';
  // 'blocked' | 'expired' — no track decision applies yet.
  return 'not-required';
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// ─────────────────────────────────────────────────────────
// Vocabulary maps — kept exported so the full-screen route
// reuses them and stays in sync.
// ─────────────────────────────────────────────────────────

export const KIND_META: Record<
  ApprovalQueueItemKind,
  { label: string; icon: IconName }
> = {
  'ai-applicant-rank': { label: 'AI applicant rank', icon: 'sparkles-outline' },
  'compliance-review': { label: 'Compliance review', icon: 'shield-checkmark-outline' },
  'external-send': { label: 'External send', icon: 'paper-plane-outline' },
  'deal-change': { label: 'Deal change', icon: 'swap-horizontal-outline' },
  'financial-action': { label: 'Financial action', icon: 'cash-outline' },
  'disclosure-submission': { label: 'Disclosure submission', icon: 'document-text-outline' },
};

/** Uppercase label per state — matches the reviewer-state vocabulary. */
export const STATE_LABEL: Record<ApprovalQueueItemState, string> = {
  pending: 'In review',
  approved: 'Approved',
  rejected: 'Rejected',
  blocked: 'Blocked',
  expired: 'Expired',
};

/** Tone-mapped color per state — re-uses ui-kit tones. */
export const STATE_TONE: Record<ApprovalQueueItemState, Tone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  blocked: 'danger',
  expired: 'muted',
};

export const STATE_ICON: Record<ApprovalQueueItemState, IconName> = {
  pending: 'time-outline',
  approved: 'checkmark-circle-outline',
  rejected: 'close-circle-outline',
  blocked: 'lock-closed-outline',
  expired: 'hourglass-outline',
};

export const PRIORITY_TONE: Record<ApprovalQueueItemPriority, Tone> = {
  low: 'muted',
  normal: 'info',
  high: 'accent',
  urgent: 'danger',
};

export const PRIORITY_LABEL: Record<ApprovalQueueItemPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

const TRUST_CONFIDENCE_TONE: Record<AiTrustMeta['confidence'], Tone> = {
  low: 'muted',
  medium: 'info',
  high: 'success',
};

const TRUST_REVIEWER_LABEL: Record<AiTrustMeta['reviewerState'], string> = {
  'auto-suggested': 'Suggested',
  'pending-review': 'In review',
  approved: 'Approved',
  rejected: 'Rejected',
};

const TRUST_REVIEWER_TONE: Record<AiTrustMeta['reviewerState'], Tone> = {
  'auto-suggested': 'muted',
  'pending-review': 'warning',
  approved: 'success',
  rejected: 'danger',
};

// ─────────────────────────────────────────────────────────
// TrustBand — inline trust meta strip.
// One line: provider · confidence · reviewer-state.
// Shared between this preview and the full-screen route.
// ─────────────────────────────────────────────────────────

export interface TrustBandProps {
  trustMeta: AiTrustMeta;
  /** Compact tightens the layout for inline use inside a row. */
  compact?: boolean;
}

export function TrustBand({ trustMeta, compact = true }: TrustBandProps) {
  const confidenceTone = TRUST_CONFIDENCE_TONE[trustMeta.confidence];
  const reviewerTone = TRUST_REVIEWER_TONE[trustMeta.reviewerState];
  const providerColor = trustMeta.provider === 'mock' ? TONE_COLOR.muted : TONE_COLOR.info;

  return (
    <View
      style={[
        styles.trustBand,
        { paddingVertical: compact ? 6 : 8 },
      ]}
      accessibilityLabel="AI trust meta"
    >
      <Ionicons name="sparkles-outline" size={11} color={providerColor} />
      <Text style={[styles.trustProvider, { color: providerColor }]}>
        {trustMeta.provider.toUpperCase()}
      </Text>
      <View style={styles.trustDivider} />
      <Text style={[styles.trustConfidence, { color: TONE_COLOR[confidenceTone] }]}>
        {trustMeta.confidence.toUpperCase()} CONF
      </Text>
      <View style={styles.trustDivider} />
      <StatusPill
        label={TRUST_REVIEWER_LABEL[trustMeta.reviewerState]}
        tone={reviewerTone}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Preview card
// ─────────────────────────────────────────────────────────

export interface ApprovalQueueCardProps {
  queue: ApprovalQueue;
  /** Tap the hero or a row → opens the full-screen route. */
  onPressHero?: () => void;
  onPressItem?: (itemId: string) => void;
}

export function ApprovalQueueCard({
  queue,
  onPressHero,
  onPressItem,
}: ApprovalQueueCardProps) {
  const pendingItems = React.useMemo(
    () =>
      queue.items
        .filter((item) => item.state === 'pending')
        .sort(
          (a, b) =>
            Date.parse(b.submittedAt) - Date.parse(a.submittedAt),
        )
        .slice(0, 3),
    [queue.items],
  );

  return (
    <SectionCard title="Approval queue" icon="clipboard-outline">
      <View style={styles.statsRow}>
        <StatPill
          value={String(queue.counts.pending)}
          label="Pending"
          tint={TONE_COLOR.warning}
          size="sm"
        />
        <StatPill
          value={String(queue.counts.approved)}
          label="Approved"
          tint={TONE_COLOR.success}
          size="sm"
        />
        <StatPill
          value={String(queue.counts.rejected)}
          label="Rejected"
          tint={TONE_COLOR.danger}
          size="sm"
        />
        <StatPill
          value={String(queue.counts.blocked)}
          label="Blocked"
          tint={TONE_COLOR.danger}
          size="sm"
        />
      </View>

      <View style={styles.periodRow}>
        <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.55)" />
        <Text style={styles.periodText}>{queue.period.label}</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.periodMeta}>
          {queue.items.length} item{queue.items.length === 1 ? '' : 's'}
        </Text>
      </View>

      {pendingItems.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="checkmark-done-outline" size={20} color={TONE_COLOR.success} />
          <Text style={styles.emptyText}>No pending rows. Queue is clear.</Text>
        </View>
      ) : (
        <View style={styles.itemStack}>
          {pendingItems.map((item) => (
            <QueueRowPreview
              key={item.id}
              item={item}
              onPress={onPressItem ? () => onPressItem(item.id) : undefined}
            />
          ))}
        </View>
      )}

      {onPressHero ? (
        <Pressable
          style={styles.openAllBtn}
          onPress={onPressHero}
          accessibilityRole="button"
          accessibilityLabel="Open the full approval queue"
        >
          <Text style={styles.openAllText}>Open full queue</Text>
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.75)" />
        </Pressable>
      ) : null}

      <View style={styles.footer}>
        <Ionicons name="information-circle-outline" size={13} color={TONE_COLOR.info} />
        <Text style={styles.footerText}>
          Approval gate — every row requires a reviewer decision before downstream
          action. AI-flagged rows show their TrustBand.
        </Text>
      </View>
    </SectionCard>
  );
}

function QueueRowPreview({
  item,
  onPress,
}: {
  item: ApprovalQueueItem;
  onPress?: () => void;
}) {
  const kindMeta = KIND_META[item.kind];
  const ringState = deriveRingState(item.state);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={styles.row}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`Review ${item.title}`}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={kindMeta.icon} size={14} color="rgba(255,255,255,0.78)" />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowHeadRow}>
          <Text style={styles.rowKindLabel}>{kindMeta.label}</Text>
          <StatusPill
            label={PRIORITY_LABEL[item.priority]}
            tone={PRIORITY_TONE[item.priority]}
          />
        </View>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.rowSubject} numberOfLines={1}>
          {item.subjectRef.label}
        </Text>
        {item.trustMeta ? <TrustBand trustMeta={item.trustMeta} compact /> : null}
      </View>
      <View style={styles.rowRing}>
        <ComplianceRing
          ncaa={ringState}
          school={ringState}
          ethics={ringState}
          size={28}
          hideLabel
        />
      </View>
      <View style={styles.rowCta}>
        <StatusPill label="Review" tone="accent" icon="chevron-forward" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  periodText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11.5,
    fontWeight: '700',
  },
  periodMeta: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  emptyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.16)',
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },

  itemStack: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.16)',
    padding: 11,
  },
  rowIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    marginTop: 1,
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  rowHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowKindLabel: {
    flex: 1,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  rowTitle: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '900',
  },
  rowSubject: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11,
    fontWeight: '600',
  },
  rowRing: {
    justifyContent: 'center',
    paddingTop: 2,
  },
  rowCta: {
    justifyContent: 'flex-start',
    paddingTop: 2,
  },

  openAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 9,
  },
  openAllText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 2,
  },
  footerText: {
    flex: 1,
    color: 'rgba(255,255,255,0.62)',
    fontSize: 10.5,
    lineHeight: 14.5,
  },

  // TrustBand
  trustBand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  trustProvider: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  trustConfidence: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  trustDivider: {
    width: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});
