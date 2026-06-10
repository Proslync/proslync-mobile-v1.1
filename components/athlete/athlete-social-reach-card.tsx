// ── ATHLETE SOCIAL REACH CARD ────────────────────────────
// W25 (PLAN.md §5 P1) — cross-platform follower-count card for the
// athlete bio. Mrs. Wilson's brand-side discovery flow needs reach
// context immediately under the hero; this card surfaces it with the
// same source-freshness discipline the rest of Proslync's evidence
// primitives carry (per-platform `lastUpdatedAt`, source ref, and
// methodology footer).
//
// Visual posture mirrors `athlete-comparables-card.tsx`: dark glass
// card on `rgba(255,255,255,0.055)` background, athlete-accent (#EB621A)
// chrome, hairline borders, `RADIUS_MD` (10) corners.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAthleteSocialReach } from '@/hooks/use-social-reach';
import {
  CARD_BG,
  CARD_BG_INSET,
  CARD_BORDER,
  RADIUS_MD,
  RADIUS_PILL,
  RADIUS_SM,
} from '@/components/shared/ui-kit';
import type {
  AthleteSocialReach,
  PlatformReach,
  SocialPlatform,
} from '@/lib/types/social-reach.types';

const ATHLETE_ACCENT = '#EB621A';
const VERIFIED_BLUE = '#4DA3FF';
const MUTED = 'rgba(255,255,255,0.52)';

const PLATFORM_ICON: Record<SocialPlatform, keyof typeof Ionicons.glyphMap> = {
  instagram: 'logo-instagram',
  tiktok: 'logo-tiktok',
  twitter: 'logo-twitter',
  youtube: 'logo-youtube',
  twitch: 'logo-twitch',
  linkedin: 'logo-linkedin',
};

const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  twitter: 'Twitter / X',
  youtube: 'YouTube',
  twitch: 'Twitch',
  linkedin: 'LinkedIn',
};

/** "1.2M" / "845K" / "612" — same convention as `BRAND_ATHLETES.followers`. */
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

export interface AthleteSocialReachCardProps {
  /** Athlete id to fetch the reach packet for. Defaults to demo athlete `a-1`. */
  athleteId?: string;
}

export function AthleteSocialReachCard({
  athleteId = 'a-1',
}: AthleteSocialReachCardProps) {
  const { data, isLoading } = useAthleteSocialReach(athleteId);

  if (isLoading) {
    return (
      <View style={[styles.card, styles.centerLoading]}>
        <ActivityIndicator color={ATHLETE_ACCENT} />
      </View>
    );
  }

  if (!data) {
    return null;
  }

  return <SocialReachContent reach={data} />;
}

function SocialReachContent({ reach }: { reach: AthleteSocialReach }) {
  const platformCount = reach.platforms.length;
  const engagementPct =
    typeof reach.engagementRate7d === 'number'
      ? `${(reach.engagementRate7d * 100).toFixed(1)}%`
      : null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconBadge}>
          <Ionicons name="globe-outline" size={16} color={ATHLETE_ACCENT} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>Cross-platform reach</Text>
          <Text style={styles.title}>Audience across every connected handle</Text>
        </View>
      </View>

      <View style={styles.heroBox}>
        <Text style={styles.heroNumber}>{formatFollowers(reach.totalFollowers)}</Text>
        <Text style={styles.heroLabel}>
          {`followers across ${platformCount} platform${platformCount === 1 ? '' : 's'}`}
        </Text>
        {engagementPct ? (
          <View style={styles.engagementChip}>
            <Ionicons name="flame-outline" size={11} color={ATHLETE_ACCENT} />
            <Text style={styles.engagementText}>
              {`${engagementPct} avg engagement (7d)`}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.platformList}>
        {reach.platforms.map((platform) => (
          <PlatformRow key={platform.platform} platform={platform} />
        ))}
      </View>

      <View style={styles.footer}>
        <Ionicons name="information-circle-outline" size={12} color={MUTED} />
        <Text style={styles.footerText} numberOfLines={2}>
          {`${reach.sourceNote} Last sync ${formatRelativeFromIso(reach.lastSyncedAt)}.`}
        </Text>
      </View>
    </View>
  );
}

function PlatformRow({ platform }: { platform: PlatformReach }) {
  const days = platform.source.freshnessDays;
  const isStale = days >= 7;
  return (
    <View style={styles.row}>
      <View style={[styles.platformIcon, isStale && styles.platformIconStale]}>
        <Ionicons
          name={PLATFORM_ICON[platform.platform]}
          size={18}
          color="#FFFFFF"
        />
      </View>
      <View style={styles.flex}>
        <View style={styles.handleRow}>
          <Text style={styles.platformLabel}>
            {PLATFORM_LABEL[platform.platform]}
          </Text>
          {platform.verified ? (
            <Ionicons
              name="checkmark-circle"
              size={12}
              color={VERIFIED_BLUE}
              style={styles.verifiedIcon}
            />
          ) : null}
        </View>
        <Text style={styles.handleText} numberOfLines={1}>
          {`@${platform.handle}`}
        </Text>
      </View>
      <View style={styles.followerCol}>
        <Text style={styles.followerCount}>
          {formatFollowers(platform.followers)}
        </Text>
        <View style={[styles.freshnessChip, isStale && styles.freshnessChipStale]}>
          <Text style={[styles.freshnessText, isStale && styles.freshnessTextStale]}>
            {formatFreshness(days)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function formatRelativeFromIso(iso: string): string {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return 'recently';
  const diffMs = Date.now() - ts;
  const days = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  return formatFreshness(days);
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${ATHLETE_ACCENT}42`,
    backgroundColor: CARD_BG,
    padding: 14,
  },
  centerLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 11,
  },
  iconBadge: {
    alignItems: 'center',
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${ATHLETE_ACCENT}55`,
    backgroundColor: `${ATHLETE_ACCENT}1C`,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  flex: { flex: 1 },
  eyebrow: {
    color: ATHLETE_ACCENT,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
  },
  heroBox: {
    alignItems: 'flex-start',
    gap: 6,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG_INSET,
    padding: 14,
  },
  heroNumber: {
    color: ATHLETE_ACCENT,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
    lineHeight: 36,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 12.5,
    fontWeight: '700',
  },
  engagementChip: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    marginTop: 4,
    borderRadius: RADIUS_PILL,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${ATHLETE_ACCENT}55`,
    backgroundColor: `${ATHLETE_ACCENT}1C`,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  engagementText: {
    color: ATHLETE_ACCENT,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  platformList: {
    gap: 8,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG_INSET,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  platformIcon: {
    alignItems: 'center',
    borderRadius: RADIUS_SM,
    backgroundColor: 'rgba(255,255,255,0.08)',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  platformIconStale: {
    opacity: 0.55,
  },
  handleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  platformLabel: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '900',
  },
  verifiedIcon: {
    marginTop: 1,
  },
  handleText: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  followerCol: {
    alignItems: 'flex-end',
    gap: 3,
  },
  followerCount: {
    color: '#FFFFFF',
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
    color: '#00C6B0',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  freshnessTextStale: {
    color: '#FFD60A',
  },
  footer: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  footerText: {
    color: MUTED,
    flex: 1,
    fontSize: 10.5,
    fontWeight: '600',
    lineHeight: 14,
  },
});
