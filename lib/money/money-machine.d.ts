// lib/money/money-machine.d.ts
// Type surface for the pure money state machine in money-machine.mjs.
// Mirrors the lib/fan/seeded.d.ts pattern.

import type {
  PaymentEvent,
  PaymentState,
  PayoutHoldState,
  LedgerEntry,
} from './money-model';

export const PAYMENT_STATES: PaymentState[];

export const PAYMENT_TRANSITIONS: Record<PaymentState, PaymentState[]>;

export function canTransition(from: PaymentState, to: PaymentState): boolean;

export function deriveState(events: PaymentEvent[]): PaymentState;

export function applyTransition(
  events: PaymentEvent[],
  event: PaymentEvent,
): PaymentEvent[];

export function paidEvent(
  atISO: string,
  source: PaymentEvent['source'],
  returnWindowDays?: number,
  ref?: string,
): PaymentEvent & { kind: 'paid'; reversibleUntilISO: string };

export function derivePayoutHoldState(
  heldCents: number,
  releasedCents: number,
): Exclude<PayoutHoldState, 'refunded'>;

export function ledgerBalance(entries: LedgerEntry[]): number;

export function formatCentsUSD(cents: number): string;
