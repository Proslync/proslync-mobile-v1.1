// ── AD AUDIT-DEFENSE RISK REPORT ─────────────────────────
// Sprint 3.10 primitive (PLAN.md §3.10). The buyer-side governance
// surface that turns the §recursive-research-2026-05-10 House-vs-NCAA
// + CSC research into a reviewable product object.
//
// Contract:
//   - Every fact carries a `ComparableDealSourceRef` (synthetic-tagged
//     in mock fixtures, aggregator/disclosure-tagged once Q17 clears).
//   - Every category row carries a reviewer state — the hero severity
//     is *summary*, not consensus. Legal use is gated on reviewer
//     approval (mirrors comparable-deal trust posture).
//   - All money in integer cents (`MoneyAmount` precedent).
//   - The House-v.-NCAA cap context is a *reference display* of the
//     school's own reported cap usage. Proslync does not own that
//     math (PLAN P4 — separate from platform↔AD rev-share).
//
// Schema attribution: original to Proslync. Field naming mirrors the
// existing `ComparableDeal*` and `OpenDeal*` shapes for readability.

import type {
  ComparableDealSourceRef,
  MoneyAmount,
} from './comparable-deal.types';

/** Severity of a single category row or the rolled-up overall report. */
export type RiskSeverity = 'clear' | 'watch' | 'flagged' | 'critical';

/**
 * The 5 audit-defense buckets per PLAN §3.10:
 *   - allocation                          → Title IX / EADA per-sport / per-gender split
 *   - associated-entity-cap-circumvention → Bylaw 22 payor-association status, structured layering
 *   - dispute-clawback                    → settlement / clawback timeline exposure
 *   - tampering-evidence                  → preservation gaps in audit-trail evidence
 *   - source-freshness                    → underlying source posture & retrieval freshness
 */
export type RiskCategory =
  | 'allocation'
  | 'associated-entity-cap-circumvention'
  | 'dispute-clawback'
  | 'tampering-evidence'
  | 'source-freshness';

/**
 * Reviewer lifecycle for an individual category roll-up. Mirrors
 * `ComparableDealReviewerState`. A flagged finding can sit `pending-review`
 * while its severity is rendered honestly.
 */
export type RiskReportReviewerState =
  | 'auto-suggested'
  | 'pending-review'
  | 'approved'
  | 'rejected';

/**
 * One concrete finding inside a category. Each finding cites at least
 * one source ref and may refer to a deal/athlete/entity id surfaced
 * elsewhere in the app.
 */
export interface RiskReportFinding {
  id: string;
  severity: RiskSeverity;
  /** One-sentence headline shown in the row. */
  headline: string;
  /** Reviewer-facing rationale — the "why" behind the severity. */
  rationale: string;
  /** Optional cross-ref ids (deal ids, athlete ids, entity ids). */
  relatedDealIds?: string[];
  relatedAthleteIds?: string[];
  relatedEntityIds?: string[];
  /** Source attribution for this finding. Required. */
  sources: ComparableDealSourceRef[];
  /** Suggested remediation step, when known. */
  recommendedAction?: string;
}

/**
 * A category roll-up — the visible row in the card. Aggregates findings
 * up to a single severity + reviewer state for at-a-glance triage.
 */
export interface RiskReportCategoryRollup {
  category: RiskCategory;
  severity: RiskSeverity;
  /** One-sentence summary rendered on the card row. */
  summary: string;
  findings: RiskReportFinding[];
  /** Cross-cutting source refs cited by the rollup as a whole. */
  evidenceRefs: ComparableDealSourceRef[];
  reviewerState: RiskReportReviewerState;
  /** Optional reviewer note (who decided, when, why). */
  reviewerNote?: string;
}

/**
 * House-v.-NCAA cap context block. **Reference display only** — the
 * school is the source-of-truth for these numbers; Proslync surfaces
 * them so an AD auditing the platform's own rev-share has the cap
 * context next to it (PLAN P4).
 */
export interface HouseCapContext {
  fiscalYear: string;
  annualCap: MoneyAmount;
  capUsed: MoneyAmount;
  capRemaining: MoneyAmount;
  /** Optional caveat surfaced inline with the bar. */
  caveat?: string;
}

/** Last-refresh audit stamp. */
export interface RiskReportAudit {
  lastRefreshedAt: string;
  refreshedByActor: string;
  /** Optional checksum / version stamp. */
  versionTag?: string;
}

/**
 * Reporting period the report covers. Single ISO date pair — half-open
 * by convention (`[start, end)`).
 */
export interface RiskReportPeriod {
  /** ISO 8601 date — inclusive start. */
  start: string;
  /** ISO 8601 date — exclusive end. */
  end: string;
  /** Human label (e.g. "FY 2025-26 H1"). */
  label: string;
}

/**
 * Top-level Risk Report payload. One per `schoolId` per period.
 */
export interface RiskReport {
  id: string;
  schoolId: string;
  /** ISO 8601 timestamp the report was generated. */
  generatedAt: string;
  period: RiskReportPeriod;
  overallSeverity: RiskSeverity;
  houseCapContext: HouseCapContext;
  categories: RiskReportCategoryRollup[];
  audit: RiskReportAudit;
  /** Free-form caveats surfaced in the card footer. */
  caveats: string[];
  attribution: {
    source: 'proslync-ad-audit-defense';
    /** Optional license tag for any embedded research donor. */
    schemaLicense?: string;
    note: string;
  };
}
