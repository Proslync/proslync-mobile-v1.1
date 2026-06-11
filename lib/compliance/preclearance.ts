// lib/compliance/preclearance.ts
// Typed wrappers around the .mjs pure functions.
// Follows the lib/deal-engine/engine.ts pattern.

import {
  scorePreclearance as _scorePreclearance,
  nilGoDeadline as _nilGoDeadline,
} from './preclearance.mjs';

import type {
  PreclearanceInput,
  PreclearanceResult,
} from './preclearance.d';

export type {
  PreclearanceInput,
  PreclearanceResult,
  PreflightFlag,
  TestResult,
  PreclearanceVerdict,
} from './preclearance.d';

export const scorePreclearance = _scorePreclearance as (
  input: PreclearanceInput,
) => PreclearanceResult;

export const nilGoDeadline = _nilGoDeadline as (
  executedISO: string,
) => string;
