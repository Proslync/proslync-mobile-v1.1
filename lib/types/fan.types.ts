// ── PROSLYNC FAN AUTHED API TYPES ──────────────────────────
// Phase 2 — these mirror the backend `proslync-backend` shapes for the
// authed `/api/fan/*` surface (auth, posts, follows, profile, feed,
// media, reports). The fields here cover what the UI consumes; the
// backend may return additional metadata we ignore at the type level.

export type FanOtpPurpose = 'fan_signin' | 'fan_signup';

export interface FanUser {
  id: string;
  handle: string;
  displayName: string;
  phoneNumber: string;
  avatarUrl?: string | null;
  bio?: string | null;
  isVerified?: boolean;
  createdAt?: string;
}

export interface IdentityLink {
  fanUserId: string;
  /**
   * Wire shape from the backend is `number | null` (`pro_users.id` is an
   * integer PK). The UI only ever uses this as a presence check, so the
   * looser `unknown`/null modeling here keeps the boundary honest without
   * forcing every call-site to do a numeric narrow.
   */
  proUserId: number | string | null;
  /** Present on the backend `identityLinkDto` — the canonical handle for
   * this human across fan + pro shells. Used by the link-pro flow as the
   * default `proposedHandle` so the pro signup carries the same name. */
  handle?: string;
  /** Convenience flag mirroring the backend response. Treat as authoritative
   * over the local `proUserId != null` check when both are available. */
  hasLinkedProUser?: boolean;
}

export interface FanAuthResult {
  fanUser: FanUser;
  identityLink: IdentityLink;
  accessToken: string;
  refreshToken: string;
}

export interface RequestOtpResponse {
  /** Present only when the backend is in dev mode — the actual 6-digit OTP
   * code so the QA pass can shortcut the SMS round-trip. */
  debugCode?: string;
  /** Backend echoes back the phone for confirmation. */
  phoneNumber?: string;
  /** Echoed back so the UI can guard against a state mismatch. */
  purpose?: FanOtpPurpose;
}

export type FanPostVisibility = 'public' | 'followers' | 'private';

export interface FanPostAuthor {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface FanPostMedia {
  id: string;
  url: string;
  mimeType: string;
  width?: number | null;
  height?: number | null;
}

export interface FanPost {
  id: string;
  author: FanPostAuthor;
  body: string | null;
  media: FanPostMedia[];
  visibility: FanPostVisibility;
  linkedGameId?: string | null;
  linkedSchoolId?: string | null;
  parentPostId?: string | null;
  repostOfId?: string | null;
  likeCount: number;
  replyCount: number;
  repostCount: number;
  viewerLiked?: boolean;
  createdAt: string;
}

export interface FanFeedEnvelope {
  data: FanPost[];
  nextCursor: string | null;
}

export interface FanRepliesEnvelope {
  data: FanPost[];
  nextCursor: string | null;
}

export interface FanProfile {
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  bannerUrl?: string | null;
  favoriteSchoolId?: string | null;
  birthYear?: number | null;
}

export interface FanPublicProfile {
  fanUser: FanUser;
  profile: FanProfile | null;
  counts: {
    followers: number;
    follows: number;
    posts: number;
  };
  viewerFollows?: boolean;
}

export interface FanFollowCheck {
  isFollowing: boolean;
}

export interface FanHandleAvailability {
  handle: string;
  available: boolean;
}

export interface FanMediaPresignResponse {
  fileId: string;
  uploadUrl: string;
  /** Some backends return required headers for the PUT. */
  headers?: Record<string, string>;
}

export interface FanMediaConfirmResponse {
  fileId: string;
  url: string;
}

export interface FanReportInput {
  targetType: 'post' | 'user';
  targetId: string;
  reason: string;
  details?: string;
}
