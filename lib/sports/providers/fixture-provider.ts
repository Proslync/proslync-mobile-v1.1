// ── FIXTURE PROVIDER ──────────────────────────────────────
// Reads from hand-authored fixtures. Used when isDemoMode() is true,
// and as the fallback when the live provider throws.

import type {
  NcaaGameCollection,
  NcaaGameSport,
} from '@/lib/types/explore.types';
import { AP25_SEEDS } from '@/lib/data/ap25-seeds';
import { FAN_GAMES } from '@/lib/data/mock-fan-data';
import { ATHLETE_CATALOG } from '@/lib/dev/datasets/athlete-catalog';
import { SCHOOL_CATALOG } from '@/lib/dev/datasets/school-catalog';
import { MOCK_VENUES } from '@/lib/data/mock-venues';
import type {
  AthleteBioOverlay,
  RankingsResult,
  RankingsScope,
  ScheduledGame,
  SportsDataProvider,
  TeamMeta,
} from '@/lib/sports/sports-data-provider';

const NOW_ISO = '2026-05-10T00:00:00.000Z';

function fixtureScoreboard(
  sport: NcaaGameSport,
  date: Date,
): NcaaGameCollection {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const isoDate = `${yyyy}-${mm}-${dd}`;
  const games = FAN_GAMES.filter((g) => g.status === 'live' || g.status === 'final').map(
    (g, i) => ({
      id: `fixture-${g.id}`,
      sport,
      startDateISO: isoDate,
      startTimeLabel: g.tipoff ?? (g.status === 'live' ? `${g.quarter} ${g.clock}` : 'Final'),
      startTimeEpoch: Date.now() - i * 60 * 60 * 1000,
      state: g.status === 'live' ? ('live' as const) : ('final' as const),
      periodLabel: g.quarter ?? (g.status === 'final' ? 'Final' : ''),
      clockLabel: g.clock ?? '0:00',
      finalMessage: g.status === 'final' ? 'Final' : '',
      away: {
        shortName: g.away,
        abbreviation: g.away.slice(0, 3).toUpperCase(),
        seo: g.away.toLowerCase().replace(/\s+/g, '-'),
        conferenceSeo: '',
        score: g.awayScore,
        isWinner: (g.awayScore ?? 0) > (g.homeScore ?? 0),
      },
      home: {
        shortName: g.home,
        abbreviation: g.home.slice(0, 3).toUpperCase(),
        seo: g.home.toLowerCase().replace(/\s+/g, '-'),
        conferenceSeo: '',
        score: g.homeScore,
        isWinner: (g.homeScore ?? 0) > (g.awayScore ?? 0),
      },
      source: {
        id: `fixture:${g.id}`,
        label: 'Synthetic — FAN_GAMES fixture',
        kind: 'synthetic' as const,
        retrievedAt: NOW_ISO,
        freshnessDays: 0,
      },
    }),
  );
  return {
    sport,
    date: isoDate,
    sourceUpdatedAt: NOW_ISO,
    games,
  };
}

function fixtureRankings(scope: RankingsScope): RankingsResult | null {
  const seed = AP25_SEEDS[scope.sport];
  if (!seed) return null;
  return seed;
}

function fixtureTeam(schoolId: string): TeamMeta | null {
  const school = SCHOOL_CATALOG.find((s) => s.id === schoolId);
  if (!school) return null;
  return {
    schoolId: school.id,
    name: school.name,
    conferenceSeo: school.conference.toLowerCase().replace(/\s+/g, '-'),
    primaryColorHex: school.color,
    logoSlug: undefined,
  };
}

function fixtureSchedule(schoolId: string): ScheduledGame[] {
  // Accept both `school-syracuse` (mock-venues style) and `sc-syracuse`
  // (school-catalog style) by stripping the prefix and matching on slug.
  const slug = schoolId.replace(/^(sc-|school-)/, '');
  const venuesForSchool = MOCK_VENUES.filter(
    (v) => v.school?.id.endsWith(slug) || v.school?.seo === slug,
  );
  if (venuesForSchool.length === 0) return [];
  const primary = venuesForSchool[0];
  const homeShort = primary.school?.name.split(' ')[0] ?? 'Home';
  return [
    {
      id: `${schoolId}-sch-1`,
      startDateISO: '2026-06-12',
      startTimeLabel: '7:30 PM',
      homeShortName: homeShort,
      awayShortName: 'Opponent A',
      venue: primary.name,
    },
    {
      id: `${schoolId}-sch-2`,
      startDateISO: '2026-06-18',
      startTimeLabel: '8:00 PM',
      homeShortName: 'Opponent B',
      awayShortName: homeShort,
      venue: undefined,
    },
    {
      id: `${schoolId}-sch-3`,
      startDateISO: '2026-06-26',
      startTimeLabel: '9:00 PM',
      homeShortName: homeShort,
      awayShortName: 'Opponent C',
      venue: primary.name,
    },
  ];
}

function fixtureAthleteBio(athleteId: string): AthleteBioOverlay | null {
  const athlete = ATHLETE_CATALOG.find((a) => a.id === athleteId);
  if (!athlete) return null;
  return {
    athleteId: athlete.id,
    schoolName: athlete.school,
    classYear: athlete.classYear,
    position: undefined,
    height: undefined,
    hometown: undefined,
    sourceKind: 'fixture',
    sourceLabel: 'Synthetic — ATHLETE_CATALOG fixture',
    retrievedAt: NOW_ISO,
  };
}

export const fixtureProvider: SportsDataProvider = {
  async getScoreboard(sport, date = new Date()) {
    return fixtureScoreboard(sport, date);
  },
  async getRankings(scope) {
    return fixtureRankings(scope);
  },
  async getTeam(schoolId) {
    return fixtureTeam(schoolId);
  },
  async getSchedule(schoolId) {
    return fixtureSchedule(schoolId);
  },
  async getAthleteBio(athleteId) {
    return fixtureAthleteBio(athleteId);
  },
};
