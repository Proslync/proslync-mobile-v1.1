// components/brand/brand-home.tsx
// ── BRAND OWNER HOME ──────────────────────────────────────────────────────
// Charter §A — thin four-module home screen for the brand role.
// Modules: ACTIVE CAMPAIGNS (hero) · CLEARANCE · RESULTS · REBOOK
// Footer wall: no unfunded outreach lock row (brand analog of agent wall).
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
const AMBER = '#FFD60A';
const GREEN = '#34C759';
const CARD_BG = 'rgba(255,255,255,0.05)';
const CARD_BORDER = 'rgba(255,255,255,0.10)';
const MUTED = 'rgba(255,255,255,0.50)';

// ── Fixture: active campaign rows ────────────────────────────────────────
// Status stepper: BRIEF → POSTED → VERIFIED
// proofState drives the detail line per row.
type ProofState = 'verified' | 'posted' | 'funded';

type CampaignRow = {
  id: string;
  athlete: string;
  briefType: string;
  currentStep: 'BRIEF' | 'POSTED' | 'VERIFIED';
  proofState: ProofState;
};

const ACTIVE_CAMPAIGNS: CampaignRow[] = [
  {
    id: 'ac-1',
    athlete: 'Kiyan A.',
    briefType: '3 Posts + Promo Code',
    currentStep: 'VERIFIED',
    proofState: 'verified',
  },
  {
    id: 'ac-2',
    athlete: 'JJ S.',
    briefType: 'Local Appearance',
    currentStep: 'POSTED',
    proofState: 'posted',
  },
  {
    id: 'ac-3',
    athlete: 'Maya C.',
    briefType: 'Brand Ambassador Package',
    currentStep: 'BRIEF',
    proofState: 'funded',
  },
];

// ── Fixture: clearance lines ──────────────────────────────────────────────
type ClearanceRow = {
  id: string;
  label: string;   // e.g. "$450 post"
  result: string;  // copy that includes the threshold logic
  cleared: boolean;
};

const CLEARANCE_ROWS: ClearanceRow[] = [
  {
    id: 'cl-1',
    label: '$450 post',
    result: 'no review needed ✓',
    cleared: true,
  },
  {
    id: 'cl-2',
    label: '$2,400 package',
    result: 'cleared in 26h ✓',
    cleared: true,
  },
  {
    id: 'cl-3',
    label: '$3,800 appearance',
    result: 'in CSC review · est. ≤7d',
    cleared: false,
  },
];

// ── Fixture: redemption counter rows ─────────────────────────────────────
type RedemptionRow = {
  id: string;
  code: string;
  redemptions: number;
  trackedSales: string;
};

const REDEMPTION_ROWS: RedemptionRow[] = [
  {
    id: 'rd-1',
    code: 'KIYAN20',
    redemptions: 47,
    trackedSales: '$1,880',
  },
  {
    id: 'rd-2',
    code: 'JJ15',
    redemptions: 31,
    trackedSales: '$1,240',
  },
];

// ── Fixture: past performer rebook rows ──────────────────────────────────
type RebookRow = {
  id: string;
  athlete: string;
  campaigns: number;
  onTime: boolean;
};

const REBOOK_ROWS: RebookRow[] = [
  {
    id: 'rb-1',
    athlete: 'Kiyan A.',
    campaigns: 3,
    onTime: true,
  },
  {
    id: 'rb-2',
    athlete: 'JJ S.',
    campaigns: 2,
    onTime: true,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────

const STEPS = ['BRIEF', 'POSTED', 'VERIFIED'] as const;

function proofDetailLine(row: CampaignRow): { text: string; color: string } {
  if (row.proofState === 'verified') {
    return { text: 'proof captured ✓ · #ad check passed', color: GREEN };
  }
  if (row.proofState === 'posted') {
    return { text: 'due Thu 6pm', color: AMBER };
  }
  // funded
  return { text: 'escrow funded · awaiting post', color: MUTED };
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

// ── MODULE 1: ACTIVE CAMPAIGNS ────────────────────────────────────────────

function ActiveCampaignsModule() {
  return (
    <View style={s.card}>
      <SectionHeader label="ACTIVE CAMPAIGNS" />
      {ACTIVE_CAMPAIGNS.map((row, idx) => {
        const currentIdx = STEPS.indexOf(row.currentStep);
        const detail = proofDetailLine(row);
        return (
          <Pressable
            key={row.id}
            style={[s.campaignRow, idx > 0 && s.campaignRowBorder]}
            onPress={() => {/* no-op per charter */}}
            accessibilityRole="button"
            accessibilityLabel={`Campaign: ${row.athlete} ${row.briefType}`}
          >
            {/* Athlete + brief type */}
            <View style={s.campaignTopRow}>
              <Text style={s.campaignAthlete}>{row.athlete}</Text>
              <Text style={s.campaignBriefType}>{row.briefType}</Text>
            </View>

            {/* Status stepper dots BRIEF → POSTED → VERIFIED */}
            <View style={s.stepperRow} accessibilityLabel={`Status: ${row.currentStep}`}>
              {STEPS.map((step, sIdx) => {
                const isCurrent = sIdx === currentIdx;
                const isPast = sIdx < currentIdx;
                return (
                  <React.Fragment key={step}>
                    <View style={[s.stepDot, isCurrent && s.stepDotCurrent, isPast && s.stepDotPast]} />
                    {sIdx < STEPS.length - 1 && (
                      <View style={[s.stepConnector, isPast && s.stepConnectorPast]} />
                    )}
                  </React.Fragment>
                );
              })}
              <Text style={s.stepLabel}>{row.currentStep}</Text>
            </View>

            {/* Per-row detail line */}
            <Text style={[s.campaignDetailLine, { color: detail.color }]}>{detail.text}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── MODULE 2: CLEARANCE ───────────────────────────────────────────────────
// The thresholds ARE the copy: <$600 none, <$2,500 no comp review.

function ClearanceModule() {
  return (
    <View style={s.card}>
      <SectionHeader label="CLEARANCE" />
      {/* Threshold legend */}
      <Text style={s.clearanceNote}>
        {'Under $600: no review. Under $2,500: no compliance review.'}
      </Text>
      {CLEARANCE_ROWS.map((row, idx) => (
        <View key={row.id} style={[s.clearanceRow, idx > 0 && s.clearanceRowBorder]}>
          <View style={[s.clearanceStripe, { backgroundColor: row.cleared ? GREEN : AMBER }]} />
          <View style={s.clearanceContent}>
            <Text style={s.clearanceLabel}>{row.label}</Text>
            <Text style={[s.clearanceResult, { color: row.cleared ? GREEN : AMBER }]}>
              {row.result}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ── MODULE 3: RESULTS ─────────────────────────────────────────────────────

function ResultsModule() {
  return (
    <View style={s.card}>
      <SectionHeader label="RESULTS" />
      {REDEMPTION_ROWS.map((row, idx) => (
        <View key={row.id} style={[s.redemptionRow, idx > 0 && s.redemptionRowBorder]}>
          <Text style={s.redemptionCode}>{row.code}</Text>
          <Text style={s.redemptionMeta}>
            <Text style={s.redemptionCount}>{row.redemptions}</Text>
            <Text style={s.redemptionCountLabel}> redemptions</Text>
          </Text>
          <Text style={s.redemptionSales}>{row.trackedSales} tracked sales</Text>
        </View>
      ))}
      <Text style={s.resultsFooter}>
        Codes auto-issued per athlete — results, not impressions.
      </Text>
    </View>
  );
}

// ── MODULE 4: REBOOK ──────────────────────────────────────────────────────

function RebookModule() {
  return (
    <View style={s.card}>
      <SectionHeader label="REBOOK" />
      {REBOOK_ROWS.map((row, idx) => (
        <View key={row.id} style={[s.rebookRow, idx > 0 && s.rebookRowBorder]}>
          <View style={{ flex: 1 }}>
            <Text style={s.rebookAthlete}>{row.athlete}</Text>
            <Text style={s.rebookMeta}>
              {row.campaigns} campaigns · {row.onTime ? 'on time ✓' : 'late once'}
            </Text>
          </View>
          {/* Copper ghost REBOOK chip — DEMO alert */}
          <Pressable
            style={s.rebookChip}
            onPress={() =>
              Alert.alert(
                'Brief funded to escrow',
                `Matched athletes will see it first. (DEMO)`,
              )
            }
            accessibilityRole="button"
            accessibilityLabel={`Rebook ${row.athlete}`}
          >
            <Text style={s.rebookChipText}>REBOOK</Text>
          </Pressable>
          {/* Muted MAKE AMBASSADOR chip — DEMO alert */}
          <Pressable
            style={s.ambassadorChip}
            onPress={() =>
              Alert.alert(
                'Make Ambassador',
                'Extended deal funded to escrow — athlete will be notified. (DEMO)',
              )
            }
            accessibilityRole="button"
            accessibilityLabel={`Make ${row.athlete} ambassador`}
          >
            <Text style={s.ambassadorChipText}>MAKE AMBASSADOR</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

// ── Footer wall — deliberate lock row (brand no-unfunded-outreach law) ────

function FooterWall() {
  return (
    <View style={s.wallRow}>
      <Ionicons name="lock-closed" size={13} color={MUTED} />
      <Text style={s.wallText}>
        Athletes hear from you only through a funded brief — no unfunded outreach.
      </Text>
    </View>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────

export interface BrandHomeProps {
  bottomInset?: number;
  topInset?: number;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export function BrandHome({ bottomInset = 0, topInset = 0, onScroll }: BrandHomeProps) {
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
      <ActiveCampaignsModule />
      <ClearanceModule />
      <ResultsModule />
      <RebookModule />
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

  // Card container — mirrors agent-home exactly
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

  // ── Module 1: Active Campaigns ─────────────────────────────
  campaignRow: {
    paddingVertical: 10,
    gap: 7,
  },
  campaignRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CARD_BORDER,
  },
  campaignTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  campaignAthlete: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  campaignBriefType: {
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
  },

  // Status stepper dots — mirrors agent pipeline dots
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  stepDotCurrent: {
    backgroundColor: COPPER,
    borderColor: COPPER,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepDotPast: {
    backgroundColor: 'rgba(235,98,26,0.4)',
    borderColor: 'rgba(235,98,26,0.5)',
  },
  stepConnector: {
    width: 16,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  stepConnectorPast: {
    backgroundColor: 'rgba(235,98,26,0.4)',
  },
  stepLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COPPER,
    letterSpacing: 0.5,
    marginLeft: 8,
  },

  campaignDetailLine: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    fontVariant: ['tabular-nums'],
  },

  // ── Module 2: Clearance ────────────────────────────────────
  clearanceNote: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.30)',
    marginBottom: 2,
    lineHeight: 14,
  },
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
    paddingVertical: 8,
    gap: 2,
  },
  clearanceLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  clearanceResult: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },

  // ── Module 3: Results ──────────────────────────────────────
  redemptionRow: {
    paddingVertical: 9,
    gap: 3,
  },
  redemptionRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CARD_BORDER,
  },
  redemptionCode: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  redemptionMeta: {
    lineHeight: 18,
  },
  redemptionCount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  redemptionCountLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: MUTED,
  },
  redemptionSales: {
    fontSize: 11,
    fontWeight: '600',
    color: MUTED,
    fontVariant: ['tabular-nums'],
  },
  resultsFooter: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.30)',
    lineHeight: 14,
    marginTop: 2,
  },

  // ── Module 4: Rebook ───────────────────────────────────────
  rebookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    gap: 8,
  },
  rebookRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CARD_BORDER,
  },
  rebookAthlete: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  rebookMeta: {
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
    marginTop: 2,
  },
  // Copper ghost REBOOK chip — act-now affordance
  rebookChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${COPPER}66`,
    backgroundColor: `${COPPER}1A`,
    flexShrink: 0,
  },
  rebookChipText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    color: COPPER,
  },
  // Muted MAKE AMBASSADOR chip
  ambassadorChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    flexShrink: 0,
  },
  ambassadorChipText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.40)',
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
