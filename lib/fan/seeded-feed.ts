// ── Seeded fan-feed fallback ───────────────────────────────────────────────
// Demo safety net: the masonry Fan Feed (components/fan/fan-home-feed.tsx) is a
// headline surface. If the live VPS feed 401s, errors, or just returns an empty
// page, a prospect would land on "Your feed is quiet" — a dead-looking core
// screen. useFanHomeFeed falls back to this seeded set so the feed always has
// content. Cast = the same Syracuse / NIL world as the chat + perk fixtures
// (Kiyan, JJ, Naithan, Donnie, the brand desks) so the demo reads as one app.
//
// These are real FanPost shapes (same fields the live feed returns), so every
// downstream consumer — masonry art seeding, the detail sheet, like/reply —
// works unchanged. Visibility is 'public' and viewerLiked false by default.

import type { FanPost, FanPostAuthor } from '@/lib/types/fan.types';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

// Capture once at module load so relative timestamps stay stable for the session.
const NOW = Date.now();
const ago = (ms: number): string => new Date(NOW - ms).toISOString();

const author = (
  id: string,
  handle: string,
  displayName: string,
): FanPostAuthor => ({ id, handle, displayName, avatarUrl: null });

const KIYAN = author('a-kiyan', 'kiyananthony', 'Kiyan Anthony');
const JJ = author('a-jj', 'jjstarling', 'JJ Starling');
const NAITHAN = author('a-naithan', 'naithang', 'Naithan George');
const DONNIE = author('a-donnie', 'donniefreeman', 'Donnie Freeman');
const ORANGE = author('a-cuse', 'cusehoops', "Cuse Hoops");
const DEALDESK = author('a-desk', 'proslyncdesk', 'Proslync Deal Desk');

function post(
  id: string,
  a: FanPostAuthor,
  body: string,
  createdAgoMs: number,
  counts: { like: number; reply: number; repost: number },
): FanPost {
  return {
    id,
    author: a,
    body,
    media: [],
    visibility: 'public',
    likeCount: counts.like,
    replyCount: counts.reply,
    repostCount: counts.repost,
    viewerLiked: false,
    createdAt: ago(createdAgoMs),
  };
}

// Newest-first, mirroring the live feed's order.
export const SEEDED_FAN_FEED: FanPost[] = [
  post('seed-1', KIYAN, 'Film session in the books. New drop for Insiders this Friday.', 35 * MIN, { like: 1240, reply: 86, repost: 41 }),
  post('seed-2', JJ, 'Stepback felt clean tonight. On to the next one.', 2 * HOUR, { like: 873, reply: 52, repost: 19 }),
  post('seed-3', DEALDESK, 'New offer routed: NY Edition signature line. Details in your inbox.', 3 * HOUR, { like: 311, reply: 12, repost: 7 }),
  post('seed-4', NAITHAN, 'Peep the PNR read on the 3rd possession. Reps pay off.', 5 * HOUR, { like: 642, reply: 38, repost: 22 }),
  post('seed-5', ORANGE, 'Bus leaves 4:45 sharp. Dome on Friday — come loud.', 8 * HOUR, { like: 2050, reply: 140, repost: 96 }),
  post('seed-6', DONNIE, 'Shoot-around then the weight room. The usual grind.', 11 * HOUR, { like: 528, reply: 24, repost: 9 }),
  post('seed-7', KIYAN, 'Appreciate every supporter who renewed this week. We up.', 16 * HOUR, { like: 1890, reply: 112, repost: 64 }),
  post('seed-8', JJ, 'Open gym at 9. We running 3s — who is in?', 20 * HOUR, { like: 415, reply: 67, repost: 5 }),
  post('seed-9', NAITHAN, 'Locked in for the next two weeks. Film, weights, repeat.', 27 * HOUR, { like: 733, reply: 29, repost: 14 }),
  post('seed-10', KIYAN, 'Two scouts at the Miami game. Feedback was fire. Stay off twitter.', 38 * HOUR, { like: 3120, reply: 208, repost: 151 }),
  post('seed-11', ORANGE, 'Capsule hoodies (black + orange) at the Dome Friday 2pm.', 2 * DAY, { like: 1402, reply: 78, repost: 53 }),
  post('seed-12', DONNIE, 'Rest day. Legs needed it. Back at it tomorrow.', 3 * DAY, { like: 287, reply: 16, repost: 3 }),
];

export function getSeededFanFeed(): FanPost[] {
  return SEEDED_FAN_FEED;
}
