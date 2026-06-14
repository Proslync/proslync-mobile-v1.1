// lib/money/money-model.ts
// ─────────────────────────────────────────────────────────────────────────
// CANONICAL MONEY MODEL — the source-of-truth shape the real backend will
// produce (Stripe Connect delayed payouts, Plaid `settled` webhooks, manual
// CSC clearance attestation, double-entry ledger).
//
// Money is ALWAYS cents (integer) at the source of truth. Display strings are
// DERIVED (see formatCentsUSD in money-machine.mjs). Payment is event-sourced:
// the current state is derived from the latest PaymentEvent — never stored
// as a free-standing flag.
//
// The transition rules + pure derivations live in money-machine.mjs (typed by
// money-machine.d.ts). This file holds the TS type vocabulary screens/fixtures
// import. See the spec comment block at the top of money-machine.mjs.
// ─────────────────────────────────────────────────────────────────────────

// ── Payment state machine ──────────────────────────────────────────────────

/** expected → in-review → cleared → paid (+ reversed). */
export type PaymentState = 'expected' | 'in-review' | 'cleared' | 'paid' | 'reversed';

/** Provenance of a payment truth-change. */
export type PaymentEventSource =
  | 'contract' // deal execution / authoring
  | 'csc-attested' // a human CSC officer attested clearance
  | 'plaid:settled' // Plaid webhook: deposit settled
  | 'provider:payout' // processor (Stripe etc.) confirmed payout
  | 'reversal' // ACH return / clawback
  | 'fixture'; // seeded demo data

/** Immutable event. `kind` is the TARGET state of the transition. */
export interface PaymentEvent {
  kind: PaymentState;
  atISO: string;
  source: PaymentEventSource;
  ref?: string;
  /** Carried on a `paid` event — the ACH return window upper bound. */
  reversibleUntilISO?: string;
}

// ── Attested clearance (human-in-the-loop) ──────────────────────────────────

export type ClearanceState =
  | 'not-required'
  | 'undisclosed'
  | 'submitted'
  | 'in-review'
  | 'cleared'
  | 'denied';

/** NIL Go clearance modeled as a human attestation, not an auto flag. */
export interface AttestedStatus {
  state: ClearanceState;
  /** When the attestation was recorded (only once attested). */
  attestedAtISO?: string;
  source: 'csc-portal' | 'fixture';
  /** Attesting officer / actor, if known. */
  by?: string;
}

// ── Payout (delayed payout — NOT escrow) ────────────────────────────────────

export type PayoutHoldState =
  | 'held'
  | 'partially-released'
  | 'released'
  | 'refunded';

export interface PayoutEvent {
  kind: 'held' | 'released' | 'partial-release' | 'refunded';
  atISO: string;
  amountCents: number;
  source: PaymentEventSource;
  ref?: string;
}

export interface PayoutState {
  heldCents: number;
  releasedCents: number;
  holdState: PayoutHoldState;
  events: PayoutEvent[];
}

// ── Double-entry ledger ─────────────────────────────────────────────────────

export type LedgerKind =
  | 'deal-credit' // money owed/earned to the athlete
  | 'payout' // funds released to the athlete
  | 'platform-fee' // platform's cut
  | 'tax-set-aside' // amount reserved for taxes
  | 'supporter-credit' // supporter pass payment to athlete
  | 'reversal'; // clawback

export interface LedgerEntry {
  id: string;
  atISO: string;
  kind: LedgerKind;
  amountCents: number;
  /** +1 credit, -1 debit. Balance = Σ amountCents * sign. */
  sign: 1 | -1;
  ref: string;
}
