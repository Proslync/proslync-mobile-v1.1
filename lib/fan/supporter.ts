// lib/fan/supporter.ts
// ── Supporter Pass storage + receipt ledger ────────────────────────────
// All persistence is AsyncStorage; never throws — corrupted data returns
// empty defaults. Fixture / demo only — NO real payments.
//
// Split:  toAthlete = 88%  |  platform = 12%  (spec §5)
// Key:    proslync:fan:supporterPasses:v1    (map keyed by athleteId)
//         proslync:fan:supporterReceipts:v1  (array, append-only)

import AsyncStorage from '@react-native-async-storage/async-storage';

import { ledgerBalance } from '@/lib/money/money-machine.mjs';
import type { LedgerEntry } from '@/lib/money/money-model';

// ── Types ──────────────────────────────────────────────────────────────

export interface SupporterPass {
  athleteId: string;
  athleteName: string;
  tier: 'fan' | 'insider' | 'courtside';
  priceCents: number;
  supporterNumber: number;
  startedAtISO: string;
}

export interface SupporterReceipt {
  id: string;
  passAthleteId: string;
  atISO: string;
  paidCents: number;
  toAthleteCents: number;
  platformCents: number;
  note: string;
  /**
   * PHASE 0 canonical double-entry ledger for this receipt (source of truth).
   * Optional/additive — older persisted receipts won't have it. The display
   * fields above are DERIVED from this on write (see savePass), so impact /
   * 1099 totals come from summing entries, not from the display strings.
   */
  ledger?: LedgerEntry[];
}

// ── Storage keys ───────────────────────────────────────────────────────

const PASSES_KEY = 'proslync:fan:supporterPasses:v1';
const RECEIPTS_KEY = 'proslync:fan:supporterReceipts:v1';

// ── Helpers ────────────────────────────────────────────────────────────

function splitCents(totalCents: number): { toAthleteCents: number; platformCents: number } {
  const toAthleteCents = Math.round(totalCents * 0.88);
  const platformCents = totalCents - toAthleteCents;
  return { toAthleteCents, platformCents };
}

function uid(): string {
  return `rcpt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function tierLabel(tier: SupporterPass['tier']): string {
  switch (tier) {
    case 'fan': return 'Fan $5/mo';
    case 'insider': return 'Insider $12/mo';
    case 'courtside': return 'Courtside $25/mo';
  }
}

// ── Demo seed ────────────────────────────────────────────────────────────
// Fresh-demo safety net: Fan HQ keys its feed / perks / "My athletes" off
// stored supporter passes, so a clean install lands on a mostly-empty page.
// When storage has none, surface these seeded passes (+ their receipts) so the
// fan landing tells a coherent story out of the box. Athlete ids/names match
// the supporter-only feed rows ("Kiyan A.", "JJ Starling") so nothing
// contradicts. The user can still cancel them; once they take any action the
// real persisted map/array takes over. priceCents matches tierLabel().
const SEED_NOW = new Date();
function seedISO(daysAgo: number): string {
  return new Date(SEED_NOW.getTime() - daysAgo * 24 * 3600e3).toISOString();
}

const SEEDED_PASSES: Record<string, SupporterPass> = {
  'a-1': {
    athleteId: 'a-1',
    athleteName: 'Kiyan Anthony',
    tier: 'courtside',
    priceCents: 25_00,
    supporterNumber: 15,
    startedAtISO: seedISO(34),
  },
  'a-4': {
    athleteId: 'a-4',
    athleteName: 'JJ Starling',
    tier: 'insider',
    priceCents: 12_00,
    supporterNumber: 8,
    startedAtISO: seedISO(12),
  },
};

function seededReceiptFor(
  pass: SupporterPass,
  idSuffix: string,
  atISO: string,
): SupporterReceipt {
  const { toAthleteCents, platformCents } = splitCents(pass.priceCents);
  return {
    id: `seed-rcpt-${pass.athleteId}-${idSuffix}`,
    passAthleteId: pass.athleteId,
    atISO,
    paidCents: pass.priceCents,
    toAthleteCents,
    platformCents,
    note: `${tierLabel(pass.tier)} — monthly`,
    ledger: [
      { id: `seed-${pass.athleteId}-${idSuffix}-pay`, atISO, kind: 'supporter-credit', amountCents: pass.priceCents, sign: 1, ref: pass.athleteId },
      { id: `seed-${pass.athleteId}-${idSuffix}-athlete`, atISO, kind: 'payout', amountCents: toAthleteCents, sign: -1, ref: pass.athleteId },
      { id: `seed-${pass.athleteId}-${idSuffix}-platform`, atISO, kind: 'platform-fee', amountCents: platformCents, sign: -1, ref: pass.athleteId },
    ],
  };
}

// Two months of Kiyan + one month of JJ — most-recent last (the UI reads the
// tail as the latest impact receipt).
const SEEDED_RECEIPTS: SupporterReceipt[] = [
  seededReceiptFor(SEEDED_PASSES['a-1']!, 'm1', seedISO(34)),
  seededReceiptFor(SEEDED_PASSES['a-4']!, 'm1', seedISO(12)),
  seededReceiptFor(SEEDED_PASSES['a-1']!, 'm2', seedISO(4)),
];

// ── Public API ─────────────────────────────────────────────────────────

/** Load all stored passes (never throws — returns the demo seed when storage
 *  is empty so Fan HQ isn't blank on a fresh install). */
export async function loadPasses(): Promise<Record<string, SupporterPass>> {
  try {
    const raw = await AsyncStorage.getItem(PASSES_KEY);
    if (!raw) return { ...SEEDED_PASSES };
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
      return { ...SEEDED_PASSES };
    }
    return parsed as Record<string, SupporterPass>;
  } catch {
    return { ...SEEDED_PASSES };
  }
}

/**
 * Save (upsert) a pass and append its first/updated receipt.
 * The receipt's paidCents = pass.priceCents; split is 88/12.
 */
export async function savePass(pass: SupporterPass): Promise<void> {
  try {
    const [passes, receipts] = await Promise.all([loadPasses(), loadReceipts()]);

    passes[pass.athleteId] = pass;

    const { toAthleteCents, platformCents } = splitCents(pass.priceCents);
    const atISO = new Date().toISOString();
    const id = uid();

    // Canonical double-entry ledger: payment in (credit), athlete + platform
    // splits out (debits). Display fields are DERIVED from this so they can
    // never drift from the ledger sum.
    const ledger: LedgerEntry[] = [
      { id: `${id}-pay`, atISO, kind: 'supporter-credit', amountCents: pass.priceCents, sign: 1, ref: pass.athleteId },
      { id: `${id}-athlete`, atISO, kind: 'payout', amountCents: toAthleteCents, sign: -1, ref: pass.athleteId },
      { id: `${id}-platform`, atISO, kind: 'platform-fee', amountCents: platformCents, sign: -1, ref: pass.athleteId },
    ];

    const athleteEntry = ledger.find((e) => e.kind === 'payout');
    const platformEntry = ledger.find((e) => e.kind === 'platform-fee');
    const paymentEntry = ledger.find((e) => e.kind === 'supporter-credit');

    const receipt: SupporterReceipt = {
      id,
      passAthleteId: pass.athleteId,
      atISO,
      // Derived from the canonical ledger (each entry summed as a 1-entry balance).
      paidCents: ledgerBalance(paymentEntry ? [paymentEntry] : []),
      toAthleteCents: Math.abs(ledgerBalance(athleteEntry ? [athleteEntry] : [])),
      platformCents: Math.abs(ledgerBalance(platformEntry ? [platformEntry] : [])),
      note: `${tierLabel(pass.tier)} — monthly`,
      ledger,
    };

    await Promise.all([
      AsyncStorage.setItem(PASSES_KEY, JSON.stringify(passes)),
      AsyncStorage.setItem(RECEIPTS_KEY, JSON.stringify([...receipts, receipt])),
    ]);
  } catch {
    // silent — demo; never surface storage errors to UI
  }
}

/**
 * Remove a pass (keeps receipts for provenance).
 * No-op if pass does not exist.
 */
export async function cancelPass(athleteId: string): Promise<void> {
  try {
    const passes = await loadPasses();
    if (!passes[athleteId]) return;
    delete passes[athleteId];
    await AsyncStorage.setItem(PASSES_KEY, JSON.stringify(passes));
  } catch {
    // silent
  }
}

/** Load all receipts (never throws — returns the demo seed when storage is
 *  empty so the "Your impact" proof isn't blank on a fresh install). */
export async function loadReceipts(): Promise<SupporterReceipt[]> {
  try {
    const raw = await AsyncStorage.getItem(RECEIPTS_KEY);
    if (!raw) return [...SEEDED_RECEIPTS];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...SEEDED_RECEIPTS];
    return parsed as SupporterReceipt[];
  } catch {
    return [...SEEDED_RECEIPTS];
  }
}
