// Messages Screen - DMs with profile-style header

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useStableRouter } from "@/hooks/use-stable-router";
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
  Keyboard,
} from "react-native";
import { useRefreshControl } from "@/hooks/use-refresh-control";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { GlassView } from "expo-glass-effect";
import { liquidGlass, glassTint, glassText, glassBorder, glassSurfaceTint } from "@/constants/glass/liquid-glass";
import { DarkGradientBg } from "@/components/shared/dark-gradient-bg";
import {
  useConversations,
  usePinConversation,
  useUnpinConversation,
  useEnsureConcierge,
  type ChannelData,
} from "@/hooks/use-conversations";
import { useUnifiedSearch } from "@/hooks/use-unified-search";
import { chatApi } from "@/lib/api/chat";
import { usersApi } from "@/lib/api/users";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { ConversationActionSheet } from "@/components/messages/action-sheet";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useAuth } from "@/lib/providers/auth-provider";
import { useTabNavigation } from "@/lib/providers/tab-navigation-provider";
import { formatTimestamp } from "@/lib/utils/date";
import type { UnifiedSearchItem } from "@/lib/types/search.types";

// Local default avatar with white background
const DefaultAvatarImage = require("@/assets/images/default-avatar.png");

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
      <View
        style={[
          styles.avatarWrapper,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Image
          source={hasCustomAvatar ? { uri: imageUrl } : DefaultAvatarImage}
          style={[
            styles.avatarImage,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        />
      </View>
      {hasUnread && (
        <View style={styles.unreadRing}>
          <LinearGradient
            colors={["rgba(255,255,255,0.8)", "rgba(255,255,255,0.8)"]}
            style={[
              styles.unreadRingGradient,
              {
                width: size + 4,
                height: size + 4,
                borderRadius: (size + 4) / 2,
              },
            ]}
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

function ConciergeAvatar({ size = 56 }: { size?: number }) {
  return (
    <View
      style={[
        styles.avatarWrapper,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#1a1a2e",
          borderWidth: 1.5,
          borderColor: "rgba(255,255,255,0.15)",
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
  surfaceTint,
}: {
  channel: ChannelData;
  onPress: () => void;
  onLongPress: () => void;
  currentUserId?: string;
  index: number;
  searchMatch?: string;
  colors: ReturnType<typeof useAppTheme>["colors"];
  surfaceTint: string;
}) {
  const hasUnread = channel.unreadCount > 0;
  const isOwnMessage = channel.lastMessage?.userId === currentUserId;

  const getLastMessageText = () => {
    if (searchMatch) {
      return searchMatch;
    }
    if (!channel.lastMessage) return "Start a conversation";

    const attachmentType = channel.lastMessage.attachmentType;

    if (attachmentType === "audio") {
      return isOwnMessage ? "You sent a voice message" : "Sent a voice message";
    }
    if (attachmentType === "video") {
      return isOwnMessage ? "You sent a video" : "Sent a video";
    }
    if (attachmentType === "image" || !channel.lastMessage.text) {
      return isOwnMessage ? "You sent an image" : "Sent an image";
    }

    const prefix = isOwnMessage ? "You: " : "";
    return `${prefix}${channel.lastMessage.text}`;
  };

  // Read receipt status icon for own messages
  const renderReadStatus = () => {
    if (!isOwnMessage || !channel.lastMessage) return null;

    if (channel.lastMessageReadByOther) {
      return (
        <Ionicons
          name="checkmark-done"
          size={14}
          color="#3897F0"
          style={{ marginRight: 4 }}
        />
      );
    }
    return (
      <Ionicons
        name="checkmark-done"
        size={14}
        color={colors.textTertiary}
        style={{ marginRight: 4 }}
      />
    );
  };

  return (
    <Animated.View
      entering={index < 5 ? FadeInDown.delay(index * 30).duration(250) : undefined}
    >
      <View style={styles.cardShadow}>
      <TouchableOpacity
        style={[styles.conversationRow, { overflow: "hidden" }]}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={500}
        activeOpacity={0.6}
      >
        <GlassView {...liquidGlass.surface} borderRadius={16} style={StyleSheet.absoluteFillObject} />
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
                style={[
                  styles.conversationTitle,
                  { color: colors.text },
                  hasUnread && styles.conversationTitleUnread,
                ]}
                numberOfLines={1}
              >
                {channel.name}
              </Text>
              {channel.isVerified && (
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={14}
                  color="#3897F0"
                  style={{ marginLeft: 4 }}
                />
              )}
              {channel.isPinned && !channel.isConcierge && (
                <Ionicons
                  name="pin"
                  size={12}
                  color={colors.textTertiary}
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
            <Text
              style={[
                styles.timestamp,
                { color: colors.textTertiary },
                hasUnread && { color: colors.text },
              ]}
            >
              {channel.lastMessage
                ? formatTimestamp(channel.lastMessage.createdAt)
                : ""}
            </Text>
          </View>

          <View style={styles.conversationFooter}>
            {renderReadStatus()}
            <Text
              style={[
                styles.lastMessage,
                { color: colors.textSecondary },
                hasUnread && {
                  color: colors.text,
                  fontFamily: "Lato_700Bold",
                },
              ]}
              numberOfLines={1}
            >
              {getLastMessageText()}
            </Text>
            {hasUnread && <View style={styles.unreadDot} />}
          </View>
        </View>
      </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function EmptyMessages({
  onSendMessage,
  colors,
}: {
  onSendMessage: () => void;
  colors: ReturnType<typeof useAppTheme>["colors"];
}) {
  return (
    <View style={styles.emptyContainerTop}>
      <View style={[styles.emptyGlassCard, { overflow: "hidden" }]}>
        <GlassView
          {...liquidGlass.surface}
          borderRadius={20}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.emptyIconContainer}>
          <Ionicons
            name="chatbubbles-outline"
            size={56}
            color={colors.textTertiary}
          />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          Your Messages
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Send private photos and messages to a friend
        </Text>
        <TouchableOpacity
          style={[styles.sendMessageButton, { overflow: "hidden" }]}
          onPress={onSendMessage}
        >
          <GlassView
            {...liquidGlass.surface}
            borderRadius={8}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={[styles.sendMessageButtonText, { color: colors.text }]}>Send Message</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SearchEmptyState({
  query,
  colors,
}: {
  query: string;
  colors: ReturnType<typeof useAppTheme>["colors"];
}) {
  return (
    <View style={styles.emptyContainerTop}>
      <View style={[styles.emptyGlassCard, { overflow: "hidden" }]}>
        <GlassView
          {...liquidGlass.surface}
          borderRadius={20}
          style={StyleSheet.absoluteFillObject}
        />
        <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No results
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          No messages or conversations found for &quot;{query}&quot;
        </Text>
      </View>
    </View>
  );
}

// --- New DM Compose Overlay ---

function PersonSearchRow({
  item,
  isSelected,
  onPress,
  colors,
}: {
  item: UnifiedSearchItem;
  isSelected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>["colors"];
}) {
  const displayName = [item.firstName, item.lastName].filter(Boolean).join(" ") || item.userName || "User";
  const avatarUrl = item.avatar?.url;

  return (
    <TouchableOpacity
      style={[styles.personRow, { overflow: "hidden" }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <GlassView
        {...liquidGlass.surface}
        borderRadius={14}
        style={StyleSheet.absoluteFillObject}
      />
      <Image
        source={avatarUrl ? { uri: avatarUrl } : DefaultAvatarImage}
        style={styles.personAvatar}
      />
      <View style={styles.personInfo}>
        <View style={styles.personNameRow}>
          <Text style={[styles.personName, { color: colors.text }]}>
            {displayName}
          </Text>
          {item.isVerified && (
            <MaterialCommunityIcons name="check-decagram" size={14} color="#3897F0" style={{ marginLeft: 4 }} />
          )}
        </View>
        {item.userName && (
          <Text style={[styles.personUsername, { color: colors.textSecondary }]}>
            @{item.userName}
          </Text>
        )}
      </View>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={24} color="#1A1A1A" />
      )}
    </TouchableOpacity>
  );
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { colors: _colors, isDark: _isDark } = useAppTheme();
  const colors = { ..._colors, text: '#000', textSecondary: 'rgba(0,0,0,0.6)', textTertiary: 'rgba(0,0,0,0.4)', background: '#f2f2f2', border: 'rgba(0,0,0,0.08)' };
  const isDark = false;
  const themeKey = 'light' as const;
  const t = glassText[themeKey];
  const border = glassBorder[themeKey];
  const { user } = useAuth();
  const { openAccountSwitcher, tabBarTopOffset } = useTabNavigation();
  const { channelData, isLoading, refetch, deleteChannel } = useConversations(
    user?.id,
  );
  const pinMutation = usePinConversation();
  const unpinMutation = useUnpinConversation();
  useEnsureConcierge();

  const searchInputRef = useRef<TextInput>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState<Map<string, string>>(
    new Map(),
  );

  // Compose new DM state
  const [showCompose, setShowCompose] = useState(false);
  const [selectedPeople, setSelectedPeople] = useState<UnifiedSearchItem[]>([]);
  const [groupName, setGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const composeSearchRef = useRef<TextInput>(null);
  const {
    searchQuery: composeQuery,
    setSearchQuery: setComposeQuery,
    results: composeResults,
    isSearching: isComposeSearching,
    suggestions,
  } = useUnifiedSearch();

  // Filter compose results to people only
  const peopleResults = useMemo(
    () => composeResults.filter((r) => r.type === "person"),
    [composeResults],
  );

  // Suggested people from frequent friends
  const suggestedPeople = useMemo(() => {
    if (!suggestions) return [];
    return suggestions.frequentFriends.slice(0, 10);
  }, [suggestions]);

  const selectedIds = useMemo(
    () => new Set(selectedPeople.map((p) => p.id)),
    [selectedPeople],
  );

  const currentUserId = user ? String(user.id) : undefined;

  // Pull-to-refresh
  const { refreshControl } = useRefreshControl({
    onRefresh: refetch,
  });

  // Local search through channel names and last messages
  const performLocalSearch = useCallback(
    (query: string) => {
      const results = new Map<string, string>();
      const lowerQuery = query.toLowerCase();

      channelData.forEach((channel) => {
        if (channel.name.toLowerCase().includes(lowerQuery)) {
          results.set(channel.id, "");
        } else if (
          channel.lastMessage?.text?.toLowerCase().includes(lowerQuery)
        ) {
          const text = channel.lastMessage.text;
          const idx = text.toLowerCase().indexOf(lowerQuery);
          const start = Math.max(0, idx - 15);
          const end = Math.min(text.length, idx + query.length + 15);
          const snippet =
            (start > 0 ? "..." : "") +
            text.substring(start, end) +
            (end < text.length ? "..." : "");
          results.set(channel.id, `"${snippet}"`);
        }
      });

      setSearchResults(results);
    },
    [channelData],
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performLocalSearch(searchQuery);
      } else {
        setSearchResults(new Map());
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, performLocalSearch]);

  // Filter channels by search
  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channelData;

    return channelData.filter((channel) => {
      if (searchResults.has(channel.id)) return true;
      const lowerQuery = searchQuery.toLowerCase();
      if (channel.name.toLowerCase().includes(lowerQuery)) return true;
      return false;
    });
  }, [channelData, searchQuery, searchResults]);

  const handleConversationPress = useCallback(
    (channel: ChannelData) => {
      router.push({
        pathname: "/chat/[conversationId]",
        params: { conversationId: channel.id },
      });
    },
    [router],
  );

  const handleNotificationsPress = useCallback(() => {
    router.push("/notifications");
  }, [router]);

  const handleSearchPress = useCallback(() => {
    setIsSearchActive(true);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, []);

  const handleSearchCancel = useCallback(() => {
    setSearchQuery("");
    setIsSearchActive(false);
    Keyboard.dismiss();
  }, []);

  // Compose handlers
  const handleOpenCompose = useCallback(() => {
    setShowCompose(true);
    setSelectedPeople([]);
    setGroupName("");
    setComposeQuery("");
    setTimeout(() => composeSearchRef.current?.focus(), 200);
  }, [setComposeQuery]);

  const handleCloseCompose = useCallback(() => {
    setShowCompose(false);
    setSelectedPeople([]);
    setGroupName("");
    setComposeQuery("");
    Keyboard.dismiss();
  }, [setComposeQuery]);

  const togglePersonSelection = useCallback((person: UnifiedSearchItem) => {
    setSelectedPeople((prev) => {
      const exists = prev.find((p) => p.id === person.id);
      if (exists) return prev.filter((p) => p.id !== person.id);
      return [...prev, person];
    });
  }, []);

  const handlePersonPress = useCallback(
    (person: UnifiedSearchItem) => {
      if (selectedPeople.length > 0) {
        // Multi-select mode — toggle
        togglePersonSelection(person);
        return;
      }
      // Single tap with no selections — open DM directly
      setIsCreating(true);
      chatApi
        .createConversation([person.id])
        .then((conversation) => {
          handleCloseCompose();
          router.push({
            pathname: "/chat/[conversationId]",
            params: { conversationId: conversation.id },
          });
        })
        .catch((err) => {
          console.error("Create conversation error:", err);
        })
        .finally(() => {
          setIsCreating(false);
        });
    },
    [selectedPeople.length, togglePersonSelection, handleCloseCompose, router],
  );

  const handleLongPressPerson = useCallback(
    (person: UnifiedSearchItem) => {
      togglePersonSelection(person);
    },
    [togglePersonSelection],
  );

  const handleCreateGroup = useCallback(async () => {
    if (isCreating || selectedPeople.length < 2) return;
    setIsCreating(true);
    try {
      const memberIds = selectedPeople.map((p) => p.id);
      const name =
        groupName.trim() ||
        selectedPeople
          .map((p) => (p.firstName || p.userName || "").split(" ")[0])
          .join(", ");
      const conversation = await chatApi.createConversation(memberIds, name);
      handleCloseCompose();
      router.push({
        pathname: "/chat/[conversationId]",
        params: { conversationId: conversation.id },
      });
    } catch (err) {
      console.error("Create group error:", err);
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, selectedPeople, groupName, handleCloseCompose, router]);

  // Handle tapping a suggested person (from frequent friends)
  const handleSuggestedPersonPress = useCallback(
    (suggestion: { selectedId?: number | null; displayName?: string | null; displayImage?: string | null; userName?: string | null; firstName?: string | null; lastName?: string | null; avatar?: { id: string; url: string } | null }) => {
      if (!suggestion.selectedId) return;
      // Build a minimal UnifiedSearchItem for consistent handling
      const person: UnifiedSearchItem = {
        type: "person",
        id: suggestion.selectedId,
        score: 0,
        userName: suggestion.userName,
        firstName: suggestion.firstName || suggestion.displayName,
        lastName: suggestion.lastName,
        avatar: suggestion.avatar || (suggestion.displayImage ? { id: "", url: suggestion.displayImage } : null),
      };
      handlePersonPress(person);
    },
    [handlePersonPress],
  );

  // Long-press action sheet state
  const [deleteTarget, setDeleteTarget] = useState<ChannelData | null>(null);
  const [deleteError, setDeleteError] = useState(false);
  const [actionTarget, setActionTarget] = useState<ChannelData | null>(null);
  const [blockTarget, setBlockTarget] = useState<ChannelData | null>(null);
  const [blockError, setBlockError] = useState(false);
  const handleLongPress = useCallback((channel: ChannelData) => {
    setActionTarget(channel);
  }, []);

  const dismissActionSheet = useCallback(() => {
    setActionTarget(null);
  }, []);

  const handleTogglePin = useCallback(async () => {
    if (!actionTarget) return;
    if (actionTarget.isPinned) {
      unpinMutation.mutate(actionTarget.id);
    } else {
      pinMutation.mutate(actionTarget.id);
    }
    dismissActionSheet();
  }, [actionTarget, pinMutation, unpinMutation, dismissActionSheet]);

  const handleDeleteFromAction = useCallback(() => {
    if (!actionTarget) return;
    setDeleteTarget(actionTarget);
    dismissActionSheet();
  }, [actionTarget, dismissActionSheet]);

  const handleBlockFromAction = useCallback(() => {
    if (!actionTarget) return;
    setBlockTarget(actionTarget);
    dismissActionSheet();
  }, [actionTarget, dismissActionSheet]);

  const handleConfirmBlock = useCallback(async () => {
    if (!blockTarget?.otherUserId) return;
    try {
      await usersApi.blockUser(blockTarget.otherUserId);
      // Also delete the conversation after blocking
      await deleteChannel(blockTarget.id);
    } catch {
      setBlockError(true);
    }
    setBlockTarget(null);
  }, [blockTarget, deleteChannel]);

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
        surfaceTint={glassSurfaceTint[themeKey]}
      />
    ),
    [
      handleConversationPress,
      handleLongPress,
      currentUserId,
      searchResults,
      colors,
    ],
  );

  const renderEmptyState = useCallback(() => {
    if (searchQuery) {
      return <SearchEmptyState query={searchQuery} colors={colors} />;
    }
    return <EmptyMessages onSendMessage={handleOpenCompose} colors={colors} />;
  }, [searchQuery, handleOpenCompose, colors]);

  // Loading state
  if (isLoading && channelData.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: '#f2f2f2' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="rgba(0,0,0,0.3)" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#f2f2f2' }]}>

      {/* Floating Header */}
      {/* Floating Header */}
      <View style={[styles.floatingHeader, { paddingTop: insets.top + 8 }]}>
        {isSearchActive ? (
          /* Search mode — full-width search bar replaces title */
          <Animated.View entering={FadeIn.duration(200)} style={styles.searchBarRow}>
            <View style={[styles.searchBar, { overflow: "hidden" }]}>
              <GlassView
                {...liquidGlass.fillMedium}
                borderRadius={20}
                style={StyleSheet.absoluteFillObject}
              />
              <Ionicons name="search" size={18} color="rgba(0,0,0,0.4)" />
              <TextInput
                ref={searchInputRef}
                style={[styles.searchBarInput, { color: colors.text }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search messages..."
                placeholderTextColor="rgba(0,0,0,0.35)"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color="rgba(0,0,0,0.3)" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={handleSearchCancel} style={styles.glassCircle} activeOpacity={0.7}>
              <GlassView {...liquidGlass.fillMedium} borderRadius={20} style={StyleSheet.absoluteFillObject} />
              <Ionicons name="close" size={18} color="rgba(0,0,0,0.7)" />
            </TouchableOpacity>
          </Animated.View>
        ) : (
          /* Normal mode — search icon, title, compose */
          <>
            <TouchableOpacity
              style={styles.glassCircle}
              onPress={handleSearchPress}
              activeOpacity={0.7}
            >
              <GlassView {...liquidGlass.fillMedium} borderRadius={20} style={StyleSheet.absoluteFillObject} />
              <Ionicons name="search" size={18} color="rgba(0,0,0,0.7)" />
            </TouchableOpacity>

            <View style={styles.headerTitlePill}>
              <GlassView {...liquidGlass.fillMedium} borderRadius={20} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.headerTitle}>Messages</Text>
            </View>

            <TouchableOpacity
              style={styles.glassCircle}
              onPress={handleOpenCompose}
              activeOpacity={0.7}
            >
              <GlassView {...liquidGlass.fillMedium} borderRadius={20} style={StyleSheet.absoluteFillObject} />
              <Ionicons name="create-outline" size={20} color="rgba(0,0,0,0.7)" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Conversations List */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={styles.listContainer}
      >
        <FlatList
          data={filteredChannels}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={[
            filteredChannels.length === 0
              ? styles.emptyListContainer
              : styles.listContent,
            { paddingTop: insets.top + 60, paddingBottom: tabBarTopOffset + 20 },
          ]}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
          windowSize={10}
          maxToRenderPerBatch={8}
          removeClippedSubviews={true}
        />
      </Animated.View>

      {/* Compose New DM Modal */}
      <Modal
        visible={showCompose}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseCompose}
      >
        <View style={[styles.composeContainer, { backgroundColor: '#f2f2f2' }]}>
  
          {/* Creating overlay */}
          {isCreating && (
            <View style={styles.composeOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.composeOverlayText}>Opening conversation...</Text>
            </View>
          )}

          {/* Compose Header */}
          <View style={[styles.composeHeader, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={handleCloseCompose}>
              <Text style={styles.composeCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.composeTitle, { color: colors.text }]}>
              New Message
            </Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Selected chips + group name */}
          {selectedPeople.length > 0 && (
            <View style={[styles.chipsSection, { borderBottomColor: colors.border }]}>
              <FlatList
                horizontal
                data={selectedPeople}
                keyExtractor={(item) => String(item.id)}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.chip, { overflow: "hidden" }]}
                    onPress={() => togglePersonSelection(item)}
                    activeOpacity={0.7}
                  >
                    <GlassView
                      {...liquidGlass.surface}
                      borderRadius={20}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Image
                      source={
                        item.avatar?.url
                          ? { uri: item.avatar.url }
                          : DefaultAvatarImage
                      }
                      style={styles.chipAvatar}
                    />
                    <Text style={[styles.chipName, { color: colors.text }]}>
                      {(item.firstName || item.userName || "").split(" ")[0]}
                    </Text>
                    <Ionicons name="close" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              />
              {selectedPeople.length >= 2 && (
                <View style={styles.groupRow}>
                  <TextInput
                    style={[
                      styles.groupInput,
                      {
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={groupName}
                    onChangeText={setGroupName}
                    placeholder="Group name (optional)"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TouchableOpacity
                    style={[
                      styles.createGroupBtn,
                      { overflow: "hidden" },
                      selectedPeople.length < 2 && { opacity: 0.4 },
                    ]}
                    onPress={handleCreateGroup}
                    disabled={selectedPeople.length < 2}
                    activeOpacity={0.7}
                  >
                    <GlassView
                      {...liquidGlass.surface}
                      borderRadius={8}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Text style={styles.createGroupText}>Create</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Search input */}
          <View style={[styles.composeSearchRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.toLabel, { color: colors.textSecondary }]}>
              To:
            </Text>
            <TextInput
              ref={composeSearchRef}
              style={[styles.composeSearchInput, { color: colors.text }]}
              value={composeQuery}
              onChangeText={setComposeQuery}
              placeholder="Search people..."
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {isComposeSearching && (
              <ActivityIndicator size="small" color={colors.textTertiary} />
            )}
            {composeQuery.length > 0 && !isComposeSearching && (
              <TouchableOpacity onPress={() => setComposeQuery("")}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Results / Suggestions */}
          {composeQuery.trim() ? (
            <FlatList
              data={peopleResults}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handlePersonPress(item)}
                  onLongPress={() => handleLongPressPerson(item)}
                  activeOpacity={0.7}
                >
                  <PersonSearchRow
                    item={item}
                    isSelected={selectedIds.has(item.id)}
                    onPress={() => handlePersonPress(item)}
                    colors={colors}
                  />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                isComposeSearching ? null : (
                  <View style={styles.composeEmpty}>
                    <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
                    <Text style={[styles.composeEmptyText, { color: colors.textSecondary }]}>
                      No people found for &quot;{composeQuery}&quot;
                    </Text>
                  </View>
                )
              }
              contentContainerStyle={peopleResults.length === 0 ? { paddingTop: 60 } : undefined}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <FlatList
              data={suggestedPeople}
              keyExtractor={(item) => String(item.id)}
              ListHeaderComponent={
                suggestedPeople.length > 0 ? (
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
                      Suggested
                    </Text>
                  </View>
                ) : null
              }
              renderItem={({ item: suggestion }) => {
                const displayName =
                  [suggestion.firstName, suggestion.lastName].filter(Boolean).join(" ") ||
                  suggestion.displayName ||
                  suggestion.userName ||
                  "User";
                const avatarUrl = suggestion.avatar?.url || suggestion.displayImage;
                const isSelected = suggestion.selectedId ? selectedIds.has(suggestion.selectedId) : false;

                return (
                  <TouchableOpacity
                    style={styles.personRow}
                    onPress={() => handleSuggestedPersonPress(suggestion)}
                    onLongPress={() => {
                      if (!suggestion.selectedId) return;
                      const person: UnifiedSearchItem = {
                        type: "person",
                        id: suggestion.selectedId,
                        score: 0,
                        userName: suggestion.userName,
                        firstName: suggestion.firstName || suggestion.displayName,
                        lastName: suggestion.lastName,
                        avatar: suggestion.avatar || (suggestion.displayImage ? { id: "", url: suggestion.displayImage } : null),
                      };
                      togglePersonSelection(person);
                    }}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={avatarUrl ? { uri: avatarUrl } : DefaultAvatarImage}
                      style={styles.personAvatar}
                    />
                    <View style={styles.personInfo}>
                      <View style={styles.personNameRow}>
                        <Text style={[styles.personName, { color: colors.text }]}>
                          {displayName}
                        </Text>
                        {suggestion.isVerified && (
                          <MaterialCommunityIcons name="check-decagram" size={14} color="#3897F0" style={{ marginLeft: 4 }} />
                        )}
                      </View>
                      {suggestion.userName && (
                        <Text style={[styles.personUsername, { color: colors.textSecondary }]}>
                          @{suggestion.userName}
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color="#1A1A1A" />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.composeEmpty}>
                  <Ionicons name="person-outline" size={48} color={colors.textTertiary} />
                  <Text style={[styles.composeEmptyText, { color: colors.textSecondary }]}>
                    Search for someone to message
                  </Text>
                </View>
              }
              contentContainerStyle={suggestedPeople.length === 0 ? { paddingTop: 60 } : undefined}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Modal>

      {/* Long press action sheet — native SwiftUI */}
      <ConversationActionSheet
        visible={!!actionTarget}
        onClose={dismissActionSheet}
        channel={actionTarget}
        onTogglePin={handleTogglePin}
        onDelete={handleDeleteFromAction}
        onBlock={handleBlockFromAction}
      />

      <ConfirmSheet
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

      <ConfirmSheet
        visible={deleteError}
        onClose={() => setDeleteError(false)}
        title="Error"
        message="Failed to delete conversation. Please try again."
        alertOnly
        icon="alert-circle-outline"
      />

      <ConfirmSheet
        visible={!!blockTarget}
        onClose={() => setBlockTarget(null)}
        onConfirm={handleConfirmBlock}
        title="Block User"
        message={`Are you sure you want to block ${blockTarget?.name}? They won't be able to message you and this conversation will be deleted.`}
        confirmLabel="Block"
        destructive
        icon="ban-outline"
      />

      <ConfirmSheet
        visible={blockError}
        onClose={() => setBlockError(false)}
        title="Error"
        message="Failed to block user. Please try again."
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
  // Floating header
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerTitlePill: {
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Lato_700Bold",
    color: "rgba(0,0,0,0.7)",
  },
  glassCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  // Search bar (inside floating header)
  searchBarRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 14,
    gap: 8,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Lato_400Regular",
    height: 36,
    paddingVertical: 0,
  },
  searchBarPlaceholder: {
    fontSize: 16,
    fontFamily: "Lato_400Regular",
  },
  // List
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingTop: 4,
  },
  cardShadow: {
    marginHorizontal: 10,
    marginVertical: 4,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  conversationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.5)",
  },
  avatarContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarWrapper: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    backgroundColor: "transparent",
  },
  unreadRing: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
  },
  unreadRingGradient: {
    position: "absolute",
    opacity: 0,
  },
  onlineIndicator: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(128,128,128,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#34c759",
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  conversationTitle: {
    fontSize: 15,
    fontFamily: "Lato_400Regular",
    flexShrink: 1,
  },
  conversationTitleUnread: {
    fontFamily: "Lato_700Bold",
  },
  timestamp: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
  },
  conversationFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Lato_400Regular",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3897F0",
    marginLeft: 8,
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyContainerTop: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  emptyGlassCard: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 28,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.12)",
    width: "100%",
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Lato_700Bold",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  sendMessageButton: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.2)",
    borderRadius: 8,
  },
  sendMessageButtonText: {
    fontSize: 14,
    fontFamily: "Lato_700Bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: "Lato_400Regular",
  },
  // Action sheet (account-switcher style)
  actionOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  actionSheet: {
    paddingHorizontal: 0,
  },
  actionSheetContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(128,128,128,0.12)",
  },
  actionSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(128,128,128,0.3)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  actionSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(128,128,128,0.12)",
  },
  actionSheetClose: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: {
    fontSize: 17,
    fontFamily: "Lato_700Bold",
    flex: 1,
  },
  actionList: {
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(128,128,128,0.1)",
  },
  actionItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    fontFamily: "Lato_400Regular",
    color: "#1A1A1A",
  },
  // Compose modal
  composeContainer: {
    flex: 1,
  },
  composeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  composeOverlayText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: "Lato_400Regular",
    color: "#fff",
  },
  composeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  composeCancelText: {
    fontSize: 17,
    fontFamily: "Lato_400Regular",
    color: "#3897F0",
    width: 60,
  },
  composeTitle: {
    fontSize: 17,
    fontFamily: "Lato_700Bold",
  },
  chipsSection: {
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  chipsRow: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
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
    fontFamily: "Lato_700Bold",
  },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  groupInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Lato_400Regular",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  createGroupBtn: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createGroupText: {
    fontSize: 14,
    fontFamily: "Lato_700Bold",
    color: "#1A1A1A",
  },
  composeSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  toLabel: {
    fontSize: 16,
    fontFamily: "Lato_400Regular",
    marginRight: 12,
  },
  composeSearchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Lato_400Regular",
    paddingVertical: 0,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Lato_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 10,
    marginVertical: 2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  personAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  personInfo: {
    flex: 1,
    marginLeft: 12,
  },
  personNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  personName: {
    fontSize: 16,
    fontFamily: "Lato_700Bold",
  },
  personUsername: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    marginTop: 1,
  },
  composeEmpty: {
    alignItems: "center",
    gap: 12,
    paddingTop: 40,
  },
  composeEmptyText: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
    textAlign: "center",
  },
});
