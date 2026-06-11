// ── MediaKitCard ──────────────────────────────────────────────
// Brand-facing "verified media kit" block: cross-platform reach rows
// + completed deal receipts. Sits at the top of the About tab.
// Demo fixture only — data is static.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  CARD_BG,
  CARD_BG_INSET,
  CARD_BORDER,
  RADIUS_MD,
  RADIUS_PILL,
} from '@/components/shared/ui-kit/tokens';
import { DEAL_TRUTH_FIXTURE } from '@/lib/data/mock-deal-truth';
import { getMockAthleteSocialReach } from '@/lib/data/mock-social-reach';

const COPPER = '#EB621A';
const MUTED = 'rgba(255,255,255,0.52)';
const WHITE = '#FFFFFF';
const SUCCESS_GREEN = '#00C6B0';

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
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  return months <= 1 ? '1mo ago' : `${months}mo ago`;
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

const PLATFORM_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  twitter: 'Twitter / X',
  youtube: 'YouTube',
  twitch: 'Twitch',
  linkedin: 'LinkedIn',
};

// ─── Extra partnership fixtures (to supplement the 4 DealTruth entries) ──

const EXTRA_PARTNERSHIPS = [
  { brand: 'Jordan Brand', deliverable: 'Brand campaign posts' },
  { brand: 'Beats by Dre', deliverable: 'Product feature story' },
];

// ─── Props ───────────────────────────────────────────────────

export interface MediaKitCardProps {
  /**
   * Called when the user taps "View post →" on a partnership row.
   * Typically used to navigate to the Posts tab.
   */
  onViewPosts?: () => void;
}

// ─── Component ───────────────────────────────────────────────

export function MediaKitCard({ onViewPosts }: MediaKitCardProps) {
  const reach = getMockAthleteSocialReach('a-1');

  const paidDeals = DEAL_TRUTH_FIXTURE.filter(
    (d) => d.paymentState === 'paid' || d.paymentState === 'cleared',
  );

  return (
    <View style={mk.card}>
      {/* ── Header ── */}
      <View style={mk.headerRow}>
        <View style={mk.copperBar} />
        <Text style={mk.headerTitle}>VERIFIED MEDIA KIT</Text>
        <Text style={mk.headerMuted}>Updated today</Text>
      </View>

      {/* ── Reach rows ── */}
      {reach != null ? (
        <View style={mk.section}>
          {reach.platforms.map((p) => {
            const days = p.source.freshnessDays;
            const isStale = days >= 7;
            const icon = PLATFORM_ICON[p.platform] ?? 'globe-outline';
            const label = PLATFORM_LABEL[p.platform] ?? p.platform;
            const engRate =
              typeof reach.engagementRate7d === 'number'
                ? `Avg engagement ${(reach.engagementRate7d * 100).toFixed(1)}% · last 30 posts`
                : null;

            return (
              <View key={p.platform} style={mk.reachRow}>
                <View style={mk.platformIconWrap}>
                  <Ionicons name={icon} size={18} color={WHITE} />
                </View>
                <View style={mk.reachMeta}>
                  <Text style={mk.platformLabel}>{label}</Text>
                  {engRate != null ? (
                    <Text style={mk.engagementLine} numberOfLines={1}>
                      {engRate}
                    </Text>
                  ) : null}
                </View>
                <View style={mk.reachRight}>
                  <Text style={mk.followerCount}>{formatFollowers(p.followers)}</Text>
                  <View style={[mk.freshnessChip, isStale && mk.freshnessChipStale]}>
                    <Text style={[mk.freshnessText, isStale && mk.freshnessTextStale]}>
                      {formatFreshness(days)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {/* ── Past Partnerships ── */}
      <View style={mk.subHeader}>
        <Text style={mk.subHeaderText}>PAST PARTNERSHIPS</Text>
      </View>

      <View style={mk.section}>
        {paidDeals.map((d) => (
          <PartnershipRow
            key={d.dealId}
            brand={d.brand}
            deliverable={d.deliverables[0]?.label ?? 'Deliverable'}
            onViewPosts={onViewPosts}
          />
        ))}
        {EXTRA_PARTNERSHIPS.map((ep) => (
          <PartnershipRow
            key={ep.brand}
            brand={ep.brand}
            deliverable={ep.deliverable}
            onViewPosts={onViewPosts}
          />
        ))}
      </View>

      {/* ── Footer ── */}
      <Text style={mk.footer}>
        These receipts double as CSC valid-business-purpose evidence.
      </Text>
    </View>
  );
}

// ─── PartnershipRow ───────────────────────────────────────────

function PartnershipRow({
  brand,
  deliverable,
  onViewPosts,
}: {
  brand: string;
  deliverable: string;
  onViewPosts?: () => void;
}) {
  return (
    <View style={mk.partnerRow}>
      <View style={mk.partnerMeta}>
        <Text style={mk.partnerBrand}>{brand}</Text>
        <Text style={mk.partnerDeliverable} numberOfLines={1}>
          {deliverable}
        </Text>
      </View>
      <View style={mk.partnerRight}>
        <View style={mk.deliveredPill}>
          <Ionicons name="checkmark" size={11} color={SUCCESS_GREEN} />
          <Text style={mk.deliveredText}>Delivered on time</Text>
        </View>
        {onViewPosts != null ? (
          <TouchableOpacity
            onPress={onViewPosts}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={`View ${brand} post`}
          >
            <Text style={mk.viewPost}>View post →</Text>
          </TouchableOpacity>
        ) : (
          <Text style={mk.viewPost}>View post →</Text>
        )}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const mk = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    overflow: 'hidden',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CARD_BORDER,
  },
  copperBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: COPPER,
  },
  headerTitle: {
    flex: 1,
    color: WHITE,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headerMuted: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '600',
  },
  section: {
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  reachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG_INSET,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  platformIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reachMeta: {
    flex: 1,
    gap: 2,
  },
  platformLabel: {
    color: WHITE,
    fontSize: 12.5,
    fontWeight: '800',
  },
  engagementLine: {
    color: MUTED,
    fontSize: 10.5,
    fontWeight: '500',
  },
  reachRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  followerCount: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  freshnessChip: {
    borderRadius: RADIUS_PILL,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,198,176,0.45)',
    backgroundColor: 'rgba(0,198,176,0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  freshnessChipStale: {
    borderColor: 'rgba(255,214,10,0.45)',
    backgroundColor: 'rgba(255,214,10,0.12)',
  },
  freshnessText: {
    color: SUCCESS_GREEN,
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  freshnessTextStale: {
    color: '#FFD60A',
  },
  subHeader: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CARD_BORDER,
  },
  subHeaderText: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG_INSET,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  partnerMeta: {
    flex: 1,
    gap: 2,
  },
  partnerBrand: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '800',
  },
  partnerDeliverable: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '500',
  },
  partnerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
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
  deliveredText: {
    color: SUCCESS_GREEN,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  viewPost: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CARD_BORDER,
  },
});
