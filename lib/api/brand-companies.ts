// ── BRAND COMPANIES API (Sprint 2.1 — W20/W32) ───────────
// Mock-first façade for the brand directory + brand-profile slice
// (PLAN.md §2.1 — Mrs. Wilson W20/W32). All calls resolve from
// `lib/data/mock-brand-companies.ts`; the backend swap will land
// alongside a future brand-registry / news-ingestion pipeline.

import {
  getAllMockBrandProfiles,
  getMockBrandProfile,
} from '@/lib/data/mock-brand-companies';
import { searchBrands as searchBrandsMock } from '@/lib/data/mock-brand-search';
import type {
  BrandCompanyProfile,
  BrandSearchResult,
} from '@/lib/types/brand-company.types';

export const brandCompaniesApi = {
  /**
   * Fetch a single brand company profile. Resolves to `null` for
   * unknown brand ids so the UI can render a clean empty state.
   */
  async getBrandProfile(
    brandId: string,
  ): Promise<BrandCompanyProfile | null> {
    if (!brandId) return null;
    return getMockBrandProfile(brandId) ?? null;
  },

  /** Fetch every brand profile in the directory. */
  async getAllBrands(): Promise<BrandCompanyProfile[]> {
    return getAllMockBrandProfiles();
  },

  /**
   * Run a lowercase-substring directory search. Empty query yields
   * every brand sorted by `displayName`.
   */
  async searchBrands(query: string): Promise<BrandSearchResult[]> {
    return searchBrandsMock(query, getAllMockBrandProfiles());
  },
};
