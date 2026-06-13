// components/agent/agent-home.tsx
// ── AGENT OWNER HOME ──────────────────────────────────────────────────────
// Charter §A — thin four-module home screen for the agent role.
// Modules: MONEY BOARD (cross-client) · CLEARANCE QUEUE · DUE ACROSS CLIENTS
//          · COMPLIANCE LEDGER
// Footer wall: the no-outbound lock row (agent analog of coach dollar wall).
// No animations (charter law). Tabular numerals throughout.
// Copper (#EB621A) = act-now only.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ── Charter constants ─────────────────────────────────────────────────────
const COPPER = '#EB621A';
const RED = '#FF3B30';
const AMBER = '#FFD60A';
const CARD_BG = '#1C1C1E';
const CARD_BORDER = 'rgba(255,255,255,0.07)';
const MUTED = 'rgba(255,255,255,0.50)';

// ── Fixture: cross-client money board ─────────────────────────────────────
// All numbers are static demo figures — no live API calls.
type AgingRow = {
  id: string;
  athlete: string;
  brand: string;
  amount: string;
  status: string; // "expected 45d overdue"
  overdue: boolean;
};

const AGING_ROWS: AgingRow[] = [
  {
    id: 'ar-1',
    athlete: 'Kiyan A.',
    brand: 'JMA Wireless',
    amount: '$4,500',
    status: 'expected 45d overdue',
    overdue: true,
  },
  {
    id: 'ar-2',
    athlete: 'Jalen O.',
    brand: 'Beats by Dre',
    amount: '$12,000',
    status: 'expected · pmt due Jun 20',
    overdue: false,
  },
  {
    id: 'ar-3',
    athlete: 'Maya C.',
    brand: 'Athletic Brewing',
    amount: '$6,900',
    status: '2 of 3 milestones cleared',
    overdue: false,
  },
];

// ── Fixture: clearance queue rows ─────────────────────────────────────────
type ClearanceRow = {
  id: string;
  deal: string;
  athlete: string;
  clockType: 'report' | 'resubmit';
  clockLabel: string;   // "3 days left"
  daysLeft: number | null; // null = overdue
};

const CLEARANCE_ROWS: ClearanceRow[] = [
  {
    id: 'cq-1',
    deal: 'Report to NIL Go',
    athlete: 'Kiyan A. · JMA Wireless',
    clockType: 'report',
    clockLabel: '3 days left',
    daysLeft: 3,
  },
  {
    id: 'cq-2',
    deal: 'Report to NIL Go',
    athlete: 'Maya C. · Athletic Brewing',
    clockType: 'report',
    clockLabel: '18h left',
    daysLeft: 0, // <1 day
  },
  {
    id: 'cq-3',
    deal: 'Resubmission window',
    athlete: 'Jalen O. · Beats by Dre',
    clockType: 'resubmit',
    clockLabel: '9 of 14 days left',
    daysLeft: 9,
  },
  {
    id: 'cq-4',
    deal: 'Resubmission window',
    athlete: 'JJ S. · Adidas Basketball',
    clockType: 'resubmit',
    clockLabel: '2 days left',
    daysLeft: 2,
  },
];

// ── Fixture: tasks due across clients ─────────────────────────────────────
type TaskRow = {
  id: string;
  client: string;
  task: string;
  due: string;
  urgency: 'red' | 'amber' | 'green';
};

const TASK_ROWS: TaskRow[] = [
  {
    id: 'tr-1',
    client: 'Kiyan A.',
    task: 'IG Reel deliverable · JMA Wireless',
    due: 'Due Thu 6pm',
    urgency: 'amber',
  },
  {
    id: 'tr-2',
    client: 'Jalen O.',
    task: '#ad disclosure check · Beats by Dre post',
    due: 'FTC window closes Fri',
    urgency: 'red',
  },
  {
    id: 'tr-3',
    client: 'Maya C.',
    task: 'Contract countersign · Athletic Brewing',
    due: 'Awaiting athlete signature',
    urgency: 'green',
  },
  {
    id: 'tr-4',
    client: 'JJ S.',
    task: 'Social post · Adidas Basketball',
    due: 'Due Mon 11:59pm',
    urgency: 'green',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────

function clockColor(row: ClearanceRow): string {
  if (row.daysLeft === null) return RED;
  if (row.daysLeft < 1) return RED;
  if (row.daysLeft <= 3) return AMBER;
  return 'rgba(255,255,255,0.75)';
}

function taskDotColor(urgency: TaskRow['urgency']): string {
  if (urgency === 'red') return RED;
  if (urgency === 'amber') return AMBER;
  return COPPER;
}

// ── Section header — 4px copper bar + caps label ─────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionBar} />
      <Text style={s.sectionLabel}>{label}</Text>
    </View>
  );
}

// ── MODULE 1: MONEY BOARD (cross-client) ──────────────────────────────────

function MoneyBoardModule() {
  return (
    <View style={s.card}>
      <SectionHeader label="MONEY BOARD" />
      {/* Aggregate line — tabular; overdue segment in red */}
      <View style={s.moneyAggregateLine}>
        <Text style={s.moneyAgg}>
          <Text style={s.moneyAggAmount}>$23,400</Text>
          <Text style={s.moneyAggMeta}> expected across 4 clients · 2 in CSC review · </Text>
          <Text style={s.moneyAggOverdue}>$4,500 OVERDUE 45d</Text>
        </Text>
      </View>

      {/* Aging rows — max 3 */}
      <View style={s.agingTable}>
        {AGING_ROWS.map((row, idx) => (
          <View
            key={row.id}
            style={[s.agingRow, idx > 0 && s.agingRowBorder]}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.agingAthleteText}>
                {row.athlete} · {row.brand}
              </Text>
              <Text style={[s.agingStatus, row.overdue && s.agingStatusOverdue]}>
                {row.status}
              </Text>
            </View>
            <View style={s.agingRight}>
              <Text style={[s.agingAmount, row.overdue && s.agingAmountOverdue]}>
                {row.amount}
              </Text>
              {/* Ghost NUDGE PAYER chip — deal-engine pattern, no-op tap */}
              <Pressable
                style={s.nudgeChip}
                onPress={() =>
                  Alert.alert(
                    'Nudge Payer',
                    'Athletes control payer communications — this queues a follow-up note for your records. (DEMO)',
                  )
                }
                accessibilityRole="button"
                accessibilityLabel="Nudge payer"
              >
                <Text style={s.nudgeChipText}>NUDGE PAYER</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── MODULE 2: CLEARANCE QUEUE ─────────────────────────────────────────────

function ClearanceQueueModule() {
  return (
    <View style={s.card}>
      <SectionHeader label="CLEARANCE QUEUE" />
      {CLEARANCE_ROWS.map((row, idx) => {
        const cc = clockColor(row);
        return (
          <View key={row.id} style={[s.clearanceRow, idx > 0 && s.clearanceRowBorder]}>
            <View style={[s.clearanceStripe, { backgroundColor: cc }]} />
            <View style={s.clearanceContent}>
              <View style={s.clearanceTopRow}>
                <Text style={s.clearanceDeal} numberOfLines={1}>{row.deal}</Text>
                <View style={[s.clockChip, { borderColor: `${cc}66`, backgroundColor: `${cc}1A` }]}>
                  <Text style={[s.clockChipText, { color: cc }]}>{row.clockLabel}</Text>
                </View>
              </View>
              <Text style={s.clearanceAthlete} numberOfLines={1}>{row.athlete}</Text>
              <Text style={s.clearanceFootnote}>Athlete submits — you prep</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── MODULE 3: DUE ACROSS CLIENTS ─────────────────────────────────────────

function DueAcrossClientsModule() {
  return (
    <View style={s.card}>
      <SectionHeader label="DUE ACROSS CLIENTS" />
      {TASK_ROWS.map((row, idx) => {
        const dotColor = taskDotColor(row.urgency);
        return (
          <View key={row.id} style={[s.taskRow, idx > 0 && s.taskRowBorder]}>
            <View style={[s.taskDot, { backgroundColor: dotColor }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.taskClient} numberOfLines={1}>{row.client}</Text>
              <Text style={s.taskName} numberOfLines={1}>{row.task}</Text>
              <Text style={s.taskDue} numberOfLines={1}>{row.due}</Text>
            </View>
            {row.urgency !== 'green' && (
              <View style={[s.urgencyChip, { backgroundColor: dotColor === RED ? 'rgba(255,59,48,0.14)' : 'rgba(255,214,10,0.14)' }]}>
                <Text style={[s.urgencyChipText, { color: dotColor }]}>
                  {row.urgency === 'red' ? 'URGENT' : 'SOON'}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ── MODULE 4: COMPLIANCE LEDGER ───────────────────────────────────────────

function ComplianceLedgerModule() {
  return (
    <View style={[s.card, s.ledgerCard]}>
      <SectionHeader label="COMPLIANCE LEDGER" />
      <View style={s.ledgerRow}>
        <Ionicons name="checkmark-circle" size={14} color="rgba(52,199,89,0.8)" />
        <Text style={s.ledgerText} numberOfLines={2}>
          SPARTA: 4/4 school notifications sent on time · UAAA: FL #A-2231, TX #88410 active
        </Text>
        <Pressable
          onPress={() => Alert.alert('Receipts', 'Compliance receipts archive. (DEMO)')}
          accessibilityRole="button"
          accessibilityLabel="View compliance receipts"
        >
          <Text style={s.receiptsLink}>RECEIPTS</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Footer wall — deliberate lock row (agent analog of coach dollar wall) ─

function FooterWall() {
  return (
    <View style={s.wallRow}>
      <Ionicons name="lock-closed" size={13} color={MUTED} />
      <Text style={s.wallText}>
        Athletes invite their rep and make every final submission — Proslync has no outbound contact or discovery.
      </Text>
    </View>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────

export interface AgentHomeProps {
  bottomInset?: number;
  topInset?: number;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export function AgentHome({ bottomInset = 0, topInset = 0, onScroll }: AgentHomeProps) {
  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[
        s.content,
        { paddingTop: topInset + 16, paddingBottom: bottomInset + 120 },
      ]}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <MoneyBoardModule />
      <ClearanceQueueModule />
      <DueAcrossClientsModule />
      <ComplianceLedgerModule />
      <FooterWall />
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    gap: 14,
  },

  // Card container — mirrors coach-home exactly
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },

  // Section header: 4px copper bar + caps label
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  sectionBar: {
    width: 4,
    height: 14,
    borderRadius: 2,
    backgroundColor: COPPER,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: COPPER,
  },

  // ── Module 1: Money Board ──────────────────────────────────
  moneyAggregateLine: {
    paddingVertical: 2,
  },
  moneyAgg: {
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },
  moneyAggAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  moneyAggMeta: {
    fontSize: 13,
    fontWeight: '500',
    color: MUTED,
  },
  moneyAggOverdue: {
    fontSize: 13,
    fontWeight: '800',
    color: RED,
  },

  agingTable: {
    gap: 0,
  },
  agingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    gap: 10,
  },
  agingRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CARD_BORDER,
  },
  agingAthleteText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  agingStatus: {
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
    marginTop: 2,
  },
  agingStatusOverdue: {
    color: RED,
    fontWeight: '700',
  },
  agingRight: {
    alignItems: 'flex-end',
    gap: 5,
    flexShrink: 0,
  },
  agingAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  agingAmountOverdue: {
    color: RED,
  },
  nudgeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  nudgeChipText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.55)',
  },

  // ── Module 2: Clearance Queue ──────────────────────────────
  clearanceRow: {
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },
  clearanceRowBorder: {
    marginTop: 8,
  },
  clearanceStripe: {
    width: 3,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  clearanceContent: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 3,
  },
  clearanceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  clearanceDeal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  clockChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
  },
  clockChipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    fontVariant: ['tabular-nums'],
  },
  clearanceAthlete: {
    fontSize: 11,
    fontWeight: '600',
    color: MUTED,
  },
  clearanceFootnote: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.30)',
    marginTop: 1,
  },

  // ── Module 3: Due Across Clients ───────────────────────────
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 9,
    gap: 10,
  },
  taskRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CARD_BORDER,
  },
  taskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
    flexShrink: 0,
  },
  taskClient: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: MUTED,
    textTransform: 'uppercase',
  },
  taskName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 1,
    letterSpacing: -0.1,
  },
  taskDue: {
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
    marginTop: 1,
  },
  urgencyChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    alignSelf: 'flex-start',
    marginTop: 3,
    flexShrink: 0,
  },
  urgencyChipText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  // ── Module 4: Compliance Ledger ────────────────────────────
  ledgerCard: {
    gap: 8,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  ledgerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: MUTED,
    lineHeight: 17,
  },
  receiptsLink: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.30)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },

  // ── Footer wall ────────────────────────────────────────────
  wallRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  wallText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
    lineHeight: 15,
  },
});
