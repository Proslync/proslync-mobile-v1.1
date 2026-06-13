// components/collective/collective-fans.tsx
// ── COLLECTIVE FANS TAB ────────────────────────────────────────────────────
// Charter: receipted fan-commerce dashboard. Four modules:
//   1. PROGRAM REVENUE (tabular — supporters, MRR, retention)
//   2. TIER MIX (three tiers + static proportion bars)
//   3. PERK FULFILLMENT (delivery stats + overdue nudge)
//   4. ACTIVATION RAIL (brand→fan perk loop visibility)
// No animations (charter law). Tabular numerals throughout. Copper act-now only.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ── Charter constants ──────────────────────────────────────────────────────
const COPPER = '#EB621A';
const CARD_BG = '#1C1C1E';
const CARD_BORDER = 'rgba(255,255,255,0.07)';
const MUTED = 'rgba(255,255,255,0.50)';
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

// ── MODULE 1: PROGRAM REVENUE ─────────────────────────────────────────────

const REVENUE_STATS = [
  { value: '1,250', label: 'supporters'      },
  { value: '$14,800', label: '/mo receipted' },
  { value: '92%',   label: '3-mo retention' },
] as const;

function ProgramRevenueModule() {
  return (
    <View style={s.card}>
      <SectionHeader label="PROGRAM REVENUE" />
      <View style={s.pillsRow}>
        {REVENUE_STATS.map((stat) => (
          <View key={stat.label} style={s.statPill}>
            <Text style={s.statValue}>{stat.value}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
      <Text style={s.revenueTagline}>
        Every dollar receipted to a named athlete — real commerce, no VBP gymnastics.
      </Text>
    </View>
  );
}

// ── MODULE 2: TIER MIX ────────────────────────────────────────────────────

const TIERS = [
  { label: 'FAN',       price: '$5',  count: 720, share: 720 / 1250 },
  { label: 'INSIDER',   price: '$12', count: 410, share: 410 / 1250 },
  { label: 'COURTSIDE', price: '$25', count: 120, share: 120 / 1250 },
] as const;

function TierMixModule() {
  return (
    <View style={s.card}>
      <SectionHeader label="TIER MIX" />
      {TIERS.map((tier) => {
        const barWidth = `${Math.round(tier.share * 100)}%` as const;
        return (
          <View key={tier.label} style={s.tierRow}>
            <View style={s.tierMeta}>
              <Text style={s.tierLabel}>{tier.label}</Text>
              <Text style={s.tierPrice}> {tier.price}</Text>
            </View>
            <View style={s.tierBarTrack}>
              {/* Static View bar — no Animated per charter law */}
              <View
                style={[
                  s.tierBarFill,
                  { width: barWidth },
                ]}
              />
            </View>
            <Text style={s.tierCount}>{tier.count}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ── MODULE 3: PERK FULFILLMENT ────────────────────────────────────────────

type OverdueRow = {
  id: string;
  desc: string;
  age: string;
};

const OVERDUE_ROWS: OverdueRow[] = [
  { id: 'ov-1', desc: 'M. Reid shoutout', age: '6 days' },
];

function PerkFulfillmentModule() {
  return (
    <View style={s.card}>
      <SectionHeader label="PERK FULFILLMENT" />

      <View style={s.fulfillRow}>
        <View style={s.fulfillStat}>
          <Text style={s.fulfillValue}>47</Text>
          <Text style={s.fulfillLabel}>perks delivered this month</Text>
        </View>
        <View style={[s.fulfillStat, s.fulfillStatBorder]}>
          <Text style={s.fulfillValue}>2.1d</Text>
          <Text style={s.fulfillLabel}>median delivery</Text>
        </View>
        <View style={[s.fulfillStat, s.fulfillStatBorder]}>
          <Text style={[s.fulfillValue, s.fulfillValueAmber]}>2</Text>
          <Text style={s.fulfillLabel}>overdue</Text>
        </View>
      </View>

      {/* Overdue rows */}
      {OVERDUE_ROWS.map((row) => (
        <View key={row.id} style={s.overdueRow}>
          <View style={s.overdueStripe} />
          <View style={s.overdueContent}>
            <Text style={s.overdueDesc}>{row.desc}</Text>
            <Text style={s.overdueAge}>{row.age}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [s.nudgeChip, { opacity: pressed ? 0.65 : 1 }]}
            onPress={() =>
              Alert.alert(
                'Nudge Sent (DEMO)',
                `Nudge sent for "${row.desc}" — athlete notified. (DEMO)`,
              )
            }
            accessibilityRole="button"
            accessibilityLabel={`Nudge athlete for ${row.desc}`}
          >
            <Text style={s.nudgeChipText}>NUDGE</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

// ── MODULE 4: ACTIVATION RAIL ─────────────────────────────────────────────

type ActivationRow = {
  id: string;
  brand: string;
  athlete: string;
  event: string;
  perkDesc: string;
  supporterCount: number;
};

const ACTIVATIONS: ActivationRow[] = [
  {
    id: 'ac-1',
    brand: 'JMA',
    athlete: 'Kiyan',
    event: 'signing Sat',
    perkDesc: '2-for-1 perk live',
    supporterCount: 1250,
  },
];

function ActivationRailModule() {
  return (
    <View style={s.card}>
      <SectionHeader label="ACTIVATION RAIL" />
      {ACTIVATIONS.map((act) => (
        <View key={act.id} style={s.activationRow}>
          <View style={s.activationIcon}>
            <Ionicons name="flash" size={14} color={COPPER} />
          </View>
          <View style={s.activationBody}>
            <Text style={s.activationTitle}>
              {act.brand} × {act.athlete} {act.event}
            </Text>
            <Text style={s.activationMeta}>
              {act.perkDesc} to{' '}
              <Text style={s.activationSupCount}>{act.supporterCount.toLocaleString()}</Text>{' '}
              supporters
            </Text>
          </View>
        </View>
      ))}
      <Text style={s.activationNote}>
        Brand activation → fan perk loop: every deal shows up here for supporter redemption.
      </Text>
    </View>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────

export interface CollectiveFansProps {
  bottomInset?: number;
  topInset?: number;
}

export function CollectiveFans({ bottomInset = 0, topInset = 0 }: CollectiveFansProps) {
  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[
        s.content,
        { paddingTop: topInset + 70, paddingBottom: bottomInset + 40 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <ProgramRevenueModule />
      <TierMixModule />
      <PerkFulfillmentModule />
      <ActivationRailModule />
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

  // Card
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },

  // Section header
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

  // ── Module 1: Program Revenue ────────────────────────────
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
    fontSize: 18,
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
  revenueTagline: {
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
    lineHeight: 15,
  },

  // ── Module 2: Tier Mix ───────────────────────────────────
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tierMeta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    width: 100,
    flexShrink: 0,
  },
  tierLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  tierPrice: {
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
  },
  tierBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  tierBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COPPER,
  },
  tierCount: {
    width: 36,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },

  // ── Module 3: Perk Fulfillment ───────────────────────────
  fulfillRow: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },
  fulfillStat: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 2,
  },
  fulfillStatBorder: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: CARD_BORDER,
  },
  fulfillValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  fulfillValueAmber: { color: AMBER },
  fulfillLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: MUTED,
    textAlign: 'center',
    lineHeight: 12,
  },

  overdueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: `${AMBER}0A`,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${AMBER}28`,
    gap: 0,
  },
  overdueStripe: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: AMBER,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  overdueContent: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 1,
  },
  overdueDesc: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  overdueAge: {
    fontSize: 11,
    fontWeight: '600',
    color: AMBER,
  },
  nudgeChip: {
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${COPPER}55`,
    backgroundColor: `${COPPER}10`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 0,
  },
  nudgeChipText: {
    fontSize: 10,
    fontWeight: '900',
    color: COPPER,
    letterSpacing: 0.5,
  },

  // ── Module 4: Activation Rail ────────────────────────────
  activationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  activationIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: `${COPPER}18`,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${COPPER}44`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activationBody: {
    flex: 1,
    gap: 2,
  },
  activationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activationMeta: {
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
    lineHeight: 15,
  },
  activationSupCount: {
    fontWeight: '800',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  activationNote: {
    fontSize: 10,
    fontWeight: '500',
    color: MUTED,
    lineHeight: 14,
  },
});
