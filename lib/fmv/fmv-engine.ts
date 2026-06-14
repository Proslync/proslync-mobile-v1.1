// lib/fmv/fmv-engine.ts
// Typed wrappers around fmv-engine.mjs.
// Follows the lib/compliance/preclearance.ts pattern exactly.

import {
  estimateFmv as _estimateFmv,
  predictClearance as _predictClearance,
  FMV_DISCLAIMER as _FMV_DISCLAIMER,
  LLM_READY as _LLM_READY,
} from './fmv-engine.mjs';

import type {
  FmvEstimateInput,
  FmvEstimate,
  ClearanceInput,
  ClearancePrediction,
} from './fmv-engine.d';

export type {
  DealKind,
  FmvConfidence,
  FmvMethod,
  ClearanceBand,
  ClearanceBandLabel,
  NormalizedComp,
  FmvEstimateInput,
  FmvEstimate,
  ClearanceInput,
  ClearancePrediction,
} from './fmv-engine.d';

export const estimateFmv = _estimateFmv as (
  input: FmvEstimateInput,
) => FmvEstimate;

export const predictClearance = _predictClearance as (
  input: ClearanceInput,
) => ClearancePrediction;

export const FMV_DISCLAIMER = _FMV_DISCLAIMER as string;
export const LLM_READY = _LLM_READY as false;
