// ── MediaKitCard ──────────────────────────────────────────────
// Brand-facing "verified media kit": cross-platform reach rows
// + completed deal receipts. Sits at the top of the About tab and
// uses the SAME liquid-glass block material + label styling as the
// bio blocks below it ("Freshman year" etc).
// Demo fixture only — data is static.

import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { RADIUS_PILL } from '@/components/shared/ui-kit/tokens';
import { DEAL_TRUTH_FIXTURE } from '@/lib/data/mock-deal-truth';
import { getMockAthleteSocialReach } from '@/lib/data/mock-social-reach';

const LABEL_ORANGE = '#FF6F3C';
const MUTED = 'rgba(255,255,255,0.52)';
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

// ─── GlassBlock — same material as the About bio blocks ──────

function GlassBlock({ children }: { children: React.ReactNode }) {
  return (
    <View style={mk.block}>
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 16 }]}
        pointerEvents="none"
      />
      <View style={mk.blockGlass} pointerEvents="none">
        <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 16 }]} />
        {isLiquidGlassSupported && (
          <LiquidGlassView
            effect="regular"
            tintColor="rgba(255,255,255,0.10)"
            style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
          />
        )}
      </View>
      {children}
    </View>
  );
}

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
    <>
      {/* ── Verified media kit block ── */}
      <GlassBlock>
        <View style={mk.labelRow}>
          <Text style={mk.label}>Verified media kit</Text>
          <Text style={mk.labelMuted}>Updated today</Text>
        </View>

        {reach != null
          ? reach.platforms.map((p, idx) => {
              const days = p.source.freshnessDays;
              const isStale = days >= 7;
              const icon = PLATFORM_ICON[p.platform] ?? 'globe-outline';
              const label = PLATFORM_LABEL[p.platform] ?? p.platform;

              return (
                <View key={p.platform} style={[mk.row, idx === 0 && mk.rowFirst]}>
                  <View style={mk.platformIconWrap}>
                    <Ionicons name={icon} size={17} color={WHITE} />
                  </View>
                  <Text style={mk.rowTitle}>{label}</Text>
                  <View style={mk.rowRight}>
                    <Text style={mk.followerCount}>{formatFollowers(p.followers)}</Text>
                    <View style={[mk.freshnessChip, isStale && mk.freshnessChipStale]}>
                      <Text style={[mk.freshnessText, isStale && mk.freshnessTextStale]}>
                        {formatFreshness(days)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          : null}

        {reach != null && typeof reach.engagementRate7d === 'number' ? (
          <Text style={mk.engagementLine}>
            Avg engagement {(reach.engagementRate7d * 100).toFixed(1)}% · last 30 posts
          </Text>
        ) : null}
      </GlassBlock>

      {/* ── Past partnerships block ── */}
      <GlassBlock>
        <View style={mk.labelRow}>
          <Text style={mk.label}>Past partnerships</Text>
        </View>

        {[...paidDeals.map((d) => ({
          key: d.dealId,
          brand: d.brand,
          deliverable: d.deliverables[0]?.label ?? 'Deliverable',
        })), ...EXTRA_PARTNERSHIPS.map((ep) => ({
          key: ep.brand,
          brand: ep.brand,
          deliverable: ep.deliverable,
        }))].map((p, idx) => (
          <View key={p.key} style={[mk.row, idx === 0 && mk.rowFirst]}>
            <View style={mk.partnerMeta}>
              <Text style={mk.rowTitle}>{p.brand}</Text>
              <Text style={mk.partnerDeliverable} numberOfLines={1}>
                {p.deliverable}
              </Text>
            </View>
            <View style={mk.rowRight}>
              <View style={mk.deliveredPill}>
                <Ionicons name="checkmark" size={11} color={SUCCESS_GREEN} />
                <Text style={mk.deliveredText}>Delivered on time</Text>
              </View>
              {onViewPosts != null ? (
                <TouchableOpacity
                  onPress={onViewPosts}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${p.brand} post`}
                >
                  <Text style={mk.viewPost}>View post →</Text>
                </TouchableOpacity>
              ) : (
                <Text style={mk.viewPost}>View post →</Text>
              )}
            </View>
          </View>
        ))}

        <Text style={mk.footer}>
          These receipts double as CSC valid-business-purpose evidence.
        </Text>
      </GlassBlock>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const mk = StyleSheet.create({
  // Same material recipe as profile.tsx aboutBlockBare/aboutBlockGlass
  block: {
    gap: 10,
    borderRadius: 16,
    padding: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  blockGlass: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Matches profile.tsx aboutLabel
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: LABEL_ORANGE,
    textTransform: 'uppercase',
  },
  labelMuted: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '600',
  },
  // Matches profile.tsx bioItem separators
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE,
    paddingTop: 10,
    paddingBottom: 2,
  },
  rowFirst: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
  platformIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Matches profile.tsx bioTitle
  rowTitle: {
    flex: 1,
    fontSize: 15,
    color: WHITE,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  followerCount: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  engagementLine: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
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
  partnerMeta: {
    flex: 1,
    gap: 2,
  },
  partnerDeliverable: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '500',
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
    marginTop: 2,
  },
});
