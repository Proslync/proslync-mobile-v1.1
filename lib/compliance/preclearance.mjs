// lib/compliance/preclearance.mjs
// Pure NIL pre-clearance scorer — Phase D2.
// Plain JS (.mjs) so node:test can run without TS toolchain.
//
// The three CSC tests:
//   1. businessPurpose — is the payer a known associated entity AND is the
//      deliverable description vague/empty?
//   2. activation — does the deliverable description name a concrete
//      activation (post, appearance, video, signing, session, etc.)?
//   3. compRange — is the deal amount within / outside comp benchmarks?
//
// Verdict matrix:
//   any fail → 'likely-rejected'
//   no fail, any warn → 'needs-review'
//   all pass → 'likely-clear'

import { addBusinessDays } from '../athlete/truth.mjs';

// ── Rules constants (mirrored from rules-2026-06.ts for .mjs purity) ─────

const ASSOCIATED_ENTITY_TYPES = new Set([
  'collective',
  'booster-llc',
  'mmr-partner',
  'school-sponsor',
]);

const CSC_REPORT_FLOOR_CENTS = 60_000; // $600

// ── Helpers ───────────────────────────────────────────────────────────────

/** Concrete-activation keywords per CSC guidance */
const ACTIVATION_REGEX =
  /\b(post|appearance|video|signing|session|content|reel|story|livestream|podcast|interview|event|camp|clinic|promotion|advertisement|ad)\b/i;

/**
 * Returns true when the deliverable description names a concrete activation.
 * @param {string} text
 * @returns {boolean}
 */
function hasConcreteActivation(text) {
  return ACTIVATION_REGEX.test(text ?? '');
}

/**
 * Returns true when the description is considered vague/empty (< 20 non-space chars).
 * @param {string} text
 * @returns {boolean}
 */
function isVague(text) {
  return (text ?? '').replace(/\s+/g, '').length < 20;
}

// ── nilGoDeadline ─────────────────────────────────────────────────────────

/**
 * Compute the NIL Go reporting deadline: execution date + 5 business days.
 * Per CSC mandatory-reporting rule (§3.3 / OBBBA §7): any deal at or above
 * $600 must be reported to the NIL Go portal within 5 business days of
 * execution.
 *
 * @param {string} executedISO — ISO 8601 execution timestamp
 * @returns {string} ISO 8601 deadline (date portion, end-of-day UTC implied)
 */
export function nilGoDeadline(executedISO) {
  const executed = new Date(executedISO);
  const deadline = addBusinessDays(executed, 5);
  return deadline.toISOString().slice(0, 10);
}

// ── scorePreclearance ─────────────────────────────────────────────────────

/**
 * Run the three CSC pre-clearance tests on the given input and return a
 * structured verdict.
 *
 * @param {{
 *   amountCents: number,
 *   dealKind: string,
 *   deliverableDescription: string,
 *   payerEntityType: string,
 *   compRange?: { lowCents: number, highCents: number } | null
 * }} input
 *
 * @returns {{
 *   verdict: 'likely-clear' | 'needs-review' | 'likely-rejected',
 *   flags: Array<{ kind: string, label: string, detail: string }>,
 *   tests: {
 *     businessPurpose: 'pass' | 'warn' | 'fail',
 *     activation: 'pass' | 'warn' | 'fail',
 *     compRange: 'pass' | 'warn' | 'fail'
 *   }
 * }}
 */
export function scorePreclearance(input) {
  const {
    amountCents,
    deliverableDescription,
    payerEntityType,
    compRange,
  } = input;

  const flags = [];
  const isAE = ASSOCIATED_ENTITY_TYPES.has(payerEntityType);

  // ── Flag: Associated-Entity ───────────────────────────────────────────

  if (isAE) {
    flags.push({
      kind: 'associated-entity',
      label: 'Associated-Entity Payer',
      detail:
        `"${payerEntityType}" is classified as an Associated Entity under CSC June 2026 rules. ` +
        'Enhanced review required — document business purpose and deliverables.',
    });
  }

  // ── Test 1: Business Purpose ──────────────────────────────────────────
  // fail: AE payer AND deliverable is vague/empty (< 20 chars)
  // warn: AE payer but deliverable has some content
  // pass: non-AE payer (brand-side assumed legitimate commercial purpose)

  let businessPurpose;
  if (isAE && isVague(deliverableDescription)) {
    businessPurpose = 'fail';
  } else if (isAE) {
    businessPurpose = 'warn';
  } else {
    businessPurpose = 'pass';
  }

  // ── Test 2: Activation ────────────────────────────────────────────────
  // pass: deliverable names at least one concrete activation keyword
  // warn: no concrete keyword found (generic or empty description)
  // (activation never fails on its own — only warns)

  let activation;
  if (hasConcreteActivation(deliverableDescription)) {
    activation = 'pass';
  } else {
    activation = 'warn';
  }

  // ── Test 3: Comp-Range ────────────────────────────────────────────────
  // fail: amount > 3× comp high
  // warn: amount > 1.5× comp high
  // pass: amount ≤ 1.5× comp high (or no comp data)

  let compRangeResult;
  if (!compRange || compRange.highCents <= 0) {
    // No comp data — cannot assess; treat as warn (unknown risk)
    compRangeResult = 'warn';
    flags.push({
      kind: 'no-comp-data',
      label: 'No Comp Data',
      detail:
        'No comparable deal data available for this deal type. CSC will assess FMV independently.',
    });
  } else if (amountCents > 3 * compRange.highCents) {
    compRangeResult = 'fail';
    flags.push({
      kind: 'comp-out-of-range',
      label: 'Amount Far Exceeds Comps',
      detail:
        `$${(amountCents / 100).toFixed(2)} is more than 3× the comp-range high ` +
        `($${(compRange.highCents / 100).toFixed(2)}). CSC rejection risk is elevated.`,
    });
  } else if (amountCents > 1.5 * compRange.highCents) {
    compRangeResult = 'warn';
    flags.push({
      kind: 'comp-above-range',
      label: 'Amount Above Comp Range',
      detail:
        `$${(amountCents / 100).toFixed(2)} exceeds the comp-range high ` +
        `($${(compRange.highCents / 100).toFixed(2)}) by >50%. Provide supporting FMV rationale.`,
    });
  } else {
    compRangeResult = 'pass';
  }

  // ── Verdict ───────────────────────────────────────────────────────────

  const results = [businessPurpose, activation, compRangeResult];
  let verdict;
  if (results.includes('fail')) {
    verdict = 'likely-rejected';
  } else if (results.includes('warn')) {
    verdict = 'needs-review';
  } else {
    verdict = 'likely-clear';
  }

  // ── CSC floor flag ────────────────────────────────────────────────────

  if (amountCents >= CSC_REPORT_FLOOR_CENTS) {
    flags.push({
      kind: 'csc-report-required',
      label: 'CSC Report Required',
      detail:
        'Deal amount is at or above $600. Must be reported to NIL Go within 5 business days of execution.',
    });
  }

  return {
    verdict,
    flags,
    tests: {
      businessPurpose,
      activation,
      compRange: compRangeResult,
    },
  };
}
