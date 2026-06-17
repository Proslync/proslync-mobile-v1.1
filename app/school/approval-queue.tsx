// ── APPROVAL QUEUE ROUTE ──────────────────────────────────
// Sprint 3.9 full-screen route (PLAN.md §3.9). Reached from
// School view → Compliance sub-tab → Approval queue card, and
// from AD Home approval-queue summary tile (Sprint 4 AD walk).
//
// Deep link: status:///school/approval-queue
// Optional: status:///school/approval-queue?focus=pending
//
// AD walk gate test (PLAN.md §4 step 4): tapping Approve / Reject
// calls `useDecideApprovalQueueItem`. Backend route first
// (`POST /api/approval-queue/:id/decide`), in-memory mock fallback
// when the backend has no seed for the row. State change persists
// across re-renders; the optimistic update + cache invalidation
// makes the transition immediate.

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton } from '@/components/glass/glass-button';
import { GuidedFlowPage } from '@/components/page-rescue';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import {
  KIND_META,
  PRIORITY_LABEL,
  PRIORITY_TONE,
  STATE_ICON,
  STATE_LABEL,
  STATE_TONE,
  TrustBand,
} from '@/components/school/approval-queue-card';
import {
  EmptyDealsState,
  EmptyState,
  StatusPill,
  TONE_COLOR,
} from '@/components/shared/ui-kit';
import {
  useDecideApprovalQueueItem,
  useSchoolApprovalQueue,
} from '@/hooks/use-approval-queue';
import { useAuth } from '@/lib/providers/auth-provider';
import type {
  ApprovalQueueItem,
  ApprovalQueueItemState,
} from '@/lib/types/approval-queue.types';
import type { GuidedFlowStep } from '@/lib/types/page-rescue.types';

type FilterKey = 'all' | ApprovalQueueItemState;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'blocked', label: 'Blocked' },
];

const FILTER_STATE_VALUES: ApprovalQueueItemState[] = [
  'pending',
  'approved',
  'rejected',
  'blocked',
  'expired',
];

function isApprovalQueueItemState(
  value: string,
): value is ApprovalQueueItemState {
  return (FILTER_STATE_VALUES as string[]).includes(value);
}

export default function ApprovalQueueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ schoolId?: string; focus?: string }>();
  const schoolId = params.schoolId ?? 'school:syracuse';
  const initialFilter: FilterKey =
    params.focus && (params.focus === 'all' || isApprovalQueueItemState(params.focus))
      ? (params.focus as FilterKey)
      : 'all';

  const [filter, setFilter] = React.useState<FilterKey>(initialFilter);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const { data: queue, isLoading, isError, refetch, isRefetching } =
    useSchoolApprovalQueue(schoolId);
  const { user } = useAuth();
  const decideMutation = useDecideApprovalQueueItem();
  // Auto-expand the freshly-decided row so the reviewer sees the
  // status flip and the "Resolved by" line without re-tapping.
  const [pendingDecisionId, setPendingDecisionId] = React.useState<string | null>(null);
  const activeReviewItem = React.useMemo(
    () => (queue ? selectActiveReviewItem(queue.items) : null),
    [queue],
  );
  const activeDeepLink = activeReviewItem ? deepLinkFor(activeReviewItem) : null;
  const flowSteps = React.useMemo(
    () => buildApprovalQueueSteps(activeReviewItem),
    [activeReviewItem],
  );
  const reviewerName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.userName ||
    'Reviewer';
  const decideItem = React.useCallback(
    (item: ApprovalQueueItem, status: 'approved' | 'rejected') => {
      setPendingDecisionId(item.id);
      setExpandedId(item.id);
      decideMutation.mutate(
        {
          itemId: item.id,
          status,
          decidedBy: reviewerName,
        },
        {
          onSettled: () => setPendingDecisionId(null),
        },
      );
    },
    [decideMutation, reviewerName],
  );

  const filteredItems = React.useMemo(() => {
    if (!queue) return [];
    const all = queue.items;
    const filtered =
      filter === 'all' ? all : all.filter((item) => item.state === filter);
    return [...filtered].sort(
      (a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt),
    );
  }, [queue, filter]);

  return (
    <View style={styles.container}>
      <DarkGradientBg />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>

        {isLoading ? (
          <EmptyState
            icon="hourglass-outline"
            title="Loading approval queue"
            body="Pulling disclosures awaiting review for this school cycle."
          />
        ) : isError && !queue ? (
          <View style={styles.emptyBox}>
            <Ionicons
              name="cloud-offline-outline"
              size={26}
              color="rgba(255,255,255,0.55)"
            />
            <Text style={styles.emptyTitle}>Approval queue unavailable</Text>
            <Text style={styles.emptyBody}>
              Couldn&apos;t load the approval queue. Pull to retry, or tap below.
            </Text>
            <GlassButton
              label={isRefetching ? 'Retrying…' : 'Retry'}
              icon={<Ionicons name="refresh" size={15} color="#FFF" />}
              variant="glass"
              size="sm"
              onPress={() => refetch()}
            />
          </View>
        ) : !queue ? (
          <View style={styles.emptyBox}>
            <Ionicons
              name="clipboard-outline"
              size={26}
              color="rgba(255,255,255,0.5)"
            />
            <Text style={styles.emptyTitle}>No queue available</Text>
            <Text style={styles.emptyBody}>
              No approval-queue payload exists for {schoolId}. Once compliance
              data lands the queue will populate here.
            </Text>
          </View>
        ) : (
          <>
            <GuidedFlowPage
              eyebrow="AD walk · approval"
              title="Review one disclosure"
              summary="The queue is secondary. The active decision leads the page, with evidence and compliance posture visible before any approval."
              activeLabel={
                activeReviewItem
                  ? KIND_META[activeReviewItem.kind].label
                  : 'Queue clear'
              }
              activeValue={activeReviewItem?.title ?? 'No pending review'}
              activeSummary={
                activeReviewItem?.summary ??
                'No approval item is available for this school cycle.'
              }
              steps={flowSteps}
              evidenceTitle="Evidence packet"
              evidenceBody={evidenceBodyFor(activeReviewItem)}
              primaryActionLabel={activeDeepLink?.label}
              onPrimaryAction={
                activeDeepLink
                  ? () => router.push(activeDeepLink.href as never)
                  : undefined
              }
            >
              <View style={styles.queueBrief}>
                <Text style={styles.queueBriefLabel}>{queue.period.label}</Text>
                <Text style={styles.queueBriefText}>
                  {queue.counts.pending} pending · {queue.counts.blocked} blocked ·{' '}
                  {queue.counts.approved} approved
                </Text>
              </View>
            </GuidedFlowPage>

            {activeReviewItem ? (
              <ActiveDecisionPanel
                item={activeReviewItem}
                decidedBy={reviewerName}
                isDeciding={
                  pendingDecisionId === activeReviewItem.id &&
                  decideMutation.isPending
                }
                onDecide={(status) => decideItem(activeReviewItem, status)}
                onDeepLink={
                  activeDeepLink
                    ? () => router.push(activeDeepLink.href as never)
                    : undefined
                }
                deepLinkLabel={activeDeepLink?.label}
              />
            ) : null}

            <View style={styles.filterRow}>
              {FILTERS.map(({ key, label }) => {
                const isActive = filter === key;
                return (
                  <Pressable
                    key={key}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setFilter(key)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && styles.filterChipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {filteredItems.length === 0 ? (
              <EmptyDealsState
                role="school"
                cta={{
                  label: 'View audit packet',
                  onPress: () =>
                    router.push({
                      pathname: '/school/risk-report',
                      params: { schoolId },
                    } as any),
                }}
              />
            ) : (
              filteredItems.map((item, idx) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.delay(40 + idx * 30).duration(280)}
                >
                  <QueueRow
                    item={item}
                    expanded={expandedId === item.id}
                    onToggle={() =>
                      setExpandedId((current) =>
                        current === item.id ? null : item.id,
                      )
                    }
                    onDeepLink={(href) => router.push(href as never)}
                    decidedBy={reviewerName}
                    onDecide={(status) => {
                      decideItem(item, status);
                    }}
                    isDeciding={
                      pendingDecisionId === item.id && decideMutation.isPending
                    }
                  />
                </Animated.View>
              ))
            )}

            <View style={styles.footer}>
              <Ionicons
                name="information-circle-outline"
                size={13}
                color={TONE_COLOR.info}
              />
              <Text style={styles.footerText}>
                Approval gate — every row requires a reviewer decision before
                downstream action.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ActiveDecisionPanel({
  item,
  decidedBy,
  isDeciding,
  onDecide,
  onDeepLink,
  deepLinkLabel,
}: {
  item: ApprovalQueueItem;
  decidedBy: string;
  isDeciding: boolean;
  onDecide: (status: 'approved' | 'rejected') => void;
  onDeepLink?: () => void;
  deepLinkLabel?: string;
}) {
  const isPending = item.state === 'pending';
  const trackRows = buildReviewTracks(item);

  return (
    <View style={styles.activeDecisionCard}>
      <View style={styles.activeDecisionHeader}>
        <View style={styles.activeDecisionIcon}>
          <Ionicons name="shield-checkmark-outline" size={16} color={TONE_COLOR.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.activeDecisionEyebrow}>Reviewer gate</Text>
          <Text style={styles.activeDecisionTitle} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
        <StatusPill
          label={STATE_LABEL[item.state]}
          tone={STATE_TONE[item.state]}
          icon={STATE_ICON[item.state]}
        />
      </View>

      <Text style={styles.activeDecisionBody}>{reviewerContextFor(item)}</Text>

      <View style={styles.reviewTrackGrid}>
        {trackRows.map((track) => (
          <View key={track.label} style={styles.reviewTrackRow}>
            <View
              style={[
                styles.reviewTrackDot,
                { backgroundColor: TONE_COLOR[track.tone] },
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.reviewTrackLabel}>{track.label}</Text>
              <Text style={styles.reviewTrackValue}>{track.value}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.activeDecisionSource}>
        <Ionicons
          name="document-text-outline"
          size={12}
          color="rgba(255,255,255,0.55)"
        />
        <Text style={styles.activeDecisionSourceText} numberOfLines={2}>
          {item.source.label} · retrieved {item.source.retrievedAt.slice(0, 10)}
        </Text>
      </View>

      <View style={styles.actionRow}>
        {deepLinkLabel && onDeepLink ? (
          <ActionPill
            label={deepLinkLabel}
            tone="warning"
            icon="folder-open-outline"
            onPress={onDeepLink}
          />
        ) : null}
        {isPending ? (
          <>
            <ActionPill
              label={isDeciding ? 'Working…' : 'Approve'}
              tone="success"
              icon="checkmark-circle-outline"
              onPress={() => onDecide('approved')}
              disabled={isDeciding}
              accessibilityLabel={`Approve as ${decidedBy}`}
            />
            <ActionPill
              label="Reject"
              tone="danger"
              icon="close-circle-outline"
              onPress={() => onDecide('rejected')}
              disabled={isDeciding}
              accessibilityLabel={`Reject as ${decidedBy}`}
            />
          </>
        ) : item.resolvedBy ? (
          <Text style={styles.activeDecisionResolved}>
            {STATE_LABEL[item.state]} by {item.resolvedBy.actor} ·{' '}
            {item.resolvedBy.at.slice(0, 10)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Cross-surface deep-link target for a queue row, when one applies.
 * Pure additive — surfaces already shipped, this just hops to them
 * without back-tracking through the role switcher / tabs.
 */
function deepLinkFor(
  item: ApprovalQueueItem,
): { label: string; href: string } | null {
  if (item.kind === 'disclosure-submission') {
    return {
      label: 'Open packet',
      href: `/athlete/disclosures/${item.subjectRef.id}`,
    };
  }
  if (item.kind === 'ai-applicant-rank') {
    return {
      label: 'View OpenDeal',
      href: `/brand/open-deals/${item.subjectRef.id}`,
    };
  }
  if (
    item.kind === 'compliance-review' &&
    item.subjectRef.kind === 'deal'
  ) {
    return {
      label: 'Open deal',
      href: `/deal/${item.subjectRef.id}?role=brand`,
    };
  }
  return null;
}

const PRIORITY_WEIGHT: Record<ApprovalQueueItem['priority'], number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
};

function selectActiveReviewItem(
  items: ApprovalQueueItem[],
): ApprovalQueueItem | null {
  if (items.length === 0) return null;
  const candidates = items.filter((item) => item.state === 'pending');
  const reviewable = candidates.length > 0 ? candidates : items;
  return [...reviewable].sort((a, b) => {
    const priorityDelta = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    if (priorityDelta !== 0) return priorityDelta;
    const aDue = Date.parse(a.dueBy ?? a.submittedAt);
    const bDue = Date.parse(b.dueBy ?? b.submittedAt);
    return aDue - bDue;
  })[0] ?? null;
}

function buildApprovalQueueSteps(
  item: ApprovalQueueItem | null,
): GuidedFlowStep[] {
  if (!item) {
    return [
      {
        id: 'disclosure',
        label: 'Disclosure',
        status: 'pending',
        summary: 'No disclosure selected.',
      },
      {
        id: 'evidence',
        label: 'Evidence',
        status: 'pending',
        summary: 'Evidence packet appears once a row is selected.',
      },
      {
        id: 'compliance',
        label: 'Compliance',
        status: 'pending',
        summary: 'NCAA, school, and ethics tracks wait for a review target.',
      },
      {
        id: 'approval',
        label: 'Approval',
        status: 'pending',
        summary: 'Reviewer action is unavailable.',
      },
      {
        id: 'audit',
        label: 'Audit trail',
        status: 'pending',
        summary: 'Audit state writes after a decision.',
      },
    ];
  }

  const resolved = item.state === 'approved' || item.state === 'rejected';
  const blocked = item.state === 'blocked' || item.blockers.length > 0;
  const deepLink = deepLinkFor(item);

  return [
    {
      id: 'disclosure',
      label: 'Disclosure',
      status: 'complete',
      route: deepLink?.href,
      summary: item.subjectRef.label,
    },
    {
      id: 'evidence',
      label: 'Evidence',
      status: resolved ? 'complete' : 'active',
      route: deepLink?.href,
      summary: `${item.source.label} · retrieved ${item.source.retrievedAt.slice(0, 10)}`,
    },
    {
      id: 'compliance',
      label: 'Compliance',
      status: blocked ? 'blocked' : resolved ? 'complete' : 'pending',
      summary: blocked
        ? item.blockers[0] ?? 'Compliance blocker needs reviewer handling.'
        : 'NCAA, school, and ethics tracks are ready for decision.',
    },
    {
      id: 'approval',
      label: 'Approval',
      status: resolved ? 'complete' : item.state === 'pending' ? 'pending' : 'blocked',
      summary:
        item.state === 'pending'
          ? 'Approve or reject from the expanded row.'
          : STATE_LABEL[item.state],
    },
    {
      id: 'audit',
      label: 'Audit trail',
      status: resolved ? 'complete' : 'pending',
      summary: item.resolvedBy
        ? `${item.resolvedBy.actor} · ${item.resolvedBy.at.slice(0, 10)}`
        : 'Decision note writes here after review.',
    },
  ];
}

function evidenceBodyFor(item: ApprovalQueueItem | null): string {
  if (!item) {
    return 'No selected approval item. Once the school queue has a review target, this panel shows source, disclosure, blockers, and reviewer posture.';
  }
  const blockers =
    item.blockers.length > 0
      ? ` Blockers: ${item.blockers.join('; ')}.`
      : ' No blockers are currently attached.';
  const trust = item.trustMeta
    ? ` Trust posture: ${item.trustMeta.reviewerState}.`
    : '';
  return `${item.summary} Source: ${item.source.label}, retrieved ${item.source.retrievedAt.slice(0, 10)}.${blockers}${trust}`;
}

function reviewerContextFor(item: ApprovalQueueItem): string {
  if (item.kind === 'disclosure-submission') {
    return 'NIL Go-shaped intake is complete enough for a school reviewer: disclosure packet, school attestation, and ethics posture are visible before transmit.';
  }
  if (item.kind === 'compliance-review') {
    return 'High-value deal review. Confirm amount band, payor association, and school policy fit before this can move downstream.';
  }
  if (item.kind === 'deal-change') {
    return 'Lifecycle change is blocked until the reviewer accepts the stage move and leaves an audit note.';
  }
  if (item.kind === 'external-send') {
    return 'Outbound communication is staged but held until human approval clears the send.';
  }
  if (item.kind === 'financial-action') {
    return 'Money movement is paused until the reviewer confirms ledger and cap context.';
  }
  return 'AI-assisted output is advisory only. Human review owns the decision and the audit trail.';
}

function buildReviewTracks(item: ApprovalQueueItem): {
  label: string;
  value: string;
  tone: 'success' | 'warning' | 'danger' | 'muted';
}[] {
  const blocked = item.state === 'blocked' || item.blockers.length > 0;
  const resolved = item.state === 'approved';
  const rejected = item.state === 'rejected';
  const tone = rejected ? 'danger' : blocked ? 'danger' : resolved ? 'success' : 'warning';
  return [
    {
      label: 'NCAA',
      value: blocked
        ? 'Blocked pending rule check'
        : 'Name, image, likeness disclosure ready for reviewer sign-off',
      tone,
    },
    {
      label: 'School',
      value: item.subjectRef.label,
      tone,
    },
    {
      label: 'Ethics',
      value: item.trustMeta
        ? `${item.trustMeta.confidence} confidence · ${item.trustMeta.reviewerState}`
        : 'Human reviewer owns final decision',
      tone: item.trustMeta?.confidence === 'low' ? 'warning' : tone,
    },
  ];
}

function QueueRow({
  item,
  expanded,
  onToggle,
  onDeepLink,
  onDecide,
  isDeciding,
  decidedBy,
}: {
  item: ApprovalQueueItem;
  expanded: boolean;
  onToggle: () => void;
  onDeepLink: (href: string) => void;
  onDecide: (status: 'approved' | 'rejected') => void;
  isDeciding: boolean;
  decidedBy: string;
}) {
  const kindMeta = KIND_META[item.kind];
  const stateTone = STATE_TONE[item.state];
  const submittedDate = item.submittedAt.slice(0, 10);
  const dueDate = item.dueBy ? item.dueBy.slice(0, 10) : null;
  const deepLink = deepLinkFor(item);

  return (
    <View style={styles.row}>
      <Pressable
        style={styles.rowHead}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={
          expanded ? `Collapse ${item.title}` : `Expand ${item.title}`
        }
      >
        <View style={styles.rowIcon}>
          <Ionicons name={kindMeta.icon} size={15} color="rgba(255,255,255,0.78)" />
        </View>
        <View style={styles.rowBody}>
          <View style={styles.rowHeadRow}>
            <Text style={styles.rowKindLabel}>{kindMeta.label}</Text>
            <StatusPill
              label={PRIORITY_LABEL[item.priority]}
              tone={PRIORITY_TONE[item.priority]}
            />
          </View>
          <Text style={styles.rowTitle}>{item.title}</Text>
          {deepLink ? (
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onDeepLink(deepLink.href);
              }}
              style={styles.deepLinkChip}
              accessibilityRole="link"
              accessibilityLabel={`${deepLink.label} — opens ${deepLink.href}`}
            >
              <Text style={styles.deepLinkChipText}>{deepLink.label}</Text>
              <Ionicons
                name="arrow-forward"
                size={11}
                color={TONE_COLOR.accent}
              />
            </Pressable>
          ) : null}
          <Text style={styles.rowSubject} numberOfLines={1}>
            {item.subjectRef.label}
          </Text>
          <View style={styles.rowMetaRow}>
            <StatusPill
              label={STATE_LABEL[item.state]}
              tone={stateTone}
              icon={STATE_ICON[item.state]}
            />
            <Text style={styles.rowSubmittedText}>
              by {item.submittedBy.actor} · {submittedDate}
            </Text>
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="rgba(255,255,255,0.55)"
        />
      </Pressable>

      {expanded ? (
        <View style={styles.expandBlock}>
          <Text style={styles.expandSummary}>{item.summary}</Text>

          {item.trustMeta ? (
            <View style={styles.expandSubBlock}>
              <Text style={styles.expandLabel}>AI trust meta</Text>
              <TrustBand trustMeta={item.trustMeta} compact={false} />
              {item.trustMeta.rationale.map((rationale) => (
                <View key={rationale} style={styles.bulletRow}>
                  <Ionicons
                    name="ellipse"
                    size={5}
                    color="rgba(255,255,255,0.45)"
                  />
                  <Text style={styles.bulletText}>{rationale}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {item.blockers.length > 0 ? (
            <View style={styles.expandSubBlock}>
              <Text style={styles.expandLabel}>Blockers</Text>
              {item.blockers.map((blocker) => (
                <View key={blocker} style={styles.bulletRow}>
                  <Ionicons
                    name="warning-outline"
                    size={11}
                    color={TONE_COLOR.danger}
                  />
                  <Text style={styles.bulletText}>{blocker}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.expandMetaRow}>
            <View style={styles.expandMetaCol}>
              <Text style={styles.expandMetaLabel}>Subject</Text>
              <Text style={styles.expandMetaValue} numberOfLines={2}>
                {item.subjectRef.label}
              </Text>
            </View>
            {dueDate ? (
              <View style={styles.expandMetaCol}>
                <Text style={styles.expandMetaLabel}>Due by</Text>
                <Text style={styles.expandMetaValue}>{dueDate}</Text>
              </View>
            ) : null}
          </View>

          {item.reviewerNote ? (
            <View style={styles.expandSubBlock}>
              <Text style={styles.expandLabel}>Reviewer note</Text>
              <Text style={styles.expandNoteText}>{item.reviewerNote}</Text>
            </View>
          ) : null}

          <View style={styles.expandSourceRow}>
            <Ionicons
              name="document-text-outline"
              size={11}
              color="rgba(255,255,255,0.55)"
            />
            <Text style={styles.expandSourceText} numberOfLines={2}>
              Source: {item.source.label} · retrieved
              {' '}
              {item.source.retrievedAt.slice(0, 10)}
            </Text>
          </View>

          {item.resolvedBy ? (
            <View style={styles.expandSubBlock}>
              <Text style={styles.expandLabel}>Decision</Text>
              <Text style={styles.expandNoteText}>
                {item.state === 'approved' ? 'Approved' : 'Rejected'} by{' '}
                {item.resolvedBy.actor} · {item.resolvedBy.at.slice(0, 10)}
              </Text>
            </View>
          ) : null}

          {item.state === 'pending' ? (
            <View style={styles.actionRow}>
              <ActionPill
                label={isDeciding ? 'Working…' : 'Approve'}
                tone="success"
                icon="checkmark-circle-outline"
                onPress={() => onDecide('approved')}
                disabled={isDeciding}
                accessibilityLabel={`Approve as ${decidedBy}`}
              />
              <ActionPill
                label="Reject"
                tone="danger"
                icon="close-circle-outline"
                onPress={() => onDecide('rejected')}
                disabled={isDeciding}
                accessibilityLabel={`Reject as ${decidedBy}`}
              />
              <ActionPill
                label="Request info"
                tone="warning"
                icon="help-circle-outline"
                disabled
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function ActionPill({
  label,
  tone,
  icon,
  onPress,
  disabled,
  accessibilityLabel,
}: {
  label: string;
  tone: 'success' | 'danger' | 'warning';
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const color = TONE_COLOR[tone];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        styles.actionPill,
        {
          borderColor: `${color}55`,
          backgroundColor: pressed ? `${color}33` : `${color}1C`,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
    >
      <Ionicons name={icon} size={13} color={color} />
      <Text style={[styles.actionPillText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: {
    paddingHorizontal: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  heroBox: {
    gap: 3,
    paddingHorizontal: 2,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '700',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  queueBrief: {
    gap: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  queueBriefLabel: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  queueBriefText: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 12,
    fontWeight: '800',
  },
  activeDecisionCard: {
    gap: 11,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,111,60,0.34)',
    backgroundColor: 'rgba(255,111,60,0.085)',
    padding: 14,
  },
  activeDecisionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  activeDecisionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,111,60,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,111,60,0.32)',
  },
  activeDecisionEyebrow: {
    color: 'rgba(255,255,255,0.54)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  activeDecisionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  activeDecisionBody: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  reviewTrackGrid: {
    gap: 8,
  },
  reviewTrackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  reviewTrackDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  reviewTrackLabel: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  reviewTrackValue: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
    marginTop: 1,
  },
  activeDecisionSource: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  activeDecisionSourceText: {
    flex: 1,
    color: 'rgba(255,255,255,0.56)',
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: '700',
  },
  activeDecisionResolved: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  filterChipActive: {
    borderColor: 'rgba(255,111,60,0.45)',
    backgroundColor: 'rgba(255,111,60,0.14)',
  },
  filterChipText: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  emptyBox: {
    gap: 8,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 18,
    paddingVertical: 30,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  emptyBody: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    textAlign: 'center',
    maxWidth: 280,
  },

  row: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.055)',
    overflow: 'hidden',
  },
  rowHead: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    padding: 12,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    marginTop: 1,
  },
  rowBody: { flex: 1, gap: 3 },
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
    fontSize: 13.5,
    fontWeight: '900',
  },
  rowSubject: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11.5,
    fontWeight: '600',
  },
  deepLinkChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${TONE_COLOR.accent}55`,
    backgroundColor: `${TONE_COLOR.accent}1A`,
  },
  deepLinkChipText: {
    color: TONE_COLOR.accent,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  rowMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  rowSubmittedText: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 10.5,
    fontWeight: '700',
  },

  expandBlock: {
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  expandSummary: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    lineHeight: 17,
  },
  expandSubBlock: {
    gap: 6,
  },
  expandLabel: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingLeft: 2,
  },
  bulletText: {
    flex: 1,
    color: 'rgba(255,255,255,0.66)',
    fontSize: 11.5,
    lineHeight: 16,
  },
  expandMetaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  expandMetaCol: {
    flex: 1,
    gap: 3,
  },
  expandMetaLabel: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  expandMetaValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  expandNoteText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11.5,
    lineHeight: 16,
  },
  expandSourceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  expandSourceText: {
    flex: 1,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10.5,
    fontWeight: '700',
    lineHeight: 14.5,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 2,
    paddingTop: 6,
  },
  footerText: {
    flex: 1,
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11,
    lineHeight: 15.5,
  },
});
