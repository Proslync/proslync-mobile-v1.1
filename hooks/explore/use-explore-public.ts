// ── FAN EXPLORE HOOKS ──────────────────────────────────────
// Phase 1 Slice D — small useState/useEffect-based hooks around the
// `explorePublicApi` client. React Query is intentionally not used: the
// fan-public endpoints are public + cached by the backend (45s
// Cache-Control), so a plain fetch-on-mount + manual refresh is
// sufficient and keeps the dependency surface minimal.

import * as React from 'react';

import {
  explorePublicApi,
  explorePublicEmpties,
  type CachedGame,
  type FanSearchResult,
  type GameVenuePin,
  type SchoolGeo,
  type SchoolPin,
  type SearchKind,
} from '@/lib/api/explore/public';

// ── useExploreGames ────────────────────────────────────────────

export interface UseExploreGamesOptions {
  sport?: string;
  date?: string;
}

export interface UseExploreGamesResult {
  games: CachedGame[];
  loading: boolean;
  error: Error | null;
  cachedAt: string | null;
  sourceTier: string | null;
  refresh: () => void;
}

export function useExploreGames(opts: UseExploreGamesOptions = {}): UseExploreGamesResult {
  const { sport, date } = opts;
  const [games, setGames] = React.useState<CachedGame[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [cachedAt, setCachedAt] = React.useState<string | null>(null);
  const [sourceTier, setSourceTier] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    setError(null);
    explorePublicApi
      .getGames({ sport, date, signal: controller.signal })
      .then((env) => {
        if (cancelled) return;
        setGames(env.data);
        setCachedAt(env.cachedAt ?? null);
        setSourceTier(env.sourceTier ?? null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [sport, date, tick]);

  const refresh = React.useCallback(() => setTick((n) => n + 1), []);

  return { games, loading, error, cachedAt, sourceTier, refresh };
}

// ── useExploreSchools ──────────────────────────────────────────

export interface UseExploreSchoolsOptions {
  state?: string;
  conference?: string;
  limit?: number;
}

export interface UseExploreSchoolsResult {
  schools: SchoolGeo[];
  loading: boolean;
  nextCursor: string | null;
  loadMore: () => void;
}

export function useExploreSchools(
  opts: UseExploreSchoolsOptions = {},
): UseExploreSchoolsResult {
  const { state, conference, limit } = opts;
  const [schools, setSchools] = React.useState<SchoolGeo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const cursorRef = React.useRef<string | undefined>(undefined);
  const [version, setVersion] = React.useState(0);
  const [pageTick, setPageTick] = React.useState(0);

  // Reset when filters change.
  React.useEffect(() => {
    cursorRef.current = undefined;
    setSchools([]);
    setNextCursor(null);
    setVersion((n) => n + 1);
  }, [state, conference, limit]);

  React.useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    explorePublicApi
      .listSchools({
        state,
        conference,
        limit,
        cursor: cursorRef.current,
        signal: controller.signal,
      })
      .then((env) => {
        if (cancelled) return;
        setSchools((prev) =>
          cursorRef.current ? [...prev, ...env.data] : env.data,
        );
        setNextCursor(env.nextCursor);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [state, conference, limit, version, pageTick]);

  const loadMore = React.useCallback(() => {
    if (!nextCursor) return;
    cursorRef.current = nextCursor;
    setPageTick((n) => n + 1);
  }, [nextCursor]);

  return { schools, loading, nextCursor, loadMore };
}

// ── useExploreMapPins ──────────────────────────────────────────

export interface UseExploreMapPinsResult {
  pins: { schools: SchoolPin[]; gameVenues: GameVenuePin[] };
  loading: boolean;
}

export function useExploreMapPins(
  bbox: [number, number, number, number] | null,
  date?: string,
): UseExploreMapPinsResult {
  const [pins, setPins] = React.useState<{
    schools: SchoolPin[];
    gameVenues: GameVenuePin[];
  }>(explorePublicEmpties.mapPins.data);
  const [loading, setLoading] = React.useState(Boolean(bbox));

  // Stable key for the deps array so callers can pass freshly-constructed
  // tuples without thrashing the effect.
  const bboxKey = bbox ? bbox.join(',') : null;

  React.useEffect(() => {
    if (!bbox) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    explorePublicApi
      .getMapPins(bbox, date, { signal: controller.signal })
      .then((env) => {
        if (cancelled) return;
        setPins(env.data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bboxKey, date]);

  return { pins, loading };
}

// ── useExploreSearch (debounced) ───────────────────────────────

export interface UseExploreSearchResult {
  results: FanSearchResult;
  loading: boolean;
}

const SEARCH_DEBOUNCE_MS = 300;

/** Defensively normalize a possibly-partial search envelope into the
 * stable shape the UI expects. Any missing array becomes `[]`. */
function normalizeSearchResults(
  r: FanSearchResult | null | undefined,
): FanSearchResult {
  const data = r?.data;
  return {
    data: {
      schools: Array.isArray(data?.schools) ? data!.schools : [],
      venues: Array.isArray(data?.venues) ? data!.venues : [],
      athletes: Array.isArray(data?.athletes) ? data!.athletes : [],
    },
  };
}

export function useExploreSearch(
  query: string,
  kinds?: SearchKind[],
): UseExploreSearchResult {
  const [results, setResults] = React.useState<FanSearchResult>(
    explorePublicEmpties.search,
  );
  const [loading, setLoading] = React.useState(false);
  const kindsKey = kinds ? kinds.join(',') : '';

  React.useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(explorePublicEmpties.search);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      explorePublicApi
        .search(trimmed, kinds, undefined, { signal: controller.signal })
        .then((r) => {
          if (cancelled) return;
          setResults(normalizeSearchResults(r));
        })
        .catch(() => {
          if (cancelled) return;
          setResults(explorePublicEmpties.search);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, kindsKey]);

  return { results, loading };
}
