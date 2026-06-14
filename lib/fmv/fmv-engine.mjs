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
    if (failingTest && failingTest[0] === 'businessPurpose') {
      reason = 'Payer is an associated entity with an insufficient deliverable description — CSC business-purpose test fails.';
    } else if (failingTest && failingTest[0] === 'compRange') {
      reason = (failingFlag && failingFlag.detail) ? failingFlag.detail : 'Deal amount exceeds 3× the FMV comp-range high — CSC rejection risk is elevated.';
    } else {
      reason = (failingFlag && failingFlag.detail) ? failingFlag.detail : 'One or more CSC gate tests failed.';
    }
  } else if (fmvApplies && amountCents > 3 * fmv.highCents) {
    // Overpriced even if gate is clean
    band = 'unlikely';
    reason = 'Deal amount ($' + Math.round(amountCents / 100).toLocaleString('en-US') + ') is more than 3× the FMV high ($' + Math.round(fmv.highCents / 100).toLocaleString('en-US') + '). CSC rejection risk is elevated.';
  } else if (gate.verdict === 'needs-review' || (fmvApplies && amountCents > 1.5 * fmv.highCents)) {
    band = 'borderline';
    if (fmvApplies && amountCents > 1.5 * fmv.highCents) {
      reason = 'Deal amount ($' + Math.round(amountCents / 100).toLocaleString('en-US') + ') exceeds the FMV high ($' + Math.round(fmv.highCents / 100).toLocaleString('en-US') + ') by more than 50%. Provide supporting FMV rationale.';
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
      reason = 'Deal amount is below the $2,500 FMV-review threshold — business-purpose gate is the primary clearance driver. Gate: ' + gate.verdict + '.';
    } else {
      reason = 'Amount is within the FMV range ($' + Math.round(fmv.lowCents / 100).toLocaleString('en-US') + '–$' + Math.round(fmv.highCents / 100).toLocaleString('en-US') + ') and all CSC gate tests pass or warn acceptably.';
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
