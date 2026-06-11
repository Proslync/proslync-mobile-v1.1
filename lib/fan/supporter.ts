// lib/fan/supporter.ts
// ── Supporter Pass storage + receipt ledger ────────────────────────────
// All persistence is AsyncStorage; never throws — corrupted data returns
// empty defaults. Fixture / demo only — NO real payments.
//
// Split:  toAthlete = 88%  |  platform = 12%  (spec §5)
// Key:    proslync:fan:supporterPasses:v1    (map keyed by athleteId)
//         proslync:fan:supporterReceipts:v1  (array, append-only)

import AsyncStorage from '@react-native-async-storage/async-storage';

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

// ── Public API ─────────────────────────────────────────────────────────

/** Load all stored passes (never throws — returns {} on corrupt). */
export async function loadPasses(): Promise<Record<string, SupporterPass>> {
  try {
    const raw = await AsyncStorage.getItem(PASSES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) return {};
    return parsed as Record<string, SupporterPass>;
  } catch {
    return {};
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
    const receipt: SupporterReceipt = {
      id: uid(),
      passAthleteId: pass.athleteId,
      atISO: new Date().toISOString(),
      paidCents: pass.priceCents,
      toAthleteCents,
      platformCents,
      note: `${tierLabel(pass.tier)} — monthly`,
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

/** Load all receipts (never throws — returns [] on corrupt). */
export async function loadReceipts(): Promise<SupporterReceipt[]> {
  try {
    const raw = await AsyncStorage.getItem(RECEIPTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SupporterReceipt[];
  } catch {
    return [];
  }
}
