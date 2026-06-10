// ── BRAND COMPANY PROFILE (Sprint 2.1 — W20/W32) ─────────
// Mrs. Wilson asked us to give the AD / NIL Manager a one-page
// vetted view of every brand they're contracting with: HQ,
// employees, revenue band, products / services, recent news, and
// — crucially — a fresh source-of-truth on every field. This file
// owns the canonical TypeScript shape.
//
// Per PLAN §2.1 every news item carries `freshness` (chip tone)
// plus a structured `ComparableDealSourceRef` so the spine can
// surface citation + retrieval-date next to the headline.

import type { ComparableDealSourceRef } from './comparable-deal.types';

/** Coarse revenue band — keeps synthetic profiles non-specific. */
export type RevenueBand =
  | 'under-10m'
  | '10m-50m'
  | '50m-250m'
  | '250m-1b'
  | 'over-1b';

/** Freshness chip tones for a news / company-profile field. */
export type BrandFieldFreshness = 'fresh' | 'aging' | 'stale';

/** Headquarters block — city/state required, country optional. */
export interface BrandHeadquarters {
  city: string;
  state: string;
  country: string;
}

/** Optional social-channel handles for a brand. */
export interface BrandSocialFootprint {
  instagram?: string;
  tiktok?: string;
  twitter?: string;
}

/** Trust metadata stamped on the whole profile. */
export interface BrandProfileTrustMeta {
  /** ISO 8601 timestamp the profile was last re-verified. */
  lastVerifiedAt: string;
  /** Source the verification was anchored against. */
  verificationSource: ComparableDealSourceRef;
}

/** One recent-news item attached to a brand profile. */
export interface BrandNewsItem {
  id: string;
  title: string;
  summary: string;
  /** ISO 8601 publish date — drives freshness chip. */
  publishedAt: string;
  sourceLabel: string;
  sourceUrl?: string;
  freshness: BrandFieldFreshness;
  sourceRef: ComparableDealSourceRef;
}

/** Hand-authored or backend-projected brand company profile. */
export interface BrandCompanyProfile {
  brandId: string;
  legalName: string;
  displayName: string;
  foundedYear: number;
  headquarters: BrandHeadquarters;
  employees: number;
  revenueBandUSD: RevenueBand;
  productsServices: string[];
  primaryCategories: string[];
  recentNews: BrandNewsItem[];
  socialFootprint?: BrandSocialFootprint;
  trustMeta: BrandProfileTrustMeta;
}

/** Hit row returned from the brand directory search. */
export interface BrandSearchResult {
  brandId: string;
  displayName: string;
  category: string;
  revenueBandUSD: RevenueBand;
  /** Field names that matched the query — drives chip rail in the UI. */
  matchedFields: string[];
  /** 0–100 — higher is better. Weighted across `matchedFields`. */
  matchScore: number;
  sourceRef: ComparableDealSourceRef;
}

// ── Helpers ──────────────────────────────────────────────

/** Human label for a `RevenueBand` value. */
export const REVENUE_BAND_LABEL: Record<RevenueBand, string> = {
  'under-10m': '< $10M',
  '10m-50m': '$10M – $50M',
  '50m-250m': '$50M – $250M',
  '250m-1b': '$250M – $1B',
  'over-1b': '> $1B',
};

/**
 * Classify a published-at date into the canonical freshness band
 * (fresh < 14d, aging 14–60d, stale > 60d).
 */
export function classifyFreshness(
  publishedAt: string,
  nowMs: number = Date.now(),
): BrandFieldFreshness {
  const ageDays = Math.max(
    0,
    Math.floor((nowMs - Date.parse(publishedAt)) / (24 * 60 * 60 * 1000)),
  );
  if (ageDays < 14) return 'fresh';
  if (ageDays <= 60) return 'aging';
  return 'stale';
}
