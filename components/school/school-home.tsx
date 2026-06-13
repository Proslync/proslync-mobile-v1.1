// components/school/school-home.tsx
// ── SCHOOL / AD HOME ─────────────────────────────────────────────────────
// Charter §A — thin five-module home screen for the school/AD role.
// Derivative-state consumer only: clocks, flags, counts, receipts.
// NEVER: per-athlete dollar amounts, approve/veto, agent management,
//        fan payer identities, rev-share cap tooling.
// Modules:
//   1. NIL GO TRIAGE (hero — queue rows, banded values only)
//   2. SPARTA AGENT LEDGER (notice registry + FTC export ghost)
//   3. AE EXPOSURE (associated-entity deal surface)
//   4. DISCLOSURE HEALTH (aggregate pills + anomaly line)
//   5. PAYMENT ALERTS (derived reliability signal)
// Footer wall: deliberate lock row — charter law.
// No animations (charter law). Tabular numerals throughout.

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

// ── Charter constants ──────────────────────────────────────────────────────
const COPPER = '#EB621A';
const CARD_BG = 'rgba(255,255,255,0.05)';
const CARD_BORDER = 'rgba(255,255,255,0.10)';
const MUTED = 'rgba(255,255,255,0.50)';
const RED = '#FF3B30';
const AMBER = '#FFD60A';
const GREEN = '#34C759';

// ── Module helpers ─────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionBar} />
      <Text style={s.sectionLabel}>{label}</Text>
    </View>
  );
}

// ── MODULE 1: NIL GO TRIAGE ────────────────────────────────────────────────

type TriageRow = {
  id: string;
  athlete: string;
  entity: string;
  status: string;
  statusType: 'clear' | 'warn' | 'amber';
  detail?: string;
};

const TRIAGE_ROWS: TriageRow[] = [
  {
    id: 'tg-1',
    athlete: 'Kiyan A.',
    entity: 'JMA Wireless',
    status: 'submitted · cleared ✓',
    statusType: 'clear',
  },
  {
    id: 'tg-2',
    athlete: 'M. Reid',
    entity: 'collective deal · UNDISCLOSED',
    status: '2 days left on clock',
    statusType: 'warn',
    detail: '$2.5–5K band',
  },
  {
    id: 'tg-3',
    athlete: 'J. Starling',
    entity: 'resubmission window',
    status: '9 of 14 days',
    statusType: 'amber',
  },
  {
    id: 'tg-4',
    athlete: 'Devon O.',
    entity: 'Nike Campus',
    status: 'submitted · cleared ✓',
    statusType: 'clear',
  },
  {
    id: 'tg-5',
    athlete: 'Aaron B.',
    entity: 'Gatorade',
    status: 'submitted · cleared ✓',
    statusType: 'clear',
  },
];

function NilGoTriageModule() {
  return (
    <View style={s.card}>
      <SectionHeader label="NIL GO TRIAGE" />
      {TRIAGE_ROWS.map((row) => {
        const isWarn = row.statusType === 'warn';
        const isAmber = row.statusType === 'amber';
        const isClear = row.statusType === 'clear';
        return (
          <View
            key={row.id}
            style={[
              s.triageRow,
              isWarn && s.triageRowWarn,
              isAmber && s.triageRowAmber,
            ]}
          >
            {(isWarn || isAmber) && (
              <View style={[s.triageStripe, { backgroundColor: isWarn ? RED : AMBER }]} />
            )}
            <View style={s.triageContent}>
              <View style={s.triageTop}>
                <Text style={s.triageAthlete}>{row.athlete}</Text>
                <Text style={s.triageDot}> · </Text>
                <Text style={s.triageEntity} numberOfLines={1}>{row.entity}</Text>
              </View>
              <View style={s.triageBottom}>
                <Text
                  style={[
                    s.triageStatus,
                    isClear && s.triageStatusClear,
                    isWarn && s.triageStatusWarn,
                    isAmber && s.triageStatusAmber,
                  ]}
                >
                  {row.status}
                </Text>
                {row.detail ? (
                  <Text style={s.triageBand}> · {row.detail}</Text>
                ) : null}
              </View>
            </View>
          </View>
        );
      })}
      <Text style={s.triageFooter}>12 more · all clear ✓</Text>
    </View>
  );
}

// ── MODULE 2: SPARTA AGENT LEDGER ─────────────────────────────────────────

type AgentRow = {
  id: string;
  agent: string;
  athlete: string;
  notice: string;
  noticeType: 'received' | 'pending';
  detail?: string;
};

const AGENT_ROWS: AgentRow[] = [
  {
    id: 'ag-1',
    agent: 'Marcus Webb',
    athlete: 'Kiyan A.',
    notice: 'notice received Jun 3',
    noticeType: 'received',
    detail: '✓',
  },
  {
    id: 'ag-2',
    agent: 'Dana Cole',
    athlete: 'Jordan M.',
    notice: 'notice received May 28',
    noticeType: 'received',
    detail: '✓',
  },
  {
    id: 'ag-3',
    agent: 'T. Simmons',
    athlete: 'Marcus R.',
    notice: 'notice pending · 41h left',
    noticeType: 'pending',
  },
];

function SpartaLedgerModule() {
  return (
    <View style={s.card}>
      <SectionHeader label="SPARTA AGENT LEDGER" />
      {AGENT_ROWS.map((row) => {
        const isPending = row.noticeType === 'pending';
        return (
          <View
            key={row.id}
            style={[s.agentRow, isPending && s.agentRowPending]}
          >
            {isPending && <View style={s.agentStripe} />}
            <View style={s.agentContent}>
              <Text style={s.agentName}>
                {row.agent}
                <Text style={s.agentArrow}> → </Text>
                <Text style={s.agentAthlete}>{row.athlete}</Text>
              </Text>
              <Text
                style={[
                  s.agentNotice,
                  isPending ? s.agentNoticePending : s.agentNoticeReceived,
                ]}
              >
                {row.notice}
                {row.detail ? <Text style={s.agentCheck}> {row.detail}</Text> : null}
              </Text>
            </View>
          </View>
        );
      })}
      <Pressable
        style={({ pressed }) => [s.ghostBtn, { opacity: pressed ? 0.65 : 1 }]}
        onPress={() =>
          Alert.alert(
            'FTC Export (DEMO)',
            "Exported in the FTC's requested spreadsheet schema. (DEMO)",
          )
        }
        accessibilityRole="button"
        accessibilityLabel="Export agent ledger in FTC format"
      >
        <Ionicons name="document-outline" size={14} color={COPPER} />
        <Text style={s.ghostBtnText}>EXPORT FTC FORMAT</Text>
      </Pressable>
    </View>
  );
}

// ── MODULE 3: AE EXPOSURE ─────────────────────────────────────────────────

const AE_STATS = [
  { value: '6', label: 'deals via associated entities' },
  { value: '2', label: 'pending VBP review' },
  { value: '0', label: 'warehousing flags' },
];

function AeExposureModule() {
  return (
    <View style={s.card}>
      <SectionHeader label="AE EXPOSURE" />
      <View style={s.pillsRow}>
        {AE_STATS.map((stat) => (
          <View key={stat.label} style={s.statPill}>
            <Text style={s.statValue}>{stat.value}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
      <View style={[s.flagRow, s.flagRowAmber]}>
        <View style={s.flagStripe} />
        <Text style={s.flagText} numberOfLines={2}>
          Orange Collective — 2 deals awaiting valid-business-purpose docs
        </Text>
      </View>
    </View>
  );
}

// ── MODULE 4: DISCLOSURE HEALTH ───────────────────────────────────────────

const HEALTH_PILLS = [
  { value: '87%', label: 'of roster logging', accent: false },
  { value: '34',  label: 'deals this season',  accent: false },
  { value: '29',  label: 'conf. median',        accent: false },
];

function DisclosureHealthModule() {
  return (
    <View style={s.card}>
      <SectionHeader label="DISCLOSURE HEALTH" />
      <View style={s.pillsRow}>
        {HEALTH_PILLS.map((pill) => (
          <View key={pill.label} style={s.statPill}>
            <Text style={s.statValue}>{pill.value}</Text>
            <Text style={s.statLabel}>{pill.label}</Text>
          </View>
        ))}
      </View>
      <View style={s.anomalyRow}>
        <Ionicons name="checkmark-circle" size={14} color={GREEN} />
        <Text style={s.anomalyText}>No under-disclosure anomalies detected</Text>
      </View>
    </View>
  );
}

// ── MODULE 5: PAYMENT ALERTS ───────────────────────────────────────────────

function PaymentAlertsModule() {
  return (
    <View style={s.card}>
      <SectionHeader label="PAYMENT ALERTS" />
      <View style={[s.flagRow, s.flagRowAmber]}>
        <View style={s.flagStripe} />
        <Text style={s.flagText} numberOfLines={2}>
          2 athletes unpaid {'>'} 30d by Hometown Auto (reliability: low)
        </Text>
      </View>
      <Text style={s.paymentFooter}>
        Brand reliability comes from athlete-confirmed payment truth.
      </Text>
    </View>
  );
}

// ── FOOTER WALL ────────────────────────────────────────────────────────────

function FooterWall() {
  return (
    <View style={s.wallRow}>
      <Ionicons name="lock-closed" size={13} color={MUTED} />
      <Text style={s.wallText}>
        Proslync shows your office clocks, flags and receipts — never the athlete's ledger. Review and flag; never approve or veto.
      </Text>
    </View>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────

export interface SchoolHomeProps {
  bottomInset?: number;
  topInset?: number;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export function SchoolHome({ bottomInset = 0, topInset = 0, onScroll }: SchoolHomeProps) {
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
      <NilGoTriageModule />
      <SpartaLedgerModule />
      <AeExposureModule />
      <DisclosureHealthModule />
      <PaymentAlertsModule />
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

  // Card container
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

  // ── Module 1: NIL Go Triage ──────────────────────────────
  triageRow: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    flexDirection: 'row',
  },
  triageRowWarn: {
    backgroundColor: 'rgba(255,59,48,0.08)',
    borderColor: 'rgba(255,59,48,0.28)',
  },
  triageRowAmber: {
    backgroundColor: 'rgba(255,214,10,0.07)',
    borderColor: 'rgba(255,214,10,0.28)',
  },
  triageStripe: {
    width: 3,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  triageContent: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  triageTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  triageAthlete: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  triageDot: {
    fontSize: 13,
    color: MUTED,
  },
  triageEntity: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
    flex: 1,
  },
  triageBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  triageStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
  },
  triageStatusClear: {
    color: GREEN,
  },
  triageStatusWarn: {
    color: RED,
    fontWeight: '700',
  },
  triageStatusAmber: {
    color: AMBER,
    fontWeight: '700',
  },
  triageBand: {
    fontSize: 11,
    fontWeight: '600',
    color: MUTED,
    fontVariant: ['tabular-nums'],
  },
  triageFooter: {
    fontSize: 11,
    fontWeight: '600',
    color: GREEN,
    marginTop: 2,
  },

  // ── Module 2: SPARTA Ledger ──────────────────────────────
  agentRow: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    flexDirection: 'row',
  },
  agentRowPending: {
    backgroundColor: 'rgba(255,214,10,0.07)',
    borderColor: 'rgba(255,214,10,0.28)',
  },
  agentStripe: {
    width: 3,
    backgroundColor: AMBER,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  agentContent: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 3,
  },
  agentName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  agentArrow: {
    color: MUTED,
    fontWeight: '400',
  },
  agentAthlete: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  agentNotice: {
    fontSize: 12,
    fontWeight: '500',
  },
  agentNoticeReceived: {
    color: MUTED,
  },
  agentNoticePending: {
    color: AMBER,
    fontWeight: '700',
  },
  agentCheck: {
    color: GREEN,
    fontWeight: '700',
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 4,
    paddingVertical: 11,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: `${COPPER}55`,
    backgroundColor: `${COPPER}10`,
  },
  ghostBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: COPPER,
    letterSpacing: 0.7,
  },

  // ── Modules 3-5: shared stat pill row ───────────────────
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statPill: {
    flex: 1,
    minWidth: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: MUTED,
    textAlign: 'center',
    lineHeight: 13,
  },

  // ── Shared flag row ──────────────────────────────────────
  flagRow: {
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
  },
  flagRowAmber: {
    backgroundColor: 'rgba(255,214,10,0.07)',
    borderColor: 'rgba(255,214,10,0.28)',
  },
  flagStripe: {
    width: 3,
    backgroundColor: AMBER,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  flagText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: AMBER,
    paddingHorizontal: 10,
    paddingVertical: 9,
    lineHeight: 16,
  },

  // ── Module 4: Anomaly row ────────────────────────────────
  anomalyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  anomalyText: {
    fontSize: 12,
    fontWeight: '600',
    color: GREEN,
  },

  // ── Module 5: Payment footer ──────────────────────────────
  paymentFooter: {
    fontSize: 10,
    fontWeight: '500',
    color: MUTED,
    lineHeight: 14,
  },

  // ── Footer wall ───────────────────────────────────────────
  wallRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  wallText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: MUTED,
    lineHeight: 18,
  },
});
