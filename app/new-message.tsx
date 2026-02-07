// New Message Screen - Start a new conversation with Stream Chat

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '@/lib/providers/chat-provider';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useChannels, type ChannelData } from '@/hooks/use-channels';

interface SearchUser {
  id: string;
  name: string;
  image?: string;
  online?: boolean;
}

function ContactRow({
  user,
  onPress,
}: {
  user: SearchUser;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.contactRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: user.image || 'https://picsum.photos/100' }}
          style={styles.avatar}
        />
        {user.online && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{user.name}</Text>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={48} color="rgba(0,0,0,0.25)" />
      <Text style={styles.emptyTitle}>No results</Text>
      <Text style={styles.emptySubtitle}>
        {query ? `No users found for "${query}"` : 'Search for someone to message'}
      </Text>
    </View>
  );
}

export default function NewMessageScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { client, status } = useChat();
  const { channelData } = useChannels();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Get recent contacts from existing channels
  const recentContacts = useMemo((): SearchUser[] => {
    if (!client) return [];

    return channelData.slice(0, 10).map((channel) => ({
      id: channel.id,
      name: channel.name,
      image: channel.imageUrl,
      online: channel.isOnline,
    }));
  }, [channelData, client]);

  // Search users via Stream Chat
  useEffect(() => {
    if (!client || status !== 'connected' || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      setIsSearching(true);
      try {
        const response = await client.queryUsers(
          {
            $or: [
              { name: { $autocomplete: searchQuery } },
              { id: { $autocomplete: searchQuery } },
            ],
            id: { $ne: client.userID || '' },
          },
          { name: 1 },
          { limit: 20 }
        );

        setSearchResults(
          response.users.map((u) => ({
            id: u.id,
            name: (u.name as string) || u.id,
            image: u.image as string | undefined,
            online: u.online,
          }))
        );
      } catch (err) {
        console.error('[NewMessage] Search error:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [client, status, searchQuery]);

  // Find existing channel with user
  const findExistingChannel = useCallback(
    (userId: string): ChannelData | undefined => {
      return channelData.find((c) => c.id.includes(userId));
    },
    [channelData]
  );

  // Create or get channel with user
  const handleSelectUser = useCallback(
    async (user: SearchUser) => {
      if (!client || isCreating) return;

      setIsCreating(true);
      try {
        // Check for existing channel
        const existing = findExistingChannel(user.id);
        if (existing) {
          router.replace({
            pathname: '/chat/[conversationId]',
            params: { conversationId: existing.id },
          });
          return;
        }

        // Create new channel
        const channelId = [client.userID, user.id].sort().join('-');
        const channel = client.channel('messaging', channelId, {
          members: [client.userID || '', user.id],
          name: user.name,
          image: user.image,
        });

        await channel.create();

        router.replace({
          pathname: '/chat/[conversationId]',
          params: { conversationId: channel.id || channelId },
        });
      } catch (err) {
        console.error('[NewMessage] Create channel error:', err);
      } finally {
        setIsCreating(false);
      }
    },
    [client, findExistingChannel, isCreating, router]
  );

  // Navigate to existing conversation
  const handleSelectConversation = useCallback(
    (channel: ChannelData) => {
      router.replace({
        pathname: '/chat/[conversationId]',
        params: { conversationId: channel.id },
      });
    },
    [router]
  );

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const renderSearchResult = useCallback(
    ({ item }: { item: SearchUser }) => (
      <ContactRow user={item} onPress={() => handleSelectUser(item)} />
    ),
    [handleSelectUser]
  );

  const renderRecentContact = useCallback(
    ({ item }: { item: ChannelData }) => (
      <ContactRow
        user={{
          id: item.id,
          name: item.name,
          image: item.imageUrl,
          online: item.isOnline,
        }}
        onPress={() => handleSelectConversation(item)}
      />
    ),
    [handleSelectConversation]
  );

  const renderSectionHeader = useCallback(
    (title: string) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
    ),
    []
  );

  // Show loading while chat is connecting
  if (status === 'connecting') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <DarkGradientBg />
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>New Message</Text>
          <View style={styles.cancelButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a1a1a" />
          <Text style={styles.loadingText}>Connecting...</Text>
        </View>
      </View>
    );
  }

  // Show creating overlay
  const showOverlay = isCreating;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <DarkGradientBg />
      <StatusBar barStyle="dark-content" />

      {/* Creating overlay */}
      {showOverlay && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#1a1a1a" />
          <Text style={styles.overlayText}>Creating conversation...</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Message</Text>
        <View style={styles.cancelButton} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.toLabel}>To:</Text>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search"
            placeholderTextColor="rgba(0,0,0,0.35)"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {isSearching && (
            <ActivityIndicator size="small" color="rgba(0,0,0,0.4)" />
          )}
          {searchQuery.length > 0 && !isSearching && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="rgba(0,0,0,0.4)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {searchQuery.trim() ? (
        // Search results
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={renderSearchResult}
          ListEmptyComponent={
            isSearching ? null : <EmptyState query={searchQuery} />
          }
          contentContainerStyle={
            searchResults.length === 0 && !isSearching ? styles.emptyListContainer : undefined
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        // Recent conversations
        <FlatList
          data={channelData.slice(0, 20)}
          keyExtractor={(item) => item.id}
          renderItem={renderRecentContact}
          ListHeaderComponent={
            recentContacts.length > 0 ? renderSectionHeader('Recent') : null
          }
          ListEmptyComponent={<EmptyState query="" />}
          contentContainerStyle={
            recentContacts.length === 0 ? styles.emptyListContainer : undefined
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  cancelButton: {
    width: 60,
  },
  cancelText: {
    fontSize: 17,
    fontFamily: 'Lato_400Regular',
    color: '#0095f6',
  },
  title: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    color: '#1a1a1a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  toLabel: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0, 0, 0, 0.5)',
    marginRight: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: '#1a1a1a',
    paddingVertical: 0,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(0, 0, 0, 0.45)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#fff',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: '#1a1a1a',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginLeft: 78,
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'center',
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
    color: 'rgba(0,0,0,0.5)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  overlayText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: '#1a1a1a',
  },
});
