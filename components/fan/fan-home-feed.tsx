// ── FanHomeFeed ────────────────────────────────────────────
// Phase 3 — FlashList masonry grid of MasonryPostCard items fed by
// `useFanHomeFeed`. Tap a card → bottom-sheet detail. Includes a FAB
// that opens the post composer when authed. The composer prepend's
// the newly-published post into the feed so the user sees their work immediately.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlashList } from '@shopify/flash-list';

import { FanPostCard } from '@/components/fan/fan-post-card';
import { MasonryPostCard } from '@/components/fan/masonry-post-card';
import { FanPostComposer } from '@/components/fan/post-composer';
import { useFanHomeFeed } from '@/hooks/fan/use-fan-home-feed';
import type { FanPost } from '@/lib/types/fan.types';

const ACCENT = '#EB621A';
const TEXT_SECONDARY = 'rgba(255,255,255,0.55)';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_MARGIN = 12;
const GRID_GUTTER = 8;
// With contentContainer paddingHorizontal = MARGIN − GUTTER/2 and per-item
// wrapper paddingHorizontal = GUTTER/2, each card's true width is:
const CARD_WIDTH = (SCREEN_WIDTH - GRID_MARGIN * 2 - GRID_GUTTER) / 2;

interface FanHomeFeedProps {
  /** Override the list's top padding (e.g. when rendered below an in-page
   *  header so the default `insets.top + 8` would double-inset). */
  topInset?: number;
  /** Plain JS scroll handler for FloatingTabPill collapse. */
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export function FanHomeFeed({ topInset, onScroll }: FanHomeFeedProps = {}): React.JSX.Element {
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
  const [detailPost, setDetailPost] = React.useState<FanPost | null>(null);

  const openDetail = React.useCallback((p: FanPost) => setDetailPost(p), []);

  // Keep detailPost fresh against the live list so likes update in the sheet.
  const livePost = detailPost ? (posts.find((p) => p.id === detailPost.id) ?? null) : null;

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
      <FlashList
        data={posts}
        masonry
        numColumns={2}
        optimizeItemArrangement
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={{ paddingHorizontal: GRID_GUTTER / 2, paddingBottom: GRID_GUTTER }}>
            <MasonryPostCard post={item} colWidth={CARD_WIDTH} index={index} onPress={openDetail} />
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#EB621A" />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: topInset !== undefined ? topInset : insets.top + 8,
          paddingBottom: 120,
          paddingHorizontal: GRID_MARGIN - GRID_GUTTER / 2,
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

      <Modal
        visible={livePost != null}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailPost(null)}
      >
        <View style={styles.sheetRoot}>
          <Pressable style={styles.sheetScrim} onPress={() => setDetailPost(null)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            {livePost ? (
              <FanPostCard
                post={livePost}
                onLike={like}
                onUnlike={unlike}
                onReply={(p) => { setDetailPost(null); handleReply(p); }}
              />
            ) : null}
          </View>
        </View>
      </Modal>
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
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheetScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: '#0F0F0F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 34,
    maxHeight: '80%',
  },
  sheetHandle: {
    alignSelf: 'center', width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)', marginBottom: 8,
  },
});
