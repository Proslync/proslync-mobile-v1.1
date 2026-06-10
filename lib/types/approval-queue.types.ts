// ── APPROVAL QUEUE TYPES ──────────────────────────────────
// Sprint 3.9 governance primitive (PLAN.md §3.9). Single shape
// for every reviewer-gated action the school sees: AI applicant
// rankings, compliance reviews, external sends, deal changes,
// financial actions, and disclosure submissions.
//
// Trust posture re-uses `AiTrustMeta` from `lib/api/ai-review.ts`
// rather than defining a parallel `TrustMeta` — same provider /
// confidence / rationale / caveats / reviewerState vocabulary so
// every AI-flagged row in the queue renders the same TrustBand
// (Brand HQ, NIL Manager, deal-detail, approval-queue all read
// from one map).
//
// `subjectRef` and `source` re-use the existing canonical shapes:
//   - `ComparableDealSourceRef` for evidence/source attribution
//     (synthetic-tagged in mock; aggregator/disclosure once Q17
//     clears)
//   - role from `ProfileRole` so the "submitted by" actor maps
//     onto the role provider.
//
// All money in integer cents per `MoneyAmount` precedent (this
// module does not own money fields directly — they live on the
// referenced subject record — but rev-share-entry subjects do).

import type { AiTrustMeta } from '@/lib/api/ai-review';
import type { ProfileRole } from '@/lib/providers/role-provider';
import type { ComparableDealSourceRef } from '@/lib/types/comparable-deal.types';

/** The six action kinds an approval queue can gate. */
export type ApprovalQueueItemKind =
  | 'ai-applicant-rank'
  | 'compliance-review'
  | 'external-send'
  | 'deal-change'
  | 'financial-action'
  | 'disclosure-submission';

/** Priority band rendered next to the row. */
export type ApprovalQueueItemPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Lifecycle state for the queue row.
 *
 * `pending` — awaiting reviewer decision (the default).
 * `approved` / `rejected` — reviewer-resolved.
 * `blocked` — reviewer cannot decide until a `blockers[]` clears.
 * `expired` — the dueBy window closed before a decision landed.
 *
 * Mirrors the `AiReviewerState` vocabulary deliberately:
 *   approved / rejected map 1:1
 *   pending  ↔ `pending-review`
 *   blocked  ↔ no AI analogue, queue-only
 *   expired  ↔ no AI analogue, queue-only
 */
export type ApprovalQueueItemState =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'blocked'
  | 'expired';

/** What the queue row is acting on. */
export type ApprovalQueueSubjectKind =
  | 'deal'
  | 'open-deal'
  | 'applicant'
  | 'disclosure'
  | 'rev-share-entry';

export interface ApprovalQueueSubjectRef {
  kind: ApprovalQueueSubjectKind;
  id: string;
  /** Human label for the row — e.g. "Kiyan Anthony × Nike Hoops". */
  label: string;
}

export interface ApprovalQueueActor {
  /** Display name of the submitter. */
  actor: string;
  /** Role that produced this row. */
  role: ProfileRole;
}

export interface ApprovalQueueResolution extends ApprovalQueueActor {
  /** ISO 8601 timestamp the resolution landed. */
  at: string;
}

/**
 * A single reviewer-gated row. Stays shape-stable across the six
 * kinds so the queue UI is one renderer with kind-specific icons
 * and copy, not six surfaces.
 */
export interface ApprovalQueueItem {
  id: string;
  kind: ApprovalQueueItemKind;
  title: string;
  /** One-sentence summary rendered on the row. */
  summary: string;
  subjectRef: ApprovalQueueSubjectRef;
  priority: ApprovalQueueItemPriority;
  state: ApprovalQueueItemState;
  submittedBy: ApprovalQueueActor;
  /** ISO 8601 timestamp the row was filed. */
  submittedAt: string;
  /** Optional ISO 8601 cutoff before which a decision is expected. */
  dueBy?: string;
  /** Free-form reasons the row is blocked, when state === 'blocked'. */
  blockers: string[];
  /**
   * Optional AI trust posture — re-uses `AiTrustMeta` from
   * `lib/api/ai-review.ts` for shape stability. Present when the
   * row originated from an AI suggestion or carries AI commentary.
   */
  trustMeta?: AiTrustMeta;
  /** Source attribution for the row's claims. Required. */
  source: ComparableDealSourceRef;
  /** Optional reviewer-facing free-text note. */
  reviewerNote?: string;
  /** Set when state ∈ {approved, rejected, blocked, expired}. */
  resolvedBy?: ApprovalQueueResolution;
}

/** Lifecycle counts rendered on the preview card hero stats. */
export type ApprovalQueueCounts = Record<ApprovalQueueItemState, number>;

/** Reporting period the queue covers (current cycle by convention). */
export interface ApprovalQueuePeriod {
  id: string;
  /** Human label, e.g. "Week of 2026-05-10". */
  label: string;
}

/**
 * Top-level Approval Queue payload. One per `schoolId` per cycle.
 */
export interface ApprovalQueue {
  schoolId: string;
  period: ApprovalQueuePeriod;
  items: ApprovalQueueItem[];
  counts: ApprovalQueueCounts;
  /** ISO 8601 timestamp of the most recent change. */
  updatedAt: string;
}
