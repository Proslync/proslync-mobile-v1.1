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
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  predictClearance,
  FMV_DISCLAIMER,
} from '@/lib/fmv/fmv-engine';
import type { DealKind } from '@/lib/fmv/fmv-engine';
import { getMockAthleteSocialReach } from '@/lib/data/mock-social-reach';
import { getBrandDealDetail } from '@/lib/data/mock-brand-data';
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
  SP_XL,
  SP_XS,
  SURFACE,
  SURFACE_SUBTLE,
  TEXT,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  WEIGHT,
} from '@/components/shared/ui-kit/tokens';

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
  /** Bridge into the live, charter-safe deal-detail page (`/deal/[id]`).
   *  Collective is the funder (payer) — depth (dollars + packaged outcome)
   *  is charter-ALLOWED here, so each clearance line opens the real packet
   *  (`d-1..d-6` in mock-brand-data). The athlete + brand shown on the row are
   *  derived from `getBrandDealDetail(dealId)` so the card can never drift from
   *  the detail it opens (same single-source pattern as brand campaigns). */
  dealId: string;
  /** Identity used by the FMV band engine (social reach lookup). Kept distinct
   *  from the deal packet so per-line clearance economics stay collective-scoped. */
  athleteId: string;
  amount: string;
  amountCents: number;
  dealKind: DealKind;
  status: DealRowStatus;
  detail: string;
};

const DEAL_ROWS: DealRow[] = [
  {
    id: 'cr-1',
    dealId: 'd-4', // Kiyan Anthony · Syracuse — Gatorade packet
    athleteId: 'a-1',
    amount: '$4,500',
    amountCents: 450_000,
    dealKind: 'endorsement',
    status: 'cleared',
    detail: 'cleared in 26h ✓',
  },
  {
    id: 'cr-2',
    dealId: 'd-1', // Dylan Harper · Rutgers — Nike Hoops packet
    athleteId: 'a-4',
    amount: '$2,200',
    amountCents: 220_000,
    dealKind: 'social-post',
    status: 'submitted',
    detail: 'submitted · day 4 of review',
  },
  {
    id: 'cr-3',
    dealId: 'd-3', // Naithan George · GT — Zaxby's Southeast packet
    // FMV identity fixed: was 'a-1' (= Kiyan, colliding with cr-1) so the band
    // computed off the wrong athlete. 'a-3' is a real, distinct reach entry.
    athleteId: 'a-3',
    amount: '$1,800',
    amountCents: 180_000,
    dealKind: 'appearance',
    status: 'not-cleared',
    detail: 'NOT CLEARED — resubmission 9 of 14 days · missing VBP docs',
  },
  {
    id: 'cr-4',
    dealId: 'd-5', // Jordan Miles · Paul VI — CarMax Syracuse packet
    athleteId: 'a-2',
    amount: '$900',
    amountCents: 90_000,
    dealKind: 'autograph',
    status: 'pre-checked',
    detail: 'pre-checked: likely-clear · ready to submit',
  },
];

// Athlete + brand shown on each clearance line are derived from the linked deal
// packet (single source of truth = getBrandDealDetail) so the row can never
// drift from the detail page it opens. Falls back gracefully if a packet is
// missing (e.g. mid-migration to backend persistence).
function dealRowAthlete(row: DealRow): string {
  const full = getBrandDealDetail(row.dealId)?.deal.athlete;
  return full ? full.split('·')[0].trim() : 'Athlete';
}

function dealRowBrand(row: DealRow): string {
  return getBrandDealDetail(row.dealId)?.companyOverview.name ?? 'Brand';
}

// ── FMV band chip (compact per-row indicator) ─────────────────────────────

function FmvBandChip({ row }: { row: DealRow }) {
  const prediction = React.useMemo(() => {
    const reach = getMockAthleteSocialReach(row.athleteId) ??
                  getMockAthleteSocialReach('a-1');
    return predictClearance({
      amountCents: row.amountCents,
      dealKind: row.dealKind,
      deliverableDescription: 'Promotional activation for brand partnership',
      payerEntityType: 'brand',
      totalFollowers: reach?.totalFollowers ?? 0,
      engagementRate7d: reach?.engagementRate7d ?? 0,
    });
  }, [row.athleteId, row.amountCents, row.dealKind]);
  const dotColor =
    prediction.band === 'likely'     ? SIGNAL_POSITIVE :
    prediction.band === 'borderline' ? SIGNAL_WARN :
                                       SIGNAL_NEGATIVE;
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
    gap: SP_XS,
    marginTop: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: TEXT.caption,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});

// ── MODULE 1: CLEARANCE PIPELINE ──────────────────────────────────────────

function ClearancePipelineModule() {
  const router = useRouter();
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

      {/* Deal rows — each opens the real packaged-outcome deal detail.
          Collective is the funder, so depth (dollars + packet) is charter-allowed.
          'brand' lens = the payer view (roleToDealLens maps collective→brand). */}
      {DEAL_ROWS.map((row) => {
        const isCleared = row.status === 'cleared';
        const isSubmitted = row.status === 'submitted';
        const isNotCleared = row.status === 'not-cleared';
        const isPreChecked = row.status === 'pre-checked';
        const athlete = dealRowAthlete(row);
        const brand = dealRowBrand(row);
        return (
          <Pressable
            key={row.id}
            style={({ pressed }) => [
              s.dealRow,
              isNotCleared && s.dealRowRed,
              isSubmitted && s.dealRowAmber,
              pressed && { opacity: 0.72 },
            ]}
            onPress={() => router.push(`/deal/${row.dealId}?role=brand` as never)}
            accessibilityRole="button"
            accessibilityLabel={`Clearance: ${athlete} × ${brand} ${row.amount}`}
          >
            {(isNotCleared || isSubmitted) && (
              <View
                style={[
                  s.dealStripe,
                  { backgroundColor: isNotCleared ? SIGNAL_NEGATIVE : SIGNAL_WARN },
                ]}
              />
            )}
            <View style={s.dealContent}>
              <View style={s.dealTop}>
                <Text style={s.dealAthlete}>{athlete}</Text>
                <Text style={s.dealDot}> × </Text>
                <Text style={s.dealBrand}>{brand}</Text>
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
          </Pressable>
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
          <Ionicons name="document-text-outline" size={16} color={ACCENT} />
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
                color={item.done ? SIGNAL_POSITIVE : SIGNAL_WARN}
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

      {/* Copper CTA — the single primary action */}
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
      <Ionicons name="lock-closed" size={13} color={TEXT_TERTIARY} />
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
        { paddingTop: topInset + SP_LG, paddingBottom: bottomInset + 120 },
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

  // ── Module 1: Clearance Pipeline ────────────────────────
  heroStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingBottom: 2,
  },
  heroStat: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.medium,
    color: TEXT_SECONDARY,
  },
  heroStatValue: {
    fontSize: TEXT.label,
    fontWeight: WEIGHT.bold,
    color: TEXT_PRIMARY,
    fontVariant: ['tabular-nums'],
  },
  heroStatDivider: {
    fontSize: TEXT.caption,
    color: TEXT_SECONDARY,
  },

  stagePillsRow: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
  },
  stagePill: {
    flex: 1,
    minWidth: 54,
    backgroundColor: SURFACE_SUBTLE,
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    paddingVertical: 7,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 1,
  },
  stagePillGreen: {
    backgroundColor: `${SIGNAL_POSITIVE}12`,
    borderColor: `${SIGNAL_POSITIVE}30`,
  },
  stagePillRed: {
    backgroundColor: `${SIGNAL_NEGATIVE}10`,
    borderColor: `${SIGNAL_NEGATIVE}30`,
  },
  stagePillCount: {
    fontSize: TEXT.title,
    fontWeight: WEIGHT.bold,
    color: TEXT_PRIMARY,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  stagePillCountGreen: { color: SIGNAL_POSITIVE },
  stagePillCountRed:   { color: SIGNAL_NEGATIVE   },
  stagePillLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 12,
  },
  stagePillLabelGreen: { color: `${SIGNAL_POSITIVE}CC` },
  stagePillLabelRed:   { color: `${SIGNAL_NEGATIVE}CC`   },

  dealRow: {
    borderRadius: RADIUS_SM,
    overflow: 'hidden',
    backgroundColor: SURFACE_SUBTLE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    flexDirection: 'row',
  },
  dealRowRed: {
    backgroundColor: `${SIGNAL_NEGATIVE}0D`,
    borderColor: `${SIGNAL_NEGATIVE}30`,
  },
  dealRowAmber: {
    backgroundColor: `${SIGNAL_WARN}0A`,
    borderColor: `${SIGNAL_WARN}28`,
  },
  dealStripe: {
    width: 3,
    borderTopLeftRadius: RADIUS_SM,
    borderBottomLeftRadius: RADIUS_SM,
  },
  dealContent: {
    flex: 1,
    paddingHorizontal: SP_SM,
    paddingVertical: SP_SM,
    gap: 3,
  },
  dealTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dealAthlete: {
    fontSize: TEXT.label,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  dealDot: {
    fontSize: TEXT.caption,
    color: TEXT_SECONDARY,
  },
  dealBrand: {
    fontSize: TEXT.label,
    fontWeight: WEIGHT.medium,
    color: TEXT_SECONDARY,
  },
  dealAmount: {
    fontSize: TEXT.label,
    fontWeight: WEIGHT.bold,
    color: TEXT_PRIMARY,
    fontVariant: ['tabular-nums'],
  },
  dealDetail: {
    fontSize: 11,
    fontWeight: WEIGHT.semibold,
    color: TEXT_SECONDARY,
    lineHeight: 15,
  },
  dealDetailGreen: { color: SIGNAL_POSITIVE },
  dealDetailRed:   { color: SIGNAL_NEGATIVE   },
  dealDetailAmber: { color: SIGNAL_WARN },
  dealDetailMuted: { color: TEXT_SECONDARY },

  // ── Module 2: VBP Packet Builder ─────────────────────────
  packetCard: {
    borderRadius: RADIUS_CARD,
    backgroundColor: SURFACE_SUBTLE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${ACCENT}30`,
    padding: SP_MD,
    gap: SP_SM,
  },
  packetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  packetTitle: {
    fontSize: TEXT.label,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    flex: 1,
  },
  packetMeta: {
    fontSize: 11,
    fontWeight: WEIGHT.semibold,
    color: TEXT_SECONDARY,
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
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.medium,
    color: TEXT_SECONDARY,
    flex: 1,
  },
  checklistLabelPending: {
    color: SIGNAL_WARN,
    fontWeight: WEIGHT.semibold,
  },

  // Primary CTA — the ONE copper action per screen
  copperBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: SP_MD,
    borderRadius: RADIUS_CARD,
    backgroundColor: ACCENT,
    marginTop: 2,
  },
  copperBtnText: {
    fontSize: TEXT.label,
    fontWeight: WEIGHT.bold,
    color: '#000',
    letterSpacing: 0.7,
  },

  // ── Module 3: AE Exposure ─────────────────────────────────
  aeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP_SM,
  },
  aeBadge: {
    borderRadius: RADIUS_SM,
    paddingHorizontal: SP_SM,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  aeBadgeAmber: {
    backgroundColor: `${SIGNAL_WARN}10`,
    borderColor: `${SIGNAL_WARN}44`,
  },
  aeBadgeText: {
    fontSize: 11,
    fontWeight: WEIGHT.bold,
    color: SIGNAL_WARN,
    letterSpacing: 0.5,
  },
  aeBodyText: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.medium,
    color: TEXT_SECONDARY,
    lineHeight: 17,
  },

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

  // ── Module 4: Payment Ops ─────────────────────────────────
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
  statPillGreen: {
    backgroundColor: `${SIGNAL_POSITIVE}0E`,
    borderColor: `${SIGNAL_POSITIVE}28`,
  },
  statValue: {
    fontSize: 20,
    fontWeight: WEIGHT.bold,
    color: TEXT_PRIMARY,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
  },
  statValueGreen: { color: SIGNAL_POSITIVE },
  statLabel: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.semibold,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 13,
  },

  // ── Footer wall ────────────────────────────────────────────
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
  fmvDisclaimer: {
    fontSize: 9,
    color: TEXT_TERTIARY,
    fontWeight: WEIGHT.medium,
    lineHeight: 13,
    marginTop: SP_SM,
  },
});
