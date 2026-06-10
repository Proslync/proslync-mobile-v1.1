// ── ATHLETE URGENCY SELECTOR ──────────────────────────────
// Pure selector: deriveUrgencyItems({ offers, contracts, disclosures? })
// → UrgencyItem[]
//
// Produces up to 3 urgency items sorted by deadline ascending.
// Stripe color law: red ≤24h, amber ≤72h, blue = awaiting-you/no deadline.
// When no real deadline fields are present on incoming data, falls back
// to MOCK_URGENCY_ITEMS (spec-allowed fixture fallback).
//
// CTA routing: chips navigate to existing screens — no new flows behind them.
// This selector is a pure function; it contains no React/hooks.

import type { ActiveContractView } from '@/hooks/use-athlete-contracts';
import type { OfferInboxView } from '@/hooks/use-athlete-offers';
import { MOCK_URGENCY_ITEMS } from '@/lib/data/mock-urgency';

export type UrgencyKind = 'disclosure' | 'deliverable' | 'offer';
export type UrgencyCta = 'DISCLOSE' | 'SUBMIT' | 'RESPOND';
export type UrgencyStripe = 'red' | 'amber' | 'blue';

export interface UrgencyItem {
  id: string;
  label: string;
  sublabel: string;
  deadlineISO: string | null;
  kind: UrgencyKind;
  cta: UrgencyCta;
  route: string;
  stripe: UrgencyStripe;
  hoursUntil: number | null; // null = no deadline / awaiting-you
}

// ── Stripe resolver ───────────────────────────────────────

/** Resolve stripe color from hours until deadline. Null = blue (awaiting). */
export function stripeForHours(hours: number | null): UrgencyStripe {
  if (hours === null) return 'blue';
  if (hours <= 24) return 'red';
  if (hours <= 72) return 'amber';
  return 'blue';
}

function hoursUntilDeadline(isoString: string | null | undefined): number | null {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  if (ms <= 0) return null; // past deadline — treat as no deadline
  return ms / (1000 * 60 * 60);
}

// ── Contract → UrgencyItem conversion ────────────────────

function contractToUrgencyItem(c: ActiveContractView): UrgencyItem | null {
  // Only surface contracts that are "pending" or have upcoming due dates.
  // We extract an urgency item when: status is Pending (needs action) OR
  // the "due" field suggests something is approaching soon.
  if (c.status !== 'Pending') return null;

  // No raw ISO on the view — contracts are Pending-status items only
  // (real deadline from endDate is inaccessible from the view type).
  const hours = null; // awaiting-you
  return {
    id: `contract-${c.id}`,
    label: `${c.brand} · ${c.contract}`,
    sublabel: c.due,
    deadlineISO: null,
    kind: 'deliverable',
    cta: 'SUBMIT',
    route: '/athlete/deals',
    stripe: 'blue',
    hoursUntil: hours,
  };
}

// ── Offer → UrgencyItem conversion ───────────────────────

function offerToUrgencyItem(o: OfferInboxView): UrgencyItem | null {
  // Surface high-match offers as actionable items.
  if (o.matchScore < 75) return null;
  return {
    id: `offer-${o.id}`,
    label: `${o.brand} · New offer`,
    sublabel: `${o.amount} · received ${o.received}`,
    deadlineISO: null,
    kind: 'offer',
    cta: 'RESPOND',
    route: '/athlete/deals',
    stripe: 'blue',
    hoursUntil: null,
  };
}

// ── Public selector ───────────────────────────────────────

export interface UrgencyInputs {
  contracts?: ActiveContractView[];
  offers?: OfferInboxView[];
}

/**
 * Derive up to 3 urgency items sorted by deadline (soonest first).
 * Falls back to MOCK_URGENCY_ITEMS when real data is empty/unavailable.
 */
export function deriveUrgencyItems(inputs: UrgencyInputs): UrgencyItem[] {
  const { contracts = [], offers = [] } = inputs;

  const items: UrgencyItem[] = [];

  // 1. Contracts first (deliverable/pending action)
  for (const c of contracts) {
    const item = contractToUrgencyItem(c);
    if (item) items.push(item);
  }

  // 2. High-match offers
  for (const o of offers) {
    const item = offerToUrgencyItem(o);
    if (item) items.push(item);
  }

  // 3. If we produced no items at all, use the mock fixture
  if (items.length === 0) {
    return MOCK_URGENCY_ITEMS.map((m) => {
      const hours = hoursUntilDeadline(m.deadlineISO);
      return {
        id: m.id,
        label: m.label,
        sublabel: m.sublabel,
        deadlineISO: m.deadlineISO,
        kind: m.kind,
        cta: m.cta,
        route: m.route,
        stripe: stripeForHours(hours),
        hoursUntil: hours,
      };
    }).slice(0, 3);
  }

  // Sort by deadline: items with a real deadline come first (soonest first),
  // then awaiting-you items.
  items.sort((a, b) => {
    if (a.hoursUntil === null && b.hoursUntil === null) return 0;
    if (a.hoursUntil === null) return 1;
    if (b.hoursUntil === null) return -1;
    return a.hoursUntil - b.hoursUntil;
  });

  return items.slice(0, 3);
}

// ── Countdown string ──────────────────────────────────────

/**
 * Format hours into a countdown string: "2h", "14h", "3d".
 * Used for the countdown chips in This Week zone.
 */
export function formatCountdown(hours: number): string {
  if (hours < 1) return '<1h';
  if (hours < 24) return `${Math.floor(hours)}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
