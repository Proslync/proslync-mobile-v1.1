// ── useFanPostActions ──────────────────────────────────────
// Phase 2 — stateless wrapper around the post-level mutating calls
// (like/unlike/reply/repost) for screens that don't own a feed list
// (post detail, replies sheet). Optimistic state management lives
// in the feed hooks; this just exposes the network surface.

import * as React from 'react';

import { fanAuthedApi } from '@/lib/api/fan/authed';
import type { FanPost } from '@/lib/types/fan.types';

export interface UseFanPostActionsResult {
  likePost: (id: string) => Promise<boolean>;
  unlikePost: (id: string) => Promise<boolean>;
  reply: (id: string, body: string) => Promise<FanPost | null>;
  repost: (id: string) => Promise<FanPost | null>;
}

export function useFanPostActions(): UseFanPostActionsResult {
  const likePost = React.useCallback(
    (id: string) => fanAuthedApi.likePost(id),
    [],
  );
  const unlikePost = React.useCallback(
    (id: string) => fanAuthedApi.unlikePost(id),
    [],
  );
  const reply = React.useCallback(
    (id: string, body: string) => fanAuthedApi.replyToPost(id, body),
    [],
  );
  const repost = React.useCallback(
    (id: string) => fanAuthedApi.repostPost(id),
    [],
  );
  return { likePost, unlikePost, reply, repost };
}
