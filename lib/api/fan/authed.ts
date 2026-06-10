// ── PROSLYNC FAN AUTHED API CLIENT ─────────────────────────
// Phase 2 — typed wrappers around the authed `/api/fan/*` surface
// exposed by `proslync-backend` (auth, posts, follows, profile,
// feed, media, reports).
//
// Posture:
//   • Bearer token sourced from `fanTokens` (separate keychain entry
//     from the pro token store).
//   • On 401 we try refresh once; on a second 401 we clear tokens and
//     bubble up null. This client never throws plain network errors
//     to the UI — failures are surfaced as `null` / empty envelopes.
//   • The trending feed uses `optionalFanAuth` on the backend so the
//     token is sent if present but never required.
//   • Base URL: `config.api.fanBaseUrl` (defaults to localhost:3020
//     in dev; production override via EXPO_PUBLIC_PROSLYNC_FAN_API_BASE_URL).

import { config } from '@/lib/config';
import { fanTokens } from '@/lib/storage/fan-tokens';
import { secureTokens } from '@/lib/storage/secure-tokens';
import type {
  FanAuthResult,
  FanFeedEnvelope,
  FanFollowCheck,
  FanHandleAvailability,
  FanMediaConfirmResponse,
  FanMediaPresignResponse,
  FanOtpPurpose,
  FanPost,
  FanPostVisibility,
  FanPublicProfile,
  FanProfile,
  FanRepliesEnvelope,
  FanReportInput,
  FanUser,
  IdentityLink,
  RequestOtpResponse,
} from '@/lib/types/fan.types';

const DEFAULT_TIMEOUT_MS = 10_000;

interface FetchOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  /** When true, the request will NOT auto-retry on 401. Used by the refresh
   * call itself to avoid infinite loops. */
  skipAuthRetry?: boolean;
  /** When true, send the Bearer token if present but don't fail if missing
   * (used by trending feed which sits behind `optionalFanAuth`). */
  optionalAuth?: boolean;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

function buildFanAuthedUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): string {
  const base = config.api.fanBaseUrl || 'http://localhost:3020';
  const url = new URL(path.startsWith('/') ? path : `/${path}`, base);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

// In-flight refresh promise — coalesces concurrent 401s so we only hit
// /refresh once.
let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const refresh = await fanTokens.getRefreshToken();
      if (!refresh) return false;
      const url = buildFanAuthedUrl('/api/fan/auth/refresh');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (!res.ok) return false;
      const payload = (await res.json()) as {
        accessToken?: string;
        refreshToken?: string;
      } | null;
      if (!payload?.accessToken) return false;
      await fanTokens.setAccessToken(payload.accessToken);
      if (payload.refreshToken) {
        await fanTokens.setRefreshToken(payload.refreshToken);
      }
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function authedFetch<T>(
  method: HttpMethod,
  path: string,
  body: unknown | undefined,
  fallback: T,
  options: FetchOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const userSignal = options.signal;
  const onUserAbort = () => controller.abort();
  if (userSignal) {
    if (userSignal.aborted) controller.abort();
    else userSignal.addEventListener('abort', onUserAbort);
  }
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  const url = buildFanAuthedUrl(path);

  try {
    const accessToken = await fanTokens.getAccessToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (response.status === 401 && !options.skipAuthRetry && !options.optionalAuth) {
      // try refresh once
      const refreshed = await tryRefresh();
      if (refreshed) {
        clearTimeout(timeout);
        if (userSignal) userSignal.removeEventListener('abort', onUserAbort);
        return authedFetch<T>(method, path, body, fallback, {
          ...options,
          skipAuthRetry: true,
        });
      }
      await fanTokens.clear();
      return fallback;
    }

    if (!response.ok) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn(`[fanAuthedApi] ${response.status} ${method} ${url}`);
      }
      return fallback;
    }

    // 204 No Content (e.g. DELETE)
    if (response.status === 204) return fallback;
    const text = await response.text();
    if (!text) return fallback;
    try {
      return JSON.parse(text) as T;
    } catch {
      return fallback;
    }
  } catch (error) {
    const isAbort =
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name?: string }).name === 'AbortError';
    if (!isAbort && __DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[fanAuthedApi] network error', method, url, error);
    }
    return fallback;
  } finally {
    clearTimeout(timeout);
    if (userSignal) userSignal.removeEventListener('abort', onUserAbort);
  }
}

// ── Auth ───────────────────────────────────────────────────

export interface RequestOtpInput {
  phoneNumber: string;
  purpose: FanOtpPurpose;
}

export interface VerifyOtpInput {
  phoneNumber: string;
  code: string;
  purpose: FanOtpPurpose;
  proposedHandle?: string;
  displayName?: string;
}

// ── Posts ──────────────────────────────────────────────────

export interface CreatePostInput {
  body?: string;
  mediaFileIds?: string[];
  visibility?: FanPostVisibility;
  linkedGameId?: string;
  linkedSchoolId?: string;
  parentPostId?: string;
}

export interface ListPostsOptions {
  cursor?: string;
  limit?: number;
  signal?: AbortSignal;
}

// ── Profile updates ────────────────────────────────────────

export interface UpdateMyUserInput {
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface UpsertMyProfileInput {
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  bannerUrl?: string | null;
  favoriteSchoolId?: string | null;
  birthYear?: number | null;
}

// ── Media ──────────────────────────────────────────────────

export interface PresignMediaInput {
  fileName: string;
  mimeType: string;
  fileSize: number;
}

// ── Pro-role link ──────────────────────────────────────────

export type ProRoleProposal = 'player' | 'brand' | 'agent' | 'school' | 'nilManager' | 'coach';

export interface LinkProRoleInput {
  proposedRole: ProRoleProposal;
  proposedHandle?: string;
}

export interface LinkProRoleResult {
  proUserId: number;
  proAccessToken: string;
  proRefreshToken: string;
  proExpiresInSeconds: number;
}

// ── Empty fallbacks ────────────────────────────────────────

const EMPTY_FEED: FanFeedEnvelope = { data: [], nextCursor: null };
const EMPTY_REPLIES: FanRepliesEnvelope = { data: [], nextCursor: null };

// ── API surface ────────────────────────────────────────────

export const fanAuthedApi = {
  // Auth
  async requestOtp(input: RequestOtpInput): Promise<RequestOtpResponse | null> {
    return authedFetch<RequestOtpResponse | null>(
      'POST',
      '/api/fan/auth/otp/request',
      input,
      null,
      { optionalAuth: true, skipAuthRetry: true },
    );
  },

  async verifyOtp(input: VerifyOtpInput): Promise<FanAuthResult | null> {
    // Unauth endpoint — but the helper will still attach a token if present.
    // That's harmless; the backend ignores it.
    return authedFetch<FanAuthResult | null>(
      'POST',
      '/api/fan/auth/otp/verify',
      input,
      null,
      { optionalAuth: true, skipAuthRetry: true },
    );
  },

  async refresh(): Promise<boolean> {
    return tryRefresh();
  },

  async logout(): Promise<void> {
    await authedFetch<null>('POST', '/api/fan/auth/logout', {}, null);
  },

  async me(): Promise<{ fanUser: FanUser; identityLink: IdentityLink } | null> {
    return authedFetch<{ fanUser: FanUser; identityLink: IdentityLink } | null>(
      'GET',
      '/api/fan/auth/me',
      undefined,
      null,
    );
  },

  // Posts
  async createPost(input: CreatePostInput): Promise<FanPost | null> {
    return authedFetch<FanPost | null>('POST', '/api/fan/posts', input, null);
  },

  async getPost(id: string): Promise<FanPost | null> {
    if (!id) return null;
    return authedFetch<FanPost | null>(
      'GET',
      `/api/fan/posts/${encodeURIComponent(id)}`,
      undefined,
      null,
    );
  },

  async deletePost(id: string): Promise<boolean> {
    if (!id) return false;
    const res = await authedFetch<{ ok?: boolean } | null>(
      'DELETE',
      `/api/fan/posts/${encodeURIComponent(id)}`,
      undefined,
      null,
    );
    return res !== null;
  },

  async likePost(id: string): Promise<boolean> {
    if (!id) return false;
    const res = await authedFetch<{ ok?: boolean } | null>(
      'POST',
      `/api/fan/posts/${encodeURIComponent(id)}/like`,
      {},
      null,
    );
    return res !== null;
  },

  async unlikePost(id: string): Promise<boolean> {
    if (!id) return false;
    const res = await authedFetch<{ ok?: boolean } | null>(
      'DELETE',
      `/api/fan/posts/${encodeURIComponent(id)}/like`,
      undefined,
      null,
    );
    return res !== null;
  },

  async replyToPost(id: string, body: string): Promise<FanPost | null> {
    if (!id) return null;
    return authedFetch<FanPost | null>(
      'POST',
      `/api/fan/posts/${encodeURIComponent(id)}/reply`,
      { body },
      null,
    );
  },

  async repostPost(id: string): Promise<FanPost | null> {
    if (!id) return null;
    return authedFetch<FanPost | null>(
      'POST',
      `/api/fan/posts/${encodeURIComponent(id)}/repost`,
      {},
      null,
    );
  },

  async listAuthorPosts(
    handleOrId: string,
    opts: ListPostsOptions = {},
  ): Promise<FanFeedEnvelope> {
    if (!handleOrId) return EMPTY_FEED;
    const qs = new URLSearchParams();
    if (opts.cursor) qs.set('cursor', opts.cursor);
    if (opts.limit) qs.set('limit', String(opts.limit));
    const path =
      `/api/fan/users/${encodeURIComponent(handleOrId)}/posts` +
      (qs.toString() ? `?${qs.toString()}` : '');
    return authedFetch<FanFeedEnvelope>('GET', path, undefined, EMPTY_FEED, {
      signal: opts.signal,
      optionalAuth: true,
    });
  },

  async listReplies(
    postId: string,
    opts: ListPostsOptions = {},
  ): Promise<FanRepliesEnvelope> {
    if (!postId) return EMPTY_REPLIES;
    const qs = new URLSearchParams();
    if (opts.cursor) qs.set('cursor', opts.cursor);
    if (opts.limit) qs.set('limit', String(opts.limit));
    const path =
      `/api/fan/posts/${encodeURIComponent(postId)}/replies` +
      (qs.toString() ? `?${qs.toString()}` : '');
    return authedFetch<FanRepliesEnvelope>(
      'GET',
      path,
      undefined,
      EMPTY_REPLIES,
      { signal: opts.signal, optionalAuth: true },
    );
  },

  // Follows
  async follow(targetFanUserId: string): Promise<boolean> {
    if (!targetFanUserId) return false;
    const res = await authedFetch<{ ok?: boolean } | null>(
      'POST',
      '/api/fan/follows',
      { targetFanUserId },
      null,
    );
    return res !== null;
  },

  async unfollow(targetFanUserId: string): Promise<boolean> {
    if (!targetFanUserId) return false;
    const res = await authedFetch<{ ok?: boolean } | null>(
      'DELETE',
      '/api/fan/follows',
      { targetFanUserId },
      null,
    );
    return res !== null;
  },

  async isFollowing(targetFanUserId: string): Promise<boolean> {
    if (!targetFanUserId) return false;
    const res = await authedFetch<FanFollowCheck | null>(
      'GET',
      `/api/fan/follows/check?targetFanUserId=${encodeURIComponent(targetFanUserId)}`,
      undefined,
      null,
    );
    return res?.isFollowing ?? false;
  },

  // Profile
  async getPublicProfile(handleOrId: string): Promise<FanPublicProfile | null> {
    if (!handleOrId) return null;
    return authedFetch<FanPublicProfile | null>(
      'GET',
      `/api/fan/users/${encodeURIComponent(handleOrId)}`,
      undefined,
      null,
      { optionalAuth: true },
    );
  },

  async updateMyProfile(input: UpdateMyUserInput): Promise<FanUser | null> {
    return authedFetch<FanUser | null>(
      'PATCH',
      '/api/fan/users/me',
      input,
      null,
    );
  },

  async upsertMyExtendedProfile(
    input: UpsertMyProfileInput,
  ): Promise<FanProfile | null> {
    return authedFetch<FanProfile | null>(
      'PUT',
      '/api/fan/users/me/profile',
      input,
      null,
    );
  },

  async checkHandleAvailable(handle: string): Promise<FanHandleAvailability> {
    if (!handle) return { handle, available: false };
    const res = await authedFetch<FanHandleAvailability | null>(
      'GET',
      `/api/fan/users/check-handle/${encodeURIComponent(handle)}`,
      undefined,
      null,
      { optionalAuth: true, skipAuthRetry: true },
    );
    return res ?? { handle, available: false };
  },

  // Feed
  async getHomeFeed(opts: ListPostsOptions = {}): Promise<FanFeedEnvelope> {
    const qs = new URLSearchParams();
    if (opts.cursor) qs.set('cursor', opts.cursor);
    if (opts.limit) qs.set('limit', String(opts.limit));
    const path = '/api/fan/feed/home' + (qs.toString() ? `?${qs.toString()}` : '');
    return authedFetch<FanFeedEnvelope>('GET', path, undefined, EMPTY_FEED, {
      signal: opts.signal,
    });
  },

  async getFollowingFeed(opts: ListPostsOptions = {}): Promise<FanFeedEnvelope> {
    const qs = new URLSearchParams();
    if (opts.cursor) qs.set('cursor', opts.cursor);
    if (opts.limit) qs.set('limit', String(opts.limit));
    const path =
      '/api/fan/feed/following' + (qs.toString() ? `?${qs.toString()}` : '');
    return authedFetch<FanFeedEnvelope>('GET', path, undefined, EMPTY_FEED, {
      signal: opts.signal,
    });
  },

  async getTrendingFeed(opts: ListPostsOptions = {}): Promise<FanFeedEnvelope> {
    const qs = new URLSearchParams();
    if (opts.cursor) qs.set('cursor', opts.cursor);
    if (opts.limit) qs.set('limit', String(opts.limit));
    const path =
      '/api/fan/feed/explore/trending' +
      (qs.toString() ? `?${qs.toString()}` : '');
    return authedFetch<FanFeedEnvelope>('GET', path, undefined, EMPTY_FEED, {
      signal: opts.signal,
      optionalAuth: true,
    });
  },

  // Media
  async presignMediaUpload(
    input: PresignMediaInput,
  ): Promise<FanMediaPresignResponse | null> {
    return authedFetch<FanMediaPresignResponse | null>(
      'POST',
      '/api/fan/media/presign',
      input,
      null,
    );
  },

  async confirmMediaUpload(
    fileId: string,
  ): Promise<FanMediaConfirmResponse | null> {
    if (!fileId) return null;
    return authedFetch<FanMediaConfirmResponse | null>(
      'POST',
      '/api/fan/media/confirm',
      { fileId },
      null,
    );
  },

  // Pro-role link — Phase 5
  //
  // `/api/auth/link/pro-role` lives on the PRO router but is gated by
  // `requireFanAuth`, because at call-time the human only has a fan
  // session (pro_users row doesn't exist yet). So we send the FAN
  // bearer here and, on success, hydrate the EXISTING pro keychain
  // entry via `secureTokens.set*`. From that point on, the legacy
  // `apiClient` will pick up the pro tokens automatically when the
  // user flips into pro mode.
  //
  // Returns null on any failure (4xx / network) — never throws.
  async linkProRole(input: LinkProRoleInput): Promise<LinkProRoleResult | null> {
    const accessToken = await fanTokens.getAccessToken();
    if (!accessToken) return null;
    const url = buildFanAuthedUrl('/api/auth/link/pro-role');
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn(`[fanAuthedApi.linkProRole] ${response.status}`);
        }
        return null;
      }
      const payload = (await response.json()) as {
        proUserId?: number;
        proAccessToken?: string;
        proRefreshToken?: string;
        proAccessExpiresInSeconds?: number;
        proExpiresInSeconds?: number;
      } | null;
      if (
        !payload ||
        typeof payload.proUserId !== 'number' ||
        !payload.proAccessToken ||
        !payload.proRefreshToken
      ) {
        return null;
      }
      // Persist pro tokens into the EXISTING pro keychain entry. The
      // legacy apiClient + AuthProvider will pick these up on the next
      // session hydrate (i.e. when the user flips into pro mode and
      // `/(tabs)` mounts).
      await secureTokens.setAccessToken(payload.proAccessToken);
      await secureTokens.setRefreshToken(payload.proRefreshToken);
      const expiresInSeconds =
        payload.proAccessExpiresInSeconds ?? payload.proExpiresInSeconds ?? 3600;
      return {
        proUserId: payload.proUserId,
        proAccessToken: payload.proAccessToken,
        proRefreshToken: payload.proRefreshToken,
        proExpiresInSeconds: expiresInSeconds,
      };
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[fanAuthedApi.linkProRole] network error', error);
      }
      return null;
    }
  },

  // Reports
  async createReport(input: FanReportInput): Promise<boolean> {
    const res = await authedFetch<{ ok?: boolean } | null>(
      'POST',
      '/api/fan/reports',
      input,
      null,
    );
    return res !== null;
  },
};
