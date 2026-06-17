// lib/athlete/truth.mjs
// Pure selectors for the athlete "thin truth layer".
// JS (.mjs) so node:test can run without TS toolchain.
// Metro bundles .mjs fine (same as lib/fan/seeded.mjs).

// ── Business-day math ─────────────────────────────────────────────────────

/**
 * Add N business days to a Date. Saturdays (6) and Sundays (0) are skipped.
 *
 * Operates entirely in UTC (getUTCDay / setUTCDate) so the weekend-skip
 * decision agrees with how callers serialize the result — every caller reads
 * the output via `.toISOString()` (whole timestamp or the `YYYY-MM-DD` slice).
 * Using local-time day-of-week here while serializing in UTC produced
 * timezone-dependent results: in any negative-UTC-offset zone (i.e. every US
 * timezone — the entire NIL athlete user base) a deadline that is a weekday
 * locally serializes to the next UTC calendar day, so NIL Go reporting
 * deadlines could land on a Saturday and be off by a business day. UTC math
 * makes this pure and timezone-independent.
 *
 * @param {Date} startDate
 * @param {number} businessDays
 * @returns {Date}
 */
export function addBusinessDays(startDate, businessDays) {
  const d = new Date(startDate.getTime());
  let remaining = businessDays;
  while (remaining > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) remaining -= 1;
  }
  return d;
}

// ── Hours-until helper ────────────────────────────────────────────────────

/**
 * Hours between now and an ISO deadline string. Returns null if past or no deadline.
 * @param {string|null|undefined} isoString
 * @returns {number|null}
 */
export function hoursUntilISO(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  if (ms <= 0) return null;
  return ms / (1000 * 60 * 60);
}

// ── Threshold resolver ────────────────────────────────────────────────────

/**
 * Returns 'red' (<24h), 'amber' (<72h), or 'green' (else/null).
 * Matches the app-wide urgency thresholds from lib/athlete/urgency.ts.
 * @param {number|null} hours
 * @returns {'red'|'amber'|'green'}
 */
export function thresholdForHours(hours) {
  if (hours === null) return 'green';
  if (hours < 24) return 'red';
  if (hours < 72) return 'amber';
  return 'green';
}

// ── truthSummary ──────────────────────────────────────────────────────────

/**
 * Aggregate summary across all deals.
 * @param {Array} deals — DealTruth[]
 * @returns {{ expectedCents: number, inReviewCount: number, lastPaid?: { dateISO: string, amountCents: number } }}
 */
export function truthSummary(deals) {
  let expectedCents = 0;
  let inReviewCount = 0;
  let lastPaid = undefined;

  for (const d of deals) {
    if (d.paymentState === 'expected' || d.paymentState === 'cleared') {
      expectedCents += d.amountCents;
    }
    if (d.paymentState === 'in-review') {
      inReviewCount += 1;
    }
    if (d.paymentState === 'paid' && d.paidAtISO) {
      if (!lastPaid || d.paidAtISO > lastPaid.dateISO) {
        lastPaid = { dateISO: d.paidAtISO, amountCents: d.amountCents };
      }
    }
  }

  return { expectedCents, inReviewCount, lastPaid };
}

// ── nextDisclosureDeadline ────────────────────────────────────────────────

/**
 * Return the single most urgent undisclosed deal, or null.
 * "Most urgent" = smallest signed time-to-deadline, so an OVERDUE disclosure
 * (deadline already in the past → negative remaining time) ranks ABOVE a deal
 * whose deadline is merely approaching. (hoursUntilISO clamps past deadlines to
 * null, which would wrongly bury the most eligibility-critical item — see the
 * 'overdue' label the truth strip / home surfaces render — so we sort on the
 * raw signed delta here instead.) Unparseable/absent deadlines sort last.
 * @param {Array} deals — DealTruth[]
 * @returns {object|null}
 */
export function nextDisclosureDeadline(deals) {
  const undisclosed = deals.filter(
    (d) => d.disclosure.state === 'undisclosed' && d.disclosure.deadlineISO
  );
  if (undisclosed.length === 0) return null;

  const remainingMs = (d) => {
    const t = new Date(d.disclosure.deadlineISO).getTime();
    return Number.isNaN(t) ? Infinity : t - Date.now();
  };

  undisclosed.sort((a, b) => remainingMs(a) - remainingMs(b));
  return undisclosed[0];
}

// ── upcomingDeliverables ──────────────────────────────────────────────────

/**
 * Flatten all undone deliverables across deals, sorted by dueISO, capped at n.
 * @param {Array} deals — DealTruth[]
 * @param {number} n
 * @returns {Array<{ dealId: string, brand: string, label: string, dueISO: string }>}
 */
export function upcomingDeliverables(deals, n) {
  const items = [];
  for (const d of deals) {
    for (const del of d.deliverables) {
      if (!del.done) {
        items.push({ dealId: d.dealId, brand: d.brand, label: del.label, dueISO: del.dueISO });
      }
    }
  }
  items.sort((a, b) => a.dueISO.localeCompare(b.dueISO));
  return items.slice(0, n);
}
