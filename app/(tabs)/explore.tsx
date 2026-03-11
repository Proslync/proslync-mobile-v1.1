// Messages Screen - Clean conversations list with message search

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useStableRouter } from '@/hooks/use-stable-router';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  useConversations,
  usePinConversation,
  useUnpinConversation,
  useEnsureConcierge,
  type ChannelData,
} from '@/hooks/use-conversations';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuth } from '@/lib/providers/auth-provider';
import { useTabNavigation } from '@/lib/providers/tab-navigation-provider';
import { formatTimestamp } from '@/lib/utils/date';

// Local default avatar with white background
const DefaultAvatarImage = require('@/assets/images/default-avatar.png');

// Avatar with online indicator
function ConversationAvatar({
  imageUrl,
  isOnline,
  hasUnread,
  size = 56,
}: {
  imageUrl?: string;
  isOnline?: boolean;
  hasUnread?: boolean;
  size?: number;
}) {
  const hasCustomAvatar = imageUrl && imageUrl.length > 0;

  return (
    <View style={[styles.avatarContainer, { width: size, height: size }]}>
      <View style={[styles.avatarWrapper, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image
          source={hasCustomAvatar ? { uri: imageUrl } : DefaultAvatarImage}
          style={[styles.avatarImage, { width: size, height: size, borderRadius: size / 2 }]}
        />
      </View>
      {hasUnread && (
        <View style={styles.unreadRing}>
          <LinearGradient
            colors={['#0095f6', '#0095f6']}
            style={[styles.unreadRingGradient, {
              width: size + 4,
              height: size + 4,
              borderRadius: (size + 4) / 2
            }]}
          />
        </View>
      )}
      {isOnline && (
        <View style={styles.onlineIndicator}>
          <View style={styles.onlineDot} />
        </View>
      )}
    </View>
  );
}

interface SearchResult {
  channelId: string;
  channelName: string;
  channelImage?: string;
  isOnline?: boolean;
  matchedMessage?: string;
  matchedAt?: string;
}

function ConciergeAvatar({ size = 56 }: { size?: number }) {
  return (
    <View
      style={[
        styles.avatarWrapper,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#1a1a2e',
          borderWidth: 1.5,
          borderColor: 'rgba(255,255,255,0.15)',
        },
      ]}
    >
      <Ionicons name="sparkles" size={size * 0.45} color="#fff" />
    </View>
  );
}

function ConversationRow({
  channel,
  onPress,
  onLongPress,
  currentUserId,
  index,
  searchMatch,
  colors,
  isDark,
}: {
  channel: ChannelData;
  onPress: () => void;
  onLongPress: () => void;
  currentUserId?: string;
  index: number;
  searchMatch?: string;
  colors: any;
  isDark: boolean;
}) {
  const hasUnread = channel.unreadCount > 0;
  const isOwnMessage = channel.lastMessage?.userId === currentUserId;

  const getLastMessageText = () => {
    if (searchMatch) {
      return searchMatch;
    }
    if (!channel.lastMessage) return 'Start a conversation';

    // Check attachment type
    const attachmentType = channel.lastMessage.attachmentType;

    if (attachmentType === 'audio') {
      return isOwnMessage ? 'You sent a voice message' : 'Sent a voice message';
    }

    if (attachmentType === 'video') {
      return isOwnMessage ? 'You sent a video' : 'Sent a video';
    }

    if (attachmentType === 'image' || !channel.lastMessage.text) {
      return isOwnMessage ? 'You sent an image' : 'Sent an image';
    }

    const prefix = isOwnMessage ? 'You: ' : '';
    return `${prefix}${channel.lastMessage.text}`;
  };

  // Read receipt status icon for own messages
  const renderReadStatus = () => {
    if (!isOwnMessage || !channel.lastMessage) return null;

    if (channel.lastMessageReadByOther) {
      return (
        <Ionicons name="checkmark-done" size={14} color="#0095f6" style={{ marginRight: 4 }} />
      );
    }
    // Delivered (sent but not read)
    return (
      <Ionicons name="checkmark-done" size={14} color={colors.textTertiary} style={{ marginRight: 4 }} />
    );
  };

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 30, 300)).duration(250)}>
      <TouchableOpacity
        style={styles.conversationRow}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={500}
        activeOpacity={0.6}
      >
        {channel.isConcierge ? (
          <ConciergeAvatar />
        ) : (
          <ConversationAvatar
            imageUrl={channel.imageUrl}
            isOnline={channel.isOnline}
            hasUnread={hasUnread}
          />
        )}

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <View style={styles.titleRow}>
              <Text
                style={[styles.conversationTitle, { color: colors.text }, hasUnread && styles.conversationTitleUnread]}
                numberOfLines={1}
              >
                {channel.name}
              </Text>
              {channel.isPinned && !channel.isConcierge && (
                <Ionicons name="pin" size={12} color={colors.textTertiary} style={{ marginLeft: 4 }} />
              )}
            </View>
            <Text style={[styles.timestamp, { color: colors.textTertiary }, hasUnread && { color: colors.text }]}>
              {channel.lastMessage ? formatTimestamp(channel.lastMessage.createdAt) : ''}
            </Text>
          </View>

          <View style={styles.conversationFooter}>
            {renderReadStatus()}
            <Text
              style={[
                styles.lastMessage,
                { color: colors.textSecondary },
                hasUnread && { color: colors.text, fontFamily: 'Lato_700Bold' },
              ]}
              numberOfLines={1}
            >
              {getLastMessageText()}
            </Text>
            {hasUnread && <View style={styles.unreadDot} />}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function EmptyMessages({ onSendMessage, colors }: { onSendMessage: () => void; colors: any }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color={colors.textTertiary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Your Messages</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Send private photos and messages to a friend
      </Text>
      <TouchableOpacity style={styles.sendMessageButton} onPress={onSendMessage}>
        <Text style={styles.sendMessageButtonText}>Send Message</Text>
      </TouchableOpacity>
    </View>
  );
}

function SearchEmptyState({ query, colors }: { query: string; colors: any }) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={64} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No results</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        No messages or conversations found for "{query}"
      </Text>
    </View>
  );
}

function ConnectionError({ onRetry, colors }: { onRetry: () => void; colors: any }) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="cloud-offline-outline" size={64} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Connection Error</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Unable to connect to chat. Please try again.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

function LoadingState({ colors }: { colors: any }) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.text} />
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Connecting...</Text>
    </View>
  );
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuth();
  const { openAccountSwitcher } = useTabNavigation();
  const { channelData, isLoading, refetch, deleteChannel } = useConversations(user?.id);
  const pinMutation = usePinConversation();
  const unpinMutation = useUnpinConversation();
  useEnsureConcierge();
  const headerTitle = user?.userName ? `@${user.userName}` : 'Messages';

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Map<string, string>>(new Map());

  const currentUserId = user ? String(user.id) : undefined;

  // Pull-to-refresh with haptic feedback
  const { refreshControl } = useRefreshControl({
    onRefresh: refetch,
  });

  // Search through conversations locally (name + last message)
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults(new Map());
      return;
    }

    setIsSearching(true);
    try {
      performLocalSearch(query);
    } finally {
      setIsSearching(false);
    }
  }, [performLocalSearch]);

  // Fallback local search through channel names and last messages
  const performLocalSearch = useCallback((query: string) => {
    const results = new Map<string, string>();
    const lowerQuery = query.toLowerCase();

    channelData.forEach((channel) => {
      // Check channel name
      if (channel.name.toLowerCase().includes(lowerQuery)) {
        results.set(channel.id, '');
      }
      // Check last message
      else if (channel.lastMessage?.text?.toLowerCase().includes(lowerQuery)) {
        const text = channel.lastMessage.text;
        const index = text.toLowerCase().indexOf(lowerQuery);
        const start = Math.max(0, index - 15);
        const end = Math.min(text.length, index + query.length + 15);
        const snippet = (start > 0 ? '...' : '') +
                       text.substring(start, end) +
                       (end < text.length ? '...' : '');
        results.set(channel.id, `"${snippet}"`);
      }
    });

    setSearchResults(results);
  }, [channelData]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      } else {
        setSearchResults(new Map());
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // Filter channels by search query (names + content matches)
  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) {
      return channelData;
    }

    const lowerQuery = searchQuery.toLowerCase();

    return channelData.filter((channel) => {
      // Match by name
      if (channel.name.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      // Match by search results (message content)
      if (searchResults.has(channel.id)) {
        return true;
      }
      // Match by last message text
      if (channel.lastMessage?.text?.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      return false;
    });
  }, [channelData, searchQuery, searchResults]);

  const handleConversationPress = useCallback(
    (channel: ChannelData) => {
      router.push({
        pathname: '/chat/[conversationId]',
        params: { conversationId: channel.id },
      });
    },
    [router]
  );

  const handleNewMessage = useCallback(() => {
    router.push('/new-message');
  }, [router]);

  const [deleteTarget, setDeleteTarget] = useState<ChannelData | null>(null);
  const [deleteError, setDeleteError] = useState(false);
  const [actionTarget, setActionTarget] = useState<ChannelData | null>(null);

  const handleLongPress = useCallback(
    (channel: ChannelData) => {
      setActionTarget(channel);
    },
    []
  );

  const handleTogglePin = useCallback(async () => {
    if (!actionTarget) return;
    if (actionTarget.isPinned) {
      unpinMutation.mutate(actionTarget.id);
    } else {
      pinMutation.mutate(actionTarget.id);
    }
    setActionTarget(null);
  }, [actionTarget, pinMutation, unpinMutation]);

  const handleDeleteFromAction = useCallback(() => {
    if (!actionTarget) return;
    setDeleteTarget(actionTarget);
    setActionTarget(null);
  }, [actionTarget]);

  const renderItem = useCallback(
    ({ item, index }: { item: ChannelData; index: number }) => (
      <ConversationRow
        channel={item}
        onPress={() => handleConversationPress(item)}
        onLongPress={() => handleLongPress(item)}
        currentUserId={currentUserId}
        index={index}
        searchMatch={searchResults.get(item.id)}
        colors={colors}
        isDark={isDark}
      />
    ),
    [handleConversationPress, handleLongPress, currentUserId, searchResults, colors, isDark]
  );

  const renderEmptyState = useCallback(() => {
    if (searchQuery) {
      return <SearchEmptyState query={searchQuery} colors={colors} />;
    }
    return <EmptyMessages onSendMessage={handleNewMessage} colors={colors} />;
  }, [searchQuery, handleNewMessage, colors]);


  // Show loading while fetching conversations
  if (isLoading && channelData.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
          <View style={styles.headerButton} />
          <Text style={[styles.title, { color: colors.text }]}>{headerTitle}</Text>
          <TouchableOpacity style={styles.headerButton} onPress={handleNewMessage}>
            <Ionicons name="create-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading messages...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerButton} />
        <TouchableOpacity
          style={styles.usernameButton}
          onPress={openAccountSwitcher}
          activeOpacity={0.7}
        >
          <Text style={[styles.title, { color: colors.text }]}>{headerTitle}</Text>
          <Ionicons name="chevron-down" size={18} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={handleNewMessage}>
          <Ionicons name="create-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }, isSearchFocused && { borderColor: colors.textTertiary }]}>
          <Ionicons name="search" size={18} color={colors.placeholder} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search messages..."
            placeholderTextColor={colors.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {isSearching && (
            <ActivityIndicator size="small" color={colors.placeholder} />
          )}
          {searchQuery.length > 0 && !isSearching && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.placeholder} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Conversations List */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.listContainer}>
        <FlatList
          data={filteredChannels}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={[
            filteredChannels.length === 0 ? styles.emptyListContainer : styles.listContent,
            { paddingBottom: insets.bottom + 90 },
          ]}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>

      {/* Long press action sheet */}
      <Modal
        visible={!!actionTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setActionTarget(null)}
      >
        <TouchableOpacity
          style={styles.actionOverlay}
          activeOpacity={1}
          onPress={() => setActionTarget(null)}
        >
          <View style={[styles.actionSheet, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.actionTitle, { color: colors.text }]} numberOfLines={1}>
              {actionTarget?.name}
            </Text>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleTogglePin}
            >
              <Ionicons
                name={actionTarget?.isPinned ? 'pin-outline' : 'pin'}
                size={20}
                color={colors.text}
              />
              <Text style={[styles.actionText, { color: colors.text }]}>
                {actionTarget?.isPinned ? 'Unpin conversation' : 'Pin conversation'}
              </Text>
            </TouchableOpacity>
            {actionTarget && !actionTarget.isConcierge && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDeleteFromAction}
              >
                <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
                <Text style={[styles.actionText, { color: '#ff6b6b' }]}>Delete conversation</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, { marginTop: 4 }]}
              onPress={() => setActionTarget(null)}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ConfirmModal
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          const success = await deleteChannel(deleteTarget.id);
          setDeleteTarget(null);
          if (!success) setDeleteError(true);
        }}
        title="Delete Conversation"
        message={`Are you sure you want to delete your conversation with ${deleteTarget?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        icon="trash-outline"
      />

      <ConfirmModal
        visible={deleteError}
        onClose={() => setDeleteError(false)}
        title="Error"
        message="Failed to delete conversation. Please try again."
        alertOnly
        icon="alert-circle-outline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  usernameButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Lato_700Bold',
    textAlign: 'center',
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
    borderWidth: 1,
  },
  searchBarFocused: {
    // borderColor set dynamically
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingTop: 4,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  // Avatar styles
  avatarContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  avatarWrapper: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    backgroundColor: 'transparent',
  },
  unreadRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
  },
  unreadRingGradient: {
    position: 'absolute',
    opacity: 0,
  },
  onlineIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34c759',
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  conversationTitle: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    flexShrink: 1,
  },
  conversationTitleUnread: {
    fontFamily: 'Lato_700Bold',
  },
  timestamp: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0095f6',
    marginLeft: 8,
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'Lato_700Bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  sendMessageButton: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#0095f6',
    borderRadius: 8,
  },
  sendMessageButtonText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#0095f6',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  aiBadge: {
    marginLeft: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  aiBadgeText: {
    fontSize: 10,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255,255,255,0.7)',
  },
  actionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  actionSheet: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 12,
  },
  actionText: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
  },
});
