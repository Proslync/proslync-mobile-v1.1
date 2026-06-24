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
  { value: '1,250',   label: 'supporters'      },
  { value: '$14,800', label: '/mo receipted'   },
  { value: '92%',     label: '3-mo retention'  },
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
                'Nudge Sent',
                `Nudge sent for "${row.desc}" — athlete notified.`,
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
            <Ionicons name="flash" size={14} color={TEXT_SECONDARY} />
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
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export function CollectiveFans({ bottomInset = 0, topInset = 0, onScroll }: CollectiveFansProps) {
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
    paddingHorizontal: SP_LG,
    gap: SP_MD,
  },

  // Card
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

  // ── Module 1: Program Revenue ────────────────────────────
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
    fontSize: 18,
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
  revenueTagline: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.medium,
    color: TEXT_SECONDARY,
    lineHeight: 15,
  },

  // ── Module 2: Tier Mix ───────────────────────────────────
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP_SM,
  },
  tierMeta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    width: 100,
    flexShrink: 0,
  },
  tierLabel: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.bold,
    color: TEXT_PRIMARY,
    letterSpacing: 0.3,
  },
  tierPrice: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.medium,
    color: TEXT_SECONDARY,
  },
  tierBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: SURFACE_SUBTLE,
    overflow: 'hidden',
  },
  // Tier fill: data-viz bar — demoted from COPPER to TEXT_TERTIARY (neutral bar)
  tierBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: TEXT_TERTIARY,
  },
  tierCount: {
    width: 36,
    textAlign: 'right',
    fontSize: TEXT.label,
    fontWeight: WEIGHT.bold,
    color: TEXT_PRIMARY,
    fontVariant: ['tabular-nums'],
  },

  // ── Module 3: Perk Fulfillment ───────────────────────────
  fulfillRow: {
    flexDirection: 'row',
    borderRadius: RADIUS_CARD,
    overflow: 'hidden',
    backgroundColor: SURFACE_SUBTLE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
  fulfillStat: {
    flex: 1,
    paddingVertical: SP_SM,
    paddingHorizontal: SP_XS,
    alignItems: 'center',
    gap: 2,
  },
  fulfillStatBorder: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: HAIRLINE,
  },
  fulfillValue: {
    fontSize: 18,
    fontWeight: WEIGHT.bold,
    color: TEXT_PRIMARY,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  fulfillValueAmber: { color: SIGNAL_WARN },
  fulfillLabel: {
    fontSize: 9,
    fontWeight: WEIGHT.semibold,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 12,
  },

  overdueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS_SM,
    overflow: 'hidden',
    backgroundColor: `${SIGNAL_WARN}0A`,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${SIGNAL_WARN}28`,
    gap: 0,
  },
  overdueStripe: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: SIGNAL_WARN,
    borderTopLeftRadius: RADIUS_SM,
    borderBottomLeftRadius: RADIUS_SM,
  },
  overdueContent: {
    flex: 1,
    paddingHorizontal: SP_SM,
    paddingVertical: SP_SM,
    gap: 1,
  },
  overdueDesc: {
    fontSize: TEXT.label,
    fontWeight: WEIGHT.bold,
    color: TEXT_PRIMARY,
  },
  overdueAge: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.semibold,
    color: SIGNAL_WARN,
  },
  // NUDGE chip — demoted from copper (not the primary CTA of the screen)
  nudgeChip: {
    marginRight: SP_SM,
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    backgroundColor: SURFACE_SUBTLE,
    paddingHorizontal: SP_SM,
    paddingVertical: 5,
    flexShrink: 0,
  },
  nudgeChipText: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.bold,
    color: TEXT_SECONDARY,
    letterSpacing: 0.5,
  },

  // ── Module 4: Activation Rail ────────────────────────────
  activationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP_SM,
    backgroundColor: SURFACE_SUBTLE,
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE_SUBTLE,
    paddingHorizontal: SP_SM,
    paddingVertical: SP_SM,
  },
  // Activation icon box — decorative, demoted from copper to neutral
  activationIcon: {
    width: 30,
    height: 30,
    borderRadius: RADIUS_SM,
    backgroundColor: SURFACE_SUBTLE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activationBody: {
    flex: 1,
    gap: 2,
  },
  activationTitle: {
    fontSize: TEXT.label,
    fontWeight: WEIGHT.bold,
    color: TEXT_PRIMARY,
  },
  activationMeta: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.medium,
    color: TEXT_SECONDARY,
    lineHeight: 15,
  },
  activationSupCount: {
    fontWeight: WEIGHT.bold,
    color: TEXT_PRIMARY,
    fontVariant: ['tabular-nums'],
  },
  activationNote: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.medium,
    color: TEXT_TERTIARY,
    lineHeight: 14,
  },
});
