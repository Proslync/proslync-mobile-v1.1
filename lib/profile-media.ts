// ── PROFILE MEDIA REGISTRY ──────────────────────────────────────────
// Banner videos are streamed from the public proslync-web repo via the
// jsDelivr CDN (https://cdn.jsdelivr.net/gh/...) — NOT bundled in the .ipa.
//
// Why streaming: expo-video's `useVideoPlayer(require(...))` resolves to a
// URI that AVPlayer can't open in production iOS (bundled-asset path mismatch
// with no NSBundle fallback). Hosting the videos and passing an HTTPS URL
// sidesteps the whole issue — AVPlayer streams `video/mp4` over HTTPS
// trivially, and jsDelivr caches aggressively (~7-day edge TTL).
//
// ─── How to update a banner video ──────────────────────────────────
//   1. Replace the file at  proslync-web-v1.1/public/videos/<role>-banner.mp4
//   2. Commit + push to the public repo's default branch.
//   3. The jsDelivr URL stays the same; clients see the new video within
//      ~12h (s-maxage). Bump to a commit-pinned URL below if you need it
//      immediate.
//
// Static images (avatars, banner fallbacks) stay bundled — RN's image loader
// has NSBundle fallback so the bundled-asset path mismatch doesn't bite them.

// Served from GitHub Pages on the public proslync-web-v1.1 repo. Earlier
// attempts via jsDelivr (`cdn.jsdelivr.net/gh/...@<hash>/...`) returned the
// right bytes but AVPlayer's strict NSURL parser tripped over the `@` in
// path (RFC 3986 reserves `@` for userinfo). Pages URLs have no `@` and
// parse cleanly. To update a video: push to public/videos/ on the default
// branch; Pages republishes automatically (~1 min).
const CDN_BASE =
  'https://arshiarahnavard7-sys.github.io/proslync-web-v1.1/public/videos';

export type ProfileMedia = {
  /** require()'d cover image — shown when there's no bannerVideo. */
  banner: number;
  /** HTTPS URL of a looping cover video (preferred over `banner`). */
  bannerVideo?: string;
  /** require()'d square avatar / profile photo. */
  avatar: number;
};

const KIYAN_BANNER = require('@/assets/images/kiyan-banner.png');
const KIYAN_AVATAR = require('@/assets/images/kiyan-avatar.png');
const COACH_BANNER = require('@/assets/images/coach-banner.png');
const COACH_AVATAR = require('@/assets/images/coach-avatar.png');

export const PROFILE_MEDIA: Record<string, ProfileMedia> = {
  player: {
    banner: KIYAN_BANNER,
    bannerVideo: `${CDN_BASE}/player-banner.mp4`,
    avatar: KIYAN_AVATAR,
  },
  brand: {
    banner: KIYAN_BANNER,
    bannerVideo: `${CDN_BASE}/brand-banner.mp4`,
    avatar: require('@/assets/profile-media/brand-avatar.png'),
  },
  school: {
    banner: KIYAN_BANNER,
    bannerVideo: `${CDN_BASE}/school-banner.mp4`,
    avatar: require('@/assets/profile-media/school-avatar.png'),
  },
  coach: {
    banner: COACH_BANNER,
    bannerVideo: `${CDN_BASE}/coach-banner.mp4`,
    avatar: COACH_AVATAR,
  },
  // No custom video for these — default placeholders.
  agent: { banner: KIYAN_BANNER, avatar: KIYAN_AVATAR },
  fan: { banner: KIYAN_BANNER, avatar: KIYAN_AVATAR },
  nilManager: { banner: KIYAN_BANNER, avatar: KIYAN_AVATAR },
};

export function profileMedia(role: keyof typeof PROFILE_MEDIA | string): ProfileMedia {
  return PROFILE_MEDIA[role] ?? PROFILE_MEDIA.player;
}
