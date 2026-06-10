// ── FanHomeFeed ────────────────────────────────────────────
// Phase 2 — paginated FlatList of `FanPostCard` items fed by
// `useFanHomeFeed`. Includes a FAB that opens the post composer
// when authed. The composer prepend's the newly-published post
// into the feed so the user sees their work immediately.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FanPostCard } from '@/components/fan/fan-post-card';
import { FanPostComposer } from '@/components/fan/post-composer';
import { useFanHomeFeed } from '@/hooks/fan/use-fan-home-feed';
import type { FanPost } from '@/lib/types/fan.types';

const ACCENT = '#EB621A';
const TEXT_SECONDARY = 'rgba(255,255,255,0.55)';

export function FanHomeFeed(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {
    posts,
    loading,
    refreshing,
    hasMore,
    loadMore,
    refresh,
    like,
    unlike,
    prepend,
  } = useFanHomeFeed();

  const [composerOpen, setComposerOpen] = React.useState(false);
  const [replyTarget, setReplyTarget] = React.useState<FanPost | null>(null);

  const handleReply = React.useCallback((post: FanPost) => {
    setReplyTarget(post);
    setComposerOpen(true);
  }, []);

  const handlePosted = React.useCallback(
    (post: FanPost) => {
      if (!replyTarget) {
        // Top-level post — show it immediately at the top of the feed.
        prepend(post);
      } else {
        // Reply — refresh so the parent's replyCount updates.
        refresh();
      }
      setReplyTarget(null);
    },
    [replyTarget, prepend, refresh],
  );

  const handleNewPost = () => {
    setReplyTarget(null);
    setComposerOpen(true);
  };

  const handleCloseComposer = () => {
    setComposerOpen(false);
    setReplyTarget(null);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FanPostCard
            post={item}
            onLike={like}
            onUnlike={unlike}
            onReply={handleReply}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="rgba(255,255,255,0.5)"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: 120,
        }}
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <ActivityIndicator color="rgba(255,255,255,0.5)" />
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons
                name="newspaper-outline"
                size={32}
                color="rgba(255,255,255,0.3)"
              />
              <Text style={styles.emptyTitle}>Your feed is quiet</Text>
              <Text style={styles.emptyBody}>
                Follow some athletes or fans to see their posts here.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          hasMore && posts.length > 0 ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color="rgba(255,255,255,0.4)" />
            </View>
          ) : null
        }
      />

      <Pressable
        style={[styles.fab, { bottom: 110 }]}
        onPress={handleNewPost}
        accessibilityRole="button"
        accessibilityLabel="Compose new post"
      >
        <Ionicons name="add" size={28} color="#000" />
      </Pressable>

      <FanPostComposer
        visible={composerOpen}
        onClose={handleCloseComposer}
        onPosted={handlePosted}
        parentPostId={replyTarget?.id}
        replyingToHandle={replyTarget?.author.handle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  emptyBody: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLoader: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
});
