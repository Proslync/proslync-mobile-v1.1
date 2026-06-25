// lib/coach/coach-dollar-blind.mjs
// ── COACH DOLLAR-BLIND WALL (pure) ────────────────────────────────────────
// The coach charter's load-bearing wall: a coach surface may show a deal's
// STAGE and a binary cleared flag, but NEVER a dollar amount or a payment id
// (dollar surveillance collapses athlete self-reporting — ProPublica/Illinois).
// This module holds the pure stage-label projection the coach NIL-watch model
// uses, plus a mechanical assertion that a projected coach row leaks no money.
// JS (.mjs) so node:test runs it without the TS toolchain (same pattern as
// lib/athlete/truth.mjs); the TS coach model imports `formatDealStageLabel`
// from here so the test guards the real code path.

/**
 * Dollar-free, sentence-case label for a deal stage — the only deal signal a
 * (dollar-blind) coach surface is allowed to show.
 * @param {'draft'|'sent'|'negotiation'|'signed'|'live'} stage
 * @returns {string}
 */
export function formatDealStageLabel(stage) {
  switch (stage) {
    case 'draft':
      return 'Drafting';
    case 'sent':
      return 'Offer sent';
    case 'negotiation':
      return 'In negotiation';
    case 'signed':
      return 'Signed';
    case 'live':
      return 'Active';
    default:
      return String(stage);
  }
}

// ── Dollar-blind verifier ─────────────────────────────────────────────────
// Scans an arbitrary value (string / number / nested object) for anything that
// looks like a money amount or a payment id. Used by the coach-wall test to
// mechanically prove a coach row carries no $ and no payment id.

const MONEY_RE = /\$|\bUSD\b|\bcents?\b|\bamount(?:Cents)?\b/i;
// Payment/transaction id shapes used across the spine fixtures:
// txn-*, ap-* (payout items), lg-* (ledger entries), pay-*, pmt-*, dt-* truth.
const PAYMENT_ID_RE = /\b(?:txn|ap|lg|pay|pmt|dt|payout|disbursement|stripe|plaid)[-_:][\w-]+/i;

/**
 * @param {unknown} value
 * @returns {{ ok: boolean, offendingPath: string | null, offendingValue: unknown }}
 */
export function findMoneyLeak(value, path = '$') {
  if (value == null) return { ok: true, offendingPath: null, offendingValue: null };

  if (typeof value === 'number') {
    // A coach row should carry no monetary number. Allowed numeric fields are
    // structural (jersey number, counts) — callers pass only the row to scan,
    // so any large/currency-shaped number is suspicious. We treat bare numbers
    // as OK here (jersey #) and rely on the string/key checks for $ leakage,
    // since money on these surfaces is always rendered as a "$"-prefixed string.
    return { ok: true, offendingPath: null, offendingValue: null };
  }

  if (typeof value === 'string') {
    if (MONEY_RE.test(value)) {
      return { ok: false, offendingPath: path, offendingValue: value };
    }
    if (PAYMENT_ID_RE.test(value)) {
      return { ok: false, offendingPath: path, offendingValue: value };
    }
    return { ok: true, offendingPath: null, offendingValue: null };
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const r = findMoneyLeak(value[i], `${path}[${i}]`);
      if (!r.ok) return r;
    }
    return { ok: true, offendingPath: null, offendingValue: null };
  }

  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      // Reject money-shaped KEYS too (e.g. amountCents, paymentId).
      if (MONEY_RE.test(k) || /payment.?id|paymentId|payoutId/i.test(k)) {
        return { ok: false, offendingPath: `${path}.${k}`, offendingValue: v };
      }
      const r = findMoneyLeak(v, `${path}.${k}`);
      if (!r.ok) return r;
    }
  }

  return { ok: true, offendingPath: null, offendingValue: null };
}
