/**
 * Compile-time + lightweight runtime contract guards for the fan public
 * API client. The repo has no JS test runner — this file is exercised by
 * `npx tsc --noEmit`. The `runRuntimeChecks` block at the bottom is also
 * safe to invoke from a one-off node script; nothing here imports
 * React Native runtime modules.
 */

import {
  buildExploreUrl,
  explorePublicApi,
  explorePublicEmpties,
  type CachedGame,
  type FanSearchResult,
  type GamesEnvelope,
  type SchoolsEnvelope,
  type SchoolPin,
  type Venue,
  type SchoolGeoWithVenue,
} from '../public';

// ── Type-shape guards (compile-time) ───────────────────────

const _envelopeShape: GamesEnvelope = explorePublicEmpties.games;
const _schoolsShape: SchoolsEnvelope = explorePublicEmpties.schools;
const _searchShape: FanSearchResult = explorePublicEmpties.search;

const _gameField: CachedGame['sourceTier'] = 'live-data';
const _venueIndoor: Venue['indoor'] = null;
const _pinLatitude: SchoolPin['latitude'] = 0;
const _schoolWithVenueShape: SchoolGeoWithVenue | null = null;
void _envelopeShape;
void _schoolsShape;
void _searchShape;
void _gameField;
void _venueIndoor;
void _pinLatitude;
void _schoolWithVenueShape;

// ── URL builder: query-param shape ─────────────────────────

const gamesUrl = buildExploreUrl('/api/fan/games', {
  sport: 'basketball-men',
  date: '2026-05-10',
});
if (
  !gamesUrl.includes('sport=basketball-men') ||
  !gamesUrl.includes('date=2026-05-10') ||
  !gamesUrl.includes('/api/fan/games')
) {
  throw new Error(`fan-public: getGames URL malformed: ${gamesUrl}`);
}

const emptyParamUrl = buildExploreUrl('/api/fan/games', {
  sport: 'basketball-men',
  date: undefined,
});
if (emptyParamUrl.includes('date=')) {
  throw new Error('fan-public: undefined param leaked into URL');
}

const mapUrl = buildExploreUrl('/api/fan/map/pins', {
  bbox: [24.5, -125, 49.5, -66].join(','),
});
if (!mapUrl.includes('bbox=24.5%2C-125%2C49.5%2C-66')) {
  throw new Error(`fan-public: map bbox URL malformed: ${mapUrl}`);
}

// ── Empty-query search short-circuit (no fetch fired) ──────

(async () => {
  // Spy on global fetch — if the empty-string short-circuit is removed
  // this will throw because the harness fetch is unset.
  let fetchCount = 0;
  const realFetch = (globalThis as { fetch?: typeof fetch }).fetch;
  (globalThis as { fetch: typeof fetch }).fetch = (async () => {
    fetchCount += 1;
    throw new Error('search should not call fetch for empty query');
  }) as typeof fetch;
  try {
    const result = await explorePublicApi.search('   ');
    if (result.data.schools.length !== 0 || result.data.athletes.length !== 0) {
      throw new Error('fan-public: empty search did not return empty result');
    }
    if (fetchCount !== 0) {
      throw new Error('fan-public: empty search fired a fetch');
    }
  } finally {
    if (realFetch) (globalThis as { fetch?: typeof fetch }).fetch = realFetch;
  }
})().catch((err) => {
  // Surface failures at module load time when tsc/ts-node executes.
  throw err;
});
