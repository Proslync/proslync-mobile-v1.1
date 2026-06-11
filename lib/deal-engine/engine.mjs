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

// ── Dispute deadline ──────────────────────────────────────────────────────

/**
 * Compute the ISO timestamp at which an athlete's dispute response is due.
 * Response window is 48 hours from when the dispute was opened.
 *
 * @param {string} openedISO - ISO 8601 timestamp when brand opened the dispute
 * @returns {string} ISO 8601 response deadline (+48h)
 */
export function athleteResponseDeadline(openedISO) {
  const d = new Date(openedISO);
  d.setTime(d.getTime() + 48 * 60 * 60 * 1000);
  return d.toISOString();
}

/**
 * Determine whether the athlete response window has passed.
 *
 * @param {string} deadlineISO - ISO 8601 response deadline
 * @param {string} nowISO      - ISO 8601 "current time" (injected for determinism)
 * @returns {boolean}
 */
export function isResponseOverdue(deadlineISO, nowISO) {
  return new Date(nowISO).getTime() > new Date(deadlineISO).getTime();
}

// ── Deal notifications ────────────────────────────────────────────────────

/**
 * Derive a newest-first list of deal notifications (max 10) from deal events
 * and live milestone state.
 *
 * Sources:
 *   - escrow-funded events          → kind 'escrow-funded'
 *   - milestone-submitted events    → kind 'milestone-submitted'
 *   - milestone-auto-approved events → kind 'milestone-auto-approved'
 *   - milestone-paid events         → kind 'payout'
 *   - dispute-opened events         → kind 'disputed'
 *   - dispute-determination events  → kind 'determination'
 *   - Live: submitted milestone with autoApproveAt <12h from now  → kind 'auto-approve-imminent'
 *   - Live: disputed milestone with unanswered response deadline <48h from now → kind 'response-due'
 *
 * @param {Array<object>} deals  - array of EngineDeal-shaped objects
 * @param {string} nowISO        - ISO 8601 current time (injected)
 * @returns {Array<{id: string, dealId: string, atISO: string, kind: string, title: string, body: string}>}
 */
export function deriveDealNotifications(deals, nowISO) {
  const nowMs = new Date(nowISO).getTime();
  /** @type {Array<{id: string, dealId: string, atISO: string, kind: string, title: string, body: string}>} */
  const items = [];

  for (const deal of deals) {
    const dealId = deal.dealId;

    // ── Event-based notifications ──────────────────────────────────────────
    for (const ev of deal.events ?? []) {
      switch (ev.kind) {
        case 'escrow-funded':
          items.push({
            id: `${dealId}:${ev.at}:escrow-funded`,
            dealId,
            atISO: ev.at,
            kind: 'escrow-funded',
            title: 'Escrow Funded',
            body: `Escrow has been funded for deal ${dealId}.`,
          });
          break;
        case 'milestone-submitted':
          items.push({
            id: `${dealId}:${ev.at}:milestone-submitted`,
            dealId,
            atISO: ev.at,
            kind: 'milestone-submitted',
            title: 'Milestone Submitted',
            body: ev.note ?? `A milestone was submitted on deal ${dealId}.`,
          });
          break;
        case 'milestone-auto-approved':
          items.push({
            id: `${dealId}:${ev.at}:milestone-auto-approved`,
            dealId,
            atISO: ev.at,
            kind: 'milestone-auto-approved',
            title: 'Milestone Auto-Approved',
            body: ev.note ?? `A milestone was auto-approved on deal ${dealId}.`,
          });
          break;
        case 'milestone-paid':
          items.push({
            id: `${dealId}:${ev.at}:payout`,
            dealId,
            atISO: ev.at,
            kind: 'payout',
            title: 'Payout Released',
            body: ev.note ?? `Payout released on deal ${dealId}.`,
          });
          break;
        case 'dispute-opened':
          items.push({
            id: `${dealId}:${ev.at}:disputed`,
            dealId,
            atISO: ev.at,
            kind: 'disputed',
            title: 'Dispute Opened',
            body: ev.note ?? `A dispute was opened on deal ${dealId}.`,
          });
          break;
        case 'dispute-determination':
          items.push({
            id: `${dealId}:${ev.at}:determination`,
            dealId,
            atISO: ev.at,
            kind: 'determination',
            title: 'Dispute Determination',
            body: ev.note ?? `Admin determination issued on deal ${dealId}.`,
          });
          break;
        default:
          break;
      }
    }

    // ── Live-state notifications ───────────────────────────────────────────
    for (const m of deal.milestones ?? []) {
      // auto-approve-imminent: submitted + autoApproveAt within 12h
      if (
        m.status === 'submitted' &&
        m.autoApproveAt &&
        !items.some((i) => i.id === `${dealId}:${m.id}:auto-approve-imminent`)
      ) {
        const autoMs = new Date(m.autoApproveAt).getTime();
        const hoursRemaining = (autoMs - nowMs) / (1000 * 60 * 60);
        if (hoursRemaining > 0 && hoursRemaining < 12) {
          items.push({
            id: `${dealId}:${m.id}:auto-approve-imminent`,
            dealId,
            atISO: nowISO,
            kind: 'auto-approve-imminent',
            title: 'Auto-Approve Imminent',
            body: `Milestone "${m.description}" auto-approves in ${Math.ceil(hoursRemaining)}h on deal ${dealId}.`,
          });
        }
      }

      // response-due: disputed + no athleteResponse + deadline within 48h
      if (
        m.status === 'disputed' &&
        m.dispute &&
        !m.dispute.athleteResponse &&
        !items.some((i) => i.id === `${dealId}:${m.id}:response-due`)
      ) {
        const deadlineMs = new Date(m.dispute.athleteResponseDeadlineISO).getTime();
        const hoursRemaining = (deadlineMs - nowMs) / (1000 * 60 * 60);
        if (hoursRemaining > 0 && hoursRemaining <= 48) {
          items.push({
            id: `${dealId}:${m.id}:response-due`,
            dealId,
            atISO: nowISO,
            kind: 'response-due',
            title: 'Response Due',
            body: `You have ${Math.ceil(hoursRemaining)}h to respond to the dispute on deal ${dealId}.`,
          });
        }
      }
    }
  }

  // Sort newest-first, cap at 10
  items.sort((a, b) => new Date(b.atISO).getTime() - new Date(a.atISO).getTime());
  return items.slice(0, 10);
}
