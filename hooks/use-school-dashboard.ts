// ── SCHOOL / AD DASHBOARD SNAPSHOT HOOK ──────────────────
// React wrapper around `lib/api/school.getSchoolDashboardSnapshot`.
// Fans out queue + reviews + deals + athletes against the live
// `proslync-backend`, and folds in the still-mock rev-share / cap /
// risk surfaces. Single source of truth for the AD persona view.
//
// `snapshot.source` is the tier badge:
//   • 'backend'  → every live sub-request succeeded
//   • 'mixed'    → some live sub-requests failed
//   • 'fallback' → every live sub-request failed
//
// Backend down? Mock surfaces (rev-share / risk) keep rendering. The
// view surfaces "Awaiting backend §4.6" chips per mock card.

import * as React from 'react';

import {
  getSchoolDashboardSnapshot,
  type SchoolDashboardSnapshot,
} from '@/lib/api/school';

export interface UseSchoolDashboardSnapshotOptions {
  schoolId?: string;
}

export interface UseSchoolDashboardSnapshotResult {
  snapshot: SchoolDashboardSnapshot | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useSchoolDashboardSnapshot(
  opts: UseSchoolDashboardSnapshotOptions = {},
): UseSchoolDashboardSnapshotResult {
  const { schoolId } = opts;
  const [snapshot, setSnapshot] = React.useState<SchoolDashboardSnapshot | null>(
    null,
  );
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [tick, setTick] = React.useState<number>(0);

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getSchoolDashboardSnapshot({ schoolId, signal: controller.signal })
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
  }, [schoolId, tick]);

  const refresh = React.useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  return { snapshot, loading, error, refresh };
}
