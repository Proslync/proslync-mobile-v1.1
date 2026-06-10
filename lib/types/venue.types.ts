// ── PROSLYNC VENUE TYPES ──────────────────────────────────
// Schema groundwork for the Map track (Explore-track Phase 4). Venues
// anchor games to a geo point so the Mapbox primitive — landing in the
// next slice — can render markers, clusters, and venue-detail cards on
// top of the same daily ncaa-api scoreboard data.
//
// Data sourcing posture (per PLAN.md §5b cross-poll guardrails):
//   - Every `Venue` carries an explicit `source: ComparableDealSourceRef`
//     so freshness + reviewer-state can render the same TrustMeta
//     primitive the deal-detail surface uses.
//   - Today's fixture file (`lib/data/mock-venues.ts`) tags every row as
//     `kind: 'synthetic'` per the `mock-deal-comps.ts` precedent. No
//     scraped venue source is approved yet.
//   - Lat/lon are approximated to the campus centroid. The
//     `VenueGeo.precision` field is the trust signal — the Map can downrank
//     `campus-centroid` markers vs. future `exact` rows when those land.
//   - Backend swap-ready: `venuesApi.getVenues()` returns the same
//     `Venue[]` shape regardless of whether the source is the fixture
//     module or a proslync-backend `/api/venues` endpoint.
//
// Money / numeric conventions match the prior schemas:
//   - `capacity` is an integer seat count (no float drift).
//   - Lat/lon are decimal degrees (WGS84). South/west are negative.

import type { ComparableDealSourceRef } from '@/lib/types/comparable-deal.types';

/** Venue kind — broad enough to cover NCAA D1 fixture surface. */
export type VenueKind =
  | 'arena'
  | 'stadium'
  | 'field'
  | 'pool'
  | 'track'
  | 'court'
  | 'rink'
  | 'multi-purpose';

/** Geo coordinate with an explicit precision flag for trust rendering. */
export interface VenueGeo {
  /** Latitude in decimal degrees (WGS84). */
  lat: number;
  /** Longitude in decimal degrees (WGS84). */
  lon: number;
  /** Precision tier — `exact` is reserved for verified survey-grade rows. */
  precision: 'exact' | 'campus-centroid' | 'city-centroid';
}

/** School ref slim enough to embed inside a `Venue`. */
export interface VenueSchoolRef {
  id: string;
  name: string;
  /** ncaa-api `seo` slug, e.g. "syracuse", "kansas". */
  seo: string;
  /** Conference slug e.g. "acc", "big-12", "ivy-league". */
  conferenceSeo: string;
}

/** Address surface — readable city/state/country only. */
export interface VenueAddress {
  city: string;
  state: string;
  country: string;
}

export interface Venue {
  id: string;
  name: string;
  kind: VenueKind;
  /** Tied to a school when natural. Some venues are city-owned, hence optional. */
  school?: VenueSchoolRef;
  geo: VenueGeo;
  /** Integer seat count. Undefined when not on record. */
  capacity?: number;
  address?: VenueAddress;
  /** Optional remote image URL — fixtures may use placeholder/SVG-free assets. */
  image?: string;
  /** Provenance — every venue datum carries source + freshness. */
  source: ComparableDealSourceRef;
}

export interface VenueCollection {
  /** ISO 8601 timestamp the collection was projected at. */
  fetchedAt: string;
  venues: Venue[];
}
