// lib/fmv/fmv-engine.d.ts
// TypeScript declarations for lib/fmv/fmv-engine.mjs.
// Mirrors the lib/compliance/preclearance.d.ts pattern.

import type { PreclearanceResult } from '../compliance/preclearance.d';

export type DealKind =
  | 'endorsement'
  | 'social-post'
  | 'appearance'
  | 'autograph'
  | 'licensing';

export type FmvConfidence = 'low' | 'medium' | 'high';
export type FmvMethod = 'base' | 'blended';
export type ClearanceBand = 'likely' | 'borderline' | 'unlikely';
export type ClearanceBandLabel =
  | 'Likely to clear'
  | 'Borderline — needs work'
  | 'Unlikely to clear as written';

/** A normalized comp row passed into estimateFmv. */
export interface NormalizedComp {
  amountCents: number;
  nilCategory: string;
  followerReach: number;
  dealReportedAt?: string;
  source?: string;
  reviewerState?: string;
}

export interface FmvEstimateInput {
  dealKind: DealKind;
  totalFollowers: number;
  engagementRate7d: number;
  comps?: NormalizedComp[];
}

export interface FmvEstimate {
  lowCents: number;
  highCents: number;
  pointCents: number;
  confidence: FmvConfidence;
  compsUsedCount: number;
  method: FmvMethod;
}

export interface ClearanceInput {
  amountCents: number;
  dealKind: DealKind;
  deliverableDescription: string;
  payerEntityType: string;
  athleteId?: string;
  dealId?: string;
  totalFollowers: number;
  engagementRate7d: number;
  comps?: NormalizedComp[];
}

export interface ClearancePrediction {
  band: ClearanceBand;
  bandLabel: ClearanceBandLabel;
  reason: string;
  fmv: FmvEstimate;
  fmvApplies: boolean;
  gate: PreclearanceResult;
  confidence: FmvConfidence;
}

export declare const LLM_READY: false;
export declare const FMV_DISCLAIMER: string;

export declare function estimateFmv(input: FmvEstimateInput): FmvEstimate;
export declare function predictClearance(input: ClearanceInput): ClearancePrediction;
