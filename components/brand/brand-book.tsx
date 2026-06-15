// components/brand/brand-book.tsx
// ── BRAND BOOK TAB ────────────────────────────────────────────────────────
// Charter §A — packaged-outcome storefront. Order is law:
//   1. START A CAMPAIGN — 3 package cards with copper FUND BRIEF CTA
//   2. FIND ATHLETES — deliberately last and small, locked until first funded brief
// No animations (charter law). Copper only on act-now CTAs.

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

// ── Package card fixture type ─────────────────────────────────────────────
type PackageCard = {
  id: string;
  title: string;
  priceRange: string;
  clearanceNote: string;
  bullets: string[];
};

// ── Fixture: 3 package cards ──────────────────────────────────────────────
const PACKAGES: PackageCard[] = [
  {
    id: 'pkg-1',
    title: 'LOCAL APPEARANCE',
    priceRange: '$800–1.5K',
    clearanceNote: 'clears instantly under $2.5K',
    bullets: [
      'FTC #ad template attached',
      'Escrow-funded',
      'Proof-of-post required',
    ],
  },
  {
    id: 'pkg-2',
    title: '3 POSTS + PROMO CODE',
    priceRange: '$300–900',
    clearanceNote: 'no CSC review under $600/ea',
    bullets: [
      'FTC #ad template attached',
      'Escrow-funded',
      'Proof-of-post required',
    ],
  },
  {
    id: 'pkg-3',
    title: 'TEAM TAKEOVER',
    priceRange: '$2–6K',
    clearanceNote: 'we handle clearance',
    bullets: [
      'FTC #ad template attached',
      'Escrow-funded',
      'Proof-of-post required',
    ],
  },
];

// ── Section header — 4px copper bar + caps label ─────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionBar} />
      <Text style={s.sectionLabel}>{label}</Text>
    </View>
  );
}

// ── Package card component ────────────────────────────────────────────────

function PackageCardView({ pkg }: { pkg: PackageCard }) {
  return (
    <View style={s.packageCard}>
      {/* Card header */}
      <View style={s.packageCardHeader}>
        <Text style={s.packageTitle}>{pkg.title}</Text>
        <View style={s.packagePriceCol}>
          <Text style={s.packagePrice}>{pkg.priceRange}</Text>
          <Text style={s.packageClearNote}>{pkg.clearanceNote}</Text>
        </View>
      </View>

      {/* Included-items bullets */}
      <View style={s.bulletList}>
        {pkg.bullets.map((bullet) => (
          <View key={bullet} style={s.bulletRow}>
            <Ionicons name="checkmark" size={12} color={TEXT_SECONDARY} />
            <Text style={s.bulletText}>{bullet}</Text>
          </View>
        ))}
      </View>

      {/* Copper FUND BRIEF CTA */}
      <Pressable
        style={s.fundBriefBtn}
        onPress={() =>
          Alert.alert(
            'Brief funded to escrow',
            'Matched athletes will see it first. (DEMO)',
          )
        }
        accessibilityRole="button"
        accessibilityLabel={`Fund brief: ${pkg.title}`}
      >
        <Text style={s.fundBriefBtnText}>FUND BRIEF</Text>
        <Ionicons name="arrow-forward" size={13} color={ACCENT} />
      </Pressable>
    </View>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────

export interface BrandBookProps {
  bottomInset?: number;
  topInset?: number;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export function BrandBook({ bottomInset = 0, topInset = 0, onScroll }: BrandBookProps) {
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
      {/* 1. START A CAMPAIGN — package storefront (charter: FIRST) */}
      <View style={s.card}>
        <SectionHeader label="START A CAMPAIGN" />
        {PACKAGES.map((pkg) => (
          <PackageCardView key={pkg.id} pkg={pkg} />
        ))}
      </View>

      {/* 2. FIND ATHLETES — deliberately last + small (charter law) */}
      <View style={[s.card, s.findAthletesCard]}>
        <SectionHeader label="FIND ATHLETES" />
        {/* Lock affordance — no-op */}
        <View style={s.lockedRow}>
          <Ionicons name="lock-closed" size={14} color={TEXT_SECONDARY} />
          <Text style={s.lockedText}>
            Browse verified athletes — geo + engagement + reply-time. Opens after your first funded brief.
          </Text>
        </View>
      </View>
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

  // ── Package cards ──────────────────────────────────────────
  packageCard: {
    borderRadius: RADIUS_CARD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    backgroundColor: SURFACE_SUBTLE,
    padding: SP_MD,
    gap: SP_SM,
  },
  packageCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SP_SM,
  },
  packageTitle: {
    fontSize: TEXT.label,
    fontWeight: WEIGHT.bold,
    color: TEXT_PRIMARY,
    letterSpacing: 0.4,
    flex: 1,
  },
  packagePriceCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: 2,
  },
  packagePrice: {
    fontSize: TEXT.label,
    fontWeight: WEIGHT.bold,
    color: TEXT_PRIMARY,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
  packageClearNote: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.semibold,
    color: TEXT_SECONDARY,
    textAlign: 'right',
  },

  bulletList: {
    gap: 5,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  bulletText: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.medium,
    color: TEXT_SECONDARY,
  },

  // Copper FUND BRIEF CTA — act-now affordance (charter law: copper only here)
  fundBriefBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SP_SM,
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${ACCENT}66`,
    backgroundColor: `${ACCENT}14`,
    marginTop: 2,
  },
  fundBriefBtnText: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.bold,
    letterSpacing: 0.8,
    color: ACCENT,
  },

  // ── Find Athletes (locked, last) ───────────────────────────
  findAthletesCard: {
    opacity: 0.75,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SP_SM,
    paddingVertical: 6,
    paddingHorizontal: SP_XS,
  },
  lockedText: {
    flex: 1,
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.medium,
    color: TEXT_SECONDARY,
    lineHeight: 17,
  },
});
