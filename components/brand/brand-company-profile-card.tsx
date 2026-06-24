// ── BRAND COMPANY PROFILE CARD (Sprint 2.1 — W20/W32) ────
// Visual card rendering of `BrandCompanyProfile`. Used by:
//
//   - `app/brand/profile.tsx` — full-screen route
//   - Brand HQ surfaces (composed inline)
//
// Sections (top → bottom):
//   1. Hero — legal name, founded year, HQ city/state, revenue chip
//   2. StatPill row × 4 — Employees / Revenue / Recent news / Active deals
//   3. Products / services chip row
//   4. Recent news horizontal rail with freshness chip + source label
//   5. Trust footer — `lastVerifiedAt` + verification source ref
//
// Every news item rendered carries a freshness chip + citation label.
// `BrandCompanyProfileCta` is a compact mini-card variant that lives
// inside another surface and routes to `/brand/profile`.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  CARD_BG,
  CARD_BG_INSET,
  CARD_BORDER,
  RADIUS_MD,
  RADIUS_PILL,
  RADIUS_SM,
  SectionCard,
  StatPill,
  StatusPill,
  TONE_COLOR,
  type Tone,
} from '@/components/shared/ui-kit';
import type {
  BrandCompanyProfile,
  BrandFieldFreshness,
  BrandNewsItem,
} from '@/lib/types/brand-company.types';
import { REVENUE_BAND_LABEL } from '@/lib/types/brand-company.types';

const FRESHNESS_TONE: Record<BrandFieldFreshness, Tone> = {
  fresh: 'success',
  aging: 'warning',
  stale: 'danger',
};

const FRESHNESS_LABEL: Record<BrandFieldFreshness, string> = {
  fresh: 'Fresh',
  aging: 'Aging',
  stale: 'Stale',
};

function formatDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    })
    .toUpperCase();
}

function formatVerifiedAgo(iso: string): string {
  const days = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(iso)) / (24 * 60 * 60 * 1000)),
  );
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export interface BrandCompanyProfileCardProps {
  profile: BrandCompanyProfile;
  /** Optional count of live deals to render in the stat row. */
  activeDealsCount?: number;
}

export function BrandCompanyProfileCard({
  profile,
  activeDealsCount,
}: BrandCompanyProfileCardProps) {
  const hq = `${profile.headquarters.city}, ${profile.headquarters.state}`;

  return (
    <View style={styles.card}>
      {/* ─── Hero ───────────────────────────── */}
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>BRAND PROFILE</Text>
        <Text style={styles.displayName}>{profile.displayName}</Text>
        <Text style={styles.legalName} numberOfLines={2}>
          {profile.legalName}
        </Text>
        <View style={styles.heroMetaRow}>
          <View style={styles.heroChip}>
            <Ionicons name="business-outline" size={11} color="#FFF" />
            <Text style={styles.heroChipText}>{hq}</Text>
          </View>
          <View style={styles.heroChip}>
            <Ionicons name="calendar-outline" size={11} color="#FFF" />
            <Text style={styles.heroChipText}>Est. {profile.foundedYear}</Text>
          </View>
          <StatusPill
            label={REVENUE_BAND_LABEL[profile.revenueBandUSD]}
            tone="info"
            size="sm"
          />
        </View>
      </View>

      {/* ─── Stats ──────────────────────────── */}
      <View style={styles.statRow}>
        <StatPill
          value={formatEmployees(profile.employees)}
          label="Employees"
          tint="#FFFFFF"
          size="sm"
        />
        <StatPill
          value={REVENUE_BAND_LABEL[profile.revenueBandUSD]}
          label="Revenue"
          tint={TONE_COLOR.info}
          size="sm"
        />
        <StatPill
          value={String(profile.recentNews.length)}
          label="News"
          tint={TONE_COLOR.accent}
          size="sm"
        />
        <StatPill
          value={String(activeDealsCount ?? 0)}
          label="Live deals"
          tint={TONE_COLOR.success}
          size="sm"
        />
      </View>

      {/* ─── Products / services ────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Products & services</Text>
        <View style={styles.chipWrap}>
          {profile.productsServices.map((p) => (
            <View key={p} style={styles.tagChip}>
              <Text style={styles.tagChipText}>{p}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ─── Recent news rail ───────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Recent news</Text>
          <Text style={styles.sectionMeta}>
            {profile.recentNews.length} items · every source vetted
          </Text>
        </View>
        {profile.recentNews.length === 0 ? (
          <Text style={styles.emptyNews}>No recent news captured.</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.newsRail}
          >
            {profile.recentNews.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </ScrollView>
        )}
      </View>

      {/* ─── Trust footer ───────────────────── */}
      <View style={styles.trustFooter}>
        <Ionicons
          name="shield-checkmark-outline"
          size={14}
          color={TONE_COLOR.success}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.trustTitle}>
            Last verified {formatVerifiedAgo(profile.trustMeta.lastVerifiedAt)}
          </Text>
          <Text style={styles.trustMeta} numberOfLines={2}>
            Source: {profile.trustMeta.verificationSource.label}
          </Text>
        </View>
      </View>
    </View>
  );
}

function formatEmployees(n: number): string {
  if (n >= 10000) return `${Math.round(n / 1000)}K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function NewsCard({ item }: { item: BrandNewsItem }) {
  return (
    <View style={styles.newsCard}>
      <View style={styles.newsChipRow}>
        <StatusPill
          label={FRESHNESS_LABEL[item.freshness]}
          tone={FRESHNESS_TONE[item.freshness]}
          size="sm"
        />
        <Text style={styles.newsDate}>{formatDate(item.publishedAt)}</Text>
      </View>
      <Text style={styles.newsTitle} numberOfLines={3}>
        {item.title}
      </Text>
      <Text style={styles.newsSummary} numberOfLines={3}>
        {item.summary}
      </Text>
      <View style={styles.newsSourceRow}>
        <Ionicons
          name="newspaper-outline"
          size={11}
          color="rgba(255,255,255,0.6)"
        />
        <Text style={styles.newsSource} numberOfLines={1}>
          {item.sourceLabel}
        </Text>
      </View>
    </View>
  );
}

// ─── Compact CTA mini-card ───────────────────────────────

export interface BrandCompanyProfileCtaProps {
  profile: BrandCompanyProfile;
}

export function BrandCompanyProfileCta({
  profile,
}: BrandCompanyProfileCtaProps) {
  const router = useRouter();
  const hq = `${profile.headquarters.city}, ${profile.headquarters.state}`;
  const newsCount = profile.recentNews.length;
  const freshCount = profile.recentNews.filter((n) => n.freshness === 'fresh')
    .length;

  return (
    <SectionCard title="Brand profile" icon="business-outline">
      <Pressable
        onPress={() => router.push(`/brand/profile?brandId=${profile.brandId}`)}
        accessibilityRole="button"
        accessibilityLabel={`Open ${profile.displayName} brand profile`}
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
      >
        <View style={styles.ctaIcon}>
          <Ionicons
            name="business-outline"
            size={16}
            color={TONE_COLOR.accent}
          />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.ctaTitle}>{profile.displayName}</Text>
          <Text style={styles.ctaMeta} numberOfLines={1}>
            {hq} · Est. {profile.foundedYear} ·{' '}
            {REVENUE_BAND_LABEL[profile.revenueBandUSD]}
          </Text>
          <Text style={styles.ctaMeta} numberOfLines={1}>
            {newsCount} news · {freshCount} fresh · verified{' '}
            {formatVerifiedAgo(profile.trustMeta.lastVerifiedAt)}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/brand/search')}
          accessibilityRole="button"
          accessibilityLabel="Search brand directory"
          hitSlop={10}
          style={styles.searchBtn}
        >
          <Ionicons name="search" size={16} color="#FFF" />
        </Pressable>
        <Ionicons
          name="chevron-forward"
          size={16}
          color="rgba(255,255,255,0.5)"
        />
      </Pressable>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderColor: CARD_BORDER,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 16,
    padding: 16,
  },
  hero: {
    gap: 6,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  displayName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  legalName: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    fontWeight: '600',
  },
  heroMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  heroChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: CARD_BORDER,
    borderRadius: RADIUS_PILL,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  heroChipText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  statRow: {
    flexDirection: 'row',
    gap: 8,
  },

  section: {
    gap: 8,
  },
  sectionHead: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sectionMeta: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10.5,
    fontWeight: '700',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    backgroundColor: CARD_BG_INSET,
    borderColor: CARD_BORDER,
    borderRadius: RADIUS_PILL,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagChipText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
    fontWeight: '700',
  },

  newsRail: {
    gap: 10,
    paddingRight: 8,
  },
  newsCard: {
    backgroundColor: CARD_BG_INSET,
    borderColor: CARD_BORDER,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
    padding: 12,
    width: 240,
  },
  newsChipRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  newsDate: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  newsTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 17,
  },
  newsSummary: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11.5,
    lineHeight: 15,
  },
  newsSourceRow: {
    alignItems: 'center',
    borderTopColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 4,
    paddingTop: 6,
  },
  newsSource: {
    color: 'rgba(255,255,255,0.62)',
    flex: 1,
    fontSize: 10.5,
    fontWeight: '700',
  },
  emptyNews: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontStyle: 'italic',
  },

  trustFooter: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0,198,176,0.08)',
    borderColor: 'rgba(0,198,176,0.24)',
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    padding: 10,
  },
  trustTitle: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '900',
  },
  trustMeta: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },

  // ── CTA mini-card ──
  cta: {
    alignItems: 'center',
    backgroundColor: CARD_BG_INSET,
    borderColor: CARD_BORDER,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  ctaIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,111,60,0.14)',
    borderColor: 'rgba(255,111,60,0.32)',
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  ctaTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  ctaMeta: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11,
    fontWeight: '600',
  },
  searchBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: CARD_BORDER,
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
});
