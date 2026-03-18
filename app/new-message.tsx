// New Message Screen - Start a new conversation

import React, { useState, useCallback, useEffect } from 'react';
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
import { useAuth } from '@/lib/providers/auth-provider';
import { followsApi } from '@/lib/api/follows';
import { chatApi } from '@/lib/api/chat';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useAppTheme, type ThemeColors } from '@/hooks/use-app-theme';
import type { UserFollowItem } from '@/lib/types/follows.types';

const DefaultAvatarImage = require('@/assets/images/default-avatar.png');

interface ContactItem {
  id: number;
  name: string;
  userName?: string | null;
  image?: string | null;
  /** 0 = mutual, 1 = following, 2 = follower */
  sortGroup: number;
}

interface SearchUser {
  id: string;
  name: string;
  image?: string;
  online?: boolean;
}

function SearchResultRow({
  user,
  onPress,
  colors,
  isSelected,
}: {
  user: SearchUser;
  onPress: () => void;
  colors: ThemeColors;
  isSelected?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.contactRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatarContainer}>
        <Image
          source={user.image ? { uri: user.image } : DefaultAvatarImage}
          style={styles.avatar}
        />
        {user.online && <View style={[styles.onlineIndicator, { borderColor: colors.background }]} />}
      </View>
      <View style={styles.contactInfo}>
        <Text style={[styles.contactName, { color: colors.text }]}>{user.name}</Text>
      </View>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={24} color={colors.text} />
      )}
    </TouchableOpacity>
  );
}

function EmptyState({ query, colors }: { query: string; colors: ThemeColors }) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No results</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {query ? `No users found for "${query}"` : 'Search for someone to message'}
      </Text>
    </View>
  );
}

function buildDisplayName(item: UserFollowItem): string {
  const parts = [item.firstName, item.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : item.userName || `User ${item.id}`;
}

export default function NewMessageScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { colors, isDark } = useAppTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [selectedContacts, setSelectedContacts] = useState<ContactItem[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isGroupMode, setIsGroupMode] = useState(false);

  // Fetch following + followers and build sorted contact list
  useEffect(() => {
    if (!currentUser?.id) return;

    let cancelled = false;

    async function fetchContacts() {
      setIsLoadingContacts(true);
      try {
        const [followingRes, followersRes] = await Promise.all([
          followsApi.getUserFollowing(currentUser!.id),
          followsApi.getUserFollowers(currentUser!.id),
        ]);

        if (cancelled) return;

        const followingUsers = followingRes.followingUsers || [];
        const followerUsers = followersRes.userFollowers || [];

        // Build sets for quick lookup
        const followingIds = new Set(followingUsers.map((u) => u.id));
        const followerIds = new Set(followerUsers.map((u) => u.id));

        const contactMap = new Map<number, ContactItem>();

        // Add all following users
        for (const u of followingUsers) {
          const isMutual = followerIds.has(u.id);
          contactMap.set(u.id, {
            id: u.id,
            name: buildDisplayName(u),
            userName: u.userName,
            image: u.avatarUrl,
            sortGroup: isMutual ? 0 : 1,
          });
        }

        // Add followers not already in the map
        for (const u of followerUsers) {
          if (!contactMap.has(u.id)) {
            contactMap.set(u.id, {
              id: u.id,
              name: buildDisplayName(u),
              userName: u.userName,
              image: u.avatarUrl,
              sortGroup: 2,
            });
          }
        }

        // Sort: mutuals (0), following (1), followers (2), then alphabetical within each
        const sorted = Array.from(contactMap.values()).sort((a, b) => {
          if (a.sortGroup !== b.sortGroup) return a.sortGroup - b.sortGroup;
          return a.name.localeCompare(b.name);
        });

        setContacts(sorted);
      } catch (err) {
        console.error('Error fetching contacts:', err);
      } finally {
        if (!cancelled) setIsLoadingContacts(false);
      }
    }

    fetchContacts();
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  // Filter contacts by search query (search is client-side from contacts list)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = contacts
      .filter((c) =>
        c.name.toLowerCase().includes(query) ||
        c.userName?.toLowerCase().includes(query),
      )
      .map((c) => ({
        id: String(c.id),
        name: c.name,
        image: c.image || undefined,
      }));

    setSearchResults(filtered);
  }, [searchQuery, contacts]);

  // Open or create conversation with a user (by numeric userId)
  const openChannelWithUser = useCallback(
    async (targetUserId: string) => {
      if (isCreating) return;

      setIsCreating(true);
      try {
        const targetId = Number(targetUserId);
        if (isNaN(targetId)) return;

        // Create conversation (backend will dedup existing DMs)
        const conversation = await chatApi.createConversation([targetId]);

        router.replace({
          pathname: '/chat/[conversationId]',
          params: { conversationId: conversation.id },
        });
      } catch (err) {
        console.error('Create conversation error:', err);
      } finally {
        setIsCreating(false);
      }
    },
    [isCreating, router]
  );

  const toggleContact = useCallback(
    (contact: ContactItem) => {
      setSelectedContacts((prev) => {
        const exists = prev.find((c) => c.id === contact.id);
        if (exists) return prev.filter((c) => c.id !== contact.id);
        return [...prev, contact];
      });
    },
    [],
  );

  const handleSelectContact = useCallback(
    (contact: ContactItem) => {
      if (isGroupMode) {
        toggleContact(contact);
        return;
      }
      // Single tap with no selections = open DM directly
      openChannelWithUser(String(contact.id));
    },
    [openChannelWithUser, isGroupMode, toggleContact],
  );

  const handleSelectSearchResult = useCallback(
    (user: SearchUser) => {
      if (isGroupMode) {
        const contact: ContactItem = {
          id: Number(user.id),
          name: user.name,
          image: user.image,
          sortGroup: 0,
        };
        toggleContact(contact);
        return;
      }
      openChannelWithUser(user.id);
    },
    [openChannelWithUser, isGroupMode, toggleContact],
  );

  const exitGroupMode = useCallback(() => {
    setIsGroupMode(false);
    setSelectedContacts([]);
    setGroupName('');
  }, []);

  const handleCreateGroup = useCallback(async () => {
    if (isCreating || selectedContacts.length < 2) return;
    setIsCreating(true);
    try {
      const memberIds = selectedContacts.map((c) => c.id);
      const name = groupName.trim() || selectedContacts.map((c) => c.name.split(' ')[0]).join(', ');
      const conversation = await chatApi.createConversation(memberIds, name);
      router.replace({
        pathname: '/chat/[conversationId]',
        params: { conversationId: conversation.id },
      });
    } catch (err) {
      console.error('Create group error:', err);
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, selectedContacts, groupName, router]);

  const handleClose = useCallback(() => {
    if (isGroupMode) {
      exitGroupMode();
      return;
    }
    router.back();
  }, [router, isGroupMode, exitGroupMode]);

  const selectedIds = React.useMemo(() => new Set(selectedContacts.map((c) => c.id)), [selectedContacts]);

  const renderContact = useCallback(
    ({ item }: { item: ContactItem }) => (
      <TouchableOpacity
        onPress={() => handleSelectContact(item)}
        activeOpacity={0.7}
        style={styles.contactRow}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={item.image ? { uri: item.image } : DefaultAvatarImage}
            style={styles.avatar}
          />
        </View>
        <View style={styles.contactInfo}>
          <Text style={[styles.contactName, { color: colors.text }]}>{item.name}</Text>
          {item.userName ? (
            <Text style={[styles.contactUsername, { color: colors.textSecondary }]}>@{item.userName}</Text>
          ) : null}
        </View>
        {selectedIds.has(item.id) && (
          <Ionicons name="checkmark-circle" size={24} color={colors.text} />
        )}
      </TouchableOpacity>
    ),
    [handleSelectContact, colors, selectedIds],
  );

  const renderSearchResult = useCallback(
    ({ item }: { item: SearchUser }) => (
      <SearchResultRow
        user={item}
        onPress={() => handleSelectSearchResult(item)}
        colors={colors}
        isSelected={selectedIds.has(Number(item.id))}
      />
    ),
    [handleSelectSearchResult, colors, selectedIds],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Creating overlay */}
      {isCreating && (
        <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(15, 9, 12, 0.85)' : 'rgba(255, 255, 255, 0.85)' }]}>
          <ActivityIndicator size="large" color={colors.text} />
          <Text style={[styles.overlayText, { color: colors.text }]}>Opening conversation...</Text>
        </View>
      )}

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
          {isGroupMode ? (
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          ) : (
            <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
          )}
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {isGroupMode ? 'New Group' : 'New Message'}
        </Text>
        {isGroupMode ? (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCreateGroup}
            disabled={selectedContacts.length < 2 || isCreating}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.headerActionText,
                { color: colors.text },
                selectedContacts.length < 2 && { opacity: 0.3 },
              ]}
            >
              Create
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.cancelButton} />
        )}
      </View>

      {/* Selected contacts chips */}
      {isGroupMode && selectedContacts.length > 0 && (
        <View style={[styles.chipsContainer, { borderBottomColor: colors.border }]}>
          <FlatList
            horizontal
            data={selectedContacts}
            keyExtractor={(item) => String(item.id)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.chip, { overflow: 'hidden' as const, borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1 }]}
                onPress={() => toggleContact(item)}
                activeOpacity={0.7}
              >
                <GlassView {...liquidGlass.fill} borderRadius={20} style={StyleSheet.absoluteFillObject} />
                <Image
                  source={item.image ? { uri: item.image } : DefaultAvatarImage}
                  style={styles.chipAvatar}
                />
                <Text style={[styles.chipName, { color: colors.text }]}>{item.name.split(' ')[0]}</Text>
                <Ionicons name="close" size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          />
          {selectedContacts.length >= 2 && (
            <View style={styles.groupNameRow}>
              <View style={[styles.groupNameInput, { borderColor: colors.border, backgroundColor: isDark ? undefined : colors.input, overflow: 'hidden' as const }]}>
                {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={8} style={StyleSheet.absoluteFillObject} />}
                <TextInput
                  style={{ flex: 1, fontSize: 15, fontFamily: 'Lato_400Regular', paddingHorizontal: 12, paddingVertical: 8, color: colors.text }}
                  value={groupName}
                  onChangeText={setGroupName}
                  placeholder="Group name (optional)"
                  placeholderTextColor={colors.placeholder}
                />
              </View>
            </View>
          )}
        </View>
      )}

      {/* Search */}
      <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
        <Text style={[styles.toLabel, { color: colors.textSecondary }]}>To:</Text>
        <View style={styles.searchBar}>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search"
            placeholderTextColor={colors.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {isSearching && (
            <ActivityIndicator size="small" color={colors.iconSecondary} />
          )}
          {searchQuery.length > 0 && !isSearching && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.iconSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {searchQuery.trim() ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={renderSearchResult}
          ListEmptyComponent={
            isSearching ? null : <EmptyState query={searchQuery} colors={colors} />
          }
          contentContainerStyle={
            searchResults.length === 0 && !isSearching ? styles.emptyListContainer : undefined
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.separator }]} />}
        />
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderContact}
          ListHeaderComponent={
            <>
              {!isGroupMode && (
                <TouchableOpacity
                  style={styles.newGroupRow}
                  onPress={() => setIsGroupMode(true)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.newGroupIcon, { overflow: 'hidden' as const }]}>
                    <GlassView {...liquidGlass.fill} borderRadius={25} style={StyleSheet.absoluteFillObject} />
                    <Ionicons name="people" size={22} color={colors.text} />
                  </View>
                  <Text style={[styles.contactName, { color: colors.text }]}>Create a Group</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
              {contacts.length > 0 && (
                <View style={[styles.sectionHeader, { backgroundColor: 'transparent' }]}>
                  <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
                    {isGroupMode ? 'Add People' : 'Suggested'}
                  </Text>
                </View>
              )}
            </>
          }
          ListEmptyComponent={
            isLoadingContacts ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.text} />
              </View>
            ) : (
              <EmptyState query="" colors={colors} />
            )
          }
          contentContainerStyle={
            contacts.length === 0 ? styles.emptyListContainer : undefined
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.separator }]} />}
        />
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  cancelButton: {
    width: 60,
  },
  cancelText: {
    fontSize: 17,
    fontFamily: 'Lato_400Regular',
  },
  headerActionText: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    textAlign: 'right',
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
    fontFamily: 'Lato_700Bold',
    color: '#1a1a1a',
  },
  contactUsername: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 1,
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
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.5)',
  },
  newGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  newGroupIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipsContainer: {
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  chipsContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    gap: 6,
  },
  chipAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  chipName: {
    fontSize: 13,
    fontFamily: 'Lato_600SemiBold',
  },
  groupNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  groupNameInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
