// Messages Screen - Clean conversations list with message search

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useChat } from '@/lib/providers/chat-provider';
import { useChannels, type ChannelData } from '@/hooks/use-channels';
import { useAppTheme } from '@/hooks/use-app-theme';

// Local default avatar with white background
const DefaultAvatarImage = require('@/assets/images/default-avatar.png');

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) {
    return 'now';
  } else if (diffMins < 60) {
    return `${diffMins}m`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else if (diffDays === 1) {
    return '1d';
  } else if (diffDays < 7) {
    return `${diffDays}d`;
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

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

function ConversationRow({
  channel,
  onPress,
  onLongPress,
  currentUserId,
  index,
  searchMatch,
}: {
  channel: ChannelData;
  onPress: () => void;
  onLongPress: () => void;
  currentUserId?: string;
  index: number;
  searchMatch?: string;
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

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 30, 300)).duration(250)}>
      <TouchableOpacity
        style={styles.conversationRow}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={500}
        activeOpacity={0.6}
      >
        <ConversationAvatar
          imageUrl={channel.imageUrl}
          isOnline={channel.isOnline}
          hasUnread={hasUnread}
        />

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text
              style={[styles.conversationTitle, hasUnread && styles.conversationTitleUnread]}
              numberOfLines={1}
            >
              {channel.name}
            </Text>
            <Text style={[styles.timestamp, hasUnread && styles.timestampUnread]}>
              {channel.lastMessage ? formatTime(channel.lastMessage.createdAt) : ''}
            </Text>
          </View>

          <View style={styles.conversationFooter}>
            <Text
              style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]}
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
  const router = useRouter();
  const { client, status, reconnect } = useChat();
  const { channelData, isLoading, refetch, deleteChannel } = useChannels();
  const { colors, isDark } = useAppTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Map<string, string>>(new Map());

  const currentUserId = client?.userID;

  // Pull-to-refresh with haptic feedback
  const { refreshControl } = useRefreshControl({
    onRefresh: refetch,
  });

  // Search through message content using Stream Chat search API
  const performSearch = useCallback(async (query: string) => {
    if (!client || !query.trim()) {
      setSearchResults(new Map());
      return;
    }

    setIsSearching(true);
    try {
      // Use Stream Chat's message search API
      const response = await client.search(
        { members: { $in: [currentUserId || ''] } },
        query,
        { limit: 30, offset: 0 }
      );

      const results = new Map<string, string>();

      if (response.results) {
        response.results.forEach((result: any) => {
          const message = result.message;
          if (message && message.cid) {
            // Extract channel ID from cid (format: "messaging:channelId")
            const channelId = message.cid.split(':')[1];
            if (channelId && message.text) {
              // Store the matching message snippet
              const snippet = message.text.length > 50
                ? message.text.substring(0, 50) + '...'
                : message.text;
              results.set(channelId, `"${snippet}"`);
            }
          }
        });
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to local search if API fails
      performLocalSearch(query);
    } finally {
      setIsSearching(false);
    }
  }, [client, currentUserId]);

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

  const handleDeleteConversation = useCallback(
    (channel: ChannelData) => {
      Alert.alert(
        'Delete Conversation',
        `Are you sure you want to delete your conversation with ${channel.name}? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const success = await deleteChannel(channel.id);
              if (!success) {
                Alert.alert('Error', 'Failed to delete conversation. Please try again.');
              }
            },
          },
        ]
      );
    },
    [deleteChannel]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ChannelData; index: number }) => (
      <ConversationRow
        channel={item}
        onPress={() => handleConversationPress(item)}
        onLongPress={() => handleDeleteConversation(item)}
        currentUserId={currentUserId}
        index={index}
        searchMatch={searchResults.get(item.id)}
      />
    ),
    [handleConversationPress, handleDeleteConversation, currentUserId, searchResults]
  );

  const renderEmptyState = useCallback(() => {
    if (searchQuery) {
      return <SearchEmptyState query={searchQuery} colors={colors} />;
    }
    return <EmptyMessages onSendMessage={handleNewMessage} colors={colors} />;
  }, [searchQuery, handleNewMessage, colors]);

  // Show loading while connecting
  if (status === 'connecting') {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <DarkGradientBg />
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
          <TouchableOpacity style={styles.headerButton} onPress={handleNewMessage}>
            <Ionicons name="create-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <LoadingState colors={colors} />
      </View>
    );
  }

  // Show error state
  if (status === 'error') {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <DarkGradientBg />
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
          <View style={styles.headerButton} />
        </View>
        <ConnectionError onRetry={reconnect} colors={colors} />
      </View>
    );
  }

  // Show loading while fetching channels
  if (status === 'connected' && isLoading && channelData.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <DarkGradientBg />
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
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
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <DarkGradientBg />
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleNewMessage}>
          <Ionicons name="create-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.input, borderColor: 'transparent' }, isSearchFocused && { borderColor: colors.inputBorder }]}>
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
  title: {
    fontSize: 24,
    fontFamily: 'Lato_700Bold',
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
    flex: 1,
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: '#1a1a1a',
    marginRight: 8,
  },
  conversationTitleUnread: {
    fontFamily: 'Lato_700Bold',
  },
  timestamp: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.4)',
  },
  timestampUnread: {
    color: '#1a1a1a',
  },
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.4)',
  },
  lastMessageUnread: {
    color: 'rgba(0,0,0,0.7)',
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
});
