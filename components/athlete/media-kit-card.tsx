// ── MediaKitCard ──────────────────────────────────────────────
// Brand-facing "verified media kit": a polished one-pager — hero reach +
// engagement band, per-platform rows, proven partnerships, rates & reliability.
// Lives at the top of the profile's Kit tab. Demo fixture only.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { RADIUS_PILL } from '@/components/shared/ui-kit/tokens';
import { DEAL_TRUTH_FIXTURE } from '@/lib/data/mock-deal-truth';
import { getMockAthleteSocialReach } from '@/lib/data/mock-social-reach';

const COPPER = '#EB621A';
const MUTED = 'rgba(255,255,255,0.52)';
const FAINT = 'rgba(255,255,255,0.40)';
const WHITE = '#FFFFFF';
const SUCCESS_GREEN = '#00C6B0';
const HAIRLINE = 'rgba(255,255,255,0.08)';

// ─── Helpers ─────────────────────────────────────────────────

function formatFollowers(count: number): string {
  if (count >= 1_000_000) {
    const m = count / 1_000_000;
    return `${m.toFixed(m >= 10 ? 0 : 1).replace(/\.0$/, '')}M`;
  }
  if (count >= 1_000) {
    const k = count / 1_000;
    return `${k.toFixed(k >= 100 ? 0 : 1).replace(/\.0$/, '')}K`;
  }
  return `${count}`;
}

function formatFreshness(days: number): string {
  if (days <= 0) return 'today';
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  const months = Math.round(days / 30);
  return months <= 1 ? '1mo' : `${months}mo`;
}

type PlatformIcon = keyof typeof Ionicons.glyphMap;

const PLATFORM_ICON: Record<string, PlatformIcon> = {
  instagram: 'logo-instagram',
  tiktok: 'logo-tiktok',
  twitter: 'logo-twitter',
  youtube: 'logo-youtube',
  twitch: 'logo-twitch',
  linkedin: 'logo-linkedin',
};

const PLATFORM_COLOR: Record<string, string> = {
  instagram: '#E1306C',
  tiktok: '#25F4EE',
  twitter: '#1DA1F2',
  youtube: '#FF0000',
  twitch: '#9146FF',
  linkedin: '#0A66C2',
};

const PLATFORM_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  twitter: 'Twitter / X',
  youtube: 'YouTube',
  twitch: 'Twitch',
  linkedin: 'LinkedIn',
};

const EXTRA_PARTNERSHIPS = [
  { brand: 'Jordan Brand', deliverable: 'Brand campaign posts' },
  { brand: 'Beats by Dre', deliverable: 'Product feature story' },
];

// ─── Props ───────────────────────────────────────────────────

export interface MediaKitCardProps {
  onViewPosts?: () => void;
}

// ─── Component ───────────────────────────────────────────────

export function MediaKitCard({ onViewPosts }: MediaKitCardProps) {
  const reach = getMockAthleteSocialReach('a-1');
  const totalReach = reach?.totalFollowers ?? 0;
  const engagementPct = (reach?.engagementRate7d ?? 0) * 100;

  const partnerships = [
    ...DEAL_TRUTH_FIXTURE.filter(
      (d) => d.paymentState === 'paid' || d.paymentState === 'cleared',
    ).map((d) => ({
      key: d.dealId,
      brand: d.brand,
      deliverable: d.deliverables[0]?.label ?? 'Deliverable',
    })),
    ...EXTRA_PARTNERSHIPS.map((ep) => ({
      key: ep.brand,
      brand: ep.brand,
      deliverable: ep.deliverable,
    })),
  ];

  return (
    <>
      {/* ── Verified media kit — hero band + platforms ── */}
      <View style={mk.card}>
        <View style={mk.headerRow}>
          <View style={mk.badge}>
            <Ionicons name="shield-checkmark" size={12} color={COPPER} />
            <Text style={mk.badgeText}>VERIFIED MEDIA KIT</Text>
          </View>
          <Text style={mk.updated}>Updated today</Text>
        </View>

        {/* Hero stat band */}
        <View style={mk.statBand}>
          <View style={mk.stat}>
            <Text style={mk.statNum}>{formatFollowers(totalReach)}</Text>
            <Text style={mk.statLabel}>TOTAL REACH</Text>
          </View>
          <View style={mk.statDivider} />
          <View style={mk.stat}>
            <Text style={mk.statNum}>{engagementPct.toFixed(1)}%</Text>
            <Text style={mk.statLabel}>ENGAGEMENT</Text>
          </View>
        </View>
        <Text style={mk.benchNote}>
          ≈2.5× the typical influencer — an audience that actually shows up.
        </Text>

        {/* Platforms */}
        <View style={mk.platforms}>
          {reach?.platforms.map((p) => {
            const color = PLATFORM_COLOR[p.platform] ?? '#777';
            const icon = PLATFORM_ICON[p.platform] ?? 'globe-outline';
            const label = PLATFORM_LABEL[p.platform] ?? p.platform;
            return (
              <View key={p.platform} style={mk.pRow}>
                <View style={[mk.pIcon, { backgroundColor: `${color}26`, borderColor: `${color}66` }]}>
                  <Ionicons name={icon} size={16} color={WHITE} />
                </View>
                <View style={mk.pMeta}>
                  <View style={mk.pHandleRow}>
                    <Text style={mk.pHandle} numberOfLines={1}>@{(p as { handle?: string }).handle ?? label}</Text>
                    {(p as { verified?: boolean }).verified ? (
                      <Ionicons name="checkmark-circle" size={12} color={COPPER} />
                    ) : null}
                  </View>
                  <Text style={mk.pPlatform}>{label}</Text>
                </View>
                <View style={mk.pRight}>
                  <Text style={mk.pFollowers}>{formatFollowers(p.followers)}</Text>
                  <Text style={mk.pFresh}>{formatFreshness(p.source.freshnessDays)} ago</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── Proven partnerships ── */}
      <View style={mk.card}>
        <Text style={mk.sectionLabel}>PROVEN PARTNERSHIPS</Text>
        <View style={mk.platforms}>
          {partnerships.map((p) => (
            <View key={p.key} style={mk.pRow}>
              <View style={mk.monogram}>
                <Text style={mk.monogramText}>{p.brand.charAt(0)}</Text>
              </View>
              <View style={mk.pMeta}>
                <Text style={mk.pHandle} numberOfLines={1}>{p.brand}</Text>
                <Text style={mk.pPlatform} numberOfLines={1}>{p.deliverable}</Text>
              </View>
              <View style={mk.deliveredPill}>
                <Ionicons name="checkmark" size={11} color={SUCCESS_GREEN} />
                <Text style={mk.deliveredText}>On time</Text>
              </View>
            </View>
          ))}
        </View>
        <TouchableOpacity
          onPress={onViewPosts}
          disabled={onViewPosts == null}
          activeOpacity={0.75}
          style={mk.viewAllRow}
          accessibilityRole="button"
          accessibilityLabel="View partnership posts"
        >
          <Text style={mk.viewAll}>View the work</Text>
          <Ionicons name="arrow-forward" size={13} color={COPPER} />
        </TouchableOpacity>
        <Text style={mk.footer}>
          Receipts double as CSC valid-business-purpose evidence.
        </Text>
      </View>

      {/* ── Rates & reliability ── */}
      <View style={mk.card}>
        <Text style={mk.sectionLabel}>RATES</Text>
        <View style={mk.platforms}>
          {([
            { type: 'Endorsement post', range: '$1.2–2.4K' },
            { type: 'Appearance', range: '$800–1.5K' },
            { type: 'Licensing', range: '$2–5K' },
          ] as const).map((item) => (
            <View key={item.type} style={mk.rateRow}>
              <Text style={mk.rateType}>{item.type}</Text>
              <Text style={mk.rateValue}>{item.range}</Text>
            </View>
          ))}
        </View>

        <View style={mk.reliBand}>
          <View style={mk.reliStat}>
            <Text style={mk.reliNum}>5</Text>
            <Text style={mk.reliLabel}>DEALS</Text>
          </View>
          <View style={mk.statDivider} />
          <View style={mk.reliStat}>
            <Text style={mk.reliNum}>100%</Text>
            <Text style={mk.reliLabel}>ON TIME</Text>
          </View>
          <View style={mk.statDivider} />
          <View style={mk.reliStat}>
            <Text style={mk.reliNum}>~2h</Text>
            <Text style={mk.reliLabel}>REPLIES</Text>
          </View>
        </View>
      </View>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const mk = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(235,98,26,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(235,98,26,0.45)',
    borderRadius: RADIUS_PILL,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeText: {
    color: COPPER,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  updated: { color: FAINT, fontSize: 10, fontWeight: '600' },
  sectionLabel: {
    color: COPPER,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // Hero stat band
  statBand: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    paddingVertical: 14,
  },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statNum: {
    color: WHITE,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: MUTED,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 6 },
  benchNote: {
    color: MUTED,
    fontSize: 11.5,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: -2,
  },

  // Platform / partnership rows
  platforms: { gap: 0 },
  pRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE,
  },
  pIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogram: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: { color: WHITE, fontSize: 15, fontWeight: '800' },
  pMeta: { flex: 1, gap: 1 },
  pHandleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pHandle: { color: WHITE, fontSize: 14, fontWeight: '700', letterSpacing: -0.1, flexShrink: 1 },
  pPlatform: { color: FAINT, fontSize: 11, fontWeight: '500' },
  pRight: { alignItems: 'flex-end', gap: 1 },
  pFollowers: { color: WHITE, fontSize: 15, fontWeight: '900', fontVariant: ['tabular-nums'], letterSpacing: -0.3 },
  pFresh: { color: FAINT, fontSize: 10, fontWeight: '600' },

  deliveredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: RADIUS_PILL,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${SUCCESS_GREEN}44`,
    backgroundColor: `${SUCCESS_GREEN}12`,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  deliveredText: { color: SUCCESS_GREEN, fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },

  viewAllRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  viewAll: { color: COPPER, fontSize: 13, fontWeight: '700' },
  footer: { color: FAINT, fontSize: 10, fontWeight: '500', lineHeight: 14 },

  // Rates
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE,
  },
  rateType: { color: WHITE, fontSize: 14, fontWeight: '600', letterSpacing: -0.1 },
  rateValue: { color: WHITE, fontSize: 14, fontWeight: '900', fontVariant: ['tabular-nums'], letterSpacing: -0.2 },

  // Reliability strip
  reliBand: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    paddingVertical: 12,
  },
  reliStat: { flex: 1, alignItems: 'center', gap: 2 },
  reliNum: { color: WHITE, fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'], letterSpacing: -0.4 },
  reliLabel: { color: MUTED, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
});
