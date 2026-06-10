// Feed API — activity feed types and stub functions
// Restored: was orphaned during a prior refactor; shapes match adjacent
// API modules (activity, analytics, posts).

import { apiClient } from './client';

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * A single activity item returned by the feed endpoint.
 * Shape mirrors the mock feed objects in client.ts and the FeedItemResponse
 * in posts.ts — keeping the union of fields both sources expose.
 */
export interface FeedActivity {
  id: string;
  /** Owning user id (string to match the mock + upstream convention) */
  userId: string;
  username: string;
  userAvatar: string | null;
  verified: boolean;
  /** Post / event description body */
  description: string | null;
  /** Reaction counts */
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  /** Primary media */
  mediaType: 'image' | 'video' | null;
  imageUrl: string | null;
  thumbnail: string | null;
  mediaWidth: number | null;
  mediaHeight: number | null;
  aspectRatio: number | null;
  mediaOrientation: 'vertical' | 'horizontal' | 'square' | null;
  /** Event linkage */
  isEvent: boolean;
  eventId: number | null;
  eventTitle: string | null;
  eventDate: string | null;
  price: number | null;
  isPaid: boolean;
  ticketsAvailableNow: boolean;
  isPrivate: boolean;
  /** Venue linkage */
  venueId: number | null;
  venueName: string | null;
  isVenueActivity: boolean;
  isUserRegistered: boolean;
  createdAt?: string;
}

/**
 * Paginated response envelope returned by GET /api/feed/foryou and
 * GET /api/feed/following.  Mirrors FeedResponse in posts.ts so either
 * can be used interchangeably; a single source of truth for feed
 * consumers that import from lib/api directly.
 */
export interface FeedResponse {
  items: FeedActivity[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ── Mapper ───────────────────────────────────────────────────────────────────

/**
 * Convert a raw server activity record (any shape) into a strongly-typed
 * FeedActivity.  Provides safe defaults so downstream UI never crashes on
 * missing fields.
 */
export function mapActivityToFeedItem(raw: Record<string, unknown>): FeedActivity {
  return {
    id: String(raw['id'] ?? ''),
    userId: String(raw['userId'] ?? raw['authorId'] ?? ''),
    username: String(raw['username'] ?? raw['authorUserName'] ?? ''),
    userAvatar:
      (raw['userAvatar'] as string | null) ??
      (raw['authorAvatarUrl'] as string | null) ??
      null,
    verified: Boolean(raw['verified'] ?? raw['authorIsVerified'] ?? false),
    description:
      (raw['description'] as string | null) ?? (raw['text'] as string | null) ?? null,
    likes: Number(raw['likes'] ?? raw['likeCount'] ?? 0),
    comments: Number(raw['comments'] ?? raw['commentCount'] ?? 0),
    shares: Number(raw['shares'] ?? 0),
    isLiked: Boolean(raw['isLiked'] ?? false),
    mediaType: (raw['mediaType'] as 'image' | 'video' | null) ?? null,
    imageUrl: (raw['imageUrl'] as string | null) ?? null,
    thumbnail: (raw['thumbnail'] as string | null) ?? null,
    mediaWidth: raw['mediaWidth'] != null ? Number(raw['mediaWidth']) : null,
    mediaHeight: raw['mediaHeight'] != null ? Number(raw['mediaHeight']) : null,
    aspectRatio: raw['aspectRatio'] != null ? Number(raw['aspectRatio']) : null,
    mediaOrientation:
      (raw['mediaOrientation'] as 'vertical' | 'horizontal' | 'square' | null) ?? null,
    isEvent: Boolean(raw['isEvent'] ?? raw['eventId'] != null),
    eventId: raw['eventId'] != null ? Number(raw['eventId']) : null,
    eventTitle:
      (raw['eventTitle'] as string | null) ?? (raw['eventName'] as string | null) ?? null,
    eventDate:
      (raw['eventDate'] as string | null) ??
      (raw['eventStartDate'] as string | null) ??
      null,
    price: raw['price'] != null ? Number(raw['price']) : null,
    isPaid: Boolean(raw['isPaid'] ?? raw['eventIsPaid'] ?? false),
    ticketsAvailableNow: Boolean(raw['ticketsAvailableNow'] ?? false),
    isPrivate: Boolean(raw['isPrivate'] ?? false),
    venueId: raw['venueId'] != null ? Number(raw['venueId']) : null,
    venueName: (raw['venueName'] as string | null) ?? null,
    isVenueActivity: Boolean(raw['isVenueActivity'] ?? false),
    isUserRegistered: Boolean(raw['isUserRegistered'] ?? false),
    createdAt: (raw['createdAt'] as string | undefined) ?? undefined,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract the numeric event id from a FeedActivity, or return null if the
 * activity is not event-linked.
 */
export function getEventIdFromActivity(activity: FeedActivity): number | null {
  return activity.eventId ?? null;
}

// ── API surface ──────────────────────────────────────────────────────────────

export const feedApi = {
  /**
   * Get the personalised "For You" feed.
   * TODO: wire to real endpoint once feed service lands.
   */
  getForYouFeed: (cursor?: string, limit = 20): Promise<FeedResponse> =>
    apiClient.get<FeedResponse>('/api/feed/foryou', { params: { cursor, limit } }),

  /**
   * Get the "Following" feed (content from followed users/venues).
   * TODO: wire to real endpoint once feed service lands.
   */
  getFollowingFeed: (cursor?: string, limit = 20): Promise<FeedResponse> =>
    apiClient.get<FeedResponse>('/api/feed/following', { params: { cursor, limit } }),

  /**
   * Get a specific user's activity posts.
   * TODO: wire to real endpoint once feed service lands.
   */
  getUserActivityFeed: (userId: number, cursor?: string, limit = 50): Promise<FeedResponse> =>
    apiClient.get<FeedResponse>(`/api/feed/users/${userId}/posts`, {
      params: { cursor, limit },
    }),
};
