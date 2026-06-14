// lib/money/money-machine.mjs
// ═══════════════════════════════════════════════════════════════════════════
// PROSLYNC MONEY STATE MACHINE — canonical, event-sourced, cents-based.
// Plain JS (.mjs) so node:test runs without a TS toolchain. Metro bundles
// .mjs fine (same pattern as lib/athlete/truth.mjs + lib/fan/seeded.mjs).
//
// THIS FILE IS THE SPEC A REAL BACKEND WILL IMPLEMENT.
// (Stripe Connect delayed payouts + Plaid `settled` webhooks + manual CSC
//  clearance attestation + double-entry ledger.) No SDK, no network — pure
// functions over immutable event arrays.
//
// ───────────────────────────────────────────────────────────────────────────
// 1. PAYMENT STATE MACHINE
// ───────────────────────────────────────────────────────────────────────────
// States:  expected → in-review → cleared → paid   (+ reversed)
//
//   expected    The deal is executed; money is owed but no funds have moved.
//   in-review   Clearance / compliance review in progress (CSC, NIL Go).
//   cleared     Compliance cleared; payout authorized but not yet settled.
//   paid        Funds settled to the athlete (Plaid `settled` / provider payout).
//   reversed    A previously-`paid` payment bounced / was clawed back within
//               the ACH return window (reversibleUntilISO).
//
// Allowed transitions (directed edges):
//   expected   → in-review | cleared | paid     (a deal may skip review when
//                                                 clearance is not required)
//   in-review  → cleared   | paid               (cleared, then settle)
//   cleared    → paid
//   paid       → reversed                        (only while within the ACH
//                                                  return window)
//   reversed   → (terminal — no outgoing edges)
//
// Illegal (rejected by canTransition / applyTransition):
//   any backward edge (paid → cleared, cleared → in-review, …)
//   self-loops (paid → paid, etc.)
//   reversed → anything
//   reaching `reversed` from anything other than `paid`
//
// Each transition is recorded as an immutable PaymentEvent:
//   { kind, atISO, source, ref? }
//     kind   — the TARGET state of the transition
//     atISO  — ISO 8601 timestamp the event was emitted
//     source — provenance of the truth:
//                'contract'        deal execution / authoring
//                'csc-attested'    a human CSC officer attested clearance
//                'plaid:settled'   Plaid webhook says the deposit settled
//                'provider:payout' Stripe/processor confirmed the payout
//                'reversal'        ACH return / clawback
//                'fixture'         seeded demo data (no real backend)
//     ref    — optional external reference (webhook id, payout id, …)
//
// The CURRENT paymentState is DERIVED from the latest event (deriveState).
// `reversibleUntilISO` is carried on the `paid` event payload so a derived
// view can show the bounce window.
//
// ───────────────────────────────────────────────────────────────────────────
// 2. PAYOUT (delayed payout, NOT escrow)
// ───────────────────────────────────────────────────────────────────────────
// holdState: held → partially-released → released   (+ refunded)
//   held               funds held by the processor, nothing released
//   partially-released some milestones released, balance still held
//   released           everything released to the athlete
//   refunded           held funds returned to the payer (dispute / cancel)
// derivePayoutHoldState(heldCents, releasedCents) computes the holdState from
// the cents so a fixture can't drift out of sync.
//
// ───────────────────────────────────────────────────────────────────────────
// 3. CLEARANCE (attested, human-in-the-loop — NOT a synthetic auto flag)
// ───────────────────────────────────────────────────────────────────────────
//   { state, attestedAtISO, source: 'csc-portal' | 'fixture', by? }
// NIL Go clearance is a human attestation, not an automatic boolean.
//
// ───────────────────────────────────────────────────────────────────────────
// 4. LEDGER (minimal double-entry)
// ───────────────────────────────────────────────────────────────────────────
//   { id, atISO, kind, amountCents, sign: 1 | -1, ref }
// Receipts / 1099 totals derive from SUMMING entries (ledgerBalance), never
// from display strings. A debit is sign -1, a credit is sign +1.
// ═══════════════════════════════════════════════════════════════════════════

// ── Payment state machine definition ──────────────────────────────────────

/** Ordered payment states (excluding the terminal `reversed`). */
export const PAYMENT_STATES = ['expected', 'in-review', 'cleared', 'paid'];

/** Adjacency map of allowed forward transitions + the reversal edge. */
export const PAYMENT_TRANSITIONS = {
  expected: ['in-review', 'cleared', 'paid'],
  'in-review': ['cleared', 'paid'],
  cleared: ['paid'],
  paid: ['reversed'],
  reversed: [],
};

/**
 * Is moving `from` → `to` a legal payment-state transition?
 * @param {string} from
 * @param {string} to
 * @returns {boolean}
 */
export function canTransition(from, to) {
  const edges = PAYMENT_TRANSITIONS[from];
  if (!edges) return false;
  return edges.includes(to);
}

/**
 * Derive the current payment state from an event list.
 * The latest event's `kind` IS the current state. Empty → 'expected'.
 * @param {Array<{kind:string, atISO:string}>} events
 * @returns {string}
 */
export function deriveState(events) {
  if (!Array.isArray(events) || events.length === 0) return 'expected';
  // Latest by atISO; stable for equal timestamps (last wins).
  let latest = events[0];
  for (let i = 1; i < events.length; i++) {
    if (events[i].atISO >= latest.atISO) latest = events[i];
  }
  return latest.kind;
}

/**
 * Append a transition event, enforcing the state machine.
 * Returns a NEW event array (immutable). Throws on an illegal transition.
 * @param {Array} events
 * @param {{kind:string, atISO:string, source:string, ref?:string, reversibleUntilISO?:string}} event
 * @returns {Array}
 */
export function applyTransition(events, event) {
  const from = deriveState(events);
  if (!canTransition(from, event.kind)) {
    throw new Error(
      `illegal payment transition: ${from} → ${event.kind}`,
    );
  }
  return [...events, event];
}

/**
 * Build a paid event with an ACH-return window.
 * @param {string} atISO
 * @param {string} source
 * @param {number} returnWindowDays — default 5 business-ish days (calendar here)
 * @param {string} [ref]
 * @returns {{kind:'paid', atISO:string, source:string, ref?:string, reversibleUntilISO:string}}
 */
export function paidEvent(atISO, source, returnWindowDays = 5, ref) {
  const reversibleUntilISO = new Date(
    new Date(atISO).getTime() + returnWindowDays * 24 * 3600e3,
  ).toISOString();
  const ev = { kind: 'paid', atISO, source, reversibleUntilISO };
  if (ref !== undefined) ev.ref = ref;
  return ev;
}

// ── Payout (delayed payout) ────────────────────────────────────────────────

/**
 * Derive the payout hold state from held/released cents.
 * @param {number} heldCents — total amount placed on hold
 * @param {number} releasedCents — amount released to the athlete so far
 * @returns {'held'|'partially-released'|'released'}
 */
export function derivePayoutHoldState(heldCents, releasedCents) {
  if (releasedCents <= 0) return 'held';
  if (releasedCents >= heldCents) return 'released';
  return 'partially-released';
}

// ── Ledger (double-entry) ──────────────────────────────────────────────────

/**
 * Sum a ledger to a signed cents balance: Σ (amountCents * sign).
 * @param {Array<{amountCents:number, sign:1|-1}>} entries
 * @returns {number}
 */
export function ledgerBalance(entries) {
  if (!Array.isArray(entries)) return 0;
  return entries.reduce((acc, e) => acc + e.amountCents * e.sign, 0);
}

// ── Cents formatting ───────────────────────────────────────────────────────

/**
 * Format integer cents as a USD display string, e.g. 320000 → "$3,200".
 * Whole dollars drop the decimals; fractional cents keep two places.
 * @param {number} cents
 * @returns {string}
 */
export function formatCentsUSD(cents) {
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const rem = abs % 100;
  const dollarStr = dollars.toLocaleString('en-US');
  const body = rem === 0 ? `$${dollarStr}` : `$${dollarStr}.${String(rem).padStart(2, '0')}`;
  return negative ? `-${body}` : body;
}
