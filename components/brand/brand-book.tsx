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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ── Charter constants ─────────────────────────────────────────────────────
const COPPER = '#EB621A';
const CARD_BG = '#1C1C1E';
const CARD_BORDER = 'rgba(255,255,255,0.07)';
const MUTED = 'rgba(255,255,255,0.50)';

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
            <Ionicons name="checkmark" size={12} color={MUTED} />
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
        <Ionicons name="arrow-forward" size={13} color={COPPER} />
      </Pressable>
    </View>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────

export interface BrandBookProps {
  bottomInset?: number;
  topInset?: number;
}

export function BrandBook({ bottomInset = 0, topInset = 0 }: BrandBookProps) {
  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[
        s.content,
        { paddingTop: topInset + 70, paddingBottom: bottomInset + 40 },
      ]}
      showsVerticalScrollIndicator={false}
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
          <Ionicons name="lock-closed" size={14} color={MUTED} />
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

  // ── Package cards ──────────────────────────────────────────
  packageCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 14,
    gap: 10,
  },
  packageCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  packageTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
    flex: 1,
  },
  packagePriceCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: 2,
  },
  packagePrice: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
  packageClearNote: {
    fontSize: 10,
    fontWeight: '600',
    color: MUTED,
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
    fontSize: 12,
    fontWeight: '500',
    color: MUTED,
  },

  // Copper FUND BRIEF CTA — act-now affordance (charter law: copper only here)
  fundBriefBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${COPPER}66`,
    backgroundColor: `${COPPER}14`,
    marginTop: 2,
  },
  fundBriefBtnText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: COPPER,
  },

  // ── Find Athletes (locked, last) ───────────────────────────
  findAthletesCard: {
    opacity: 0.75,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  lockedText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: MUTED,
    lineHeight: 17,
  },
});
