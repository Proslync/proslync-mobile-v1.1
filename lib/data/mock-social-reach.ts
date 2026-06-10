// ── MOCK ATHLETE SOCIAL REACH ────────────────────────────
// W25 (PLAN.md §5 P1) — hand-authored cross-platform follower fixtures
// for the three demo athletes that already appear in the brand HQ
// roster (`a-1` Kiyan Anthony, `a-2` Jordan Miles, `a-4` JJ Starling).
// Counts are synthetic — the source ref on every row carries
// `kind: 'synthetic'` and a caveat so a reviewer can tell at a glance
// these aren't pulled from a real platform sync.
//
// Aggregate totals deliberately exceed the rolled-up `followers: '1.2M'`
// strings on `BRAND_ATHLETES` because that field tracks "primary
// platform" reach; this fixture sums across every connected handle.

import type { ComparableDealSourceRef } from '@/lib/types/comparable-deal.types';
import type {
  AthleteSocialReach,
  PlatformReach,
  SocialPlatform,
} from '@/lib/types/social-reach.types';

const SYNC_ISO = '2026-05-09T14:00:00.000Z';

const SOURCE_NOTE =
  'Counts updated weekly. Engagement = avg likes per post / followers.';

function syntheticSource(
  platform: SocialPlatform,
  freshnessDays: number,
): ComparableDealSourceRef {
  return {
    id: `src:social-reach:${platform}`,
    label: `Synthetic ${platform} reach v0`,
    kind: 'synthetic',
    retrievedAt: SYNC_ISO,
    freshnessDays,
    caveat:
      'Hand-authored fixture — replace with the platform-sync worker once OAuth handoff lands.',
  };
}

function row(
  platform: SocialPlatform,
  handle: string,
  followers: number,
  verified: boolean,
  freshnessDays: number,
  lastUpdatedAt: string,
): PlatformReach {
  return {
    platform,
    handle,
    followers,
    verified,
    lastUpdatedAt,
    source: syntheticSource(platform, freshnessDays),
  };
}

const FIXTURE: Record<string, AthleteSocialReach> = {
  // Kiyan Anthony — high-reach Syracuse PG, NBA-legacy halo on IG.
  'a-1': {
    athleteId: 'a-1',
    totalFollowers: 1_200_000 + 845_000 + 312_000 + 198_000 + 64_500,
    engagementRate7d: 0.052,
    lastSyncedAt: SYNC_ISO,
    sourceNote: SOURCE_NOTE,
    platforms: [
      row('instagram', 'kiyananthony', 1_200_000, true, 1, '2026-05-08T14:00:00.000Z'),
      row('tiktok', 'kiyan', 845_000, true, 1, '2026-05-08T14:00:00.000Z'),
      row('twitter', 'kiyananthony1', 312_000, true, 2, '2026-05-07T14:00:00.000Z'),
      row('youtube', 'KiyanAnthony', 198_000, false, 3, '2026-05-06T14:00:00.000Z'),
      row('twitch', 'kiyan_live', 64_500, false, 5, '2026-05-04T14:00:00.000Z'),
    ],
  },
  // Jordan Miles — Paul VI senior, growing TikTok-first audience.
  'a-2': {
    athleteId: 'a-2',
    totalFollowers: 480_000 + 612_000 + 88_000 + 41_000,
    engagementRate7d: 0.071,
    lastSyncedAt: SYNC_ISO,
    sourceNote: SOURCE_NOTE,
    platforms: [
      row('tiktok', 'jordanm', 612_000, true, 1, '2026-05-08T14:00:00.000Z'),
      row('instagram', 'jordan.miles', 480_000, true, 1, '2026-05-08T14:00:00.000Z'),
      row('twitter', 'jordanmilespv', 88_000, false, 4, '2026-05-05T14:00:00.000Z'),
      row('youtube', 'JordanMilesHoops', 41_000, false, 6, '2026-05-03T14:00:00.000Z'),
    ],
  },
  // JJ Starling — Syracuse SO, smaller but engaged Twitch streamer side.
  'a-4': {
    athleteId: 'a-4',
    totalFollowers: 290_000 + 145_000 + 52_000 + 38_000 + 12_500,
    engagementRate7d: 0.044,
    lastSyncedAt: SYNC_ISO,
    sourceNote: SOURCE_NOTE,
    platforms: [
      row('instagram', 'jjstarling', 290_000, true, 2, '2026-05-07T14:00:00.000Z'),
      row('tiktok', 'jjstarling11', 145_000, false, 2, '2026-05-07T14:00:00.000Z'),
      row('twitter', 'jjstarling_', 52_000, false, 3, '2026-05-06T14:00:00.000Z'),
      row('twitch', 'jjstarling', 38_000, false, 1, '2026-05-08T14:00:00.000Z'),
      row('youtube', 'JJStarling', 12_500, false, 8, '2026-05-01T14:00:00.000Z'),
    ],
  },
  // Cooper Flagg — Duke FR, very high-reach top-1 recruit.
  'a-3': {
    athleteId: 'a-3',
    totalFollowers: 3_100_000 + 1_850_000 + 720_000 + 340_000,
    engagementRate7d: 0.082,
    lastSyncedAt: SYNC_ISO,
    sourceNote: SOURCE_NOTE,
    platforms: [
      row('instagram', 'cooperflagg', 3_100_000, true, 1, '2026-05-08T14:00:00.000Z'),
      row('tiktok', 'cooperflagg', 1_850_000, true, 1, '2026-05-08T14:00:00.000Z'),
      row('twitter', 'cooperflagg', 720_000, true, 2, '2026-05-07T14:00:00.000Z'),
      row('youtube', 'CooperFlagg', 340_000, false, 4, '2026-05-05T14:00:00.000Z'),
    ],
  },
  // AJ Dybantsa — BYU FR.
  'a-8': {
    athleteId: 'a-8',
    totalFollowers: 1_600_000 + 920_000 + 240_000 + 110_000,
    engagementRate7d: 0.061,
    lastSyncedAt: SYNC_ISO,
    sourceNote: SOURCE_NOTE,
    platforms: [
      row('instagram', 'ajdybantsa', 1_600_000, true, 1, '2026-05-08T14:00:00.000Z'),
      row('tiktok', 'ajdybantsa', 920_000, true, 1, '2026-05-08T14:00:00.000Z'),
      row('twitter', 'ajdybantsa', 240_000, true, 3, '2026-05-06T14:00:00.000Z'),
      row('youtube', 'AJDybantsa', 110_000, false, 5, '2026-05-04T14:00:00.000Z'),
    ],
  },
  // Kon Knueppel — Duke FR.
  'a-9': {
    athleteId: 'a-9',
    totalFollowers: 540_000 + 310_000 + 95_000 + 22_000,
    engagementRate7d: 0.048,
    lastSyncedAt: SYNC_ISO,
    sourceNote: SOURCE_NOTE,
    platforms: [
      row('instagram', 'konknueppel', 540_000, true, 2, '2026-05-07T14:00:00.000Z'),
      row('tiktok', 'konknueppel', 310_000, true, 2, '2026-05-07T14:00:00.000Z'),
      row('twitter', 'konknueppel', 95_000, false, 3, '2026-05-06T14:00:00.000Z'),
      row('youtube', 'KonKnueppel', 22_000, false, 10, '2026-04-29T14:00:00.000Z'),
    ],
  },
  // RJ Davis — UNC senior PG.
  'a-12': {
    athleteId: 'a-12',
    totalFollowers: 650_000 + 380_000 + 145_000 + 41_000,
    engagementRate7d: 0.039,
    lastSyncedAt: SYNC_ISO,
    sourceNote: SOURCE_NOTE,
    platforms: [
      row('instagram', 'rjdavis4', 650_000, true, 2, '2026-05-07T14:00:00.000Z'),
      row('tiktok', 'rjdavis', 380_000, true, 2, '2026-05-07T14:00:00.000Z'),
      row('twitter', 'RJDavis4', 145_000, true, 3, '2026-05-06T14:00:00.000Z'),
      row('youtube', 'RJDavis', 41_000, false, 6, '2026-05-03T14:00:00.000Z'),
    ],
  },
  // JuJu Watkins — flagship W-Bball reach.
  'a-15': {
    athleteId: 'a-15',
    totalFollowers: 2_400_000 + 1_650_000 + 580_000 + 210_000,
    engagementRate7d: 0.089,
    lastSyncedAt: SYNC_ISO,
    sourceNote: SOURCE_NOTE,
    platforms: [
      row('instagram', 'jujuwatkins', 2_400_000, true, 1, '2026-05-08T14:00:00.000Z'),
      row('tiktok', 'jujuwatkins', 1_650_000, true, 1, '2026-05-08T14:00:00.000Z'),
      row('twitter', 'jujuwatkins', 580_000, true, 2, '2026-05-07T14:00:00.000Z'),
      row('youtube', 'JuJuWatkins', 210_000, true, 4, '2026-05-05T14:00:00.000Z'),
    ],
  },
  // Hannah Hidalgo — Notre Dame.
  'a-16': {
    athleteId: 'a-16',
    totalFollowers: 880_000 + 510_000 + 175_000 + 62_000,
    engagementRate7d: 0.068,
    lastSyncedAt: SYNC_ISO,
    sourceNote: SOURCE_NOTE,
    platforms: [
      row('instagram', 'hannahhidalgo', 880_000, true, 2, '2026-05-07T14:00:00.000Z'),
      row('tiktok', 'hannahhidalgo', 510_000, true, 2, '2026-05-07T14:00:00.000Z'),
      row('twitter', 'hannahhidalgo', 175_000, true, 3, '2026-05-06T14:00:00.000Z'),
      row('youtube', 'HannahHidalgo', 62_000, false, 7, '2026-05-02T14:00:00.000Z'),
    ],
  },
  // Ryan Williams — Alabama WR.
  'a-18': {
    athleteId: 'a-18',
    totalFollowers: 1_100_000 + 720_000 + 250_000 + 85_000,
    engagementRate7d: 0.054,
    lastSyncedAt: SYNC_ISO,
    sourceNote: SOURCE_NOTE,
    platforms: [
      row('instagram', 'ryanwilliams', 1_100_000, true, 2, '2026-05-07T14:00:00.000Z'),
      row('tiktok', 'ryanwilliams7', 720_000, true, 2, '2026-05-07T14:00:00.000Z'),
      row('twitter', 'ryanwilliams_', 250_000, true, 3, '2026-05-06T14:00:00.000Z'),
      row('youtube', 'RyanWilliamsAL', 85_000, false, 6, '2026-05-03T14:00:00.000Z'),
    ],
  },
  // Dylan Harper — Rutgers FR (pre-signing, smaller but growing audience).
  'a-5': {
    athleteId: 'a-5',
    totalFollowers: 910_000 + 540_000 + 120_000 + 38_000,
    engagementRate7d: 0.055,
    lastSyncedAt: SYNC_ISO,
    sourceNote: SOURCE_NOTE,
    platforms: [
      row('instagram', 'dylanharper', 910_000, true, 1, '2026-05-08T14:00:00.000Z'),
      row('tiktok', 'dylanharper', 540_000, true, 1, '2026-05-08T14:00:00.000Z'),
      row('twitter', 'dylanharper2', 120_000, false, 4, '2026-05-05T14:00:00.000Z'),
      row('youtube', 'DylanHarper', 38_000, false, 8, '2026-05-01T14:00:00.000Z'),
    ],
  },
};

/**
 * Return the social reach packet for an athlete id, or null if no
 * fixture exists. UI is expected to render a clean empty state on
 * `null` — do not throw.
 */
export function getMockAthleteSocialReach(
  athleteId: string,
): AthleteSocialReach | null {
  return FIXTURE[athleteId] ?? null;
}
