// ── PROSLYNC FAN PUBLIC API CLIENT ─────────────────────────
// Phase 1 Slice D — typed wrappers around the unauth `/api/fan/*`
// endpoints exposed by `proslync-backend` (Slice C).
//
// Posture per the architectural plan (§3f):
//   • All endpoints public — no Authorization header attached.
//   • Backend rate-limits 60 req/min/IP for unauth GETs and emits
//     `Cache-Control: public, max-age=45` headers we let the network
//     stack honor.
//   • UI surfaces the `sourceTier` field on every games response so
//     "live-data" vs "mock-data" is visible (Slice C's contract).
//
// Network posture: bypasses the shared apiClient so the Bearer token
// is never attached (apiClient eagerly hydrates a mock token in demo
// mode and would leak it onto the public endpoints). Single-resource
// 404/network errors return `null`; list endpoints return empty
// envelopes. Nothing throws to the UI.

import { config } from '@/lib/config';

// ── Domain types (mirror backend src/db/schema-fan/*.ts) ───

/** Mirrors `EvidenceTier` from `src/db/schema/governance.ts` on the
 * backend so fan-side games carry the same trust posture as pro-side
 * stats (see §6c of the conceptual plan). */
export type FanSourceTier =
  | 'live-data'
  | 'mock-data'
  | 'source-requirement'
  | 'product-doctrine'
  | 'blocked-unverified';

export type CachedGameStatus =
  | 'scheduled'
  | 'live'
  | 'final'
  | 'postponed'
  | 'cancelled'
  | 'unknown';

export interface CachedGame {
  id: string;
  sport: string;
  homeSchoolId: string | null;
  awaySchoolId: string | null;
  homeSchoolName: string | null;
  awaySchoolName: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: CachedGameStatus;
  period: string | null;
  clock: string | null;
  venueId: string | null;
  venueName: string | null;
  scheduledAt: string;
  lastSyncedAt: string;
  sourceId: string;
  source: string;
  sourceTier: FanSourceTier;
}

export interface SchoolGeo {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
  conference: string | null;
  state: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  logoUrl: string | null;
  homeVenueId: string | null;
}

export interface Venue {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  capacity: number | null;
  schoolId: string | null;
  surface: string | null;
  indoor: boolean | null;
}

export interface SchoolGeoWithVenue extends SchoolGeo {
  homeVenue?: Venue;
}

export interface SchoolPin {
  id: string;
  name: string;
  slug: string;
  state: string | null;
  latitude: number;
  longitude: number;
  gameIds: string[];
}

export interface GameVenuePin {
  gameId: string;
  venueId: string;
  venueName: string;
  latitude: number;
  longitude: number;
  status: CachedGameStatus;
  homeSchoolName: string | null;
  awaySchoolName: string | null;
  scheduledAt: string;
}

export interface FanSearchAthlete {
  // Phase 1 returns []; reserved shape for Phase 2.
  id: string;
  name: string;
  schoolId: string | null;
}

export interface FanSearchResult {
  data: {
    schools: SchoolGeo[];
    venues: Venue[];
    athletes: FanSearchAthlete[];
  };
}

export interface GamesEnvelope {
  data: CachedGame[];
  cachedAt: string;
  sourceTier: FanSourceTier | string;
}

export interface SchoolsEnvelope {
  data: SchoolGeo[];
  nextCursor: string | null;
}

export interface VenuesEnvelope {
  data: Venue[];
}

export interface MapPinsEnvelope {
  data: {
    schools: SchoolPin[];
    gameVenues: GameVenuePin[];
  };
}

// ── Empty defaults (returned on error) ─────────────────────

const EMPTY_GAMES: GamesEnvelope = {
  data: [],
  cachedAt: new Date(0).toISOString(),
  sourceTier: 'blocked-unverified',
};

const EMPTY_SCHOOLS: SchoolsEnvelope = { data: [], nextCursor: null };
const EMPTY_VENUES: VenuesEnvelope = { data: [] };
const EMPTY_MAP_PINS: MapPinsEnvelope = { data: { schools: [], gameVenues: [] } };
const EMPTY_SEARCH: FanSearchResult = { data: { schools: [], venues: [], athletes: [] } };

// ── Fetch helper ───────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 8000;

interface FetchOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

// Dev-only one-shot log so QA can see which host the fan client targets.
let __loggedFanHost = false;
function logFanHostOnce(base: string): void {
  if (__loggedFanHost) return;
  __loggedFanHost = true;
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.info(`[explorePublicApi] base URL → ${base}`);
  }
}

/** Build absolute URL against the configured backend base + append
 * defined query params. Empty / undefined / null values are dropped so
 * callers can pass shapes like `{ sport, date }` without conditional
 * spreads. */
export function buildExploreUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): string {
  const base = config.api.fanBaseUrl || 'http://localhost:3020';
  logFanHostOnce(base);
  const url = new URL(path.startsWith('/') ? path : `/${path}`, base);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function fetchJson<T>(
  url: string,
  fallback: T,
  options: FetchOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const userSignal = options.signal;
  const onUserAbort = () => controller.abort();
  if (userSignal) {
    if (userSignal.aborted) controller.abort();
    else userSignal.addEventListener('abort', onUserAbort);
  }
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      if (__DEV__) {
        console.warn(`[explorePublicApi] ${response.status} ${url}`);
      }
      return fallback;
    }
    const payload = (await response.json()) as T;
    return payload;
  } catch (error) {
    // AbortError on unmount is expected; don't spam.
    const isAbort =
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name?: string }).name === 'AbortError';
    if (!isAbort && __DEV__) {
      console.warn('[explorePublicApi] network error', url, error);
    }
    return fallback;
  } finally {
    clearTimeout(timeout);
    if (userSignal) userSignal.removeEventListener('abort', onUserAbort);
  }
}

// ── Public API surface ─────────────────────────────────────

export interface ListGamesOptions {
  sport?: string;
  date?: string; // ISO YYYY-MM-DD
  signal?: AbortSignal;
}

export interface ListSchoolsOptions {
  state?: string;
  conference?: string;
  limit?: number;
  cursor?: string;
  signal?: AbortSignal;
}

export interface ListVenuesOptions {
  state?: string;
  limit?: number;
  signal?: AbortSignal;
}

export type SearchKind = 'schools' | 'venues' | 'athletes';

export const explorePublicApi = {
  async getGames(opts: ListGamesOptions = {}): Promise<GamesEnvelope> {
    const url = buildExploreUrl('/api/fan/games', {
      sport: opts.sport,
      date: opts.date,
    });
    return fetchJson<GamesEnvelope>(url, EMPTY_GAMES, { signal: opts.signal });
  },

  async getGame(
    id: string,
    options: FetchOptions = {},
  ): Promise<CachedGame | null> {
    if (!id) return null;
    const url = buildExploreUrl(`/api/fan/games/${encodeURIComponent(id)}`);
    const envelope = await fetchJson<{ data: CachedGame } | null>(url, null, options);
    return envelope?.data ?? null;
  },

  async listSchools(opts: ListSchoolsOptions = {}): Promise<SchoolsEnvelope> {
    const url = buildExploreUrl('/api/fan/schools', {
      state: opts.state,
      conference: opts.conference,
      limit: opts.limit,
      cursor: opts.cursor,
    });
    return fetchJson<SchoolsEnvelope>(url, EMPTY_SCHOOLS, { signal: opts.signal });
  },

  async getSchool(
    id: string,
    options: FetchOptions = {},
  ): Promise<SchoolGeoWithVenue | null> {
    if (!id) return null;
    const url = buildExploreUrl(`/api/fan/schools/${encodeURIComponent(id)}`);
    const envelope = await fetchJson<{ data: SchoolGeoWithVenue } | null>(
      url,
      null,
      options,
    );
    return envelope?.data ?? null;
  },

  async listVenues(opts: ListVenuesOptions = {}): Promise<VenuesEnvelope> {
    const url = buildExploreUrl('/api/fan/venues', {
      state: opts.state,
      limit: opts.limit,
    });
    return fetchJson<VenuesEnvelope>(url, EMPTY_VENUES, { signal: opts.signal });
  },

  async getMapPins(
    bbox: [number, number, number, number],
    date?: string,
    options: FetchOptions = {},
  ): Promise<MapPinsEnvelope> {
    const url = buildExploreUrl('/api/fan/map/pins', {
      bbox: bbox.join(','),
      date,
    });
    return fetchJson<MapPinsEnvelope>(url, EMPTY_MAP_PINS, options);
  },

  async search(
    query: string,
    kinds?: SearchKind[],
    limit?: number,
    options: FetchOptions = {},
  ): Promise<FanSearchResult> {
    const trimmed = query.trim();
    if (!trimmed) return EMPTY_SEARCH;
    const url = buildExploreUrl('/api/fan/search', {
      q: trimmed,
      kind: kinds && kinds.length > 0 ? kinds.join(',') : undefined,
      limit,
    });
    return fetchJson<FanSearchResult>(url, EMPTY_SEARCH, options);
  },
};

export const explorePublicEmpties = {
  games: EMPTY_GAMES,
  schools: EMPTY_SCHOOLS,
  venues: EMPTY_VENUES,
  mapPins: EMPTY_MAP_PINS,
  search: EMPTY_SEARCH,
};
