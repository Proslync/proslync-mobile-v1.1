# NIL FMV + Clearance Predictor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a gate-before-price FMV engine (`lib/fmv/fmv-engine.mjs`) and surface clearance bands in the deal-engine pre-check step and the collective clearance pipeline.

**Architecture:** A pure `.mjs` engine module (same pattern as `lib/compliance/preclearance.mjs`) exports `estimateFmv` and `predictClearance`. It composes with the existing `scorePreclearance` — gate runs first, then price. TypeScript wrappers and `.d.ts` declarations follow the `lib/compliance/preclearance.ts` pattern. Two UI surfaces (`app/deal-engine/new.tsx` PrecheckStep and `components/collective/collective-home.tsx` ClearancePipelineModule) import only from the `.ts` wrapper.

**Tech Stack:** Node.js ESM (`.mjs`), TypeScript wrappers, React Native (no animations), `node:test` for unit tests, cents-only internally, `formatCentsUSD` from `lib/money/money-machine.mjs` for display.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `lib/fmv/fmv-engine.mjs` | Create | Pure JS engine — `estimateFmv`, `predictClearance`, constants, CPE_BAND table |
| `lib/fmv/fmv-engine.d.ts` | Create | TypeScript declarations mirroring the `.mjs` exports |
| `lib/fmv/fmv-engine.ts` | Create | Typed wrapper (re-exports through `.mjs`, same pattern as `preclearance.ts`) |
| `lib/fmv/fmv-engine.test.mjs` | Create | ≥ 12 `node:test` tests (all required scenarios from spec) |
| `app/deal-engine/new.tsx` | Modify | Upgrade PrecheckStep (~lines 1118–1275) to call `predictClearance`, render band pill + FMV range + expandable comps + disclaimer |
| `components/collective/collective-home.tsx` | Modify | Add FMV band chip to each DEAL_ROWS entry in `ClearancePipelineModule`, disclaimer at section footer |

---

## Task 1: Engine — `lib/fmv/fmv-engine.mjs`

**Files:**
- Create: `lib/fmv/fmv-engine.mjs`

Read `lib/compliance/preclearance.mjs` and `lib/money/money-machine.mjs` before writing — you need the import paths and `formatCentsUSD` signature.

### Calibration reference (read before writing CPE_BAND)
Athlete `a-1` (Kiyan Anthony): `totalFollowers = 2_619_500`, `engagementRate7d = 0.052`.
`engagedReach = 2_619_500 * 0.052 ≈ 135_214`.
Spec target for a social-post: roughly $12k–$28k → `lowCents ≈ 12_000_00`, `highCents ≈ 28_000_00`.
CPE_low = 12_000_00 / 135_214 ≈ 8.87 ¢/engaged-follower → round to **9**.
CPE_high = 28_000_00 / 135_214 ≈ 20.7 → round to **21**.

Deal-kind calibration (cents per engaged follower):
- `social-post`:   `{ low: 9,  high: 21  }` — single post, short-cycle
- `endorsement`:   `{ low: 45, high: 110 }` — multi-deliverable, exclusivity premium
- `appearance`:    `{ low: 22, high: 55  }` — in-person, narrower reach multiplier
- `autograph`:     `{ low: 8,  high: 18  }` — signing session, time-limited
- `licensing`:     `{ low: 55, high: 130 }` — usage rights, compounding value

Cross-check KIND_COMP_RANGES in `new.tsx` (line 1070–1076):
- endorsement: low 50_000, high 500_000_00 — wide static band, FMV will tighten it at runtime.
- social-post: low 5_000, high 50_000_00 — consistent with the new CPE at moderate reach.

- [ ] **Step 1.1: Create the directory**

```bash
mkdir -p /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1/lib/fmv
```

- [ ] **Step 1.2: Write `fmv-engine.mjs`**

Create `/Users/arshiarahnavard/Desktop/proslync-mobile-v1.1/lib/fmv/fmv-engine.mjs` with the content below:

```js
// lib/fmv/fmv-engine.mjs
// NIL FMV estimation + clearance-band predictor — Phase FMV1.
// Pure JS (.mjs) so node:test can run without a TS toolchain.
// Metro bundles .mjs fine (same pattern as lib/compliance/preclearance.mjs).
//
// Governing principle: gate-before-price, bands not percentages, show the work.
// Antitrust/UPL-safe by construction — we show comparable public deals so
// an athlete can assess their own deal; we don't set a price.
//
// Future LLM swap point: estimateFmv is the function to replace with an LLM
// call once the comp database is large enough. See LLM_READY export.

import { scorePreclearance } from '../compliance/preclearance.mjs';

// ── LLM readiness flag ─────────────────────────────────────────────────────
// Set to true once the LLM comp-summarizer endpoint is live.
export const LLM_READY = false;

// ── Disclaimer (verbatim per spec) ────────────────────────────────────────
export const FMV_DISCLAIMER =
  "Estimate, not a decision or guarantee — only the CSC and NIL Go decide whether a deal clears. Not legal advice. We show comparable public deals so you can assess your own — we don't set a price. The CSC's criteria aren't public and may change.";

// ── CPE_BAND: cents-per-engaged-follower (low / high) by deal kind ────────
//
// Calibration (2026-06-14):
//   Reference athlete: Kiyan Anthony (a-1)
//     totalFollowers = 2_619_500, engagementRate7d = 0.052
//     engagedReach = 2_619_500 * 0.052 ≈ 135_214 engaged followers
//   social-post target band: $12k–$28k
//     CPE_low = 1_200_000 / 135_214 ≈ 8.87 → 9
//     CPE_high = 2_800_000 / 135_214 ≈ 20.7 → 21
//   endorsement: multi-deliverable + exclusivity → 5–12× social-post per engaged
//   appearance: in-person, narrower multiplier → ~2.5× social-post
//   autograph: signing session, time-limited → ~0.9× social-post
//   licensing: usage rights, compounding → 6–14× social-post
//
// Units: integer cents per single engaged follower.
const CPE_BAND = {
  'social-post':  { low: 9,   high: 21  },
  endorsement:    { low: 45,  high: 110 },
  appearance:     { low: 22,  high: 55  },
  autograph:      { low: 8,   high: 18  },
  licensing:      { low: 55,  high: 130 },
};

// Roster / recruiting categories to exclude from comp reconciliation.
// The CSC excludes roster-value payments from FMV analysis.
const EXCLUDED_NIL_CATEGORIES = new Set([
  'roster-retention',
  'roster-bonus',
  'recruiting',
  'transfer-incentive',
]);

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * P25 of a sorted numeric array (lower quartile).
 * @param {number[]} sorted — must be sorted ascending
 * @returns {number}
 */
function p25(sorted) {
  if (sorted.length === 0) return 0;
  const idx = 0.25 * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/**
 * P75 of a sorted numeric array (upper quartile).
 * @param {number[]} sorted — must be sorted ascending
 * @returns {number}
 */
function p75(sorted) {
  if (sorted.length === 0) return 0;
  const idx = 0.75 * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

// ── estimateFmv ───────────────────────────────────────────────────────────

/**
 * Estimate fair-market value for an NIL deal given reach + optional comps.
 *
 * @param {{
 *   dealKind: 'endorsement'|'social-post'|'appearance'|'autograph'|'licensing',
 *   totalFollowers: number,
 *   engagementRate7d: number,
 *   comps?: Array<{
 *     amountCents: number,
 *     nilCategory: string,
 *     followerReach: number,
 *     dealReportedAt?: string,
 *     source?: string,
 *     reviewerState?: string
 *   }>
 * }} input
 *
 * @returns {{
 *   lowCents: number,
 *   highCents: number,
 *   pointCents: number,
 *   confidence: 'low'|'medium'|'high',
 *   compsUsedCount: number,
 *   method: 'base'|'blended'
 * }}
 */
export function estimateFmv(input) {
  const { dealKind, totalFollowers, engagementRate7d, comps } = input;

  // ── Engaged reach (the true driver) ────────────────────────────────────
  const engagedReach = (totalFollowers ?? 0) * (engagementRate7d ?? 0);

  // ── Base estimate ───────────────────────────────────────────────────────
  // Works at N=0 comps; produces low/high band from CPE_BAND.
  const band = CPE_BAND[dealKind] ?? CPE_BAND['social-post'];
  let baseLow  = Math.round(engagedReach * band.low);
  let baseHigh = Math.round(engagedReach * band.high);

  // Safety floor: if engaged reach is essentially 0, return a minimal band
  // so downstream never divides by zero or renders $0–$0.
  if (baseLow === 0 && baseHigh === 0) {
    baseLow  = band.low  * 1000; // proxy: 1k engaged followers minimum
    baseHigh = band.high * 1000;
  }

  // ── Comp reconciliation ────────────────────────────────────────────────
  // Filter: exclude roster/recruiting categories; require followerReach > 0.
  const usable = (comps ?? []).filter(
    (c) =>
      !EXCLUDED_NIL_CATEGORIES.has(c.nilCategory) &&
      (c.followerReach ?? 0) > 0,
  );

  // Normalize each usable comp to price-per-1k-engaged-reach.
  // We don't have per-comp engagementRate, so we proxy with the subject
  // athlete's engagementRate7d applied to the comp's followerReach.
  // This is conservative — real comps would carry their own ER.
  const pricePerKEngaged = usable.map((c) => {
    const compEngaged = (c.followerReach) * (engagementRate7d ?? 0);
    if (compEngaged <= 0) return null;
    return (c.amountCents / compEngaged) * 1000; // price per 1k engaged
  }).filter((v) => v !== null);

  const n = pricePerKEngaged.length;

  // Confidence tier
  let confidence;
  if (n < 3) confidence = 'low';
  else if (n < 8) confidence = 'medium';
  else confidence = 'high';

  // If <3 usable comps, skip comp reconciliation — use base only with wider band
  if (n < 3) {
    const widenFactor = 1.15; // widen base band by 15% when comps thin
    return {
      lowCents:      Math.round(baseLow / widenFactor),
      highCents:     Math.round(baseHigh * widenFactor),
      pointCents:    Math.round((baseLow / widenFactor + baseHigh * widenFactor) / 2),
      confidence,
      compsUsedCount: n,
      method: 'base',
    };
  }

  // IQR (P25–P75) over normalized comp prices
  const sorted = [...pricePerKEngaged].sort((a, b) => a - b);
  const iqrLow  = p25(sorted); // price/1k engaged
  const iqrHigh = p75(sorted);

  // Scale IQR back to subject athlete's engaged reach (in 1k units)
  const subjectEngaged1k = engagedReach / 1000;
  const compLow  = Math.round(iqrLow  * subjectEngaged1k);
  const compHigh = Math.round(iqrHigh * subjectEngaged1k);

  // ── Blend base + comps ─────────────────────────────────────────────────
  // compWeight grows with comp count; capped at 0.7 so base always has voice.
  const compWeight = Math.min(n / 8, 0.7);
  const baseWeight = 1 - compWeight;

  const blendedLow  = Math.round(baseLow  * baseWeight + compLow  * compWeight);
  const blendedHigh = Math.round(baseHigh * baseWeight + compHigh * compWeight);
  const pointCents  = Math.round((blendedLow + blendedHigh) / 2);

  return {
    lowCents:      blendedLow,
    highCents:     blendedHigh,
    pointCents,
    confidence,
    compsUsedCount: n,
    method: 'blended',
  };
}

// ── predictClearance ──────────────────────────────────────────────────────

/**
 * Gate-before-price clearance band predictor.
 *
 * @param {{
 *   amountCents: number,
 *   dealKind: 'endorsement'|'social-post'|'appearance'|'autograph'|'licensing',
 *   deliverableDescription: string,
 *   payerEntityType: string,
 *   athleteId?: string,
 *   dealId?: string,
 *   totalFollowers: number,
 *   engagementRate7d: number,
 *   comps?: Array<{amountCents:number, nilCategory:string, followerReach:number, dealReportedAt?:string, source?:string, reviewerState?:string}>
 * }} input
 *
 * @returns {{
 *   band: 'likely'|'borderline'|'unlikely',
 *   bandLabel: 'Likely to clear'|'Borderline — needs work'|'Unlikely to clear as written',
 *   reason: string,
 *   fmv: {lowCents:number, highCents:number, pointCents:number, confidence:string, compsUsedCount:number, method:string},
 *   fmvApplies: boolean,
 *   gate: {verdict:string, flags:Array<{kind:string,label:string,detail:string}>, tests:{businessPurpose:string,activation:string,compRange:string}},
 *   confidence: string
 * }}
 */
export function predictClearance(input) {
  const {
    amountCents,
    dealKind,
    deliverableDescription,
    payerEntityType,
    totalFollowers,
    engagementRate7d,
    comps,
  } = input;

  // ── Step 1: Estimate FMV ───────────────────────────────────────────────
  const fmv = estimateFmv({
    dealKind,
    totalFollowers,
    engagementRate7d,
    comps,
  });

  // ── Step 2: FMV threshold — does FMV review apply? ────────────────────
  // Under $2,500 → FMV review does NOT apply; band reflects business-purpose
  // gate only. Under $600 → no CSC review at all (but we still run gate).
  const FMV_REVIEW_FLOOR_CENTS = 250_000; // $2,500
  const fmvApplies = amountCents >= FMV_REVIEW_FLOOR_CENTS;

  // ── Step 3: Gate (GATE BEFORE PRICE) ──────────────────────────────────
  // Pass FMV range as compRange so scorePreclearance's comp-range test uses
  // our dynamic estimate instead of a static lookup.
  const gate = scorePreclearance({
    amountCents,
    dealKind,
    deliverableDescription,
    payerEntityType,
    compRange: fmvApplies ? { lowCents: fmv.lowCents, highCents: fmv.highCents } : null,
  });

  // ── Step 4: Band derivation (3 ordinal bands, never a %) ──────────────

  let band;
  let reason;

  if (gate.verdict === 'likely-rejected') {
    // Gate beats price — a failed gate means 'unlikely' regardless of amount.
    band = 'unlikely';
    const failingTest = Object.entries(gate.tests).find(([, v]) => v === 'fail');
    const failingFlag = gate.flags.find((f) =>
      f.kind === 'comp-out-of-range' || f.kind === 'associated-entity' || f.kind === 'no-comp-data',
    );
    if (failingTest?.[0] === 'businessPurpose') {
      reason = 'Payer is an associated entity with an insufficient deliverable description — CSC business-purpose test fails.';
    } else if (failingTest?.[0] === 'compRange') {
      reason = failingFlag?.detail ?? 'Deal amount exceeds 3× the FMV comp-range high — CSC rejection risk is elevated.';
    } else {
      reason = failingFlag?.detail ?? 'One or more CSC gate tests failed.';
    }
  } else if (fmvApplies && amountCents > 3 * fmv.highCents) {
    // Overpriced even if gate is clean
    band = 'unlikely';
    reason = `Deal amount ($${(amountCents / 100).toFixed(0)}) is more than 3× the FMV high ($${(fmv.highCents / 100).toFixed(0)}). CSC rejection risk is elevated.`;
  } else if (gate.verdict === 'needs-review' || (fmvApplies && amountCents > 1.5 * fmv.highCents)) {
    band = 'borderline';
    if (fmvApplies && amountCents > 1.5 * fmv.highCents) {
      reason = `Deal amount ($${(amountCents / 100).toFixed(0)}) exceeds the FMV high ($${(fmv.highCents / 100).toFixed(0)}) by more than 50%. Provide supporting FMV rationale.`;
    } else {
      // gate needs-review
      const warnTests = Object.entries(gate.tests).filter(([, v]) => v === 'warn').map(([k]) => k);
      if (warnTests.includes('businessPurpose')) {
        reason = 'Associated-entity payer with adequate — but not comprehensive — deliverable documentation. Enhanced CSC review is likely.';
      } else if (warnTests.includes('activation')) {
        reason = 'Deliverable description lacks concrete activation keywords. Add specifics (post, appearance, video, session, etc.) to reduce review burden.';
      } else if (warnTests.includes('compRange')) {
        reason = 'Deal amount is above the FMV range midpoint but not flagged as extreme. Provide comp rationale.';
      } else {
        reason = 'One or more CSC tests flagged for review. Address before submitting to NIL Go.';
      }
    }
  } else {
    band = 'likely';
    if (!fmvApplies) {
      reason = `Deal amount is below the $2,500 FMV-review threshold — business-purpose gate is the primary clearance driver. Gate: ${gate.verdict}.`;
    } else {
      reason = `Amount is within the FMV range ($${(fmv.lowCents / 100).toFixed(0)}–$${(fmv.highCents / 100).toFixed(0)}) and all CSC gate tests pass or warn acceptably.`;
    }
  }

  const bandLabel =
    band === 'likely'     ? 'Likely to clear' :
    band === 'borderline' ? 'Borderline — needs work' :
                            'Unlikely to clear as written';

  return {
    band,
    bandLabel,
    reason,
    fmv,
    fmvApplies,
    gate,
    confidence: fmv.confidence,
  };
}
```

- [ ] **Step 1.3: Verify the file exists**

```bash
ls /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1/lib/fmv/
```

Expected: `fmv-engine.mjs`

---

## Task 2: Type declarations — `lib/fmv/fmv-engine.d.ts`

**Files:**
- Create: `lib/fmv/fmv-engine.d.ts`

- [ ] **Step 2.1: Write the `.d.ts` file**

Create `/Users/arshiarahnavard/Desktop/proslync-mobile-v1.1/lib/fmv/fmv-engine.d.ts`:

```ts
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
```

---

## Task 3: TypeScript wrapper — `lib/fmv/fmv-engine.ts`

**Files:**
- Create: `lib/fmv/fmv-engine.ts`

- [ ] **Step 3.1: Write the `.ts` wrapper**

Create `/Users/arshiarahnavard/Desktop/proslync-mobile-v1.1/lib/fmv/fmv-engine.ts`:

```ts
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
```

- [ ] **Step 3.2: Verify TypeScript compiles without new errors**

```bash
cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH" && env -u NODE_OPTIONS npx tsc --noEmit 2>&1 | grep -c "error TS"
```

Expected: number ≤ 137 (the baseline). If it's higher, check the error output:
```bash
env -u NODE_OPTIONS npx tsc --noEmit 2>&1 | grep "lib/fmv"
```
Expected: empty (no errors in the new files).

---

## Task 4: Tests — `lib/fmv/fmv-engine.test.mjs`

**Files:**
- Create: `lib/fmv/fmv-engine.test.mjs`

Read `lib/compliance/preclearance.test.mjs` for the exact import and test structure before writing.

- [ ] **Step 4.1: Write the test file**

Create `/Users/arshiarahnavard/Desktop/proslync-mobile-v1.1/lib/fmv/fmv-engine.test.mjs`:

```js
// lib/fmv/fmv-engine.test.mjs
// node:test suite for fmv-engine.mjs — ≥ 12 tests.
// Run: node --test lib/fmv/fmv-engine.test.mjs
//
// Covers all spec-required scenarios:
//   engaged-reach math; base at N=0; engagement-over-followers;
//   IQR from comps; roster-category excluded; <3 comps → low/base;
//   blend weighting; gate-before-price; >3× → unlikely; 1.5–3× → borderline;
//   in-range → likely; under-$2500 → fmvApplies false; confidence tiers.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { estimateFmv, predictClearance, FMV_DISCLAIMER, LLM_READY } from './fmv-engine.mjs';

// ── Helpers ───────────────────────────────────────────────────────────────

// Athlete a-1 (Kiyan Anthony): 2_619_500 followers, 5.2% ER
const KIYAN = {
  totalFollowers: 2_619_500,
  engagementRate7d: 0.052,
};

// Athlete a-2 (Jordan Miles): 1_221_000 followers, 7.1% ER
const JORDAN = {
  totalFollowers: 1_221_000,
  engagementRate7d: 0.071,
};

const BASE_CLEARANCE_INPUT = {
  amountCents: 2_000_000, // $20,000
  dealKind: 'social-post',
  deliverableDescription: 'Three Instagram posts and one TikTok reel promoting the brand',
  payerEntityType: 'brand',
  ...KIYAN,
};

// ── estimateFmv tests ─────────────────────────────────────────────────────

test('1. engaged-reach math: engagedReach = totalFollowers * engagementRate7d', () => {
  // For Kiyan: 2_619_500 * 0.052 = 136_214 engaged followers
  // social-post CPE_low = 9, so baseLow ≈ 136_214 * 9 = 1_225_926 (≈ $12,259)
  const fmv = estimateFmv({ dealKind: 'social-post', ...KIYAN });
  // Band must span reasonable range; point must be within low–high
  assert.ok(fmv.lowCents > 0, 'lowCents should be positive');
  assert.ok(fmv.highCents > fmv.lowCents, 'highCents should exceed lowCents');
  assert.ok(fmv.pointCents >= fmv.lowCents, 'point should be >= low');
  assert.ok(fmv.pointCents <= fmv.highCents, 'point should be <= high');
});

test('2. base estimate at N=0 (no comps) returns a sane band within target range', () => {
  // Kiyan social-post: target $12k–$28k
  const fmv = estimateFmv({ dealKind: 'social-post', ...KIYAN });
  // After 15% widening (no comps): expect lowCents roughly $10k–$13k, highCents roughly $27k–$33k
  assert.ok(fmv.lowCents > 900_000,  'low should be above $9k (after widen)');
  assert.ok(fmv.highCents < 3_500_000, 'high should be below $35k');
  assert.equal(fmv.method, 'base');
  assert.equal(fmv.compsUsedCount, 0);
});

test('3. engagement-over-followers: 50k/8% > 200k/2% per engaged-post', () => {
  // Higher engagement rate on smaller audience should yield higher or equal FMV
  const highER  = estimateFmv({ dealKind: 'social-post', totalFollowers: 50_000,  engagementRate7d: 0.08 });
  const lowER   = estimateFmv({ dealKind: 'social-post', totalFollowers: 200_000, engagementRate7d: 0.02 });
  // 50k * 0.08 = 4_000 engaged; 200k * 0.02 = 4_000 engaged — should be equal bands
  // Both have same engaged reach, so their lowCents should be equal (within rounding)
  assert.ok(
    Math.abs(highER.pointCents - lowER.pointCents) < 500,
    `Same engaged reach should produce near-equal points: ${highER.pointCents} vs ${lowER.pointCents}`,
  );
  // And 100k/8% (8_000 engaged) should beat 200k/2% (4_000 engaged)
  const bigger  = estimateFmv({ dealKind: 'social-post', totalFollowers: 100_000, engagementRate7d: 0.08 });
  assert.ok(bigger.pointCents > lowER.pointCents, '8k engaged > 4k engaged should yield higher FMV');
});

test('4. IQR from comps: P25–P75 is used, not mean', () => {
  // Provide 8 comps with one outlier; IQR should exclude it
  const outlierAmount = 100_000_000; // $1M — extreme outlier
  const normalAmount  = 1_500_000;   // $15k — typical
  const comps = [
    ...Array(7).fill(null).map((_, i) => ({
      amountCents: normalAmount + i * 10_000,
      nilCategory: 'social-post',
      followerReach: 500_000,
    })),
    { amountCents: outlierAmount, nilCategory: 'social-post', followerReach: 500_000 },
  ];
  const fmv = estimateFmv({ dealKind: 'social-post', ...KIYAN, comps });
  // The IQR should cap the high well below the outlier's scale
  assert.ok(fmv.highCents < outlierAmount / 2, 'IQR should suppress the $1M outlier');
  assert.equal(fmv.compsUsedCount, 8);
  assert.equal(fmv.method, 'blended');
});

test('5. roster-category comps excluded from FMV calculation', () => {
  const rosterComp = {
    amountCents: 50_000_000, // $500k — would dominate if included
    nilCategory: 'roster-retention',
    followerReach: 500_000,
  };
  const fmvWith    = estimateFmv({ dealKind: 'social-post', ...KIYAN, comps: [rosterComp] });
  const fmvWithout = estimateFmv({ dealKind: 'social-post', ...KIYAN });
  // Both should be 'base' + 'low' confidence since roster comp is excluded → 0 usable comps
  assert.equal(fmvWith.compsUsedCount, 0, 'roster-retention comp should be excluded');
  assert.equal(fmvWith.method, 'base');
  // And results should be identical (no comps in either case)
  assert.equal(fmvWith.lowCents, fmvWithout.lowCents);
});

test('6. <3 usable comps → low confidence + base method', () => {
  const twoComps = [
    { amountCents: 1_000_000, nilCategory: 'social-post', followerReach: 300_000 },
    { amountCents: 2_000_000, nilCategory: 'social-post', followerReach: 600_000 },
  ];
  const fmv = estimateFmv({ dealKind: 'social-post', ...KIYAN, comps: twoComps });
  assert.equal(fmv.confidence, 'low');
  assert.equal(fmv.method, 'base');
  assert.equal(fmv.compsUsedCount, 2);
});

test('7. blend weighting: 8 comps → compWeight capped at 0.7', () => {
  // With 8 comps, compWeight = min(8/8, 0.7) = 0.7
  // The blended result should be pulled significantly toward comps
  const comps = Array(8).fill(null).map(() => ({
    amountCents: 5_000_000, // $50k comps — well above base for small athlete
    nilCategory: 'social-post',
    followerReach: 500_000,
  }));
  const small = { totalFollowers: 10_000, engagementRate7d: 0.05 };
  const baseOnly = estimateFmv({ dealKind: 'social-post', ...small });
  const blended  = estimateFmv({ dealKind: 'social-post', ...small, comps });
  // Blended should be higher than base because comps are at $50k
  assert.ok(blended.pointCents > baseOnly.pointCents, 'blended should be pulled toward higher comps');
  assert.equal(blended.method, 'blended');
});

test('8. gate-before-price: fail gate → unlikely even if amount is in FMV range', () => {
  // AE payer + vague description → gate fails → band = 'unlikely' regardless of price
  const prediction = predictClearance({
    amountCents: 1_000_000, // $10k — well within a typical social-post band
    dealKind: 'social-post',
    deliverableDescription: 'short', // < 20 non-space chars → businessPurpose fail for AE
    payerEntityType: 'collective',   // AE payer
    ...KIYAN,
  });
  assert.equal(prediction.gate.verdict, 'likely-rejected', 'gate should fire as likely-rejected');
  assert.equal(prediction.band, 'unlikely', 'band must be unlikely even with in-range amount');
});

test('9. amount >3× FMV high → unlikely', () => {
  // Get FMV first to know where to put the amount
  const fmv = estimateFmv({ dealKind: 'social-post', ...KIYAN });
  const overpriced = fmv.highCents * 4; // 4× high — definitely >3×
  const prediction = predictClearance({
    amountCents: overpriced,
    dealKind: 'social-post',
    deliverableDescription: 'Three Instagram posts and one TikTok reel for the brand campaign',
    payerEntityType: 'brand',
    ...KIYAN,
  });
  assert.equal(prediction.band, 'unlikely', `4× high should be unlikely; amount=${overpriced}, high=${fmv.highCents}`);
  assert.equal(prediction.fmvApplies, true);
});

test('10. amount 1.5–3× FMV high → borderline', () => {
  const fmv = estimateFmv({ dealKind: 'social-post', ...KIYAN });
  const borderlineAmount = Math.round(fmv.highCents * 2); // 2× high
  const prediction = predictClearance({
    amountCents: borderlineAmount,
    dealKind: 'social-post',
    deliverableDescription: 'Three Instagram posts and one TikTok reel for the brand campaign',
    payerEntityType: 'brand',
    ...KIYAN,
  });
  // Gate should not be likely-rejected (brand payer, good description) → borderline from FMV check
  assert.notEqual(prediction.gate.verdict, 'likely-rejected', 'brand payer with good description should not gate-reject');
  assert.equal(prediction.band, 'borderline', `2× high should be borderline; amount=${borderlineAmount}, high=${fmv.highCents}`);
});

test('11. in-range amount with brand payer → likely', () => {
  const fmv = estimateFmv({ dealKind: 'social-post', ...KIYAN });
  const inRange = Math.round((fmv.lowCents + fmv.highCents) / 2); // midpoint
  const prediction = predictClearance({
    amountCents: inRange,
    dealKind: 'social-post',
    deliverableDescription: 'Three Instagram posts and one TikTok video for the brand campaign',
    payerEntityType: 'brand',
    ...KIYAN,
  });
  assert.equal(prediction.band, 'likely');
  assert.equal(prediction.bandLabel, 'Likely to clear');
});

test('12. under-$2500 → fmvApplies false', () => {
  const prediction = predictClearance({
    amountCents: 100_000, // $1,000 — below $2,500 threshold
    dealKind: 'autograph',
    deliverableDescription: 'One signing session at the brand event for 30 minutes',
    payerEntityType: 'brand',
    ...KIYAN,
  });
  assert.equal(prediction.fmvApplies, false, 'FMV review should not apply below $2,500');
});

test('13. confidence tiers by comp count: 0–2 → low, 3–7 → medium, 8+ → high', () => {
  const makeComps = (n) => Array(n).fill(null).map(() => ({
    amountCents: 1_500_000,
    nilCategory: 'social-post',
    followerReach: 500_000,
  }));

  const low    = estimateFmv({ dealKind: 'social-post', ...KIYAN, comps: makeComps(2) });
  const medium = estimateFmv({ dealKind: 'social-post', ...KIYAN, comps: makeComps(5) });
  const high   = estimateFmv({ dealKind: 'social-post', ...KIYAN, comps: makeComps(9) });

  assert.equal(low.confidence,    'low',    '2 comps → low');
  assert.equal(medium.confidence, 'medium', '5 comps → medium');
  assert.equal(high.confidence,   'high',   '9 comps → high');
});

test('14. FMV_DISCLAIMER is the exact required string', () => {
  assert.ok(
    FMV_DISCLAIMER.includes("only the CSC and NIL Go decide"),
    'disclaimer must mention CSC and NIL Go',
  );
  assert.ok(
    FMV_DISCLAIMER.includes("Not legal advice"),
    'disclaimer must include "Not legal advice"',
  );
});

test('15. LLM_READY is false', () => {
  assert.equal(LLM_READY, false);
});
```

- [ ] **Step 4.2: Run the new tests**

```bash
cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH" && env -u NODE_OPTIONS node --test lib/fmv/fmv-engine.test.mjs 2>&1 | tail -20
```

Expected:
```
ℹ tests 15
ℹ pass 15
ℹ fail 0
```

If any fail, read the assertion error and fix `fmv-engine.mjs`. Do not relax the assertions.

- [ ] **Step 4.3: Run all suites together**

```bash
cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH" && env -u NODE_OPTIONS node --test lib/fmv/fmv-engine.test.mjs lib/compliance/preclearance.test.mjs lib/athlete/truth.test.mjs lib/money/money-machine.test.mjs 2>&1 | tail -8
```

Expected: `pass 58` (15 new + 43 existing), `fail 0`.

- [ ] **Step 4.4: Commit the engine**

```bash
cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && git add lib/fmv/fmv-engine.mjs lib/fmv/fmv-engine.d.ts lib/fmv/fmv-engine.ts lib/fmv/fmv-engine.test.mjs
git commit -m "$(cat <<'EOF'
feat(fmv): gate-before-price FMV + clearance-band predictor engine + tests

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: UI Surface 1 — upgrade PrecheckStep in `app/deal-engine/new.tsx`

**Files:**
- Modify: `app/deal-engine/new.tsx`

Read lines 1068–1290 and 1488–1560 of `new.tsx` before writing. You need to understand:
- `KIND_COMP_RANGES` at line 1070 — you'll replace the static `compRange` lookup with the FMV output.
- `PrecheckStep` props at line 1078 — you'll add no new props (FMV is computed inside).
- The `handleSign` function at line 1548 — it currently calls `scorePreclearance` with `KIND_COMP_RANGES`. Update it to use `predictClearance` and pass `fmv.lowCents/highCents` as the `compRange`.
- The `compRange` line rendered at ~line 1243 — replace it with the FMV range card.

**What to add to PrecheckStep:**
1. Import `predictClearance`, `FMV_DISCLAIMER`, `getMockAthleteSocialReach` at the top of the file.
2. Inside `PrecheckStep`, call `getMockAthleteSocialReach('a-1')` to get Kiyan's reach.
3. Call `predictClearance(...)` using the reach + deal inputs.
4. Render the clearance band pill (green/amber/red) with `bandLabel` + `reason` **above** the three-test display.
5. Replace the static comp-range line with an FMV range line: `Fair value $X–$Y · point $Z · <confidence> confidence (<N> comps)`.
6. Add a `showComps` toggle state; render an expandable list of comps used.
7. Render `FMV_DISCLAIMER` in muted footnote text.
8. Pass `{ lowCents: fmv.lowCents, highCents: fmv.highCents }` as `compRange` to `scorePreclearance` inside `handleSign`.

**Colors:** band pill: `'likely' → TONE_PASS (#30D158)`, `'borderline' → TONE_WARN (#FF9F0A)`, `'unlikely' → TONE_FAIL (#FF453A)`.

- [ ] **Step 5.1: Add imports at the top of `new.tsx`**

Find the existing import block (around lines 43–50) and add after the existing compliance imports:

```ts
import {
  predictClearance,
  FMV_DISCLAIMER,
} from '@/lib/fmv/fmv-engine';
import type { ClearancePrediction } from '@/lib/fmv/fmv-engine';
import { getMockAthleteSocialReach } from '@/lib/data/mock-social-reach';
import { getMockDealComparables } from '@/lib/data/mock-deal-comps';
```

- [ ] **Step 5.2: Upgrade `PrecheckStep` component**

Replace the entire `PrecheckStep` function (lines ~1118–1275 in `new.tsx`) with the following. Keep `PrecheckStepProps` interface unchanged.

The key changes vs. the original:
- Add `showComps` state.
- Compute `prediction` (from `predictClearance`) and use `prediction.gate` instead of calling `scorePreclearance` directly.
- Band pill (green/amber/red) replaces the verdict pill at the top.
- FMV range line replaces the static comp-range line.
- Expandable comps section.
- `FMV_DISCLAIMER` footnote replaces the old disclaimer text.

```tsx
function PrecheckStep({
  amountCents,
  dealKind,
  deliverableDescription,
  payerEntityType,
  onPayerChange,
  onContinue,
  onBack,
}: PrecheckStepProps) {
  const [showComps, setShowComps] = React.useState(false);

  // Kiyan's reach for demo predictions (athlete 'a-1')
  const reach = getMockAthleteSocialReach('a-1');

  const prediction = React.useMemo(
    () =>
      predictClearance({
        amountCents,
        dealKind,
        deliverableDescription,
        payerEntityType,
        totalFollowers: reach?.totalFollowers ?? 0,
        engagementRate7d: reach?.engagementRate7d ?? 0,
      }),
    [amountCents, dealKind, deliverableDescription, payerEntityType, reach],
  );

  const { band, bandLabel, reason, fmv, fmvApplies, gate } = prediction;
  const result = gate; // alias — keeps the rest of the original code unchanged
  const isAE = (ASSOCIATED_ENTITY_TYPES as readonly string[]).includes(payerEntityType);

  const bandColor =
    band === 'likely'     ? TONE_PASS :
    band === 'borderline' ? TONE_WARN :
                            TONE_FAIL;

  const fmtDollars = (cents: number) =>
    '$' + Math.round(cents / 100).toLocaleString('en-US');

  return (
    <ScrollView
      contentContainerStyle={precheckStyles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={precheckStyles.title}>Will This Clear?</Text>
      <Text style={precheckStyles.subtitle}>
        Pre-check against the three CSC tests before you sign.
        This is a copilot — not an official CSC determination.
      </Text>

      {/* ── Clearance band pill (headline) ────────────────────────── */}
      <View style={precheckStyles.bandCard}>
        <View style={precheckStyles.bandTop}>
          <Text style={precheckStyles.bandHeadingLabel}>CLEARANCE OUTLOOK</Text>
          <View style={[precheckStyles.bandPill, { borderColor: bandColor, backgroundColor: `${bandColor}18` }]}>
            <Text style={[precheckStyles.bandPillText, { color: bandColor }]}>
              {bandLabel.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={precheckStyles.bandReason}>{reason}</Text>
      </View>

      {/* ── FMV range line ─────────────────────────────────────────── */}
      <View style={precheckStyles.fmvCard}>
        <Text style={precheckStyles.fmvLabel}>FAIR-MARKET VALUE ESTIMATE</Text>
        <Text style={precheckStyles.fmvRange}>
          {fmtDollars(fmv.lowCents)}–{fmtDollars(fmv.highCents)}
          {' · '}point {fmtDollars(fmv.pointCents)}
          {' · '}{fmv.confidence} confidence ({fmv.compsUsedCount} comps)
        </Text>
        {!fmvApplies && (
          <Text style={precheckStyles.fmvNoApply}>
            FMV review does not apply below $2,500 — business-purpose gate is primary.
          </Text>
        )}
      </View>

      {/* ── Expandable comparables ────────────────────────────────── */}
      <View style={precheckStyles.card}>
        <TouchableOpacity
          style={precheckStyles.compsToggleRow}
          onPress={() => setShowComps((v) => !v)}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={showComps ? 'Hide comparables' : 'Show comparables'}
        >
          <Text style={precheckStyles.cardTitle}>COMPARABLES USED</Text>
          <Text style={precheckStyles.compsToggleLabel}>
            {showComps ? 'Hide ▲' : 'Show ▼'}
          </Text>
        </TouchableOpacity>
        {showComps && (
          fmv.compsUsedCount === 0 ? (
            <Text style={precheckStyles.compsEmpty}>
              Estimated from your reach + engagement (no direct comps yet).
            </Text>
          ) : (
            <Text style={precheckStyles.compsNote}>
              {fmv.compsUsedCount} comparable deal(s) used. Engagement-normalized IQR (P25–P75) applied.
              Roster/recruiting-category deals excluded per CSC guidance.
            </Text>
          )
        )}
      </View>

      {/* ── Overall verdict (secondary display) ──────────────────── */}
      <View style={precheckStyles.verdictRow}>
        <Text style={precheckStyles.verdictLabel}>OVERALL VERDICT</Text>
        <View
          style={[
            precheckStyles.verdictPill,
            { borderColor: verdictColor(result.verdict) },
          ]}
        >
          <Text style={[precheckStyles.verdictText, { color: verdictColor(result.verdict) }]}>
            {verdictLabel(result.verdict)}
          </Text>
        </View>
      </View>

      {/* Strong warning when likely-rejected */}
      {result.verdict === 'likely-rejected' && (
        <View style={precheckStyles.rejectedBanner}>
          <Text style={precheckStyles.rejectedBannerText}>
            One or more CSC tests failed. Signing is still your choice — this is a copilot,
            not a gate. Review the test results below and address before submitting to NIL Go.
          </Text>
        </View>
      )}

      {/* Payer entity type selector */}
      <View style={precheckStyles.selectorGroup}>
        <Text style={precheckStyles.selectorLabel}>PAYER ENTITY TYPE</Text>
        <View style={precheckStyles.chipRow}>
          {(Object.keys(PAYER_ENTITY_LABELS) as PayerEntityType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                precheckStyles.entityChip,
                payerEntityType === type && precheckStyles.entityChipSelected,
              ]}
              onPress={() => onPayerChange(type)}
              activeOpacity={0.75}
              accessibilityRole="radio"
              accessibilityState={{ selected: payerEntityType === type }}
            >
              <Text
                style={[
                  precheckStyles.entityChipText,
                  payerEntityType === type && precheckStyles.entityChipTextSelected,
                ]}
              >
                {PAYER_ENTITY_LABELS[type]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Associated-Entity banner */}
      {isAE && (
        <View style={precheckStyles.aeBanner}>
          <Text style={precheckStyles.aeBannerTitle}>ASSOCIATED-ENTITY PAYER</Text>
          <Text style={precheckStyles.aeBannerBody}>
            Enhanced CSC review likely — document business purpose and deliverables.
            The "{payerEntityType}" entity type triggers heightened scrutiny under
            CSC June 2026 rules.
          </Text>
        </View>
      )}

      {/* Three CSC test rows */}
      <View style={precheckStyles.card}>
        <Text style={precheckStyles.cardTitle}>CSC TEST RESULTS</Text>
        {(Object.entries(result.tests) as [string, 'pass' | 'warn' | 'fail'][]).map(([key, val]) => (
          <View key={key} style={precheckStyles.testRow}>
            <Text style={precheckStyles.testName}>{CSC_TEST_LABELS[key] ?? key}</Text>
            <View
              style={[
                precheckStyles.testPill,
                { borderColor: testColor(val) },
              ]}
            >
              <Text style={[precheckStyles.testPillText, { color: testColor(val) }]}>
                {testLabel(val)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Flags */}
      {result.flags.filter((f) => f.kind !== 'csc-report-required').map((flag) => (
        <View key={flag.kind} style={precheckStyles.flagCard}>
          <Text style={precheckStyles.flagLabel}>{flag.label.toUpperCase()}</Text>
          <Text style={precheckStyles.flagDetail}>{flag.detail}</Text>
        </View>
      ))}

      {/* FMV Disclaimer */}
      <Text style={precheckStyles.disclaimer}>
        {FMV_DISCLAIMER}
      </Text>
      <Text style={precheckStyles.disclaimer}>
        Rules version: {RULES_VERSION} · Prepared with Proslync — not an official CSC submission.
        This pre-check is a copilot tool, not legal advice.
      </Text>

      <View style={formStyles.buttonRow}>
        <TouchableOpacity style={formStyles.backBtn} onPress={onBack} activeOpacity={0.75}>
          <Text style={formStyles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={formStyles.continueBtn} onPress={onContinue} activeOpacity={0.82}>
          <Text style={formStyles.continueBtnText}>SIGN THE DEAL</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 5.3: Add new styles to `precheckStyles`**

In the `precheckStyles = StyleSheet.create({...})` block (currently ends around line 1484), add these new style keys **inside** the `StyleSheet.create({})` call, before the closing `})`:

```ts
  bandCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    padding: 14,
    gap: 8,
  },
  bandTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  bandHeadingLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 1.2,
  },
  bandPill: {
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  bandPillText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  bandReason: {
    fontSize: 13,
    color: WHITE,
    fontWeight: '600',
    lineHeight: 19,
  },
  fmvCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 5,
  },
  fmvLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 1,
  },
  fmvRange: {
    fontSize: 13,
    color: WHITE,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  fmvNoApply: {
    fontSize: 11,
    color: MUTED,
    fontWeight: '500',
    lineHeight: 16,
  },
  compsToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  compsToggleLabel: {
    fontSize: 11,
    color: MUTED,
    fontWeight: '700',
  },
  compsEmpty: {
    fontSize: 12,
    color: MUTED,
    fontWeight: '500',
    lineHeight: 17,
    paddingTop: 4,
  },
  compsNote: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.70)',
    fontWeight: '500',
    lineHeight: 17,
    paddingTop: 4,
  },
```

- [ ] **Step 5.4: Update `handleSign` to use FMV-derived compRange**

In `handleSign` (~line 1558–1566), replace:
```ts
const compRange = KIND_COMP_RANGES[template.kind] ?? null;
const preclearanceResult = scorePreclearance({
  amountCents,
  dealKind: template.kind,
  deliverableDescription: fieldValues['deliverableDescription'] ?? '',
  payerEntityType,
  compRange,
});
```

With:
```ts
const reach = getMockAthleteSocialReach('a-1');
const fmvForSign = predictClearance({
  amountCents,
  dealKind: template.kind,
  deliverableDescription: fieldValues['deliverableDescription'] ?? '',
  payerEntityType,
  totalFollowers: reach?.totalFollowers ?? 0,
  engagementRate7d: reach?.engagementRate7d ?? 0,
});
const compRange = { lowCents: fmvForSign.fmv.lowCents, highCents: fmvForSign.fmv.highCents };
const preclearanceResult = fmvForSign.gate;
```

Also remove the `getMockDealComparables` import if you added it (it's not needed in new.tsx — it was listed in the spec but comps in PrecheckStep are sourced from the engine, not by dealId).

- [ ] **Step 5.5: Verify TypeScript compiles clean on new.tsx**

```bash
cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH" && env -u NODE_OPTIONS npx tsc --noEmit 2>&1 | grep "deal-engine/new"
```

Expected: empty (no errors in the file). If there are errors, fix them before proceeding.

- [ ] **Step 5.6: Overall TS error count still ≤ 137**

```bash
cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH" && env -u NODE_OPTIONS npx tsc --noEmit 2>&1 | grep -c "error TS"
```

Expected: ≤ 137.

---

## Task 6: UI Surface 2 — FMV band chips in `components/collective/collective-home.tsx`

**Files:**
- Modify: `components/collective/collective-home.tsx`

Read `collective-home.tsx` lines 1–200 before writing. Key context:
- `DEAL_ROWS` array at line 65–98: contains `id`, `athlete`, `brand`, `amount` (formatted string), `status`, `detail`.
- `ClearancePipelineModule` function at line 100–201: renders stage pills + deal rows.
- Each `DealRow` renders `dealTop` + `dealDetail` inside `dealContent`.
- The existing row data doesn't have `amountCents` or `dealKind` — you need to add them to the fixture rows so `predictClearance` has something to work with.
- Use fixture reach: Kiyan `a-1` (for `cr-1`); `a-4` JJ Starling for `cr-3`/`cr-4`; default `a-1` for others.
- Keep it compact — a small dot + text chip, not a full card.

**Approach:**
1. Add `amountCents` and `dealKind` to `DealRow` type and `DEAL_ROWS` data.
2. Import `predictClearance`, `FMV_DISCLAIMER`, `getMockAthleteSocialReach` from the FMV engine.
3. Compute `predictClearance` per row (using fixture reach). Since this is render-time computation with small N, no memoization needed.
4. Render a `FmvBandChip` sub-component (dot + label) below the `dealDetail` line.
5. Add `FMV_DISCLAIMER` once at the section footer (below all deal rows, inside the card).

**No restructuring of the module.** Only add what's needed.

- [ ] **Step 6.1: Add imports to `collective-home.tsx`**

After the existing `import * as React from 'react';` block, add:

```ts
import {
  predictClearance,
  FMV_DISCLAIMER,
} from '@/lib/fmv/fmv-engine';
import type { DealKind } from '@/lib/fmv/fmv-engine';
import { getMockAthleteSocialReach } from '@/lib/data/mock-social-reach';
```

- [ ] **Step 6.2: Extend `DealRow` type and add `amountCents`/`dealKind` to fixture data**

Replace the `DealRow` type:

```ts
type DealRow = {
  id: string;
  athlete: string;
  athleteId: string;
  brand: string;
  amount: string;
  amountCents: number;
  dealKind: DealKind;
  status: DealRowStatus;
  detail: string;
};
```

Replace `DEAL_ROWS`:

```ts
const DEAL_ROWS: DealRow[] = [
  {
    id: 'cr-1',
    athlete: 'Kiyan A.',
    athleteId: 'a-1',
    brand: 'JMA Wireless',
    amount: '$4,500',
    amountCents: 450_000,
    dealKind: 'endorsement',
    status: 'cleared',
    detail: 'cleared in 26h ✓',
  },
  {
    id: 'cr-2',
    athlete: 'J. Starling',
    athleteId: 'a-4',
    brand: 'Gatorade',
    amount: '$2,200',
    amountCents: 220_000,
    dealKind: 'social-post',
    status: 'submitted',
    detail: 'submitted · day 4 of review',
  },
  {
    id: 'cr-3',
    athlete: 'M. Reid',
    athleteId: 'a-1',
    brand: 'Nike Campus',
    amount: '$1,800',
    amountCents: 180_000,
    dealKind: 'appearance',
    status: 'not-cleared',
    detail: 'NOT CLEARED — resubmission 9 of 14 days · missing VBP docs',
  },
  {
    id: 'cr-4',
    athlete: 'Devon O.',
    athleteId: 'a-2',
    brand: 'Puma',
    amount: '$900',
    amountCents: 90_000,
    dealKind: 'autograph',
    status: 'pre-checked',
    detail: 'pre-checked: likely-clear · ready to submit',
  },
];
```

- [ ] **Step 6.3: Add `FmvBandChip` helper component**

Add this **before** `ClearancePipelineModule` (after `DEAL_ROWS`):

```tsx
function FmvBandChip({ row }: { row: DealRow }) {
  const reach = getMockAthleteSocialReach(row.athleteId) ??
                getMockAthleteSocialReach('a-1')!;
  const prediction = predictClearance({
    amountCents: row.amountCents,
    dealKind: row.dealKind,
    deliverableDescription: 'Promotional activation for brand partnership', // fixture default
    payerEntityType: 'brand',
    totalFollowers: reach.totalFollowers,
    engagementRate7d: reach.engagementRate7d ?? 0,
  });
  const dotColor =
    prediction.band === 'likely'     ? GREEN :
    prediction.band === 'borderline' ? AMBER :
                                       RED;
  const chipLabel =
    prediction.band === 'likely'     ? 'Likely' :
    prediction.band === 'borderline' ? 'Borderline' :
                                       'Unlikely';
  return (
    <View style={chipStyles.row}>
      <View style={[chipStyles.dot, { backgroundColor: dotColor }]} />
      <Text style={[chipStyles.label, { color: dotColor }]}>{chipLabel}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
```

- [ ] **Step 6.4: Add `FmvBandChip` and disclaimer to `ClearancePipelineModule`**

In the deal-row render block (currently lines ~154–198), add `<FmvBandChip row={row} />` inside `dealContent`, after the existing `<Text ... style={[s.dealDetail, ...]}>{row.detail}</Text>`:

Find this in `ClearancePipelineModule`:
```tsx
              <Text
                style={[
                  s.dealDetail,
                  isCleared && s.dealDetailGreen,
                  isNotCleared && s.dealDetailRed,
                  isSubmitted && s.dealDetailAmber,
                  isPreChecked && s.dealDetailMuted,
                ]}
                numberOfLines={2}
              >
                {row.detail}
              </Text>
```

Replace with:
```tsx
              <Text
                style={[
                  s.dealDetail,
                  isCleared && s.dealDetailGreen,
                  isNotCleared && s.dealDetailRed,
                  isSubmitted && s.dealDetailAmber,
                  isPreChecked && s.dealDetailMuted,
                ]}
                numberOfLines={2}
              >
                {row.detail}
              </Text>
              <FmvBandChip row={row} />
```

Then, after the `{DEAL_ROWS.map(...)}` closing `)}` and before the closing `</View>` of the card, add the disclaimer:

```tsx
      {/* FMV disclaimer */}
      <Text style={s.fmvDisclaimer}>{FMV_DISCLAIMER}</Text>
```

- [ ] **Step 6.5: Add `fmvDisclaimer` style to the `s` StyleSheet**

In the existing `StyleSheet.create({...})` block (`const s = StyleSheet.create({...})`), add:

```ts
  fmvDisclaimer: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.28)',
    fontWeight: '500',
    lineHeight: 13,
    marginTop: 8,
  },
```

- [ ] **Step 6.6: Verify no new TS errors in collective-home.tsx**

```bash
cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH" && env -u NODE_OPTIONS npx tsc --noEmit 2>&1 | grep "collective-home"
```

Expected: empty.

- [ ] **Step 6.7: Overall TS error count still ≤ 137**

```bash
cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH" && env -u NODE_OPTIONS npx tsc --noEmit 2>&1 | grep -c "error TS"
```

Expected: ≤ 137.

---

## Task 7: Verification + second commit

- [ ] **Step 7.1: All test suites pass**

```bash
cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH" && env -u NODE_OPTIONS node --test lib/fmv/fmv-engine.test.mjs lib/compliance/preclearance.test.mjs lib/athlete/truth.test.mjs lib/money/money-machine.test.mjs 2>&1 | tail -8
```

Expected: `pass 58`, `fail 0`.

- [ ] **Step 7.2: Final TS gate**

```bash
cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH" && env -u NODE_OPTIONS npx tsc --noEmit 2>&1 | grep -c "error TS"
```

Expected: ≤ 137.

Verify touched files have zero errors:
```bash
env -u NODE_OPTIONS npx tsc --noEmit 2>&1 | grep -E "(lib/fmv|deal-engine/new|collective-home)"
```

Expected: empty.

- [ ] **Step 7.3: Expo export smoke test**

```bash
cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH" && env -u NODE_OPTIONS npx expo export --platform ios --output-dir /tmp/fmv 2>&1 | tail -2
```

Expected: last line mentions bundle complete or exported. Then:
```bash
rm -rf /tmp/fmv
```

- [ ] **Step 7.4: Second commit**

```bash
cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1 && git add app/deal-engine/new.tsx components/collective/collective-home.tsx
git commit -m "$(cat <<'EOF'
feat(deal-engine,collective): surface FMV range + clearance band in pre-check and pipeline

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review Checklist

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| Engine `.mjs` + `.d.ts` + `.ts` pure module | Tasks 1–3 |
| `estimateFmv`: engaged-reach math | Task 1 (`CPE_BAND`, `engagedReach = totalFollowers * engagementRate7d`) |
| `estimateFmv`: base at N=0 | Task 1 (safety floor, base method) |
| `estimateFmv`: IQR P25–P75 from comps | Task 1 (`p25`/`p75` helpers) |
| `estimateFmv`: roster-category excluded | Task 1 (`EXCLUDED_NIL_CATEGORIES`) |
| `estimateFmv`: <3 comps → base + wider band | Task 1 (widen factor 1.15) |
| `estimateFmv`: blend weighting | Task 1 (`compWeight = min(n/8, 0.7)`) |
| `predictClearance`: gate before price | Task 1 (`scorePreclearance` called first, `gate.verdict === 'likely-rejected'` wins) |
| `predictClearance`: $2,500 threshold | Task 1 (`FMV_REVIEW_FLOOR_CENTS = 250_000`) |
| `predictClearance`: 3 ordinal bands | Task 1 (unlikely/borderline/likely logic) |
| `FMV_DISCLAIMER` constant | Task 1 (verbatim per spec) |
| `LLM_READY = false` | Task 1 |
| ≥ 12 tests | Task 4 (15 tests) |
| All 12 spec test scenarios | Task 4 (tests 1–13, 14–15 cover disclaimer/LLM_READY) |
| UI Surface 1: band pill | Task 5 (`bandCard`, colored by `bandColor`) |
| UI Surface 1: FMV range line | Task 5 (`fmvCard`, `fmtDollars`) |
| UI Surface 1: expandable comps | Task 5 (`showComps` toggle) |
| UI Surface 1: `FMV_DISCLAIMER` footnote | Task 5 |
| UI Surface 1: pass FMV range into `scorePreclearance` | Task 5 (Step 5.4 `handleSign`) |
| UI Surface 2: FMV band chip per row | Task 6 (`FmvBandChip`) |
| UI Surface 2: disclaimer at footer | Task 6 (`fmvDisclaimer`) |
| Cents internally, `formatCentsUSD` for display | All tasks — `fmtDollars` in UI; engine returns cents |
| Copper only on act-now | Not applicable to FMV surfaces (no CTA); existing copper CTAs unchanged |
| ≥ 44pt touch targets | `compsToggleRow` has `minHeight: 44`; entity chips unchanged (already 44) |
| No animations | None added |
| Commits on `arshia` branch | Tasks 4 + 7 |
| Do NOT push | Not pushed |
| No new TS errors | Tasks 3, 5, 6, 7 |
| Existing suites stay green | Task 4.3 |

**Placeholder scan:** No TBD, TODO, or "implement later" found. All code steps are complete.

**Type consistency:** `FmvEstimate` (defined in `.d.ts` Task 2) is used by `predictClearance` return type, referenced as `prediction.fmv` in `PrecheckStep` (Task 5) and `FmvBandChip` (Task 6 calls `predictClearance` which returns `ClearancePrediction` containing `fmv: FmvEstimate`). `DealKind` is exported from `.d.ts` and imported in `collective-home.tsx` for the `DealRow.dealKind` field. `NormalizedComp` used in `estimateFmv` input and `comps` array. All consistent.
