// Channel detail screen — feed of posts with reactions
import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAuth } from '@/lib/providers/auth-provider';
import { useChannel, useChannelPosts } from '@/hooks/use-channels';
import {
  useSetChannelReaction,
  useRemoveChannelReaction,
  useCreateChannelPost,
} from '@/hooks/use-channel-mutations';
import { useToast } from '@/components/shared/toast';
import { useChannelsSocket } from '@/lib/providers/channels-socket-provider';
import type { ChannelPostResponse } from '@/lib/api/channels';

const DefaultAvatarImage = require('@/assets/images/default-avatar.png');

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '🔥', '👏'] as const;

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function PostCard({
  post,
  onReact,
  onRemoveReaction,
  onOpenPicker,
}: {
  post: ChannelPostResponse;
  onReact: (emoji: string) => void;
  onRemoveReaction: () => void;
  onOpenPicker: () => void;
}) {
  const authorName = post.author?.firstName
    ? `${post.author.firstName}${post.author.lastName ? ' ' + post.author.lastName : ''}`
    : post.author?.userName || 'User';

  const reactionEntries = Object.entries(post.reactionCounts || {}).filter(([_, count]) => count > 0);

  const handleQuickReact = () => {
    if (post.userReaction === '❤️') {
      onRemoveReaction();
    } else {
      onReact('❤️');
    }
  };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Image
          source={post.author?.avatarUrl ? { uri: post.author.avatarUrl } : DefaultAvatarImage}
          style={styles.postAuthorAvatar}
        />
        <View style={styles.postAuthorInfo}>
          <Text style={styles.postAuthorName}>{authorName}</Text>
          <Text style={styles.postTime}>{formatTime(post.createdAt)}</Text>
        </View>
      </View>

      {post.text ? <Text style={styles.postText}>{post.text}</Text> : null}

      {post.mediaUrl && post.type === 'image' ? (
        <Image source={{ uri: post.mediaUrl }} style={styles.postImage} resizeMode="cover" />
      ) : null}

      <View style={styles.postFooter}>
        <TouchableOpacity
          style={[styles.reactionButton, post.userReaction === '❤️' && styles.reactionButtonActive]}
          onPress={handleQuickReact}
          onLongPress={onOpenPicker}
          delayLongPress={250}
          activeOpacity={0.7}
        >
          <Ionicons
            name={post.userReaction === '❤️' ? 'heart' : 'heart-outline'}
            size={20}
            color={post.userReaction === '❤️' ? '#ef4444' : 'rgba(0,0,0,0.6)'}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.reactionButton} onPress={onOpenPicker} activeOpacity={0.7}>
          <Ionicons name="happy-outline" size={20} color="rgba(0,0,0,0.6)" />
        </TouchableOpacity>
        {reactionEntries.length > 0 ? (
          <View style={styles.reactionCounts}>
            {reactionEntries.map(([emoji, count]) => {
              const isOwn = post.userReaction === emoji;
              return (
                <TouchableOpacity
                  key={emoji}
                  style={[styles.reactionPill, isOwn && styles.reactionPillActive]}
                  onPress={() => (isOwn ? onRemoveReaction() : onReact(emoji))}
                  activeOpacity={0.7}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  <Text style={[styles.reactionCount, isOwn && styles.reactionCountActive]}>{count}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function ChannelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { data: channel, isLoading: isLoadingChannel } = useChannel(id);
  const {
    data: postsPages,
    isLoading: isLoadingPosts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useChannelPosts(id);

  const setReaction = useSetChannelReaction(id ?? '');
  const removeReaction = useRemoveChannelReaction(id ?? '');
  const createPost = useCreateChannelPost(id ?? '');
  const { showError } = useToast();
  const { joinChannel: socketJoin, leaveChannel: socketLeave } = useChannelsSocket();

  const [draftText, setDraftText] = React.useState('');

  const handleSendPost = () => {
    const text = draftText.trim();
    if (!text || !id) return;
    createPost.mutate(
      { type: 'text', text },
      {
        onSuccess: () => {
          setDraftText('');
        },
        onError: (error) => {
          showError(error.message || 'Failed to post');
        },
      },
    );
  };

  // Subscribe to real-time updates for this channel while viewing
  React.useEffect(() => {
    if (!id) return;
    socketJoin(id);
    return () => socketLeave(id);
  }, [id, socketJoin, socketLeave]);

  const [refreshing, setRefreshing] = React.useState(false);
  const [pickerForPostId, setPickerForPostId] = React.useState<number | null>(null);
  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const posts = React.useMemo(
    () => postsPages?.pages.flatMap((p) => p.posts) ?? [],
    [postsPages],
  );

  const canPost = channel?.userRole === 'owner' || channel?.userRole === 'admin';

  if (isLoadingChannel || !channel) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#000" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Image
            source={channel.avatarUrl ? { uri: channel.avatarUrl } : DefaultAvatarImage}
            style={styles.headerAvatar}
          />
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {channel.name}
            </Text>
            <Text style={styles.headerSubtitle}>
              {channel.memberCount} {channel.memberCount === 1 ? 'member' : 'members'}
            </Text>
          </View>
        </View>
        {channel.isMember ? (
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => router.push({ pathname: '/channel/[id]/settings', params: { id: id ?? '' } } as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-horizontal" size={22} color="#000" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerAction} />
        )}
      </Animated.View>

      {/* Posts feed + inline composer */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onReact={(emoji) => setReaction.mutate({ postId: item.id, emoji })}
              onRemoveReaction={() => removeReaction.mutate(item.id)}
              onOpenPicker={() => setPickerForPostId(item.id)}
            />
          )}
          contentContainerStyle={[styles.feedContent, { paddingBottom: 16 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#000" />}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            isLoadingPosts ? (
              <View style={styles.emptyState}>
                <ActivityIndicator color="#000" />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="chatbox-outline" size={48} color="rgba(0,0,0,0.2)" />
                <Text style={styles.emptyText}>No posts yet</Text>
              </View>
            )
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator color="#000" />
              </View>
            ) : null
          }
        />

        {/* Inline composer (owner/admin only) */}
        {canPost ? (
          <View style={[styles.composerBar, { paddingBottom: insets.bottom + 8 }]}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={() => router.push({ pathname: '/channel/[id]/compose', params: { id: id ?? '' } } as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="image-outline" size={22} color="rgba(0,0,0,0.6)" />
            </TouchableOpacity>
            <View style={styles.composerInputWrapper}>
              <TextInput
                style={styles.composerInput}
                value={draftText}
                onChangeText={setDraftText}
                placeholder="Post to channel..."
                placeholderTextColor="rgba(0,0,0,0.35)"
                multiline
                maxLength={2000}
              />
            </View>
            <TouchableOpacity
              style={[styles.sendButton, !draftText.trim() && styles.sendButtonDisabled]}
              onPress={handleSendPost}
              disabled={!draftText.trim() || createPost.isPending}
              activeOpacity={0.85}
            >
              {createPost.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="arrow-up" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </KeyboardAvoidingView>

      {/* Reaction picker modal */}
      <Modal
        visible={pickerForPostId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerForPostId(null)}
      >
        <Pressable style={styles.pickerOverlay} onPress={() => setPickerForPostId(null)}>
          <View style={styles.pickerContent}>
            {REACTION_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.pickerItem}
                onPress={() => {
                  if (pickerForPostId !== null) {
                    setReaction.mutate({ postId: pickerForPostId, emoji });
                  }
                  setPickerForPostId(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.pickerEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 8,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 16,
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
    marginTop: 1,
  },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedContent: {
    paddingTop: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  postAuthorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  postAuthorInfo: {
    flex: 1,
  },
  postAuthorName: {
    fontSize: 14,
    color: '#000',
  },
  postTime: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.4)',
    marginTop: 1,
  },
  postText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 21,
    marginBottom: 8,
  },
  postImage: {
    width: '100%',
    height: 240,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  reactionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  reactionButtonActive: {
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  reactionCounts: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  reactionPillActive: {
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.4)',
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.6)',
  },
  reactionCountActive: {
    color: '#3b82f6',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContent: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 32,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  pickerItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerEmoji: {
    fontSize: 28,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(0,0,0,0.4)',
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#000000',
  },
  attachButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  composerInputWrapper: {
    flex: 1,
    minHeight: 38,
    maxHeight: 120,
    borderRadius: 19,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  composerInput: {
    fontSize: 15,
    color: '#000',
    padding: 0,
    margin: 0,
    maxHeight: 100,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.3,
  },
});
