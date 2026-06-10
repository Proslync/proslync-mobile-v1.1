// ── BRAND SEARCH (Sprint 2.1 — W20/W32) ─────────────────
// Pure substring-match search across the hand-authored brand
// directory. Returns ranked `BrandSearchResult` rows with a
// 0–100 `matchScore` and the list of fields that matched (used
// to render the chip rail in `app/brand/search.tsx`).
//
// Field weights:
//   - displayName / legalName  = 40 points (exact-match bonus +20)
//   - primaryCategories        = 25 points
//   - productsServices         = 15 points
// Capped at 100. Empty query returns the whole directory ordered
// by `displayName`.

import type {
  BrandCompanyProfile,
  BrandSearchResult,
} from '@/lib/types/brand-company.types';
import type { ComparableDealSourceRef } from '@/lib/types/comparable-deal.types';

interface Hit {
  score: number;
  fields: string[];
}

function matchField(
  query: string,
  value: string,
  weight: number,
  exactBonus = 0,
): number {
  const haystack = value.toLowerCase();
  if (!haystack.includes(query)) return 0;
  if (haystack === query) return weight + exactBonus;
  return weight;
}

function matchList(
  query: string,
  values: readonly string[],
  weight: number,
): number {
  let best = 0;
  for (const v of values) {
    const s = matchField(query, v, weight);
    if (s > best) best = s;
  }
  return best;
}

function buildSourceRef(brand: BrandCompanyProfile): ComparableDealSourceRef {
  // Reuse the verification source — the search result is a pointer
  // back into the verified brand profile, not a separate document.
  return brand.trustMeta.verificationSource;
}

/**
 * Score a single brand against the query. Returns null when no
 * field matches the query at all.
 */
function scoreBrand(query: string, brand: BrandCompanyProfile): Hit | null {
  const fields: string[] = [];
  let score = 0;

  const displayScore = matchField(query, brand.displayName, 40, 20);
  if (displayScore > 0) {
    score += displayScore;
    fields.push('displayName');
  }

  const legalScore = matchField(query, brand.legalName, 40, 20);
  if (legalScore > 0) {
    score += legalScore;
    fields.push('legalName');
  }

  const categoryScore = matchList(query, brand.primaryCategories, 25);
  if (categoryScore > 0) {
    score += categoryScore;
    fields.push('primaryCategories');
  }

  const productScore = matchList(query, brand.productsServices, 15);
  if (productScore > 0) {
    score += productScore;
    fields.push('productsServices');
  }

  if (fields.length === 0) return null;
  return { score: Math.min(100, score), fields };
}

/**
 * Lowercase-substring search over the supplied brand directory.
 * Returns ranked results — empty query yields the full list sorted
 * by `displayName`.
 */
export function searchBrands(
  query: string,
  brands: BrandCompanyProfile[],
): BrandSearchResult[] {
  const q = query.trim().toLowerCase();

  if (!q) {
    return [...brands]
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .map<BrandSearchResult>((brand) => ({
        brandId: brand.brandId,
        displayName: brand.displayName,
        category: brand.primaryCategories[0] ?? 'Brand',
        revenueBandUSD: brand.revenueBandUSD,
        matchedFields: [],
        matchScore: 0,
        sourceRef: buildSourceRef(brand),
      }));
  }

  const hits: BrandSearchResult[] = [];
  for (const brand of brands) {
    const hit = scoreBrand(q, brand);
    if (!hit) continue;
    hits.push({
      brandId: brand.brandId,
      displayName: brand.displayName,
      category: brand.primaryCategories[0] ?? 'Brand',
      revenueBandUSD: brand.revenueBandUSD,
      matchedFields: hit.fields,
      matchScore: hit.score,
      sourceRef: buildSourceRef(brand),
    });
  }

  hits.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return a.displayName.localeCompare(b.displayName);
  });

  return hits;
}
