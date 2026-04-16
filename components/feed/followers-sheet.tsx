import * as React from "react";
import { useStableRouter } from "@/hooks/use-stable-router";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  TextInput,
} from "react-native";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFollowUser } from "@/hooks/use-follow-user";
import { useUserFollowers, useUserFollowing } from "@/hooks/use-user-follows";
import type { FollowUser, FollowVenue } from "@/hooks/use-user-follows";

const DefaultAvatarImage = require("@/assets/images/default-avatar.png");

type SheetTab = "followers" | "following";

interface FollowersSheetProps {
  visible: boolean;
  onClose: () => void;
  initialTab: SheetTab;
  userId: number;
  followersCount: number;
  followingCount: number;
  currentUserId?: number;
}

const UserRow = React.memo(function UserRow({
  user,
  currentUserId,
  onNavigate,
}: {
  user: FollowUser;
  currentUserId?: number;
  onNavigate: () => void;
}) {
  const router = useStableRouter();
  const {
    isFollowing,
    isLoading: followLoading,
    follow,
    unfollow,
    isFollowInProgress,
    isUnfollowInProgress,
  } = useFollowUser(user.id);

  const isSelf = currentUserId?.toString() === user.id;
  const isActionInProgress = isFollowInProgress || isUnfollowInProgress;

  const handleFollowPress = async () => {
    if (isActionInProgress) return;
    if (isFollowing) {
      await unfollow();
    } else {
      await follow();
    }
  };

  const handlePress = () => {
    onNavigate();
    router.push({
      pathname: "/user/[username]",
      params: { username: user.userName || "_", userId: String(user.id) },
    });
  };

  return (
    <TouchableOpacity
      style={styles.userRow}
      activeOpacity={0.7}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Open profile for ${user.userName}`}
    >
      <Image
        source={user.avatar ? { uri: user.avatar } : DefaultAvatarImage}
        style={styles.userAvatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>
          {user.userName}
        </Text>
        <Text style={styles.userFullName} numberOfLines={1}>
          {[user.firstName, user.lastName].filter(Boolean).join(" ") || "User"}
        </Text>
      </View>
      {!isSelf && (
        <TouchableOpacity
          style={[styles.followBtn, isFollowing && styles.followBtnFollowing]}
          activeOpacity={0.8}
          onPress={handleFollowPress}
          disabled={followLoading || isActionInProgress}
          accessibilityRole="button"
          accessibilityLabel={isFollowing ? `Unfollow ${user.userName}` : `Follow ${user.userName}`}
        >
          {isActionInProgress ? (
            <ActivityIndicator size="small" color={isFollowing ? "#1a1a1a" : "#fff"} />
          ) : (
            <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextFollowing]}>
              {isFollowing ? "Following" : "Follow"}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
});

const VenueRow = React.memo(function VenueRow({
  venue,
  onNavigate,
}: {
  venue: FollowVenue;
  onNavigate: () => void;
}) {
  const router = useStableRouter();

  const handlePress = () => {
    onNavigate();
    router.push({
      pathname: "/venue-profile/[venueId]",
      params: { venueId: venue.id },
    });
  };

  return (
    <TouchableOpacity
      style={styles.userRow}
      activeOpacity={0.7}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Open venue ${venue.name}`}
    >
      <Image
        source={venue.logo ? { uri: venue.logo } : DefaultAvatarImage}
        style={styles.userAvatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>
          {venue.name}
        </Text>
        <Text style={styles.userFullName} numberOfLines={1}>
          Venue
        </Text>
      </View>
    </TouchableOpacity>
  );
});

export function FollowersSheet({
  visible,
  onClose,
  initialTab,
  userId,
  followersCount,
  followingCount,
  currentUserId,
}: FollowersSheetProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState<SheetTab>(initialTab);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearchActive, setIsSearchActive] = React.useState(false);
  const searchInputRef = React.useRef<TextInput>(null);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Clear search when switching tabs or closing
  React.useEffect(() => {
    setSearchQuery("");
    setIsSearchActive(false);
  }, [activeTab, visible]);

  const openSearch = React.useCallback(() => {
    setIsSearchActive(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }, []);

  const closeSearch = React.useCallback(() => {
    setIsSearchActive(false);
    setSearchQuery("");
  }, []);

  const {
    followers,
    isLoading: followersLoading,
  } = useUserFollowers(userId, visible);

  const {
    following,
    followingVenues,
    isLoading: followingLoading,
  } = useUserFollowing(userId, visible);

  // Combine users and venues into a single list for the "following" tab
  const followingData = React.useMemo(() => {
    const items: Array<{ type: 'user'; data: FollowUser } | { type: 'venue'; data: FollowVenue }> = [];
    for (const u of following) items.push({ type: 'user', data: u });
    for (const v of followingVenues) items.push({ type: 'venue', data: v });
    return items;
  }, [following, followingVenues]);

  // Filter followers by search query
  const filteredFollowers = React.useMemo(() => {
    if (!searchQuery.trim()) return followers;
    const q = searchQuery.toLowerCase();
    return followers.filter(
      (u) =>
        u.userName.toLowerCase().includes(q) ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q),
    );
  }, [followers, searchQuery]);

  // Filter following by search query
  const filteredFollowing = React.useMemo(() => {
    if (!searchQuery.trim()) return followingData;
    const q = searchQuery.toLowerCase();
    return followingData.filter((item) => {
      if (item.type === 'user') {
        const u = item.data;
        return (
          u.userName.toLowerCase().includes(q) ||
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q)
        );
      }
      return item.data.name.toLowerCase().includes(q);
    });
  }, [followingData, searchQuery]);

  const isLoading = activeTab === "followers" ? followersLoading : followingLoading;

  const renderFollowerItem = React.useCallback(
    ({ item }: { item: FollowUser }) => (
      <UserRow user={item} currentUserId={currentUserId} onNavigate={onClose} />
    ),
    [currentUserId, onClose],
  );

  const renderFollowingItem = React.useCallback(
    ({ item }: { item: { type: 'user'; data: FollowUser } | { type: 'venue'; data: FollowVenue } }) => {
      if (item.type === 'venue') {
        return <VenueRow venue={item.data} onNavigate={onClose} />;
      }
      return <UserRow user={item.data} currentUserId={currentUserId} onNavigate={onClose} />;
    },
    [currentUserId, onClose],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {activeTab === "followers" ? "Followers" : "Following"}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={20} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

        {/* Tabs + search row (or full-width search bar when active) */}
        <View style={styles.tabRow}>
          {isSearchActive ? (
            <>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={16} color="rgba(0,0,0,0.4)" style={styles.searchIcon} />
                <TextInput
                  ref={searchInputRef}
                  style={styles.searchInput}
                  placeholder="Search"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery("")}
                    style={styles.clearBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                  >
                    <Ionicons name="close-circle" size={16} color="rgba(0,0,0,0.3)" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                onPress={closeSearch}
                style={styles.cancelBtn}
                accessibilityRole="button"
                accessibilityLabel="Cancel search"
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={openSearch}
                style={styles.searchIconBtn}
                accessibilityRole="button"
                accessibilityLabel="Search"
              >
                <Ionicons name="search" size={18} color="#1a1a1a" />
              </TouchableOpacity>
              <View style={styles.tabBar}>
                <SegmentedControl
                  segments={[`${followersCount} Followers`, `${followingCount} Following`]}
                  selectedIndex={activeTab === "followers" ? 0 : 1}
                  onSelect={(index) => setActiveTab(index === 0 ? "followers" : "following")}
                />
              </View>
            </>
          )}
        </View>

        {/* List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="rgba(0,0,0,0.35)" />
          </View>
        ) : activeTab === "followers" && filteredFollowers.length > 0 ? (
          <FlatList
            data={filteredFollowers}
            keyExtractor={(item) => item.id}
            renderItem={renderFollowerItem}
            contentContainerStyle={{ paddingTop: 4, paddingBottom: insets.bottom + 20 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            windowSize={10}
            removeClippedSubviews={true}
          />
        ) : activeTab === "following" && filteredFollowing.length > 0 ? (
          <FlatList
            data={filteredFollowing}
            keyExtractor={(item) => `${item.type}-${item.data.id}`}
            renderItem={renderFollowingItem}
            contentContainerStyle={{ paddingTop: 4, paddingBottom: insets.bottom + 20 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            windowSize={10}
            removeClippedSubviews={true}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery.trim()
                ? "No results"
                : activeTab === "followers"
                  ? "No followers yet"
                  : "Not following anyone yet"}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },

  // Header — title left, close right
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Lato_700Bold",
    color: "#1A1A1A",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.06)",
  },

  // Tabs + search row
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  searchIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  tabBar: {
    flex: 1,
  },

  // Search bar (active state)
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Lato_400Regular",
    color: "#1A1A1A",
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  cancelBtn: {
    paddingHorizontal: 4,
    height: 36,
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 15,
    fontFamily: "Lato_700Bold",
    color: "#1a1a1a",
  },

  // User row — solid white card with shadow (same pattern as ticket-list)
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  userAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 15,
    fontFamily: "Lato_700Bold",
    color: "#1A1A1A",
  },
  userFullName: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    color: "rgba(0,0,0,0.5)",
    marginTop: 2,
  },
  followBtn: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a1a",
  },
  followBtnFollowing: {
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  followBtnText: {
    fontSize: 13,
    fontFamily: "Lato_700Bold",
    color: "#fff",
  },
  followBtnTextFollowing: {
    color: "#1a1a1a",
  },

  // States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Lato_400Regular",
    color: "rgba(0,0,0,0.45)",
  },
});
