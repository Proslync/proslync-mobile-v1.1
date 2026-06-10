// ── MOCK VENUE FIXTURES ───────────────────────────────────
// Hand-authored fixtures for ~14 prominent NCAA venues tied to schools
// that already appear in the mock data graph (mock-brand-data,
// mock-nil-manager-data, NIL Manager seed feed).
//
// Per PLAN §5b: public venue scraping (Sports Reference, Wikidata, etc.)
// is not yet cleared for Proslync ingestion, so every row is tagged
// `kind: 'synthetic'` on the source ref — matches the precedent set by
// `mock-deal-comps.ts`. Lat/lon are approximated to the campus centroid;
// the `VenueGeo.precision` field signals that to the Map UI. Once a
// licensed venue source clears legal review, this module will be swapped
// for the proslync-backend `/api/venues` endpoint without touching the
// `Venue` shape.
//
// Capacity figures are widely-published, integer-only, and rounded to the
// nearest published official number at time of authoring. They are not
// audit-grade and should not be cited externally.

import type { Venue } from '@/lib/types/venue.types';

const NOW_ISO = '2026-05-10T00:00:00.000Z';

const SYNTHETIC_CAVEAT =
  'Hand-authored fixture for the Proslync demo. Lat/lon is campus-centroid, not exact site survey. Replace with reviewer-approved venue source before any external presentation.';

function syntheticSource(id: string, label: string) {
  return {
    id: `synthetic:venue:${id}`,
    label,
    kind: 'synthetic' as const,
    retrievedAt: NOW_ISO,
    freshnessDays: 0,
    caveat: SYNTHETIC_CAVEAT,
  };
}

export const MOCK_VENUES: Venue[] = [
  {
    id: 'venue-jma-wireless',
    name: 'JMA Wireless Dome',
    kind: 'multi-purpose',
    school: {
      id: 'school-syracuse',
      name: 'Syracuse University',
      seo: 'syracuse',
      conferenceSeo: 'acc',
    },
    geo: { lat: 43.0364, lon: -76.1361, precision: 'campus-centroid' },
    capacity: 49262,
    address: { city: 'Syracuse', state: 'NY', country: 'USA' },
    source: syntheticSource('jma-wireless', 'Synthetic — JMA Wireless Dome'),
  },
  {
    id: 'venue-jpj-arena',
    name: 'John Paul Jones Arena',
    kind: 'arena',
    school: {
      id: 'school-virginia',
      name: 'University of Virginia',
      seo: 'virginia',
      conferenceSeo: 'acc',
    },
    geo: { lat: 38.0464, lon: -78.5119, precision: 'campus-centroid' },
    capacity: 14593,
    address: { city: 'Charlottesville', state: 'VA', country: 'USA' },
    source: syntheticSource('jpj-arena', 'Synthetic — John Paul Jones Arena'),
  },
  {
    id: 'venue-bramlage',
    name: 'Bramlage Coliseum',
    kind: 'arena',
    school: {
      id: 'school-kansas-state',
      name: 'Kansas State University',
      seo: 'kansas-st',
      conferenceSeo: 'big-12',
    },
    geo: { lat: 39.1974, lon: -96.5847, precision: 'campus-centroid' },
    capacity: 12528,
    address: { city: 'Manhattan', state: 'KS', country: 'USA' },
    source: syntheticSource('bramlage', 'Synthetic — Bramlage Coliseum'),
  },
  {
    id: 'venue-cameron',
    name: 'Cameron Indoor Stadium',
    kind: 'arena',
    school: {
      id: 'school-duke',
      name: 'Duke University',
      seo: 'duke',
      conferenceSeo: 'acc',
    },
    geo: { lat: 36.0019, lon: -78.9417, precision: 'campus-centroid' },
    capacity: 9314,
    address: { city: 'Durham', state: 'NC', country: 'USA' },
    source: syntheticSource('cameron', 'Synthetic — Cameron Indoor Stadium'),
  },
  {
    id: 'venue-allen-fieldhouse',
    name: 'Allen Fieldhouse',
    kind: 'arena',
    school: {
      id: 'school-kansas',
      name: 'University of Kansas',
      seo: 'kansas',
      conferenceSeo: 'big-12',
    },
    geo: { lat: 38.9543, lon: -95.2522, precision: 'campus-centroid' },
    capacity: 16300,
    address: { city: 'Lawrence', state: 'KS', country: 'USA' },
    source: syntheticSource('allen-fieldhouse', 'Synthetic — Allen Fieldhouse'),
  },
  {
    id: 'venue-galen-center',
    name: 'Galen Center',
    kind: 'arena',
    school: {
      id: 'school-usc',
      name: 'University of Southern California',
      seo: 'southern-california',
      conferenceSeo: 'big-ten',
    },
    geo: { lat: 34.0231, lon: -118.2856, precision: 'campus-centroid' },
    capacity: 10258,
    address: { city: 'Los Angeles', state: 'CA', country: 'USA' },
    source: syntheticSource('galen', 'Synthetic — Galen Center'),
  },
  {
    id: 'venue-pauley-pavilion',
    name: 'Pauley Pavilion',
    kind: 'arena',
    school: {
      id: 'school-ucla',
      name: 'University of California, Los Angeles',
      seo: 'ucla',
      conferenceSeo: 'big-ten',
    },
    geo: { lat: 34.0707, lon: -118.4467, precision: 'campus-centroid' },
    capacity: 13800,
    address: { city: 'Los Angeles', state: 'CA', country: 'USA' },
    source: syntheticSource('pauley', 'Synthetic — Pauley Pavilion'),
  },
  {
    id: 'venue-hinkle-fieldhouse',
    name: 'Hinkle Fieldhouse',
    kind: 'arena',
    school: {
      id: 'school-butler',
      name: 'Butler University',
      seo: 'butler',
      conferenceSeo: 'big-east',
    },
    geo: { lat: 39.8418, lon: -86.1717, precision: 'campus-centroid' },
    capacity: 9100,
    address: { city: 'Indianapolis', state: 'IN', country: 'USA' },
    source: syntheticSource('hinkle', 'Synthetic — Hinkle Fieldhouse'),
  },
  {
    id: 'venue-mcguirk',
    name: 'McGuirk Alumni Stadium',
    kind: 'stadium',
    school: {
      id: 'school-umass',
      name: 'University of Massachusetts Amherst',
      seo: 'massachusetts',
      conferenceSeo: 'mac',
    },
    geo: { lat: 42.3868, lon: -72.5375, precision: 'campus-centroid' },
    capacity: 17000,
    address: { city: 'Amherst', state: 'MA', country: 'USA' },
    source: syntheticSource('mcguirk', 'Synthetic — McGuirk Alumni Stadium'),
  },
  {
    id: 'venue-cassell',
    name: 'Cassell Coliseum',
    kind: 'arena',
    school: {
      id: 'school-virginia-tech',
      name: 'Virginia Tech',
      seo: 'virginia-tech',
      conferenceSeo: 'acc',
    },
    geo: { lat: 37.2218, lon: -80.4192, precision: 'campus-centroid' },
    capacity: 9275,
    address: { city: 'Blacksburg', state: 'VA', country: 'USA' },
    source: syntheticSource('cassell', 'Synthetic — Cassell Coliseum'),
  },
  {
    id: 'venue-williams-brice',
    name: 'Williams-Brice Stadium',
    kind: 'stadium',
    school: {
      id: 'school-south-carolina',
      name: 'University of South Carolina',
      seo: 'south-carolina',
      conferenceSeo: 'sec',
    },
    geo: { lat: 33.9731, lon: -81.0192, precision: 'campus-centroid' },
    capacity: 77559,
    address: { city: 'Columbia', state: 'SC', country: 'USA' },
    source: syntheticSource('williams-brice', 'Synthetic — Williams-Brice Stadium'),
  },
  {
    id: 'venue-class-of-1952',
    name: 'Class of 1952 Stadium',
    kind: 'field',
    school: {
      id: 'school-princeton',
      name: 'Princeton University',
      seo: 'princeton',
      conferenceSeo: 'ivy-league',
    },
    geo: { lat: 40.3434, lon: -74.6515, precision: 'campus-centroid' },
    capacity: 5000,
    address: { city: 'Princeton', state: 'NJ', country: 'USA' },
    source: syntheticSource('class-1952', 'Synthetic — Class of 1952 Stadium'),
  },
  {
    id: 'venue-notre-dame-stadium',
    name: 'Notre Dame Stadium',
    kind: 'stadium',
    school: {
      id: 'school-notre-dame',
      name: 'University of Notre Dame',
      seo: 'notre-dame',
      conferenceSeo: 'acc',
    },
    geo: { lat: 41.6985, lon: -86.2336, precision: 'campus-centroid' },
    capacity: 77622,
    address: { city: 'Notre Dame', state: 'IN', country: 'USA' },
    source: syntheticSource('notre-dame-stadium', 'Synthetic — Notre Dame Stadium'),
  },
  {
    id: 'venue-jma-wireless-arena',
    name: 'JMA Wireless Arena',
    kind: 'arena',
    school: {
      id: 'school-syracuse',
      name: 'Syracuse University',
      seo: 'syracuse',
      conferenceSeo: 'acc',
    },
    geo: { lat: 43.0481, lon: -76.1532, precision: 'city-centroid' },
    capacity: 17500,
    address: { city: 'Syracuse', state: 'NY', country: 'USA' },
    source: syntheticSource('jma-wireless-arena', 'Synthetic — JMA Wireless Arena'),
  },
];
