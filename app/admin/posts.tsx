import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Pressable,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStableRouter } from '@/hooks/use-stable-router';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useDebounce } from '@/hooks';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useAdminPosts, useAdminDeletePost } from '@/hooks/use-admin';

import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import type { AdminPost } from '@/lib/api/admin';

function PostRow({
  post,
  onDelete,
  colors,
}: {
  post: AdminPost;
  onDelete: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const authorName =
    post.author?.userName ||
    [post.author?.firstName, post.author?.lastName].filter(Boolean).join(' ') ||
    `User #${post.authorId}`;
  const avatarUrl = post.author?.avatar?.url;
  const mediaThumb = post.media?.[0]?.thumbnailUrl || post.media?.[0]?.url;
  const dateStr = new Date(post.createdAt).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder, { overflow: 'hidden' as const }]}>
          <GlassView {...liquidGlass.fillFaint} borderRadius={17} style={StyleSheet.absoluteFillObject} />
          <Ionicons name="person" size={16} color={colors.textTertiary} />
        </View>
      )}
      <View style={styles.rowContent}>
        <View style={styles.postHeader}>
          <Text style={[styles.authorName, { color: colors.text }]}>@{authorName}</Text>
          <Text style={[styles.postDate, { color: colors.textTertiary }]}>{dateStr}</Text>
        </View>
        {post.text ? (
          <Text style={[styles.postText, { color: colors.textSecondary }]} numberOfLines={2}>
            {post.text}
          </Text>
        ) : (
          <Text style={[styles.postText, { color: colors.textTertiary }]}>
            [{post.type === 'event' ? 'Event post' : 'Media post'}]
          </Text>
        )}
        <View style={styles.postStats}>
          <View style={styles.stat}>
            <Ionicons name="heart" size={12} color={colors.textTertiary} />
            <Text style={[styles.statText, { color: colors.textTertiary }]}>{post.likeCount}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="chatbubble" size={12} color={colors.textTertiary} />
            <Text style={[styles.statText, { color: colors.textTertiary }]}>{post.commentCount}</Text>
          </View>
          {post.event && (
            <View style={styles.stat}>
              <Ionicons name="calendar" size={12} color={colors.textTertiary} />
              <Text style={[styles.statText, { color: colors.textTertiary }]} numberOfLines={1}>
                {post.event.name}
              </Text>
            </View>
          )}
        </View>
      </View>
      {mediaThumb && (
        <Image source={{ uri: mediaThumb }} style={styles.mediaThumb} />
      )}
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} activeOpacity={0.7}>
        <Ionicons name="trash-outline" size={18} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );
}

export default function AdminPostsScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { colors } = useAppTheme();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, refetch } = useAdminPosts({
    search: debouncedSearch || undefined,
    page,
    limit: 30,
  });

  const { refreshControl } = useRefreshControl({ onRefresh: async () => { await refetch(); } });

  const deletePost = useAdminDeletePost();

  const [deleteTarget, setDeleteTarget] = useState<AdminPost | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);

  const confirmDelete = useCallback(
    (post: AdminPost) => {
      setDeleteTarget(post);
    },
    [],
  );

  const posts = data?.posts ?? [];

  return (
    <View style={[styles.container, { backgroundColor: '#f2f2f2' }]}>

      {/* Top row */}
      {isSearchActive ? (
        <View style={[styles.pillRow, { paddingTop: insets.top + 16 }]}>
          <View style={styles.searchBarInline}>
            <Ionicons name="search" size={18} color="rgba(0,0,0,0.4)" />
            <TextInput
              style={styles.searchInputInline}
              value={search}
              onChangeText={(t) => { setSearch(t); setPage(1); }}
              placeholder="Search posts..."
              placeholderTextColor="rgba(0,0,0,0.35)"
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="rgba(0,0,0,0.3)" />
              </TouchableOpacity>
            )}
          </View>
          <Pressable style={styles.pillIcon} onPress={() => { setIsSearchActive(false); setSearch(''); }}>
            <Ionicons name="close" size={20} color="#000" />
          </Pressable>
        </View>
      ) : (
        <View style={[styles.pillRow, { paddingTop: insets.top + 16 }]}>
          <Pressable style={styles.pillIcon} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#000" />
          </Pressable>
          <Pressable style={styles.pillIcon} onPress={() => setIsSearchActive(true)}>
            <Ionicons name="search" size={18} color="#000" />
          </Pressable>
          <View style={styles.pillLabel}>
            <GlassView {...liquidGlass.surface} tintColor="rgba(0,0,0,0.12)" borderRadius={19} style={StyleSheet.absoluteFill} />
            <Text style={styles.pillLabelText}>Posts{data ? ` ${data.total}` : ''}</Text>
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PostRow post={item} onDelete={() => confirmDelete(item)} colors={colors} />
          )}
          refreshControl={refreshControl}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No posts found</Text>
            </View>
          }
          ListFooterComponent={
            data && data.totalPages > page ? (
              <TouchableOpacity style={styles.loadMore} onPress={() => setPage((p) => p + 1)}>
                <Text style={[styles.loadMoreText, { color: colors.text }]}>Load More</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      <ConfirmSheet
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { deletePost.mutate(deleteTarget.id); setDeleteTarget(null); } }}
        title="Delete Post"
        message={`Delete "${deleteTarget?.text?.substring(0, 40) || `Post #${deleteTarget?.id}`}"?`}
        confirmLabel="Delete"
        destructive
        icon="trash-outline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  pillRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, alignItems: 'center', paddingBottom: 8 },
  searchBarInline: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, height: 38, borderRadius: 19, backgroundColor: '#fff', paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  searchInputInline: { flex: 1, fontSize: 15, fontFamily: 'Lato_400Regular', color: '#000', padding: 0 },
  pillIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' },
  pillLabel: { height: 38, borderRadius: 19, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  pillLabelText: { fontSize: 14, fontWeight: '500', color: 'rgba(0,0,0,0.8)' },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Lato_400Regular' },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  rowContent: { flex: 1 },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  authorName: { fontSize: 13, fontFamily: 'Lato_700Bold' },
  postDate: { fontSize: 11, fontFamily: 'Lato_400Regular' },
  postText: { fontSize: 13, fontFamily: 'Lato_400Regular', marginTop: 3, lineHeight: 18 },
  postStats: { flexDirection: 'row', gap: 12, marginTop: 6 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontSize: 11, fontFamily: 'Lato_400Regular' },
  mediaThumb: { width: 44, height: 44, borderRadius: 8 },
  deleteBtn: { padding: 8, marginTop: 4 },
  emptyText: { fontSize: 14, fontFamily: 'Lato_400Regular' },
  loadMore: { alignItems: 'center', paddingVertical: 16 },
  loadMoreText: { fontSize: 14, fontFamily: 'Lato_700Bold' },
});
