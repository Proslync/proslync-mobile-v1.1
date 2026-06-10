// ── GAMES↔VENUES MAPPING ──────────────────────────────────
// Pure projection from `NcaaGame[]` + `Venue[]` to `GameWithVenue[]`.
// Used by the Map slice to plot today's games on a map and by the
// venues-rail card to render "Today's venues" once the rail is wired.
//
// Strategy: naive home-team match. The game's `home.seo` is compared to
// each venue's `school.seo`. We do not try to infer away-game venues —
// some NCAA tournaments are played at neutral sites we'd misattribute
// otherwise. When no match exists, the row carries `venue: null`.

import type { NcaaGame } from '@/lib/types/explore.types';
import type { Venue } from '@/lib/types/venue.types';

export interface GameWithVenue {
  game: NcaaGame;
  venue: Venue | null;
}

export function mapGamesToVenues(
  games: NcaaGame[],
  venues: Venue[],
): GameWithVenue[] {
  if (!games.length) return [];

  // Index venues by school seo once — O(n) lookup per game instead of O(n*m).
  const venueBySchoolSeo = new Map<string, Venue>();
  for (const venue of venues) {
    if (venue.school?.seo) {
      // First match wins — multiple venues per school will need a richer
      // strategy (e.g. by sport) once the fixture has them.
      if (!venueBySchoolSeo.has(venue.school.seo)) {
        venueBySchoolSeo.set(venue.school.seo, venue);
      }
    }
  }

  return games.map((game) => ({
    game,
    venue: venueBySchoolSeo.get(game.home.seo) ?? null,
  }));
}
