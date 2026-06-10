// ── STATIC SEED IMPORTS ───────────────────────────────────
// Hand-curated reference data from approved public sources. Each seed
// carries a `_meta` block documenting source/license/attribution, the
// same shape as `ComparableDealSourceRef` so the existing TrustMeta
// primitive renders attribution natively.
//
// Per PLAN §5c/§5d these sources are pre-cleared for design reference
// (Q-source-posture in PLAN §9 remains the live gate before any
// production attestation use).

import cscNilDealFlow from './csc-nil-deal-flow-2026-q1.json';
import ncaaDirectory from './ncaa-directory.json';
import eadaAthleteCounts from './eada-athlete-counts.json';
import knightNewhouseRevenueTiers from './knight-newhouse-revenue-tiers.json';
import calMattersDisclosurePatterns from './calmatters-nil-disclosure-patterns.json';
import opendorseTaxonomies from './opendorse-taxonomies.json';
import * as mockRegistry from '../../mock-registry';

export interface SeedMeta {
  source: string;
  sourceUrl: string;
  retrievedAt: string;
  license: string;
  attribution: string;
  version: string;
  caveat: string;
}

export interface CscNilSeed {
  _meta: SeedMeta;
  attestationPhrasing: Record<string, string>;
  valueBandPatterns: Array<{
    band: string;
    typicalScope: string;
    exclusivityNorm: string;
  }>;
  thresholdGuidance: {
    lowDollarThresholdCents: number;
    highDollarThresholdCents: number;
    highValueDisclosureSLAdays: number;
    note: string;
  };
}

export interface NcaaDirectorySeed {
  _meta: SeedMeta;
  schools: Array<{ name: string; conference: string; division: string }>;
}

export interface EadaAthleteCountsSeed {
  _meta: SeedMeta;
  schoolAthleteCounts: Record<
    string,
    { total: number; men: number; women: number }
  >;
}

export interface KnightNewhouseSeed {
  _meta: SeedMeta;
  tiers: Array<{
    tier: string;
    annualRevenueRangeCents: [number, number];
    exampleSchools: string[];
    narrative: string;
  }>;
}

export interface CalMattersSeed {
  _meta: SeedMeta;
  redFlagPatterns: Array<{
    id: string;
    name: string;
    summary: string;
    severity: string;
  }>;
  californiaAB252Note: string;
}

export interface OpendorseSeed {
  _meta: SeedMeta;
  brandCategories: Array<{ id: string; label: string; examples: string[] }>;
  activationTypes: Array<{ id: string; label: string; typicalDeliverables: string[] }>;
  contentCategories: string[];
}

export const CSC_NIL_SEED = cscNilDealFlow as unknown as CscNilSeed;
export const NCAA_DIRECTORY_SEED = ncaaDirectory as unknown as NcaaDirectorySeed;
export const EADA_ATHLETE_COUNTS_SEED = eadaAthleteCounts as unknown as EadaAthleteCountsSeed;
export const KNIGHT_NEWHOUSE_REV_TIERS_SEED =
  knightNewhouseRevenueTiers as unknown as KnightNewhouseSeed;
export const CALMATTERS_DISCLOSURE_PATTERNS_SEED =
  calMattersDisclosurePatterns as unknown as CalMattersSeed;
export const OPENDORSE_TAXONOMIES_SEED = opendorseTaxonomies as unknown as OpendorseSeed;

export const ALL_SEEDS = {
  csc: CSC_NIL_SEED,
  ncaaDirectory: NCAA_DIRECTORY_SEED,
  eada: EADA_ATHLETE_COUNTS_SEED,
  knightNewhouse: KNIGHT_NEWHOUSE_REV_TIERS_SEED,
  calMatters: CALMATTERS_DISCLOSURE_PATTERNS_SEED,
  opendorse: OPENDORSE_TAXONOMIES_SEED,
} as const;

// Register the seed bundle in the mock-registry so the Backend cockpit
// can render the source list.
mockRegistry.register({
  id: 'seeds-static',
  description: 'Static seed JSONs from approved public sources',
  load: () => Object.values(ALL_SEEDS).map((seed) => seed._meta),
});
