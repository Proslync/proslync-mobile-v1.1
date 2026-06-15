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

import {
  ACCENT,
  HAIRLINE,
  HAIRLINE_SUBTLE,
  RADIUS_CARD,
  RADIUS_LG,
  RADIUS_SM,
  SIGNAL_NEGATIVE,
  SIGNAL_POSITIVE,
  SIGNAL_WARN,
  SP_LG,
  SP_MD,
  SP_SM,
  SP_XS,
  SURFACE,
  SURFACE_SUBTLE,
  TEXT,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  WEIGHT,
} from '@/components/shared/ui-kit/tokens';
import { TriageDetailSheet, type TriageDetail } from '@/components/school/triage-detail-sheet';

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
  // Tapping a row opens a CHARTER-SAFE flag detail: clock + flag state +
  // banded value + SPARTA/AE flags + export. No dollar ledger, no approve/veto.
  const [openRow, setOpenRow] = React.useState<TriageDetail | null>(null);
  return (
    <View style={s.card}>
      <SectionHeader label="NIL GO TRIAGE" />
      {TRIAGE_ROWS.map((row) => {
        const isWarn = row.statusType === 'warn';
        const isAmber = row.statusType === 'amber';
        const isClear = row.statusType === 'clear';
        return (
          <Pressable
            key={row.id}
            style={[
              s.triageRow,
              isWarn && s.triageRowWarn,
              isAmber && s.triageRowAmber,
            ]}
            onPress={() => setOpenRow(row)}
            accessibilityRole="button"
            accessibilityLabel={`Triage flag: ${row.athlete} · ${row.entity} · ${row.status}`}
          >
            {(isWarn || isAmber) && (
              <View style={[s.triageStripe, { backgroundColor: isWarn ? SIGNAL_NEGATIVE : SIGNAL_WARN }]} />
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
          </Pressable>
        );
      })}
      <Text style={s.triageFooter}>12 more · all clear ✓</Text>
      <TriageDetailSheet row={openRow} visible={openRow !== null} onClose={() => setOpenRow(null)} />
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
      {/* Primary export CTA — keeps ACCENT (act-now affordance) */}
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
        <Ionicons name="document-outline" size={14} color={ACCENT} />
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
        <Ionicons name="checkmark-circle" size={14} color={SIGNAL_POSITIVE} />
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
      <Ionicons name="lock-closed" size={13} color={TEXT_TERTIARY} />
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
        { paddingTop: topInset + SP_LG, paddingBottom: bottomInset + 120 },
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
    paddingHorizontal: SP_LG,
    gap: SP_MD,
  },

  // Card container
  card: {
    backgroundColor: SURFACE,
    borderRadius: RADIUS_LG,
    padding: SP_LG,
    gap: SP_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },

  // Section header: 4px copper bar + caps label (TEXT_PRIMARY per copper-restraint)
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP_SM,
    marginBottom: 2,
  },
  sectionBar: {
    width: 4,
    height: 14,
    borderRadius: 2,
    backgroundColor: ACCENT,
  },
  sectionLabel: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.bold,
    letterSpacing: 1.2,
    color: TEXT_PRIMARY,
  },

  // ── Module 1: NIL Go Triage ──────────────────────────────
  triageRow: {
    borderRadius: RADIUS_SM,
    overflow: 'hidden',
    backgroundColor: SURFACE_SUBTLE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    flexDirection: 'row',
  },
  triageRowWarn: {
    backgroundColor: `${SIGNAL_NEGATIVE}0D`,
    borderColor: `${SIGNAL_NEGATIVE}30`,
  },
  triageRowAmber: {
    backgroundColor: `${SIGNAL_WARN}0A`,
    borderColor: `${SIGNAL_WARN}28`,
  },
  triageStripe: {
    width: 3,
    borderTopLeftRadius: RADIUS_SM,
    borderBottomLeftRadius: RADIUS_SM,
  },
  triageContent: {
    flex: 1,
    paddingHorizontal: SP_SM,
    paddingVertical: SP_XS + 4,
    gap: 2,
  },
  triageTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  triageAthlete: {
    fontSize: TEXT.label,
    fontWeight: WEIGHT.bold,
    color: TEXT_PRIMARY,
  },
  triageDot: {
    fontSize: TEXT.label,
    color: TEXT_SECONDARY,
  },
  triageEntity: {
    fontSize: TEXT.label,
    fontWeight: WEIGHT.medium,
    color: TEXT_SECONDARY,
    flex: 1,
  },
  triageBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  triageStatus: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.semibold,
    color: TEXT_SECONDARY,
  },
  triageStatusClear: {
    color: SIGNAL_POSITIVE,
  },
  triageStatusWarn: {
    color: SIGNAL_NEGATIVE,
    fontWeight: WEIGHT.bold,
  },
  triageStatusAmber: {
    color: SIGNAL_WARN,
    fontWeight: WEIGHT.bold,
  },
  triageBand: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.semibold,
    color: TEXT_SECONDARY,
    fontVariant: ['tabular-nums'],
  },
  triageFooter: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.semibold,
    color: SIGNAL_POSITIVE,
    marginTop: 2,
  },

  // ── Module 2: SPARTA Ledger ──────────────────────────────
  agentRow: {
    borderRadius: RADIUS_SM,
    overflow: 'hidden',
    backgroundColor: SURFACE_SUBTLE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    flexDirection: 'row',
  },
  agentRowPending: {
    backgroundColor: `${SIGNAL_WARN}0A`,
    borderColor: `${SIGNAL_WARN}28`,
  },
  agentStripe: {
    width: 3,
    backgroundColor: SIGNAL_WARN,
    borderTopLeftRadius: RADIUS_SM,
    borderBottomLeftRadius: RADIUS_SM,
  },
  agentContent: {
    flex: 1,
    paddingHorizontal: SP_SM,
    paddingVertical: SP_XS + 4,
    gap: 3,
  },
  agentName: {
    fontSize: TEXT.label,
    fontWeight: WEIGHT.bold,
    color: TEXT_PRIMARY,
  },
  agentArrow: {
    color: TEXT_SECONDARY,
    fontWeight: WEIGHT.regular,
  },
  agentAthlete: {
    color: TEXT_PRIMARY,
    fontWeight: WEIGHT.semibold,
  },
  agentNotice: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.medium,
  },
  agentNoticeReceived: {
    color: TEXT_SECONDARY,
  },
  agentNoticePending: {
    color: SIGNAL_WARN,
    fontWeight: WEIGHT.bold,
  },
  agentCheck: {
    color: SIGNAL_POSITIVE,
    fontWeight: WEIGHT.bold,
  },
  // Primary export CTA — keeps ACCENT styling (act-now affordance)
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: SP_XS,
    paddingVertical: 11,
    borderRadius: RADIUS_CARD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${ACCENT}55`,
    backgroundColor: `${ACCENT}10`,
  },
  ghostBtnText: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.bold,
    color: ACCENT,
    letterSpacing: 0.7,
  },

  // ── Modules 3-5: shared stat pill row ───────────────────
  pillsRow: {
    flexDirection: 'row',
    gap: SP_SM,
    flexWrap: 'wrap',
  },
  statPill: {
    flex: 1,
    minWidth: 80,
    backgroundColor: SURFACE_SUBTLE,
    borderRadius: RADIUS_CARD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    paddingVertical: SP_SM,
    paddingHorizontal: SP_SM,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: WEIGHT.bold,
    color: TEXT_PRIMARY,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
  },
  statLabel: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.semibold,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 13,
  },

  // ── Shared flag row ──────────────────────────────────────
  flagRow: {
    borderRadius: RADIUS_SM,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
  },
  flagRowAmber: {
    backgroundColor: `${SIGNAL_WARN}0A`,
    borderColor: `${SIGNAL_WARN}28`,
  },
  flagStripe: {
    width: 3,
    backgroundColor: SIGNAL_WARN,
    borderTopLeftRadius: RADIUS_SM,
    borderBottomLeftRadius: RADIUS_SM,
  },
  flagText: {
    flex: 1,
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.semibold,
    color: SIGNAL_WARN,
    paddingHorizontal: SP_SM,
    paddingVertical: 9,
    lineHeight: 16,
  },

  // ── Module 4: Anomaly row ────────────────────────────────
  anomalyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SP_XS,
  },
  anomalyText: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.semibold,
    color: SIGNAL_POSITIVE,
  },

  // ── Module 5: Payment footer ──────────────────────────────
  paymentFooter: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.medium,
    color: TEXT_SECONDARY,
    lineHeight: 14,
  },

  // ── Footer wall ───────────────────────────────────────────
  wallRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SP_SM,
    paddingHorizontal: SP_MD,
    paddingVertical: SP_MD,
    borderRadius: RADIUS_CARD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE_SUBTLE,
    backgroundColor: SURFACE_SUBTLE,
  },
  wallText: {
    flex: 1,
    fontSize: TEXT.label,
    fontWeight: WEIGHT.medium,
    color: TEXT_SECONDARY,
    lineHeight: 18,
  },
});
