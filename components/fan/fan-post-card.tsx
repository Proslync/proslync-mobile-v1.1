// ── FanPostCard ────────────────────────────────────────────
// Phase 2 — bare-minimum render of a `FanPost` for the home feed.
// Avatar / displayName / handle / body / timestamp / like + reply
// + repost icons with counts. Tap like → optimistic via the feed
// hook; tap reply icon → open the post composer with `parentPostId`.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { FanPost } from '@/lib/types/fan.types';

const CARD_BG = 'rgba(255,255,255,0.04)';
const CARD_BORDER = 'rgba(255,255,255,0.08)';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = 'rgba(255,255,255,0.55)';
const TEXT_TERTIARY = 'rgba(255,255,255,0.4)';
const ICON_COLOR = 'rgba(255,255,255,0.6)';
const LIKE_ACTIVE = '#EB621A';

interface FanPostCardProps {
  post: FanPost;
  onLike: (postId: string) => void;
  onUnlike: (postId: string) => void;
  onReply: (post: FanPost) => void;
  onRepost?: (post: FanPost) => void;
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const seconds = Math.max(0, (Date.now() - then) / 1000);
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86_400)}d`;
}

function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

export function FanPostCard({
  post,
  onLike,
  onUnlike,
  onReply,
  onRepost,
}: FanPostCardProps): React.JSX.Element {
  const liked = Boolean(post.viewerLiked);
  const author = post.author ?? { displayName: 'Unknown', handle: 'unknown', avatarUrl: null };

  const handleLikePress = () => {
    if (liked) onUnlike(post.id);
    else onLike(post.id);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {author.avatarUrl ? (
          <Image source={{ uri: author.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>
              {(author.displayName || author.handle || '?')[0]?.toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName} numberOfLines={1}>
              {author.displayName || author.handle}
            </Text>
            <Text style={styles.handle} numberOfLines={1}>
              @{author.handle}
            </Text>
            <Text style={styles.timestamp}>
              · {formatRelativeTime(post.createdAt)}
            </Text>
          </View>
        </View>
      </View>

      {post.body ? (
        <Text style={styles.body}>{post.body}</Text>
      ) : null}

      <View style={styles.actionsRow}>
        <Pressable
          style={styles.action}
          onPress={() => onReply(post)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Reply"
        >
          <Ionicons name="chatbubble-outline" size={16} color={ICON_COLOR} />
          <Text style={styles.actionCount}>{formatCount(post.replyCount)}</Text>
        </Pressable>

        <Pressable
          style={styles.action}
          onPress={() => onRepost?.(post)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Repost"
        >
          <Ionicons name="repeat-outline" size={18} color={ICON_COLOR} />
          <Text style={styles.actionCount}>{formatCount(post.repostCount)}</Text>
        </Pressable>

        <Pressable
          style={styles.action}
          onPress={handleLikePress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={liked ? 'Unlike' : 'Like'}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={17}
            color={liked ? LIKE_ACTIVE : ICON_COLOR}
          />
          <Text
            style={[
              styles.actionCount,
              liked && { color: LIKE_ACTIVE },
            ]}
          >
            {formatCount(post.likeCount)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CARD_BORDER,
    backgroundColor: CARD_BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: '700',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  displayName: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: '700',
    maxWidth: '50%',
  },
  handle: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    flexShrink: 1,
  },
  timestamp: {
    color: TEXT_TERTIARY,
    fontSize: 12,
  },
  body: {
    color: TEXT_PRIMARY,
    fontSize: 15,
    lineHeight: 20,
    marginTop: 6,
    marginLeft: 48,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 28,
    marginTop: 10,
    marginLeft: 48,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionCount: {
    color: ICON_COLOR,
    fontSize: 12,
    fontWeight: '600',
  },
});
