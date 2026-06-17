// ── useFanHomeFeed ─────────────────────────────────────────
// Phase 2 — paginated wrapper around `fanAuthedApi.getHomeFeed`.
// Returns a flat post array, pagination state, and optimistic
// like/unlike mutators that update the local cache before the
// network round-trip. On a network failure the optimistic state
// is rolled back.

import * as React from 'react';

import { fanAuthedApi } from '@/lib/api/fan/authed';
import { mergeFeedPage } from '@/lib/fan/feed-merge';
import { applyOptimisticLike, rollbackOptimisticLike } from '@/lib/fan/like-state';
import type { FanPost } from '@/lib/types/fan.types';

export interface UseFanHomeFeedResult {
  posts: FanPost[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  like: (id: string) => Promise<void>;
  unlike: (id: string) => Promise<void>;
  /** Prepend a freshly-created post (e.g. after the composer publishes). */
  prepend: (post: FanPost) => void;
}

export function useFanHomeFeed(): UseFanHomeFeedResult {
  const [posts, setPosts] = React.useState<FanPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(true);
  const [pageTick, setPageTick] = React.useState(0);
  const [resetTick, setResetTick] = React.useState(0);
  const loadingMoreRef = React.useRef(false);

  // Monotonic load epoch. A refresh (resetTick) and an in-flight pagination
  // fetch live in two SEPARATE effects, so a refresh cannot abort a pagination
  // request already on the wire. Without coordination, a page that resolves
  // AFTER a refresh would append stale rows (from the pre-refresh feed) onto
  // the fresh list AND clobber the fresh cursor with the stale one. The epoch
  // is bumped on every refresh; a pagination resolve only applies its result
  // when the epoch it captured at trigger time is still current.
  const epochRef = React.useRef(0);

  // Always-current mirror of `posts` so like/unlike can read the exact
  // pre-mutation state synchronously (for a correct optimistic rollback)
  // without depending on React state-flush timing.
  const postsRef = React.useRef<FanPost[]>(posts);
  postsRef.current = posts;

  // Initial / refresh load.
  React.useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    // Invalidate any pagination fetch already on the wire from the prior feed —
    // its resolve will see a newer epoch and discard itself (see pagination
    // effect). Also stop the in-flight guard from latching across a refresh.
    epochRef.current += 1;
    loadingMoreRef.current = false;
    if (resetTick === 0) setLoading(true);
    else setRefreshing(true);
    fanAuthedApi
      .getHomeFeed({ signal: controller.signal })
      .then((env) => {
        if (cancelled) return;
        setPosts(env.data);
        setCursor(env.nextCursor);
        setHasMore(Boolean(env.nextCursor));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setRefreshing(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [resetTick]);

  // Pagination load.
  React.useEffect(() => {
    if (pageTick === 0) return;
    if (!cursor) return;
    const controller = new AbortController();
    let cancelled = false;
    const epoch = epochRef.current;
    loadingMoreRef.current = true;
    fanAuthedApi
      .getHomeFeed({ cursor, signal: controller.signal })
      .then((env) => {
        // Discard a page that resolved after a refresh moved the epoch on: its
        // data + cursor belong to a feed that no longer exists on screen.
        if (cancelled || epoch !== epochRef.current) return;
        setPosts((prev) => mergeFeedPage(prev, env.data));
        setCursor(env.nextCursor);
        setHasMore(Boolean(env.nextCursor));
      })
      .finally(() => {
        if (!cancelled && epoch === epochRef.current) loadingMoreRef.current = false;
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
    // intentionally only re-run on pageTick — cursor is captured at trigger time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageTick]);

  const loadMore = React.useCallback(() => {
    if (loadingMoreRef.current) return;
    if (!hasMore) return;
    setPageTick((n) => n + 1);
  }, [hasMore]);

  const refresh = React.useCallback(() => {
    setResetTick((n) => n + 1);
  }, []);

  const applyLikeMutation = React.useCallback(
    (id: string, delta: 1 | -1, viewerLiked: boolean) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                ...applyOptimisticLike(
                  { likeCount: p.likeCount, viewerLiked: Boolean(p.viewerLiked) },
                  delta,
                  viewerLiked,
                ),
              }
            : p,
        ),
      );
    },
    [],
  );

  // Restore a post's like fields to an exact captured snapshot. Used to roll
  // back a failed optimistic mutation. Restoring the snapshot (not inverting
  // the delta) is required for correctness: the optimistic count passes through
  // `Math.max(0, …)`, so when the optimistic value is clamped at 0 (e.g.
  // unliking a post already showing likeCount 0) inverting the delta rolls back
  // to 1 — inventing a like that never existed. Snapshot-restore is exact.
  const restoreLikeState = React.useCallback(
    (id: string, snapshot: { likeCount: number; viewerLiked: boolean }) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...rollbackOptimisticLike(snapshot) } : p)),
      );
    },
    [],
  );

  const like = React.useCallback(
    async (id: string) => {
      const prev = postsRef.current.find((p) => p.id === id);
      const snapshot = prev
        ? { likeCount: prev.likeCount, viewerLiked: Boolean(prev.viewerLiked) }
        : null;
      applyLikeMutation(id, 1, true);
      const ok = await fanAuthedApi.likePost(id);
      if (!ok && snapshot) restoreLikeState(id, snapshot);
    },
    [applyLikeMutation, restoreLikeState],
  );

  const unlike = React.useCallback(
    async (id: string) => {
      const prev = postsRef.current.find((p) => p.id === id);
      const snapshot = prev
        ? { likeCount: prev.likeCount, viewerLiked: Boolean(prev.viewerLiked) }
        : null;
      applyLikeMutation(id, -1, false);
      const ok = await fanAuthedApi.unlikePost(id);
      if (!ok && snapshot) restoreLikeState(id, snapshot);
    },
    [applyLikeMutation, restoreLikeState],
  );

  const prepend = React.useCallback((post: FanPost) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  return {
    posts,
    loading,
    refreshing,
    hasMore,
    loadMore,
    refresh,
    like,
    unlike,
    prepend,
  };
}
