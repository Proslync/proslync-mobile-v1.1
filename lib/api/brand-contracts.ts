// ── BRAND CONTRACTS API (Sprint 2.5 · W33) ────────────────
// Mock-first façade for the Brand roster contract drill-down.
//
// Anchors:
//   - PLAN.md §2.5 (Brand roster contract drill-down per W33)
//   - lib/data/mock-brand-contracts.ts (synthetic fixtures)

import {
  DEFAULT_BRAND_ID,
  getMockBrandContract,
} from '@/lib/data/mock-brand-contracts';
import type { BrandContractTerm } from '@/lib/types/brand-contract.types';

export const brandContractsApi = {
  /**
   * Returns the contract record for a brand-athlete pair, or `null`
   * when no contract exists (so the UI can render an empty state).
   *
   * `brandId` defaults to the canonical mock brand (Nike Hoops) which
   * matches the BRAND_ATHLETES roster anchor.
   */
  async getAthleteContract(
    athleteId: string,
    brandId: string = DEFAULT_BRAND_ID,
  ): Promise<BrandContractTerm | null> {
    if (!athleteId) return null;
    return getMockBrandContract(athleteId, brandId);
  },
};
