// lib/deal-engine/engine.mjs
// Pure logic for the NIL Deal Engine — Phase D1.
// Plain JS (.mjs) so node:test can run without a TS toolchain.
// Metro bundles .mjs fine (same pattern as lib/athlete/truth.mjs).
//
// BRAND-SIDE FEE MODEL (per spec §B.2):
//   - Athlete keeps 100% of deal amount (amountCents → athleteCents)
//   - Brand pays deal amount PLUS a platform fee on top
//   - Default fee rate: 10% (0.10)

// ── Deal ID generator ─────────────────────────────────────────────────────

/**
 * Generate a Deal ID in the format PSY-YYYY-XXXXXXXX.
 * @param {number} year   - e.g. 2026
 * @param {() => string} rand - injected random function; must return an
 *   uppercase alphanumeric string of exactly 8 characters (deterministic in
 *   tests).
 * @returns {string}  e.g. "PSY-2026-A3B7CX19"
 */
export function generateDealId(year, rand) {
  const suffix = rand();
  return `PSY-${year}-${suffix}`;
}

/**
 * Default random source: 8 uppercase alphanum chars.
 * @returns {string}
 */
export function defaultRand() {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < 8; i++) {
    out += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return out;
}

// ── Fee computation ───────────────────────────────────────────────────────

/**
 * Compute the brand-side fee split.
 * Athlete always receives 100% of amountCents.
 * Brand pays amountCents PLUS a platform fee (rounded to nearest cent).
 *
 * @param {number} amountCents  - the agreed deal value in cents
 * @param {number} [feeRate=0.10] - platform fee rate applied to the brand
 * @returns {{ athleteCents: number, brandFeeCents: number, brandTotalCents: number }}
 */
export function computeFees(amountCents, feeRate = 0.10) {
  const brandFeeCents = Math.round(amountCents * feeRate);
  const brandTotalCents = amountCents + brandFeeCents;
  return {
    athleteCents: amountCents,
    brandFeeCents,
    brandTotalCents,
  };
}

// ── Milestone auto-approve ────────────────────────────────────────────────

/**
 * Compute the ISO timestamp at which a submitted milestone auto-approves.
 * Auto-approve window is 72 hours from submission.
 *
 * @param {string} submittedISO - ISO 8601 submission timestamp
 * @returns {string} ISO 8601 auto-approve timestamp (+72h)
 */
export function milestoneAutoApproveAt(submittedISO) {
  const d = new Date(submittedISO);
  d.setTime(d.getTime() + 72 * 60 * 60 * 1000);
  return d.toISOString();
}

/**
 * Determine whether a submitted milestone has crossed the auto-approve threshold.
 *
 * @param {string} submittedISO - ISO 8601 submission timestamp
 * @param {string} nowISO       - ISO 8601 "current time" (injected for determinism)
 * @returns {boolean}
 */
export function isAutoApproved(submittedISO, nowISO) {
  const autoAt = new Date(milestoneAutoApproveAt(submittedISO));
  const now = new Date(nowISO);
  return now.getTime() >= autoAt.getTime();
}

// ── Escrow coverage ───────────────────────────────────────────────────────

/**
 * Compare total milestone amounts against the funded escrow balance.
 *
 * @param {Array<{ amountCents: number }>} milestones
 * @param {number} fundedCents
 * @returns {{ totalMilestoneCents: number, fundedCents: number, shortfallCents: number, isCovered: boolean }}
 */
export function escrowCoverage(milestones, fundedCents) {
  const totalMilestoneCents = milestones.reduce(
    (sum, m) => sum + m.amountCents,
    0,
  );
  const shortfallCents = Math.max(0, totalMilestoneCents - fundedCents);
  return {
    totalMilestoneCents,
    fundedCents,
    shortfallCents,
    isCovered: shortfallCents === 0,
  };
}
