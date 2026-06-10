// ── AP25 FIXED-WEEK SEED ──────────────────────────────────
// Fixed-week snapshot (Week 14, FY 2025-26) for men's and women's D1
// basketball. Tagged `kind: 'synthetic'` per PLAN §5b — replace with
// the AP-licensed feed once Q-source-posture clears.
//
// This snapshot deliberately does NOT auto-refresh — it is a stable
// demo baseline. The composite SportsDataProvider returns this when
// live rankings have not been wired yet.

import type { RankingsResult } from '@/lib/sports/sports-data-provider';
import type { NcaaGameSport } from '@/lib/types/explore.types';

const PUBLISHED_AT = '2026-02-24T12:00:00.000Z';

const MEN_BASKETBALL: RankingsResult = {
  sport: 'basketball-men',
  week: 14,
  publishedAt: PUBLISHED_AT,
  teams: [
    { rank: 1, schoolName: 'Duke', conferenceSeo: 'acc', recordLabel: '26-3', previousRank: 1 },
    { rank: 2, schoolName: 'Houston', conferenceSeo: 'big-12', recordLabel: '24-4', previousRank: 3 },
    { rank: 3, schoolName: 'Auburn', conferenceSeo: 'sec', recordLabel: '25-4', previousRank: 2 },
    { rank: 4, schoolName: 'Tennessee', conferenceSeo: 'sec', recordLabel: '23-5', previousRank: 4 },
    { rank: 5, schoolName: 'Florida', conferenceSeo: 'sec', recordLabel: '23-6', previousRank: 5 },
    { rank: 6, schoolName: 'Iowa State', conferenceSeo: 'big-12', recordLabel: '22-6', previousRank: 7 },
    { rank: 7, schoolName: 'Alabama', conferenceSeo: 'sec', recordLabel: '22-7', previousRank: 6 },
    { rank: 8, schoolName: 'Texas Tech', conferenceSeo: 'big-12', recordLabel: '22-6', previousRank: 8 },
    { rank: 9, schoolName: 'St. John\'s', conferenceSeo: 'big-east', recordLabel: '24-4', previousRank: 11 },
    { rank: 10, schoolName: 'Michigan State', conferenceSeo: 'big-ten', recordLabel: '21-7', previousRank: 10 },
    { rank: 11, schoolName: 'Marquette', conferenceSeo: 'big-east', recordLabel: '21-7', previousRank: 9 },
    { rank: 12, schoolName: 'Kentucky', conferenceSeo: 'sec', recordLabel: '20-8', previousRank: 13 },
    { rank: 13, schoolName: 'Wisconsin', conferenceSeo: 'big-ten', recordLabel: '21-7', previousRank: 14 },
    { rank: 14, schoolName: 'Syracuse', conferenceSeo: 'acc', recordLabel: '20-8', previousRank: 16 },
    { rank: 15, schoolName: 'UConn', conferenceSeo: 'big-east', recordLabel: '20-9', previousRank: 12 },
    { rank: 16, schoolName: 'Michigan', conferenceSeo: 'big-ten', recordLabel: '20-7', previousRank: 17 },
    { rank: 17, schoolName: 'Memphis', conferenceSeo: 'aac', recordLabel: '23-5', previousRank: 15 },
    { rank: 18, schoolName: 'Saint Mary\'s', conferenceSeo: 'wcc', recordLabel: '24-5', previousRank: 19 },
    { rank: 19, schoolName: 'Texas A&M', conferenceSeo: 'sec', recordLabel: '19-9', previousRank: 18 },
    { rank: 20, schoolName: 'BYU', conferenceSeo: 'big-12', recordLabel: '20-8', previousRank: 22 },
    { rank: 21, schoolName: 'Kansas', conferenceSeo: 'big-12', recordLabel: '19-9', previousRank: 20 },
    { rank: 22, schoolName: 'Louisville', conferenceSeo: 'acc', recordLabel: '22-7', previousRank: 23 },
    { rank: 23, schoolName: 'Maryland', conferenceSeo: 'big-ten', recordLabel: '20-7', previousRank: 21 },
    { rank: 24, schoolName: 'Missouri', conferenceSeo: 'sec', recordLabel: '19-9', previousRank: 25 },
    { rank: 25, schoolName: 'Mississippi', conferenceSeo: 'sec', recordLabel: '20-8', previousRank: 24 },
  ],
  sourceLabel: 'Synthetic AP25 snapshot · Week 14 FY 2025-26',
  sourceKind: 'synthetic',
};

const WOMEN_BASKETBALL: RankingsResult = {
  sport: 'basketball-women',
  week: 14,
  publishedAt: PUBLISHED_AT,
  teams: [
    { rank: 1, schoolName: 'UCLA', conferenceSeo: 'big-ten', recordLabel: '28-1', previousRank: 1 },
    { rank: 2, schoolName: 'South Carolina', conferenceSeo: 'sec', recordLabel: '26-3', previousRank: 2 },
    { rank: 3, schoolName: 'USC', conferenceSeo: 'big-ten', recordLabel: '26-3', previousRank: 4 },
    { rank: 4, schoolName: 'Notre Dame', conferenceSeo: 'acc', recordLabel: '24-4', previousRank: 3 },
    { rank: 5, schoolName: 'Texas', conferenceSeo: 'sec', recordLabel: '27-2', previousRank: 5 },
    { rank: 6, schoolName: 'LSU', conferenceSeo: 'sec', recordLabel: '25-4', previousRank: 7 },
    { rank: 7, schoolName: 'UConn', conferenceSeo: 'big-east', recordLabel: '24-4', previousRank: 6 },
    { rank: 8, schoolName: 'Oklahoma', conferenceSeo: 'sec', recordLabel: '23-5', previousRank: 8 },
    { rank: 9, schoolName: 'NC State', conferenceSeo: 'acc', recordLabel: '23-5', previousRank: 10 },
    { rank: 10, schoolName: 'Kansas State', conferenceSeo: 'big-12', recordLabel: '23-5', previousRank: 9 },
    { rank: 11, schoolName: 'TCU', conferenceSeo: 'big-12', recordLabel: '25-4', previousRank: 12 },
    { rank: 12, schoolName: 'Maryland', conferenceSeo: 'big-ten', recordLabel: '22-6', previousRank: 11 },
    { rank: 13, schoolName: 'Ohio State', conferenceSeo: 'big-ten', recordLabel: '22-5', previousRank: 13 },
    { rank: 14, schoolName: 'Tennessee', conferenceSeo: 'sec', recordLabel: '21-7', previousRank: 14 },
    { rank: 15, schoolName: 'Duke', conferenceSeo: 'acc', recordLabel: '22-6', previousRank: 16 },
    { rank: 16, schoolName: 'North Carolina', conferenceSeo: 'acc', recordLabel: '22-6', previousRank: 15 },
    { rank: 17, schoolName: 'Kentucky', conferenceSeo: 'sec', recordLabel: '20-7', previousRank: 17 },
    { rank: 18, schoolName: 'Michigan State', conferenceSeo: 'big-ten', recordLabel: '21-6', previousRank: 18 },
    { rank: 19, schoolName: 'Alabama', conferenceSeo: 'sec', recordLabel: '21-7', previousRank: 19 },
    { rank: 20, schoolName: 'Louisville', conferenceSeo: 'acc', recordLabel: '20-7', previousRank: 21 },
    { rank: 21, schoolName: 'West Virginia', conferenceSeo: 'big-12', recordLabel: '21-7', previousRank: 22 },
    { rank: 22, schoolName: 'Iowa', conferenceSeo: 'big-ten', recordLabel: '20-8', previousRank: 20 },
    { rank: 23, schoolName: 'Cal', conferenceSeo: 'acc', recordLabel: '21-7', previousRank: 24 },
    { rank: 24, schoolName: 'Mississippi State', conferenceSeo: 'sec', recordLabel: '21-7', previousRank: 25 },
    { rank: 25, schoolName: 'Florida State', conferenceSeo: 'acc', recordLabel: '21-7', previousRank: 23 },
  ],
  sourceLabel: 'Synthetic AP25 W-Bball snapshot · Week 14 FY 2025-26',
  sourceKind: 'synthetic',
};

export const AP25_SEEDS: Partial<Record<NcaaGameSport, RankingsResult>> = {
  'basketball-men': MEN_BASKETBALL,
  'basketball-women': WOMEN_BASKETBALL,
};
