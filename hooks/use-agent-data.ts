// ── AGENT DATA HOOKS ──────────────────────────────────────
// Thin useState/useEffect/AbortController wrappers around `agentApi`.
// Every hook resolves to a stable shape with `loading`/`error`/`refresh`
// so the agent-view UI can render unconditionally and never blocks on
// network. Errors surface as `error` but the data arrays stay valid
// (empty fallback) — the caller decides whether to substitute mock
// fixtures.

import * as React from 'react';

import {
  agentApi,
  type AgentDataSource,
  type AthletePublicProfile,
  type CommissionRollup,
  type NilDealRecord,
} from '@/lib/api/agent';
import type { OpenDealApplication } from '@/lib/types/open-deal.types';

interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  source: AgentDataSource;
  refreshAt: number;
}

function useAsync<T>(
  initial: T,
  loader: (signal: AbortSignal) => Promise<T>,
  deps: React.DependencyList,
): { state: AsyncState<T>; refresh: () => void } {
  const [state, setState] = React.useState<AsyncState<T>>({
    data: initial,
    loading: true,
    error: null,
    source: 'live',
    refreshAt: 0,
  });
  // bump to retrigger fetch
  const [tick, setTick] = React.useState(0);

  // Use a ref to dependency tracking and refresh
  const refresh = React.useCallback(() => setTick((t) => t + 1), []);

  React.useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    loader(controller.signal)
      .then((data) => {
        if (cancelled) return;
        setState({
          data,
          loading: false,
          error: null,
          source: agentApi.getLastSource(),
          refreshAt: Date.now(),
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
          source: agentApi.getLastSource(),
          refreshAt: Date.now(),
        }));
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return { state, refresh };
}

// ── Public hooks ──────────────────────────────────────────

export interface UseAgentRosterResult {
  roster: AthletePublicProfile[];
  total: number;
  loading: boolean;
  error: Error | null;
  source: AgentDataSource;
  refresh: () => void;
}

export function useAgentRoster(): UseAgentRosterResult {
  const { state, refresh } = useAsync(
    { athletes: [] as AthletePublicProfile[], total: 0 },
    (signal) => agentApi.getRoster({ signal }),
    [],
  );
  return {
    roster: state.data.athletes,
    total: state.data.total,
    loading: state.loading,
    error: state.error,
    source: state.source,
    refresh,
  };
}

export interface UseAgentInboundOffersResult {
  offers: OpenDealApplication[];
  loading: boolean;
  error: Error | null;
  source: AgentDataSource;
  refresh: () => void;
}

export function useAgentInboundOffers(
  athleteIds: string[],
): UseAgentInboundOffersResult {
  // Stable cache key so identical id arrays don't refetch on each render.
  const key = athleteIds.join('|');
  const { state, refresh } = useAsync<OpenDealApplication[]>(
    [],
    (signal) => agentApi.getInboundOffers(athleteIds, { signal }),
    [key],
  );
  return {
    offers: state.data,
    loading: state.loading,
    error: state.error,
    source: state.source,
    refresh,
  };
}

export interface UseAgentActiveDealsResult {
  deals: NilDealRecord[];
  loading: boolean;
  error: Error | null;
  source: AgentDataSource;
  refresh: () => void;
}

export function useAgentActiveDeals(
  athleteIds: string[],
): UseAgentActiveDealsResult {
  const key = athleteIds.join('|');
  const { state, refresh } = useAsync<NilDealRecord[]>(
    [],
    (signal) =>
      agentApi.getActiveDeals({
        athleteIds: athleteIds.length > 0 ? athleteIds : undefined,
        signal,
      }),
    [key],
  );
  return {
    deals: state.data,
    loading: state.loading,
    error: state.error,
    source: state.source,
    refresh,
  };
}

export interface UseAgentCommissionRollupResult {
  rollup: CommissionRollup | null;
  loading: boolean;
  source: AgentDataSource;
}

export function useAgentCommissionRollup(
  athleteIds: string[],
): UseAgentCommissionRollupResult {
  const key = athleteIds.join('|');
  const { state } = useAsync<CommissionRollup | null>(
    null,
    (signal) => agentApi.getCommissionRollup(athleteIds, { signal }),
    [key],
  );
  return {
    rollup: state.data,
    loading: state.loading,
    source: state.source,
  };
}
