// ── BRAND HQ HOOK ─────────────────────────────────────────
// Thin useState/useEffect/AbortController wrapper around
// `brandApi.getBrandHqSnapshot`. Renders unconditionally — the snapshot
// is `null` until the first fetch resolves, then it's always a stable
// `BrandHqSnapshot` (with `source = 'fallback'` on full failure).

import * as React from 'react';

import {
  brandApi,
  type BrandHqSnapshot,
} from '@/lib/api/brand';

export interface UseBrandHqOptions {
  brandId?: string;
}

export interface UseBrandHqResult {
  snapshot: BrandHqSnapshot | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useBrandHq(opts: UseBrandHqOptions = {}): UseBrandHqResult {
  const { brandId } = opts;
  const [snapshot, setSnapshot] = React.useState<BrandHqSnapshot | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [tick, setTick] = React.useState(0);
  const refresh = React.useCallback(() => setTick((t) => t + 1), []);

  React.useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    setError(null);
    brandApi
      .getBrandHqSnapshot({ brandId, signal: controller.signal })
      .then((next) => {
        if (cancelled) return;
        setSnapshot(next);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // The orchestrator never throws but guard anyway.
        setError(err instanceof Error ? err : new Error(String(err)));
        setSnapshot(brandApi.emptySnapshot());
        setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [brandId, tick]);

  return { snapshot, loading, error, refresh };
}
