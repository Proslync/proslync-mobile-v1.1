// ── NIL MANAGER DATA HOOKS ────────────────────────────────
// Thin React wrapper around `lib/api/nil-manager` that drives the
// NIL Manager persona view. Two surfaces:
//
//   useNilManagerSnapshot()  → { snapshot, loading, error, refresh }
//   useNilManagerActions()   → optimistic decide/appeal actions that
//                              mutate the cached snapshot in place
//                              and reconcile on response.
//
// Backend down? `snapshot.source === 'fallback'` and the view renders
// from `NIL_MANAGER_ATHLETES` so the user still sees something. The
// view is expected to surface this in a small chip — see
// `components/nil-manager/nil-manager-view.tsx`.

import * as React from 'react';

import {
  appealReview as apiAppealReview,
  decideApproval as apiDecideApproval,
  decideReview as apiDecideReview,
  getNilManagerSnapshot,
  type ApprovalQueueItem,
  type ComplianceReview,
  type NilManagerSnapshot,
} from '@/lib/api/nil-manager';

// ── snapshot hook ─────────────────────────────────────────────

export interface UseNilManagerSnapshotOptions {
  schoolId?: string;
  athleteId?: string;
}

export interface UseNilManagerSnapshotResult {
  snapshot: NilManagerSnapshot | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  /** Mutate the cached snapshot directly (used by action hooks). */
  patch: (updater: (prev: NilManagerSnapshot) => NilManagerSnapshot) => void;
}

// Per-mount snapshot is fine — the view re-mounts when the role
// switcher toggles personas, and the parent already memoises layout.
// No global cache yet (React Query isn't wired here; the existing
// useSchoolApprovalQueue uses RQ but on a fixture-only API surface).

export function useNilManagerSnapshot(
  opts: UseNilManagerSnapshotOptions = {},
): UseNilManagerSnapshotResult {
  const { schoolId, athleteId } = opts;
  const [snapshot, setSnapshot] = React.useState<NilManagerSnapshot | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [tick, setTick] = React.useState<number>(0);

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getNilManagerSnapshot({ schoolId, athleteId, signal: controller.signal })
      .then((next) => {
        if (cancelled) return;
        setSnapshot(next);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [schoolId, athleteId, tick]);

  const refresh = React.useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  const patch = React.useCallback(
    (updater: (prev: NilManagerSnapshot) => NilManagerSnapshot) => {
      setSnapshot((prev) => (prev ? updater(prev) : prev));
    },
    [],
  );

  return { snapshot, loading, error, refresh, patch };
}

// ── actions hook ─────────────────────────────────────────────

export interface UseNilManagerActionsOptions {
  patch: UseNilManagerSnapshotResult['patch'];
  refresh: UseNilManagerSnapshotResult['refresh'];
}

export interface UseNilManagerActionsResult {
  decideApproval(
    id: string,
    decision: 'approved' | 'rejected',
    note?: string,
  ): Promise<boolean>;
  decideReview(
    id: string,
    status: 'cleared' | 'flagged' | 'rejected',
    note?: string,
  ): Promise<boolean>;
  appealReview(
    id: string,
    appealState: 'requested' | 'in_progress' | 'decided',
  ): Promise<boolean>;
}

/** Optimistic-first actions: we mutate the local snapshot immediately
 *  (so the row visually flips) and roll back if the backend reports
 *  failure. On success we leave the optimistic value in place and let
 *  the caller decide whether to `refresh()` for the canonical
 *  reconciliation. */
export function useNilManagerActions(
  opts: UseNilManagerActionsOptions,
): UseNilManagerActionsResult {
  const { patch, refresh } = opts;

  const decideApproval = React.useCallback(
    async (id: string, decision: 'approved' | 'rejected', note?: string) => {
      let rollback: ApprovalQueueItem | null = null;
      patch((prev) => {
        const next = prev.queue.map((q): ApprovalQueueItem => {
          if (q.id !== id) return q;
          rollback = q;
          return {
            ...q,
            state: decision,
            decidedAt: new Date().toISOString(),
          };
        });
        return { ...prev, queue: next };
      });
      const ok = await apiDecideApproval(id, decision, note);
      if (!ok && rollback) {
        const restored = rollback;
        patch((prev) => ({
          ...prev,
          queue: prev.queue.map((q) => (q.id === id ? restored : q)),
        }));
      } else if (ok) {
        // Reconcile in the background so other in-flight rows refresh.
        refresh();
      }
      return ok;
    },
    [patch, refresh],
  );

  const decideReview = React.useCallback(
    async (
      id: string,
      status: 'cleared' | 'flagged' | 'rejected',
      note?: string,
    ) => {
      let rollback: ComplianceReview | null = null;
      patch((prev) => {
        const next = prev.reviewsPending.map((r): ComplianceReview => {
          if (r.id !== id) return r;
          rollback = r;
          return {
            ...r,
            status,
            note: note ?? r.note ?? null,
            decidedAt: new Date().toISOString(),
          };
        });
        return { ...prev, reviewsPending: next };
      });
      const ok = await apiDecideReview(id, status, note);
      if (!ok && rollback) {
        const restored = rollback;
        patch((prev) => ({
          ...prev,
          reviewsPending: prev.reviewsPending.map((r) =>
            r.id === id ? restored : r,
          ),
        }));
      } else if (ok) {
        refresh();
      }
      return ok;
    },
    [patch, refresh],
  );

  const appealReview = React.useCallback(
    async (id: string, appealState: 'requested' | 'in_progress' | 'decided') => {
      let rollback: ComplianceReview | null = null;
      patch((prev) => {
        const next = prev.reviewsPending.map((r): ComplianceReview => {
          if (r.id !== id) return r;
          rollback = r;
          return { ...r, appealState, status: 'appealed' };
        });
        return { ...prev, reviewsPending: next };
      });
      const ok = await apiAppealReview(id, appealState);
      if (!ok && rollback) {
        const restored = rollback;
        patch((prev) => ({
          ...prev,
          reviewsPending: prev.reviewsPending.map((r) =>
            r.id === id ? restored : r,
          ),
        }));
      } else if (ok) {
        refresh();
      }
      return ok;
    },
    [patch, refresh],
  );

  return { decideApproval, decideReview, appealReview };
}
