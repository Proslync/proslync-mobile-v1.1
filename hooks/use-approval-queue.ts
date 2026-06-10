// ── APPROVAL QUEUE HOOKS ─────────────────────────────────
// Sprint 3.9 React-Query hooks. 2-min stale / 10-min gc — matches
// the analytics + comparable-deal + open-deal + risk-report cadence
// elsewhere.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  approvalQueueApi,
  type ApprovalQueueDecisionInput,
} from '@/lib/api/approval-queue';
import type {
  ApprovalQueue,
  ApprovalQueueItem,
} from '@/lib/types/approval-queue.types';

export const APPROVAL_QUEUE_KEY = 'approval-queue';
export const APPROVAL_QUEUE_ITEM_KEY = 'approval-queue-item';

export function useSchoolApprovalQueue(schoolId: string | null | undefined) {
  return useQuery({
    queryKey: [APPROVAL_QUEUE_KEY, schoolId],
    queryFn: () => approvalQueueApi.getSchoolQueue(schoolId ?? ''),
    enabled: Boolean(schoolId),
    staleTime: 120_000,
    gcTime: 600_000,
  });
}

export function useApprovalQueueItem(id: string | null | undefined) {
  return useQuery({
    queryKey: [APPROVAL_QUEUE_ITEM_KEY, id],
    queryFn: () => approvalQueueApi.getItem(id ?? ''),
    enabled: Boolean(id),
    staleTime: 120_000,
    gcTime: 600_000,
  });
}

/**
 * Approve / reject a queue row.
 *
 * AD walk gate test (PLAN.md §4 step 4): "Approve one deal end-to-end.
 * State change persists via backend route." This hook is the button-side
 * of that gate. Backend-first via `approvalQueueApi.decide()`, mock
 * fallback in place so the demo always completes the transition.
 *
 * On success:
 *   - Optimistically swaps the row in the cached queue list so the
 *     reviewer sees the transition immediately (no flash of pending).
 *   - Invalidates `APPROVAL_QUEUE_KEY` + `APPROVAL_QUEUE_ITEM_KEY` so
 *     downstream tiles (AD home summary, deal-detail, etc.) refresh.
 */
export function useDecideApprovalQueueItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ApprovalQueueDecisionInput) => {
      if (__DEV__) console.log('[approve] mutationFn fired', input);
      return approvalQueueApi.decide(input);
    },

    onMutate: async (input) => {
      if (__DEV__) console.log('[approve] onMutate fired', input);
      // Cancel in-flight queue queries so the optimistic update wins.
      await qc.cancelQueries({ queryKey: [APPROVAL_QUEUE_KEY] });
      const queries = qc.getQueriesData<ApprovalQueue | null>({
        queryKey: [APPROVAL_QUEUE_KEY],
      });
      if (__DEV__)
        console.log(
          '[approve] matched queries=' + queries.length,
          queries.map(([k]) => JSON.stringify(k)),
        );
      const snapshots: Array<[unknown, ApprovalQueue | null | undefined]> = [];

      queries.forEach(([key, queue]) => {
        snapshots.push([key, queue]);
        if (!queue) return;
        const next: ApprovalQueue = {
          ...queue,
          items: queue.items.map((item) =>
            item.id === input.itemId
              ? { ...item, state: input.status }
              : item,
          ),
          counts: { ...queue.counts },
          updatedAt: new Date().toISOString(),
        };
        // Recount.
        const counts = { pending: 0, approved: 0, rejected: 0, blocked: 0, expired: 0 };
        for (const item of next.items) counts[item.state] += 1;
        next.counts = counts;
        qc.setQueryData(key, next);
        if (__DEV__)
          console.log(
            '[approve] setQueryData done key=' + JSON.stringify(key),
            'counts=' + JSON.stringify(next.counts),
          );
      });

      return { snapshots };
    },

    onError: (err, _input, context) => {
      if (__DEV__) console.log('[approve] onError', String(err));
      // Roll back optimistic update on backend + mock-fallback failure.
      context?.snapshots.forEach(([key, prev]) =>
        qc.setQueryData(key as readonly unknown[], prev),
      );
    },

    onSuccess: (result: ApprovalQueueItem | null) => {
      if (__DEV__)
        console.log(
          '[approve] onSuccess',
          result ? `id=${result.id} state=${result.state}` : 'null',
        );
      if (!result) return;
      // Refresh the single-item cache from the source of truth.
      qc.setQueryData([APPROVAL_QUEUE_ITEM_KEY, result.id], result);
    },

    onSettled: () => {
      if (__DEV__) console.log('[approve] onSettled invalidating');
      qc.invalidateQueries({ queryKey: [APPROVAL_QUEUE_KEY] });
      qc.invalidateQueries({ queryKey: [APPROVAL_QUEUE_ITEM_KEY] });
    },
  });
}
