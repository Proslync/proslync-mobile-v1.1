import { useQuery } from '@tanstack/react-query';

import {
  getBackendBaseUrl,
  getBackendModeLabel,
  isBackendReachable,
  proslyncApi,
  type ProslyncBackendHealth,
} from '@/lib/api/proslync';

export const PROSLYNC_BACKEND_HEALTH_KEY = 'proslync-backend-health';

export type ProslyncBackendStatus =
  | { state: 'mock'; baseUrl: string; mode: 'mock' }
  | {
      state: 'connecting';
      baseUrl: string;
      mode: 'fallback' | 'live';
    }
  | {
      state: 'connected';
      baseUrl: string;
      mode: 'fallback' | 'live';
      health: ProslyncBackendHealth;
      lastCheckedAt: number;
    }
  | {
      state: 'unreachable';
      baseUrl: string;
      mode: 'fallback' | 'live';
      error: string;
      lastCheckedAt: number;
    };

/**
 * Polls the Proslync backend `/api/health` endpoint when running in
 * non-mock mode. Returns a discriminated status the UI can render.
 *
 * In mock mode it short-circuits to `{ state: 'mock' }` without any
 * network traffic — keeps demo runs offline-safe.
 */
export function useProslyncBackendHealth() {
  const reachable = isBackendReachable();
  const mode = getBackendModeLabel();
  const baseUrl = getBackendBaseUrl();

  const query = useQuery({
    queryKey: [PROSLYNC_BACKEND_HEALTH_KEY, baseUrl, mode],
    queryFn: () => proslyncApi.getBackendHealth(),
    enabled: reachable,
    refetchInterval: reachable ? 15_000 : false,
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 8_000,
    gcTime: 60_000,
  });

  let status: ProslyncBackendStatus;
  if (!reachable) {
    status = { state: 'mock', baseUrl, mode: 'mock' };
  } else if (query.data) {
    status = {
      state: 'connected',
      baseUrl,
      mode: mode as 'fallback' | 'live',
      health: query.data,
      lastCheckedAt: query.dataUpdatedAt,
    };
  } else if (query.error) {
    status = {
      state: 'unreachable',
      baseUrl,
      mode: mode as 'fallback' | 'live',
      error: query.error instanceof Error ? query.error.message : String(query.error),
      lastCheckedAt: query.errorUpdatedAt,
    };
  } else {
    status = {
      state: 'connecting',
      baseUrl,
      mode: mode as 'fallback' | 'live',
    };
  }

  return {
    status,
    refresh: query.refetch,
    isFetching: query.isFetching,
  };
}
