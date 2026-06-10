// ── USE-VENUES ───────────────────────────────────────────
// React Query hooks for the venues data layer. The Map view (next slice)
// will consume `useVenues()` and the venues-rail card consumes the same
// underlying cache.
//
// Staleness: 10 minutes — venues change infrequently. The fixture is
// stable; the staleTime is set for parity with the backend swap.

import { useQuery } from '@tanstack/react-query';

import { venuesApi } from '@/lib/api/venues';
import type { Venue, VenueCollection } from '@/lib/types/venue.types';

export const VENUES_KEY = 'venues';
export const VENUES_BY_CONFERENCE_KEY = 'venues-by-conference';

const TEN_MINUTES = 10 * 60_000;
const THIRTY_MINUTES = 30 * 60_000;

export function useVenues() {
  return useQuery<VenueCollection>({
    queryKey: [VENUES_KEY],
    queryFn: () => venuesApi.getVenues(),
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
    refetchOnWindowFocus: false,
  });
}

export function useVenuesByConference(conferenceSeo: string | undefined) {
  return useQuery<Venue[]>({
    queryKey: [VENUES_BY_CONFERENCE_KEY, conferenceSeo ?? ''],
    queryFn: () =>
      conferenceSeo
        ? venuesApi.getVenuesByConference(conferenceSeo)
        : Promise.resolve([]),
    enabled: Boolean(conferenceSeo),
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
    refetchOnWindowFocus: false,
  });
}
