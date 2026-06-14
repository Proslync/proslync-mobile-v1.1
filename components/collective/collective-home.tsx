// components/collective/collective-home.tsx
// ── COLLECTIVE HOME ───────────────────────────────────────────────────────
// Charter: MONEY-side seat (payer). Four modules:
//   1. CLEARANCE PIPELINE (hero — stage pills + deal rows with dollars)
//   2. VBP PACKET BUILDER (in-progress packet card + ASSEMBLE CTA)
//   3. AE EXPOSURE (honest — status + Wilken amber)
//   4. PAYMENT OPS (escrow / unpaid / 1099s)
// Footer wall: locked deliberate row.
// No animations (charter law). Tabular numerals throughout. Copper act-now only.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  predictClearance,
  FMV_DISCLAIMER,
} from '@/lib/fmv/fmv-engine';
import type { DealKind } from '@/lib/fmv/fmv-engine';
import { getMockAthleteSocialReach } from '@/lib/data/mock-social-reach';
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

const STAGE_PILLS = [
  { label: 'DRAFTING',     count: 3  },
  { label: 'PRE-CHECKED',  count: 2  },
  { label: 'SUBMITTED',    count: 4  },
  { label: 'CLEARED',      count: 31 },
  { label: 'NOT CLEARED',  count: 2  },
] as const;

type DealRowStatus = 'cleared' | 'submitted' | 'not-cleared' | 'pre-checked';

type DealRow = {
  id: string;
  athlete: string;
  athleteId: string;
  brand: string;
  amount: string;
  amountCents: number;
  dealKind: DealKind;
  status: DealRowStatus;
  detail: string;
};

const DEAL_ROWS: DealRow[] = [
  {
    id: 'cr-1',
    athlete: 'Kiyan A.',
    athleteId: 'a-1',
    brand: 'JMA Wireless',
    amount: '$4,500',
    amountCents: 450_000,
    dealKind: 'endorsement',
    status: 'cleared',
    detail: 'cleared in 26h ✓',
  },
  {
    id: 'cr-2',
    athlete: 'J. Starling',
    athleteId: 'a-4',
    brand: 'Gatorade',
    amount: '$2,200',
    amountCents: 220_000,
    dealKind: 'social-post',
    status: 'submitted',
    detail: 'submitted · day 4 of review',
  },
  {
    id: 'cr-3',
    athlete: 'M. Reid',
    athleteId: 'a-1',
    brand: 'Nike Campus',
    amount: '$1,800',
    amountCents: 180_000,
    dealKind: 'appearance',
    status: 'not-cleared',
    detail: 'NOT CLEARED — resubmission 9 of 14 days · missing VBP docs',
  },
  {
    id: 'cr-4',
    athlete: 'Devon O.',
    athleteId: 'a-2',
    brand: 'Puma',
    amount: '$900',
    amountCents: 90_000,
    dealKind: 'autograph',
    status: 'pre-checked',
    detail: 'pre-checked: likely-clear · ready to submit',
  },
];

// ── FMV band chip (compact per-row indicator) ─────────────────────────────

function FmvBandChip({ row }: { row: DealRow }) {
  const reach = getMockAthleteSocialReach(row.athleteId) ??
                getMockAthleteSocialReach('a-1');
  const prediction = predictClearance({
    amountCents: row.amountCents,
    dealKind: row.dealKind,
    deliverableDescription: 'Promotional activation for brand partnership',
    payerEntityType: 'brand',
    totalFollowers: reach?.totalFollowers ?? 0,
    engagementRate7d: reach?.engagementRate7d ?? 0,
  });
  const dotColor =
    prediction.band === 'likely'     ? GREEN :
    prediction.band === 'borderline' ? AMBER :
                                       RED;
  const chipLabel =
    prediction.band === 'likely'     ? 'Likely' :
    prediction.band === 'borderline' ? 'Borderline' :
                                       'Unlikely';
  return (
    <View style={chipS.row}>
      <View style={[chipS.dot, { backgroundColor: dotColor }]} />
      <Text style={[chipS.label, { color: dotColor }]}>{chipLabel}</Text>
    </View>
  );
}

const chipS = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});

// ── MODULE 1: CLEARANCE PIPELINE ──────────────────────────────────────────

function ClearancePipelineModule() {
  return (
    <View style={s.card}>
      <SectionHeader label="CLEARANCE PIPELINE" />

      {/* Hero stat line */}
      <View style={s.heroStatRow}>
        <Text style={s.heroStat}>First-pass clearance</Text>
        <Text style={s.heroStatValue}>91%</Text>
        <Text style={s.heroStatDivider}> · </Text>
        <Text style={s.heroStat}>season</Text>
        <Text style={s.heroStatValue}> $284K</Text>
        <Text style={s.heroStatDivider}> cleared</Text>
      </View>

      {/* Stage pills row */}
      <View style={s.stagePillsRow}>
        {STAGE_PILLS.map((pill) => {
          const isNotCleared = pill.label === 'NOT CLEARED';
          const isCleared = pill.label === 'CLEARED';
          return (
            <View
              key={pill.label}
              style={[
                s.stagePill,
                isCleared && s.stagePillGreen,
                isNotCleared && s.stagePillRed,
              ]}
            >
              <Text
                style={[
                  s.stagePillCount,
                  isCleared && s.stagePillCountGreen,
                  isNotCleared && s.stagePillCountRed,
                ]}
              >
                {pill.count}
              </Text>
              <Text
                style={[
                  s.stagePillLabel,
                  isCleared && s.stagePillLabelGreen,
                  isNotCleared && s.stagePillLabelRed,
                ]}
                numberOfLines={2}
              >
                {pill.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Deal rows */}
      {DEAL_ROWS.map((row) => {
        const isCleared = row.status === 'cleared';
        const isSubmitted = row.status === 'submitted';
        const isNotCleared = row.status === 'not-cleared';
        const isPreChecked = row.status === 'pre-checked';
        return (
          <View
            key={row.id}
            style={[
              s.dealRow,
              isNotCleared && s.dealRowRed,
              isSubmitted && s.dealRowAmber,
            ]}
          >
            {(isNotCleared || isSubmitted) && (
              <View
                style={[
                  s.dealStripe,
                  { backgroundColor: isNotCleared ? RED : AMBER },
                ]}
              />
            )}
            <View style={s.dealContent}>
              <View style={s.dealTop}>
                <Text style={s.dealAthlete}>{row.athlete}</Text>
                <Text style={s.dealDot}> × </Text>
                <Text style={s.dealBrand}>{row.brand}</Text>
                <Text style={s.dealAmount}> · {row.amount}</Text>
              </View>
              <Text
                style={[
                  s.dealDetail,
                  isCleared && s.dealDetailGreen,
                  isNotCleared && s.dealDetailRed,
                  isSubmitted && s.dealDetailAmber,
                  isPreChecked && s.dealDetailMuted,
                ]}
                numberOfLines={2}
              >
                {row.detail}
              </Text>
              <FmvBandChip row={row} />
            </View>
          </View>
        );
      })}

      {/* FMV disclaimer — once at the section footer */}
      <Text style={s.fmvDisclaimer}>{FMV_DISCLAIMER}</Text>
    </View>
  );
}

// ── MODULE 2: VBP PACKET BUILDER ──────────────────────────────────────────

const CHECKLIST = [
  { label: 'Business-purpose statement', done: true  },
  { label: 'Deliverable evidence',       done: true  },
  { label: 'Comp benchmark attached',    done: true  },
  { label: 'AE disclosure',             done: true  },
  { label: 'Athlete countersign',        done: false, pending: 'pending' },
] as const;

function VbpPacketBuilderModule() {
  return (
    <View style={s.card}>
      <SectionHeader label="VBP PACKET BUILDER" />

      {/* In-progress packet card */}
      <View style={s.packetCard}>
        <View style={s.packetHeader}>
          <Ionicons name="document-text-outline" size={16} color={COPPER} />
          <Text style={s.packetTitle}>Orange Collective × M. Reid</Text>
        </View>
        <Text style={s.packetMeta}>appearance · $2,800</Text>

        {/* Checklist */}
        <View style={s.checklist}>
          {CHECKLIST.map((item) => (
            <View key={item.label} style={s.checklistRow}>
              <Ionicons
                name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
                size={14}
                color={item.done ? GREEN : AMBER}
              />
              <Text
                style={[
                  s.checklistLabel,
                  !item.done && s.checklistLabelPending,
                ]}
              >
                {item.label}
                {'pending' in item && item.pending
                  ? ` — ${item.pending}`
                  : ''}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Copper CTA */}
      <Pressable
        style={({ pressed }) => [s.copperBtn, { opacity: pressed ? 0.72 : 1 }]}
        onPress={() =>
          Alert.alert(
            'VBP Packet Assembled (DEMO)',
            'VBP packet assembled — submission-ready PDF. (DEMO)',
          )
        }
        accessibilityRole="button"
        accessibilityLabel="Assemble VBP packet"
      >
        <Ionicons name="cloud-upload-outline" size={15} color="#000" />
        <Text style={s.copperBtnText}>ASSEMBLE PACKET</Text>
      </Pressable>
    </View>
  );
}

// ── MODULE 3: AE EXPOSURE ─────────────────────────────────────────────────

function AeExposureModule() {
  return (
    <View style={s.card}>
      <SectionHeader label="AE EXPOSURE" />

      <View style={s.aeStatusRow}>
        <View style={[s.aeBadge, s.aeBadgeAmber]}>
          <Text style={s.aeBadgeText}>ASSOCIATED ENTITY — YES</Text>
        </View>
      </View>
      <Text style={s.aeBodyText}>
        100% of deals carry AE review — the packet is the answer.
      </Text>

      {/* Wilken hearing amber */}
      <View style={[s.flagRow, s.flagRowAmber]}>
        <View style={s.flagStripe} />
        <Text style={s.flagText} numberOfLines={3}>
          Category under review: Wilken hearing on AE definition Jun 10 — packets are your protection.
        </Text>
      </View>
    </View>
  );
}

// ── MODULE 4: PAYMENT OPS ─────────────────────────────────────────────────

const PAYMENT_STATS = [
  { value: '100%', label: 'escrow-funded before work' },
  { value: '0',    label: 'athletes unpaid >30d'     },
  { value: '34',   label: '1099s issued · current'   },
] as const;

function PaymentOpsModule() {
  return (
    <View style={s.card}>
      <SectionHeader label="PAYMENT OPS" />
      <View style={s.pillsRow}>
        {PAYMENT_STATS.map((stat) => (
          <View key={stat.label} style={[s.statPill, s.statPillGreen]}>
            <Text style={[s.statValue, s.statValueGreen]}>{stat.value}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── FOOTER WALL ────────────────────────────────────────────────────────────

function FooterWall() {
  return (
    <View style={s.wallRow}>
      <Ionicons name="lock-closed" size={13} color={MUTED} />
      <Text style={s.wallText}>
        Documented business purpose on every deal — the packet is the product.
      </Text>
    </View>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────

export interface CollectiveHomeProps {
  bottomInset?: number;
  topInset?: number;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export function CollectiveHome({ bottomInset = 0, topInset = 0, onScroll }: CollectiveHomeProps) {
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
      <ClearancePipelineModule />
      <VbpPacketBuilderModule />
      <AeExposureModule />
      <PaymentOpsModule />
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

  // ── Module 1: Clearance Pipeline ────────────────────────
  heroStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingBottom: 2,
  },
  heroStat: {
    fontSize: 12,
    fontWeight: '500',
    color: MUTED,
  },
  heroStatValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  heroStatDivider: {
    fontSize: 12,
    color: MUTED,
  },

  stagePillsRow: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
  },
  stagePill: {
    flex: 1,
    minWidth: 54,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    paddingVertical: 7,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 1,
  },
  stagePillGreen: {
    backgroundColor: `${GREEN}12`,
    borderColor: `${GREEN}30`,
  },
  stagePillRed: {
    backgroundColor: `${RED}10`,
    borderColor: `${RED}30`,
  },
  stagePillCount: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  stagePillCountGreen: { color: GREEN },
  stagePillCountRed:   { color: RED   },
  stagePillLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: MUTED,
    textAlign: 'center',
    lineHeight: 12,
  },
  stagePillLabelGreen: { color: `${GREEN}CC` },
  stagePillLabelRed:   { color: `${RED}CC`   },

  dealRow: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    flexDirection: 'row',
  },
  dealRowRed: {
    backgroundColor: `${RED}0D`,
    borderColor: `${RED}30`,
  },
  dealRowAmber: {
    backgroundColor: `${AMBER}0A`,
    borderColor: `${AMBER}28`,
  },
  dealStripe: {
    width: 3,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  dealContent: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 3,
  },
  dealTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dealAthlete: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dealDot: {
    fontSize: 12,
    color: MUTED,
  },
  dealBrand: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.80)',
  },
  dealAmount: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  dealDetail: {
    fontSize: 11,
    fontWeight: '600',
    color: MUTED,
    lineHeight: 15,
  },
  dealDetailGreen: { color: GREEN },
  dealDetailRed:   { color: RED   },
  dealDetailAmber: { color: AMBER },
  dealDetailMuted: { color: MUTED },

  // ── Module 2: VBP Packet Builder ─────────────────────────
  packetCard: {
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${COPPER}30`,
    padding: 12,
    gap: 8,
  },
  packetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  packetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  packetMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: MUTED,
    marginTop: -4,
  },
  checklist: {
    gap: 5,
    marginTop: 2,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  checklistLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.80)',
    flex: 1,
  },
  checklistLabelPending: {
    color: AMBER,
    fontWeight: '600',
  },

  copperBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    borderRadius: 13,
    backgroundColor: COPPER,
    marginTop: 2,
  },
  copperBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.7,
  },

  // ── Module 3: AE Exposure ─────────────────────────────────
  aeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aeBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  aeBadgeAmber: {
    backgroundColor: `${AMBER}10`,
    borderColor: `${AMBER}44`,
  },
  aeBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: AMBER,
    letterSpacing: 0.5,
  },
  aeBodyText: {
    fontSize: 12,
    fontWeight: '500',
    color: MUTED,
    lineHeight: 17,
  },

  flagRow: {
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
  },
  flagRowAmber: {
    backgroundColor: `${AMBER}0A`,
    borderColor: `${AMBER}28`,
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

  // ── Module 4: Payment Ops ─────────────────────────────────
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
  statPillGreen: {
    backgroundColor: `${GREEN}0E`,
    borderColor: `${GREEN}28`,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
  },
  statValueGreen: { color: GREEN },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: MUTED,
    textAlign: 'center',
    lineHeight: 13,
  },

  // ── Footer wall ────────────────────────────────────────────
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
  fmvDisclaimer: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.28)',
    fontWeight: '500',
    lineHeight: 13,
    marginTop: 8,
  },
});
