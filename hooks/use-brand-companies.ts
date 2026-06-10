// ── BRAND COMPANIES HOOKS (Sprint 2.1 — W20/W32) ────────
// React-Query wrappers around `brandCompaniesApi`. Two hooks here:
//
//   - `useBrandProfile(brandId)` — one brand record
//   - `useBrandsSearch(query)` — directory search results
//
// 5-min stale, 10-min gc (matches the rest of the brand surfaces).

import { useQuery } from '@tanstack/react-query';

import { brandCompaniesApi } from '@/lib/api/brand-companies';
import type {
  BrandCompanyProfile,
  BrandSearchResult,
} from '@/lib/types/brand-company.types';

export const BRAND_PROFILE_KEY = 'brand-company-profile';
export const BRAND_SEARCH_KEY = 'brand-company-search';

export interface UseBrandProfileResult {
  data: BrandCompanyProfile | null | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
}

export interface UseBrandsSearchResult {
  data: BrandSearchResult[] | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
}

export function useBrandProfile(
  brandId: string | null | undefined,
): UseBrandProfileResult {
  const query = useQuery<BrandCompanyProfile | null>({
    queryKey: [BRAND_PROFILE_KEY, brandId],
    queryFn: () => brandCompaniesApi.getBrandProfile(brandId ?? ''),
    enabled: Boolean(brandId),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: (query.error as Error | null) ?? null,
  };
}

export function useBrandsSearch(query: string): UseBrandsSearchResult {
  const trimmed = query.trim();
  const result = useQuery<BrandSearchResult[]>({
    queryKey: [BRAND_SEARCH_KEY, trimmed.toLowerCase()],
    queryFn: () => brandCompaniesApi.searchBrands(trimmed),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  return {
    data: result.data,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    error: (result.error as Error | null) ?? null,
  };
}
