// app/deal-engine/[id].tsx
// NIL Deal Engine — Deal Cockpit (Phase D1).
//
// Sections:
//   - Header: brand × athlete, Deal ID, status pill
//   - ESCROW card: funded amount, fee line, FUND ESCROW button (demo brand lens)
//   - MILESTONE BOARD: per-milestone rows with athlete/brand actions
//   - AUDIT TRAIL: append-only event log
//
// Lens toggle (VIEW AS: Athlete | Brand) switches action button visibility.
// Auto-approve: on render, submitted milestones past +72h flip to auto-approved.
// Dispute: Alert.prompt or inline Alert for reason capture.

import * as React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEMO_DEAL,
  DEAL_ENGINE_STORAGE_KEY,
} from '@/lib/data/mock-deal-engine';
import type {
  EngineDeal,
  EngineMilestone,
  DealEvent,
  MilestoneStatus,
  EngineDealStatus,
} from '@/lib/types/deal-engine.types';
import { computeFees, isAutoApproved, milestoneAutoApproveAt } from '@/lib/deal-engine/engine';

// ── Constants ─────────────────────────────────────────────────────────────

const COPPER = '#EB621A';
const BG = '#000000';
const CARD_BG = 'rgba(255,255,255,0.055)';
const CARD_BORDER = 'rgba(255,255,255,0.10)';
const MUTED = 'rgba(255,255,255,0.52)';
const WHITE = '#FFFFFF';
const SUCCESS = '#30D158';
const WARNING = '#FF9F0A';
const DANGER = '#FF453A';
const INFO = 'rgba(255,255,255,0.72)';
const MONO_BG = 'rgba(0,0,0,0.32)';

type Lens = 'athlete' | 'brand';

// ── Helpers ───────────────────────────────────────────────────────────────

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function hoursUntil(isoString: string): number {
  const ms = new Date(isoString).getTime() - Date.now();
  return ms / (1000 * 60 * 60);
}

function countdownLabel(isoString: string): string {
  const h = hoursUntil(isoString);
  if (h <= 0) return 'OVERDUE';
  if (h < 1) return '<1h';
  if (h < 24) return `${Math.floor(h)}h`;
  return `${Math.floor(h / 24)}d ${Math.floor(h % 24)}h`;
}

function countdownColor(isoString: string): string {
  const h = hoursUntil(isoString);
  if (h <= 0) return DANGER;
  if (h <= 24) return DANGER;
  if (h <= 72) return WARNING;
  return SUCCESS;
}

function statusColor(status: MilestoneStatus): string {
  switch (status) {
    case 'paid': return SUCCESS;
    case 'approved':
    case 'auto-approved': return SUCCESS;
    case 'submitted': return WARNING;
    case 'disputed': return DANGER;
    case 'pending': return MUTED;
    default: return MUTED;
  }
}

function dealStatusColor(s: EngineDealStatus): string {
  switch (s) {
    case 'active':
    case 'completed':
      return SUCCESS;
    case 'awaiting-signature':
    case 'signed':
    case 'escrow-funded':
      return WARNING;
    case 'disputed': return DANGER;
    default: return MUTED;
  }
}

function escrowStateColor(s: string): string {
  switch (s) {
    case 'funded':
    case 'partially-released':
    case 'released':
      return SUCCESS;
    case 'unfunded': return WARNING;
    default: return MUTED;
  }
}

function formatEventKind(kind: string): string {
  return kind.replace(/-/g, ' ').toUpperCase();
}

function formatISO(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

// ── Auto-approve check ────────────────────────────────────────────────────

function applyAutoApprovals(deal: EngineDeal): EngineDeal {
  const now = new Date().toISOString();
  let changed = false;
  const newEvents: DealEvent[] = [];

  const milestones = deal.milestones.map((m) => {
    if (m.status === 'submitted' && m.submittedISO && isAutoApproved(m.submittedISO, now)) {
      changed = true;
      const autoAt = milestoneAutoApproveAt(m.submittedISO);
      newEvents.push({
        at: now,
        actor: 'system',
        kind: 'milestone-auto-approved',
        note: `Milestone "${m.description}" auto-approved after 72h window (submitted ${formatISO(m.submittedISO)}).`,
        milestoneId: m.id,
      });
      return { ...m, status: 'auto-approved' as MilestoneStatus, approvedISO: autoAt };
    }
    return m;
  });

  if (!changed) return deal;

  return {
    ...deal,
    milestones,
    events: [...deal.events, ...newEvents],
    updatedAt: now,
  };
}

// ── Deal loading ──────────────────────────────────────────────────────────

async function loadDeal(id: string): Promise<EngineDeal | null> {
  // First check AsyncStorage for user-created deals
  try {
    const raw = await AsyncStorage.getItem(DEAL_ENGINE_STORAGE_KEY);
    if (raw) {
      const stored: EngineDeal[] = JSON.parse(raw);
      const found = stored.find((d) => d.dealId === id);
      if (found) return found;
    }
  } catch (_) {}

  // Fall back to fixture demo deal
  if (id === DEMO_DEAL.dealId || !id) return DEMO_DEAL;
  return null;
}

// ── Escrow card ───────────────────────────────────────────────────────────

function EscrowCard({
  deal,
  lens,
  onFund,
}: {
  deal: EngineDeal;
  lens: Lens;
  onFund: () => void;
}) {
  const fees = computeFees(deal.amountCents, deal.feeRate);
  const feePercent = Math.round((deal.feeRate ?? 0.10) * 100);
  const isUnfunded = deal.escrow.state === 'unfunded';

  return (
    <View style={cockpitStyles.card}>
      <View style={cockpitStyles.cardHeaderRow}>
        <Text style={cockpitStyles.cardTitle}>ESCROW</Text>
        <View
          style={[
            cockpitStyles.statePill,
            { borderColor: escrowStateColor(deal.escrow.state) },
          ]}
        >
          <Text
            style={[
              cockpitStyles.statePillText,
              { color: escrowStateColor(deal.escrow.state) },
            ]}
          >
            {deal.escrow.state.replace(/-/g, ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <DataRow
        label="Escrow funded"
        value={`$${formatCents(deal.escrow.fundedCents)}`}
      />
      <DataRow
        label="Released to athlete"
        value={`$${formatCents(deal.escrow.releasedCents)}`}
      />
      <DataRow
        label="Remaining in escrow"
        value={`$${formatCents(deal.escrow.fundedCents - deal.escrow.releasedCents)}`}
      />

      <View style={cockpitStyles.feeLine}>
        <Text style={cockpitStyles.feeLabelText}>
          Brand pays{' '}
          <Text style={cockpitStyles.feeHighlight}>
            ${formatCents(fees.athleteCents)}
          </Text>
          {' '}+ {' '}
          <Text style={cockpitStyles.feeMuted}>
            ${formatCents(fees.brandFeeCents)} platform fee ({feePercent}%)
          </Text>
          {' '} · Athlete receives{' '}
          <Text style={cockpitStyles.feeHighlight}>
            ${formatCents(fees.athleteCents)} (100%)
          </Text>
        </Text>
      </View>

      {isUnfunded && lens === 'brand' && (
        <TouchableOpacity
          style={cockpitStyles.fundBtn}
          onPress={onFund}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Fund escrow"
        >
          <Text style={cockpitStyles.fundBtnText}>FUND ESCROW</Text>
          <View style={cockpitStyles.demoBadge}>
            <Text style={cockpitStyles.demoBadgeText}>DEMO</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Milestone board ───────────────────────────────────────────────────────

function MilestoneRow({
  milestone,
  lens,
  onSubmit,
  onApprove,
  onDispute,
}: {
  milestone: EngineMilestone;
  lens: Lens;
  onSubmit: (id: string) => void;
  onApprove: (id: string) => void;
  onDispute: (id: string) => void;
}) {
  const hasDeadline =
    milestone.status === 'submitted' && milestone.autoApproveAt;

  return (
    <View style={milestoneStyles.row}>
      <View style={milestoneStyles.rowTop}>
        <View style={milestoneStyles.statusDot}>
          <View
            style={[
              milestoneStyles.dot,
              { backgroundColor: statusColor(milestone.status) },
            ]}
          />
        </View>
        <View style={milestoneStyles.rowContent}>
          <Text style={milestoneStyles.desc} numberOfLines={2}>
            {milestone.description}
          </Text>
          <View style={milestoneStyles.metaRow}>
            <Text style={milestoneStyles.amount}>
              ${formatCents(milestone.amountCents)}
            </Text>
            <Text style={milestoneStyles.bullet}> · </Text>
            <Text style={milestoneStyles.due}>
              Due {new Date(milestone.dueISO).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
            <Text style={milestoneStyles.bullet}> · </Text>
            <View style={milestoneStyles.verifyChip}>
              <Text style={milestoneStyles.verifyText}>
                {milestone.verificationMethod.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
        <View
          style={[
            milestoneStyles.statusPill,
            { borderColor: statusColor(milestone.status) },
          ]}
        >
          <Text
            style={[
              milestoneStyles.statusText,
              { color: statusColor(milestone.status) },
            ]}
          >
            {milestone.status.replace(/-/g, ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* 72h auto-approve countdown (submitted only) */}
      {hasDeadline && milestone.autoApproveAt && (
        <View style={milestoneStyles.countdownRow}>
          <View
            style={[
              milestoneStyles.countdownChip,
              { borderColor: countdownColor(milestone.autoApproveAt) },
            ]}
          >
            <Text
              style={[
                milestoneStyles.countdownText,
                { color: countdownColor(milestone.autoApproveAt) },
              ]}
            >
              AUTO-APPROVE IN {countdownLabel(milestone.autoApproveAt)}
            </Text>
          </View>
        </View>
      )}

      {/* Athlete actions */}
      {lens === 'athlete' && milestone.status === 'pending' && (
        <TouchableOpacity
          style={milestoneStyles.actionBtn}
          onPress={() => onSubmit(milestone.id)}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel={`Submit completion for ${milestone.description}`}
        >
          <Text style={milestoneStyles.actionBtnText}>SUBMIT COMPLETION</Text>
        </TouchableOpacity>
      )}

      {/* Brand actions on submitted */}
      {lens === 'brand' && milestone.status === 'submitted' && (
        <View style={milestoneStyles.brandActions}>
          <TouchableOpacity
            style={milestoneStyles.approveBtn}
            onPress={() => onApprove(milestone.id)}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel={`Approve milestone ${milestone.description}`}
          >
            <Text style={milestoneStyles.approveBtnText}>APPROVE</Text>
            <View style={milestoneStyles.demoBadgeSmall}>
              <Text style={milestoneStyles.demoBadgeSmallText}>DEMO</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={milestoneStyles.disputeBtn}
            onPress={() => onDispute(milestone.id)}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel={`Dispute milestone ${milestone.description}`}
          >
            <Text style={milestoneStyles.disputeBtnText}>DISPUTE</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const milestoneStyles = StyleSheet.create({
  row: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    padding: 14,
    gap: 10,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  statusDot: {
    paddingTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rowContent: {
    flex: 1,
    gap: 4,
  },
  desc: {
    fontSize: 13,
    fontWeight: '700',
    color: WHITE,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  amount: {
    fontSize: 12,
    fontWeight: '700',
    color: COPPER,
    fontVariant: ['tabular-nums'],
  },
  bullet: {
    color: MUTED,
    fontSize: 12,
  },
  due: {
    fontSize: 12,
    color: MUTED,
    fontWeight: '600',
  },
  verifyChip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  verifyText: {
    fontSize: 9,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 0.5,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  countdownRow: {
    flexDirection: 'row',
  },
  countdownChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countdownText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    fontVariant: ['tabular-nums'],
  },
  actionBtn: {
    backgroundColor: 'rgba(235,98,26,0.15)',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COPPER,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  actionBtnText: {
    color: COPPER,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  brandActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(48,209,88,0.12)',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUCCESS,
    paddingVertical: 11,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    gap: 6,
  },
  approveBtnText: {
    color: SUCCESS,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  demoBadgeSmall: {
    backgroundColor: 'rgba(255,214,10,0.15)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  demoBadgeSmallText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFD60A',
    letterSpacing: 0.8,
  },
  disputeBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,69,58,0.10)',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: DANGER,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  disputeBtnText: {
    color: DANGER,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

// ── Audit Trail ───────────────────────────────────────────────────────────

function AuditTrail({ events }: { events: DealEvent[] }) {
  const sorted = [...events].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
  return (
    <View style={auditStyles.container}>
      {sorted.map((ev, i) => (
        <View key={`${ev.at}-${i}`} style={auditStyles.row}>
          <Text style={auditStyles.kind}>{formatEventKind(ev.kind)}</Text>
          <Text style={auditStyles.meta}>
            {ev.actor.toUpperCase()} · {formatISO(ev.at)}
            {ev.ip ? ` · ${ev.ip}` : ''}
          </Text>
          {ev.note && <Text style={auditStyles.note}>{ev.note}</Text>}
        </View>
      ))}
      {events.length === 0 && (
        <Text style={auditStyles.empty}>No events yet.</Text>
      )}
    </View>
  );
}

const auditStyles = StyleSheet.create({
  container: {
    gap: 10,
  },
  row: {
    backgroundColor: MONO_BG,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 10,
    gap: 3,
  },
  kind: {
    fontSize: 11,
    fontWeight: '800',
    color: COPPER,
    letterSpacing: 0.6,
    fontFamily: 'Courier',
  },
  meta: {
    fontSize: 10,
    color: MUTED,
    fontFamily: 'Courier',
    fontVariant: ['tabular-nums'],
  },
  note: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.72)',
    fontFamily: 'Courier',
    lineHeight: 16,
    marginTop: 2,
  },
  empty: {
    fontSize: 13,
    color: MUTED,
    fontWeight: '600',
  },
});

// ── Shared sub-components ─────────────────────────────────────────────────

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={cockpitStyles.dataRow}>
      <Text style={cockpitStyles.dataLabel}>{label}</Text>
      <Text style={cockpitStyles.dataValue}>{value}</Text>
    </View>
  );
}

// ── Main cockpit screen ───────────────────────────────────────────────────

type ActiveTab = 'milestones' | 'audit';

export default function DealEngineCockpit() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const idParam = normalizeParam(params.id);

  const [deal, setDeal] = React.useState<EngineDeal | null>(null);
  const [lens, setLens] = React.useState<Lens>('athlete');
  const [activeTab, setActiveTab] = React.useState<ActiveTab>('milestones');
  const [loading, setLoading] = React.useState(true);

  // Load deal
  React.useEffect(() => {
    const id = idParam ?? DEMO_DEAL.dealId;
    loadDeal(id).then((d) => {
      if (d) {
        setDeal(applyAutoApprovals(d));
      }
      setLoading(false);
    });
  }, [idParam]);

  // Persist updated deal to AsyncStorage
  async function persistDeal(updated: EngineDeal) {
    setDeal(updated);
    try {
      const raw = await AsyncStorage.getItem(DEAL_ENGINE_STORAGE_KEY);
      let deals: EngineDeal[] = raw ? JSON.parse(raw) : [];
      const idx = deals.findIndex((d) => d.dealId === updated.dealId);
      if (idx >= 0) {
        deals[idx] = updated;
      } else {
        deals.push(updated);
      }
      await AsyncStorage.setItem(DEAL_ENGINE_STORAGE_KEY, JSON.stringify(deals));
    } catch (_) {}
  }

  // Fund escrow (brand lens demo action)
  function handleFundEscrow() {
    if (!deal) return;
    const now = new Date().toISOString();
    const fees = computeFees(deal.amountCents, deal.feeRate);
    const fundEvent: DealEvent = {
      at: now,
      actor: 'brand',
      kind: 'escrow-funded',
      note: `Escrow funded: $${formatCents(deal.amountCents)} (deal) + $${formatCents(fees.brandFeeCents)} platform fee (${Math.round((deal.feeRate ?? 0.10) * 100)}%) = $${formatCents(fees.brandTotalCents)} total. Athlete receives $${formatCents(fees.athleteCents)} (100%).`,
    };
    const updated: EngineDeal = {
      ...deal,
      escrow: {
        ...deal.escrow,
        state: 'funded',
        fundedCents: deal.amountCents,
      },
      status: 'escrow-funded',
      events: [...deal.events, fundEvent],
      updatedAt: now,
    };
    persistDeal(updated);
  }

  // Submit milestone (athlete lens)
  function handleMilestoneSubmit(milestoneId: string) {
    if (!deal) return;
    const now = new Date().toISOString();
    const autoApproveAt = milestoneAutoApproveAt(now);
    const updated: EngineDeal = {
      ...deal,
      milestones: deal.milestones.map((m) =>
        m.id === milestoneId
          ? {
              ...m,
              status: 'submitted' as MilestoneStatus,
              submittedISO: now,
              autoApproveAt,
            }
          : m,
      ),
      events: [
        ...deal.events,
        {
          at: now,
          actor: 'athlete',
          kind: 'milestone-submitted',
          note: `Milestone submitted. Auto-approve scheduled at ${formatISO(autoApproveAt)} if brand does not act.`,
          milestoneId,
        } as DealEvent,
      ],
      updatedAt: now,
    };
    persistDeal(updated);
  }

  // Approve milestone (brand lens)
  function handleMilestoneApprove(milestoneId: string) {
    if (!deal) return;
    const now = new Date().toISOString();
    const milestone = deal.milestones.find((m) => m.id === milestoneId);
    if (!milestone) return;

    const fees = computeFees(milestone.amountCents, deal.feeRate);

    const updated: EngineDeal = {
      ...deal,
      milestones: deal.milestones.map((m) =>
        m.id === milestoneId
          ? { ...m, status: 'paid' as MilestoneStatus, approvedISO: now, paidISO: now }
          : m,
      ),
      escrow: {
        ...deal.escrow,
        releasedCents: deal.escrow.releasedCents + milestone.amountCents,
        state:
          deal.escrow.releasedCents + milestone.amountCents >= deal.amountCents
            ? 'released'
            : 'partially-released',
      },
      events: [
        ...deal.events,
        {
          at: now,
          actor: 'brand',
          kind: 'milestone-approved',
          note: `Milestone approved by brand.`,
          milestoneId,
        } as DealEvent,
        {
          at: now,
          actor: 'platform',
          kind: 'milestone-paid',
          note: `Payout: $${formatCents(milestone.amountCents)} released to athlete. Brand paid $${formatCents(milestone.amountCents)} deal + $${formatCents(fees.brandFeeCents)} fee (${Math.round((deal.feeRate ?? 0.10) * 100)}%).`,
          milestoneId,
        } as DealEvent,
      ],
      updatedAt: now,
    };
    persistDeal(updated);
  }

  // Dispute milestone (brand lens)
  function handleMilestoneDispute(milestoneId: string) {
    if (!deal) return;
    Alert.alert(
      'Dispute Milestone',
      'Provide a brief reason for the dispute:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispute',
          style: 'destructive',
          onPress: () => {
            const now = new Date().toISOString();
            const reason = 'Deliverable does not meet agreed specifications.';
            const updated: EngineDeal = {
              ...deal,
              milestones: deal.milestones.map((m) =>
                m.id === milestoneId
                  ? {
                      ...m,
                      status: 'disputed' as MilestoneStatus,
                      disputeReason: reason,
                    }
                  : m,
              ),
              events: [
                ...deal.events,
                {
                  at: now,
                  actor: 'brand',
                  kind: 'milestone-disputed',
                  note: `Dispute raised: ${reason}`,
                  milestoneId,
                } as DealEvent,
              ],
              updatedAt: now,
            };
            persistDeal(updated);
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[cockpitStyles.root, { paddingTop: insets.top + 60 }]}>
          <Text style={cockpitStyles.loadingText}>Loading deal...</Text>
        </View>
      </>
    );
  }

  if (!deal) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[cockpitStyles.root, { paddingTop: insets.top + 60 }]}>
          <Text style={cockpitStyles.errorTitle}>Deal not found</Text>
          <TouchableOpacity style={cockpitStyles.backBtn} onPress={() => router.back()}>
            <Text style={cockpitStyles.backBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const fees = computeFees(deal.amountCents, deal.feeRate);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[cockpitStyles.root, { paddingTop: insets.top }]}>
        {/* Nav bar */}
        <View style={cockpitStyles.navBar}>
          <Pressable
            onPress={() => router.back()}
            style={cockpitStyles.navBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
          >
            <Text style={cockpitStyles.navBackText}>&#8249;</Text>
          </Pressable>
          <Text style={cockpitStyles.navTitle} numberOfLines={1}>
            Deal Cockpit
          </Text>
          {deal.isDemo && (
            <View style={cockpitStyles.demoPill}>
              <Text style={cockpitStyles.demoPillText}>DEMO</Text>
            </View>
          )}
        </View>

        <ScrollView
          contentContainerStyle={cockpitStyles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Header card */}
          <View style={cockpitStyles.headerCard}>
            <View style={cockpitStyles.headerTop}>
              <Text style={cockpitStyles.brandAthleteText}>
                {deal.brand}  ×  {deal.athlete}
              </Text>
              <View
                style={[
                  cockpitStyles.dealStatusPill,
                  { borderColor: dealStatusColor(deal.status) },
                ]}
              >
                <Text
                  style={[
                    cockpitStyles.dealStatusText,
                    { color: dealStatusColor(deal.status) },
                  ]}
                >
                  {deal.status.replace(/-/g, ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={cockpitStyles.dealIdLabel}>DEAL ID</Text>
            <Text style={cockpitStyles.dealId} selectable>
              {deal.dealId}
            </Text>
            <DataRow
              label="Deal value"
              value={`$${formatCents(deal.amountCents)}`}
            />
            <DataRow
              label="Term"
              value={`${new Date(deal.termStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — ${new Date(deal.termEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            />
            <DataRow
              label="Payment schedule"
              value={deal.paymentSchedule.charAt(0).toUpperCase() + deal.paymentSchedule.slice(1)}
            />
            {deal.exclusivity && (
              <DataRow
                label="Exclusivity"
                value={deal.exclusivityScope ?? 'Yes'}
              />
            )}
          </View>

          {/* Lens toggle */}
          <View style={cockpitStyles.lensRow}>
            <Text style={cockpitStyles.lensLabel}>VIEW AS:</Text>
            {(['athlete', 'brand'] as Lens[]).map((l) => (
              <TouchableOpacity
                key={l}
                style={[
                  cockpitStyles.lensChip,
                  lens === l && cockpitStyles.lensChipActive,
                ]}
                onPress={() => setLens(l)}
                activeOpacity={0.75}
                accessibilityRole="radio"
                accessibilityState={{ selected: lens === l }}
              >
                <Text
                  style={[
                    cockpitStyles.lensChipText,
                    lens === l && cockpitStyles.lensChipTextActive,
                  ]}
                >
                  {l.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Escrow card */}
          <EscrowCard deal={deal} lens={lens} onFund={handleFundEscrow} />

          {/* Tab bar: milestones / audit */}
          <View style={cockpitStyles.tabBar}>
            {(['milestones', 'audit'] as ActiveTab[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  cockpitStyles.tab,
                  activeTab === tab && cockpitStyles.tabActive,
                ]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.75}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === tab }}
              >
                <Text
                  style={[
                    cockpitStyles.tabText,
                    activeTab === tab && cockpitStyles.tabTextActive,
                  ]}
                >
                  {tab === 'milestones' ? 'MILESTONE BOARD' : 'AUDIT TRAIL'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Milestones */}
          {activeTab === 'milestones' && (
            <View style={cockpitStyles.section}>
              {deal.milestones.length === 0 ? (
                <Text style={cockpitStyles.emptyText}>No milestones defined.</Text>
              ) : (
                deal.milestones.map((m) => (
                  <MilestoneRow
                    key={m.id}
                    milestone={m}
                    lens={lens}
                    onSubmit={handleMilestoneSubmit}
                    onApprove={handleMilestoneApprove}
                    onDispute={handleMilestoneDispute}
                  />
                ))
              )}
            </View>
          )}

          {/* Audit trail */}
          {activeTab === 'audit' && (
            <View style={cockpitStyles.section}>
              <AuditTrail events={deal.events} />
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const cockpitStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  loadingText: {
    color: MUTED,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    color: WHITE,
    fontSize: 20,
    fontWeight: '900',
    paddingHorizontal: 24,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginHorizontal: 24,
    marginTop: 12,
    backgroundColor: CARD_BG,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  backBtnText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '700',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 10,
  },
  navBack: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  navBackText: {
    color: WHITE,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
  navTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: WHITE,
  },
  demoPill: {
    backgroundColor: 'rgba(255,214,10,0.12)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,214,10,0.4)',
  },
  demoPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFD60A',
    letterSpacing: 1.2,
  },
  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 48,
    gap: 14,
  },
  headerCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    padding: 16,
    gap: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  brandAthleteText: {
    fontSize: 15,
    fontWeight: '800',
    color: WHITE,
    flex: 1,
  },
  dealStatusPill: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  dealStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dealIdLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 1.2,
  },
  dealId: {
    fontSize: 16,
    fontWeight: '900',
    color: COPPER,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
    marginBottom: 4,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 12,
    color: MUTED,
    fontWeight: '600',
  },
  dataValue: {
    fontSize: 13,
    color: WHITE,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  lensRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lensLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 1,
  },
  lensChip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: CARD_BG,
    minHeight: 44,
    justifyContent: 'center',
  },
  lensChipActive: {
    backgroundColor: 'rgba(235,98,26,0.15)',
    borderColor: COPPER,
  },
  lensChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: MUTED,
  },
  lensChipTextActive: {
    color: COPPER,
    fontWeight: '900',
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    padding: 16,
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: MUTED,
    letterSpacing: 1.2,
  },
  statePill: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statePillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  feeLine: {
    backgroundColor: 'rgba(235,98,26,0.07)',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(235,98,26,0.2)',
    padding: 10,
    marginTop: 2,
  },
  feeLabelText: {
    fontSize: 12,
    color: MUTED,
    lineHeight: 18,
    fontWeight: '500',
  },
  feeHighlight: {
    color: COPPER,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  feeMuted: {
    color: MUTED,
    fontVariant: ['tabular-nums'],
  },
  fundBtn: {
    flexDirection: 'row',
    backgroundColor: COPPER,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    gap: 8,
    marginTop: 4,
  },
  fundBtnText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  demoBadge: {
    backgroundColor: 'rgba(255,214,10,0.22)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  demoBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFD60A',
    letterSpacing: 1,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    minHeight: 44,
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderColor: 'rgba(255,255,255,0.22)',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 0.8,
  },
  tabTextActive: {
    color: WHITE,
  },
  section: {
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: MUTED,
    fontWeight: '600',
  },
});
