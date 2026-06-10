// ── APPROVAL QUEUE API ────────────────────────────────────
// Sprint 3.9 façade. Backend-first with mock fallback — same pattern
// as `disclosures.ts`:
//   - Reads: try GET `/api/approval-queue?reviewerRole=school` first;
//     fall back to the hand-authored Syracuse fixture in
//     `lib/data/mock-approval-queue.ts` when backend has no rows.
//   - Decide: POST `/api/approval-queue/:id/decide` with
//     `{ status, decidedBy, decisionNote? }`. On success, returns the
//     updated row. On backend failure / 404, falls through to an
//     in-memory mock decision so the AD walk demo still completes.
//
// AD walk gate test (PLAN.md §4 step 4): "Approve one deal end-to-end.
// State change persists via backend route." This file is the wire.

import { apiClient } from './client';
import { isBackendReachable } from './proslync';
import {
  getMockApprovalQueue,
  getMockApprovalQueueItem,
  recordMockDecision,
} from '@/lib/data/mock-approval-queue';
import type {
  ApprovalQueue,
  ApprovalQueueItem,
  ApprovalQueueItemState,
} from '@/lib/types/approval-queue.types';

/** Decision payload accepted by the backend `/decide` route. */
export interface ApprovalQueueDecisionInput {
  itemId: string;
  status: Extract<ApprovalQueueItemState, 'approved' | 'rejected'>;
  decidedBy: string;
  decisionNote?: string;
}

type ListEnvelope = { data: ApprovalQueueItem[] };
type SingleEnvelope = { data: ApprovalQueueItem };

async function tryBackendList(
  reviewerRole: string,
): Promise<ApprovalQueueItem[] | null> {
  if (!isBackendReachable()) return null;
  try {
    const env = await apiClient.get<ListEnvelope>(
      `/api/approval-queue?reviewerRole=${encodeURIComponent(reviewerRole)}`,
    );
    if (!env || !Array.isArray(env.data)) return null;
    return env.data;
  } catch {
    return null;
  }
}

async function tryBackendDecide(
  input: ApprovalQueueDecisionInput,
): Promise<ApprovalQueueItem | null> {
  if (!isBackendReachable()) return null;
  try {
    const env = await apiClient.post<SingleEnvelope>(
      `/api/approval-queue/${encodeURIComponent(input.itemId)}/decide`,
      {
        status: input.status,
        decidedBy: input.decidedBy,
        decisionNote: input.decisionNote,
      },
    );
    // `apiClient` falls back to a stub mockResponse on 4xx/5xx when
    // `config.api.fallbackToMock` is on (see `client.ts:459`). For POST
    // endpoints that mock has no fixture for, it returns a shape that
    // satisfies the TS envelope (truthy, has `.data`) but lacks the real
    // ApprovalQueueItem fields. Validate before trusting — otherwise the
    // mutation looks successful with garbage and blocks the real mock
    // fallback in `decide()` below.
    if (!env || !env.data || typeof env.data !== 'object') return null;
    const candidate = env.data as Partial<ApprovalQueueItem>;
    if (!candidate.id || !candidate.state) return null;
    return env.data;
  } catch {
    return null;
  }
}

export const approvalQueueApi = {
  /**
   * Returns the AD-side approval queue for a school. Tries backend
   * filtered by `reviewerRole: 'school'`; if backend has zero rows
   * (no seed yet) returns the hand-authored Syracuse fixture so the
   * demo always has something to walk.
   */
  async getSchoolQueue(schoolId: string): Promise<ApprovalQueue | null> {
    if (!schoolId) return null;
    const live = await tryBackendList('school');
    if (live && live.length > 0) {
      // Backend-shaped list lacks queue-level totals; derive on the fly.
      return buildQueueFromItems(schoolId, live);
    }
    return getMockApprovalQueue(schoolId);
  },

  /** Look up a single queue row by id. Backend, then mock. */
  async getItem(id: string): Promise<ApprovalQueueItem | null> {
    if (!id) return null;
    if (isBackendReachable()) {
      try {
        const env = await apiClient.get<SingleEnvelope>(
          `/api/approval-queue/${encodeURIComponent(id)}`,
        );
        if (env?.data) return env.data;
      } catch {
        /* fall through */
      }
    }
    return getMockApprovalQueueItem(id);
  },

  /**
   * Decide a queue row. Backend-first; on backend miss / failure
   * applies the same transition to the in-memory mock fixture so
   * subsequent reads reflect the decision (demo-safe).
   *
   * Returns the updated `ApprovalQueueItem` (backend-shaped if live,
   * mock-shaped if fallback) so the mutation hook can refresh caches.
   */
  async decide(
    input: ApprovalQueueDecisionInput,
  ): Promise<ApprovalQueueItem | null> {
    const live = await tryBackendDecide(input);
    if (__DEV__)
      console.log(
        '[approvalQueueApi.decide] live=' +
          (live ? `id=${live.id} state=${live.state}` : 'null'),
        'input=' + JSON.stringify(input),
      );
    if (live) return live;
    const fallback = recordMockDecision(input.itemId, {
      status: input.status,
      decidedBy: input.decidedBy,
      decisionNote: input.decisionNote,
    });
    if (__DEV__)
      console.log(
        '[approvalQueueApi.decide] fallback=' +
          (fallback ? `id=${fallback.id} state=${fallback.state}` : 'null'),
      );
    return fallback;
  },
};

// ── helpers ──────────────────────────────────────────────

function buildQueueFromItems(
  schoolId: string,
  items: ApprovalQueueItem[],
): ApprovalQueue {
  const counts = items.reduce(
    (acc, item) => {
      acc[item.state] = (acc[item.state] ?? 0) + 1;
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0, blocked: 0, expired: 0 } as Record<
      ApprovalQueueItemState,
      number
    >,
  );
  const now = new Date().toISOString();
  return {
    schoolId,
    period: { id: `period-live-${schoolId}`, label: 'Live · backend' },
    items,
    counts,
    updatedAt: now,
  };
}
