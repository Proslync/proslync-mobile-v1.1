// ── ATHLETE SOCIAL REACH TYPES ────────────────────────────
// W25 (PLAN.md §5 P1) — cross-platform follower counts that travel
// with the athlete bio. Mrs. Wilson framed reach as one of the first
// things a brand-side buyer needs to see when scanning an athlete
// profile, *with the same source-freshness discipline* the rest of
// Proslync's evidence-grade primitives carry (`ComparableDealSourceRef`).
//
// Reach numbers are point-in-time and decay quickly — the source ref
// + `lastUpdatedAt` + `lastSyncedAt` triplet exists so the UI can
// chip "1d ago" / "stale" / "synthetic" rather than render a number
// as if it were authoritative.

import type { ComparableDealSourceRef } from '@/lib/types/comparable-deal.types';

/** Supported social platforms surfaced on the athlete bio reach card. */
export type SocialPlatform =
  | 'instagram'
  | 'tiktok'
  | 'twitter'
  | 'youtube'
  | 'twitch'
  | 'linkedin';

/** A single platform reach row attached to an athlete. */
export interface PlatformReach {
  platform: SocialPlatform;
  /** Public handle (without leading `@`). */
  handle: string;
  /** Follower count as a raw integer — formatting happens in the view. */
  followers: number;
  /** Platform-verified flag (blue check / equivalent). */
  verified: boolean;
  /** ISO 8601 timestamp the platform reach was last refreshed. */
  lastUpdatedAt: string;
  /** Source-of-truth ref so the reviewer can audit where the count came from. */
  source: ComparableDealSourceRef;
}

/** Aggregate cross-platform reach packet for one athlete. */
export interface AthleteSocialReach {
  athleteId: string;
  /** Sum of all platform follower counts (pre-deduplication; double-counted across platforms is fine for reach context). */
  totalFollowers: number;
  /** Per-platform breakdown — typically 4–6 rows. */
  platforms: PlatformReach[];
  /** Optional 7-day rolling engagement rate (avg likes per post / followers). */
  engagementRate7d?: number;
  /** ISO 8601 timestamp the aggregate sync ran. */
  lastSyncedAt: string;
  /** Human-readable methodology note rendered in the card footer. */
  sourceNote: string;
}
