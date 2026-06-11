// lib/compliance/rules-2026-06.ts
// Versioned NIL pre-clearance rules — June 2026 edition.
//
// A FILE SWAP updates the rules; never a refactor.
// Next version: rules-2026-Q3.ts (pending Aug 2026 Trump-EO guardrails).
//
// Sources:
//   - CSC Operating Bylaws (Apr 2026 revision)
//   - Nebraska–Playfly arbitration outcome (June 2026)
//   - NIL Go exemplar disclosure schema (Q1 2026)

// ── Version ───────────────────────────────────────────────────────────────

export const RULES_VERSION = '2026-06' as const;

// ── Associated-Entity types ───────────────────────────────────────────────
//
// These payer-entity types trigger enhanced CSC scrutiny under the
// "directed or requested" test (CSC Apr 2026 guidance).
// The definition is in active litigation — this list is the June 2026
// snapshot after the Nebraska–Playfly ruling.

export const ASSOCIATED_ENTITY_TYPES = [
  'collective',
  'booster-llc',
  'mmr-partner',
  'school-sponsor',
] as const;

export type AssociatedEntityType = (typeof ASSOCIATED_ENTITY_TYPES)[number];

// ── Monetary thresholds (all in cents) ───────────────────────────────────

export const THRESHOLDS = {
  /** CSC mandatory-reporting floor: $600 within 5 business days of execution */
  cscReportFloorCents: 60_000,

  /** "Light-touch" threshold: deals ≤ $2,500 receive expedited CSC review */
  lightTouchCents: 250_000,

  /** Aggregate booster/collective threshold flagging enhanced review
   *  (per athlete per institution per rolling 12-month window) */
  boosterAggregateCents: 500_000_00, // $500,000
} as const;

// ── Three CSC test definitions ────────────────────────────────────────────
//
// These are the three tests the CSC applies to every submission.
// id   — stable machine key (used in preclearance output)
// label — short UI label
// description — shown as tooltip / help text in the pre-check card

export const CSC_TESTS = [
  {
    id: 'businessPurpose' as const,
    label: 'Valid Business Purpose',
    description:
      'The compensation must relate to a genuine commercial use of the athlete\'s NIL — not a disguised gift or pay-for-play payment. Associated-entity deals require documented evidence that the payment reflects FMV for identified deliverables.',
  },
  {
    id: 'activation' as const,
    label: 'Real Activation',
    description:
      'The deal must specify concrete, identifiable deliverables (posts, appearances, signing sessions, etc.). "General promotion" language without named activations has been cited as a rejection basis in multiple 2026 CSC decisions.',
  },
  {
    id: 'compRange' as const,
    label: 'Comp-Range Alignment',
    description:
      'Compensation must not materially exceed fair-market-value ranges for comparable athletes. The CSC uses internal market data; Proslync benchmarks against aggregated NILComp disclosure data. Deals >3× the comp-range high trigger a likely-rejected flag.',
  },
] as const;

export type CscTestId = (typeof CSC_TESTS)[number]['id'];
