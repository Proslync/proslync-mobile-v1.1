// ── BRAND ROSTER CONTRACT TYPES (Sprint 2.5 · W33) ────────
// Per-athlete contract drill-down surface for the Brand roster.
//
// Anchors:
//   - PLAN.md §2.5 (Brand roster contract drill-down per W33)
//   - mrs-wilson-asks-extracted.md W33 — "full contract details per
//     athlete in the brand roster table"
//
// Contracts are *reviewable* artefacts: deliverables, payouts, and
// clauses each carry their own status / trigger / kind, and the whole
// record carries `trustMeta` so the surface can render a freshness +
// source provenance chip rather than presenting synthetic fixtures as
// signed facts. Money lives in integer cents (`MoneyAmount`) to match
// the `comparable-deal.types.ts` convention.

import type {
  ComparableDealSourceRef,
  MoneyAmount,
} from './comparable-deal.types';

/** Lifecycle of a brand-athlete contract on the Brand roster surface. */
export type BrandContractStatus =
  | 'draft'
  | 'negotiating'
  | 'live'
  | 'expired'
  | 'renewing';

/** Payout cap structure (informs UI presentation only). */
export type BrandContractCapStructure =
  | 'flat'
  | 'tiered'
  | 'royalty'
  | 'mixed';

export interface BrandContractCap {
  totalCents: MoneyAmount;
  structure: BrandContractCapStructure;
}

export type BrandContractDeliverableStatus =
  | 'queued'
  | 'active'
  | 'done'
  | 'blocked';

export type BrandContractDeliverableProofType =
  | 'screenshot'
  | 'video'
  | 'attestation'
  | 'metrics-report';

export interface BrandContractDeliverable {
  id: string;
  title: string;
  /** ISO 8601 calendar date. */
  due: string;
  status: BrandContractDeliverableStatus;
  proofType: BrandContractDeliverableProofType;
  /** Human-readable owner label (e.g. "Athlete + creative producer"). */
  ownerLabel: string;
}

export type BrandContractPayoutTrigger =
  | 'signature'
  | 'milestone'
  | 'cadence'
  | 'completion';

export type BrandContractPayoutStatus = 'projected' | 'paid' | 'held';

export interface BrandContractPayout {
  id: string;
  amountCents: MoneyAmount;
  /** ISO 8601 calendar date the payout is expected / was settled. */
  due: string;
  trigger: BrandContractPayoutTrigger;
  status: BrandContractPayoutStatus;
  note?: string;
}

export type BrandContractClauseKind =
  | 'exclusivity'
  | 'morality'
  | 'usage-rights'
  | 'termination'
  | 'audit'
  | 'tax-withhold'
  | 'force-majeure';

export interface BrandContractClause {
  id: string;
  label: string;
  kind: BrandContractClauseKind;
  summary: string;
  sourceRef: ComparableDealSourceRef;
}

export interface BrandContractTrustMeta {
  /** ISO 8601 timestamp the contract data was last verified. */
  lastVerifiedAt: string;
  sourceRef: ComparableDealSourceRef;
}

export interface BrandContractTerm {
  id: string;
  athleteId: string;
  brandId: string;
  status: BrandContractStatus;
  /** ISO 8601 start date. */
  startDate: string;
  /** ISO 8601 end date. */
  endDate: string;
  /** Inclusive day-count between `startDate` and `endDate`. */
  durationDays: number;
  renewable: boolean;
  /** Free-text exclusivity scope (e.g. "Footwear · NCAA D1"). */
  exclusivityScope: string;
  /** Granted rights chips (e.g. "Paid amplification · 30d"). */
  rightsGranted: string[];
  cap: BrandContractCap;
  deliverables: BrandContractDeliverable[];
  payoutSchedule: BrandContractPayout[];
  clauses: BrandContractClause[];
  trustMeta: BrandContractTrustMeta;
}
