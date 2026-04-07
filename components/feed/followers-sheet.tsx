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
import { GlassView } from "expo-glass-effect";
import { liquidGlass, glassTint, glassText, glassBorder } from "@/constants/glass/liquid-glass";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFollowUser } from "@/hooks/use-follow-user";
import { useUserFollowers, useUserFollowing } from "@/hooks/use-user-follows";
import type { FollowUser, FollowVenue } from "@/hooks/use-user-follows";

const DefaultAvatarImage = require("@/assets/images/default-avatar.png");

// Always use light theme for this sheet
const t = glassText.light;
const border = glassBorder.light;

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
    <View style={styles.cardShadow}>
      <TouchableOpacity
        style={styles.userRow}
        activeOpacity={0.7}
        onPress={handlePress}
      >
        <GlassView
          {...liquidGlass.surface}
          borderRadius={16}
          style={StyleSheet.absoluteFill}
        />
        <Image
          source={user.avatar ? { uri: user.avatar } : DefaultAvatarImage}
          style={styles.userAvatar}
        />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: t.primary }]} numberOfLines={1}>
            {user.userName}
          </Text>
          <Text style={[styles.userFullName, { color: t.tertiary }]} numberOfLines={1}>
            {[user.firstName, user.lastName].filter(Boolean).join(" ") || "User"}
          </Text>
        </View>
        {!isSelf && (
          <TouchableOpacity
            style={styles.followBtn}
            activeOpacity={0.8}
            onPress={handleFollowPress}
            disabled={followLoading || isActionInProgress}
          >
            <GlassView
              {...liquidGlass.fillMedium}
              borderRadius={12}
              style={StyleSheet.absoluteFill}
            />
            {isActionInProgress ? (
              <ActivityIndicator size="small" color={t.primary} />
            ) : (
              <Text style={[styles.followBtnText, { color: t.primary }]}>
                {isFollowing ? "Following" : "Follow"}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
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
    <View style={styles.cardShadow}>
      <TouchableOpacity
        style={styles.userRow}
        activeOpacity={0.7}
        onPress={handlePress}
      >
        <GlassView
          {...liquidGlass.surface}
          borderRadius={16}
          style={StyleSheet.absoluteFill}
        />
        <Image
          source={venue.logo ? { uri: venue.logo } : DefaultAvatarImage}
          style={styles.userAvatar}
        />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: t.primary }]} numberOfLines={1}>
            {venue.name}
          </Text>
          <Text style={[styles.userFullName, { color: t.tertiary }]} numberOfLines={1}>
            Venue
          </Text>
        </View>
      </TouchableOpacity>
    </View>
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

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Clear search when switching tabs or closing
  React.useEffect(() => {
    setSearchQuery("");
  }, [activeTab, visible]);

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
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <GlassView
              {...liquidGlass.fillMedium}
              borderRadius={16}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="close" size={18} color={t.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {activeTab === "followers" ? "Followers" : "Following"}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Segmented Tabs */}
        <View style={styles.tabBar}>
          <SegmentedControl
            segments={[`${followersCount} Followers`, `${followingCount} Following`]}
            selectedIndex={activeTab === "followers" ? 0 : 1}
            onSelect={(index) => setActiveTab(index === 0 ? "followers" : "following")}
          />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <GlassView
              {...liquidGlass.surface}
              borderRadius={14}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="search" size={16} color={t.muted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor={t.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={16} color={t.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={t.muted} />
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
            <Text style={[styles.emptyText, { color: t.muted }]}>
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
    backgroundColor: "#f2f2f7",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Lato_700Bold",
    color: "#1A1A1A",
  },
  headerSpacer: {
    width: 32,
  },

  // Tabs
  tabBar: {
    paddingBottom: 4,
  },

  // Search
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    // Elevated shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    borderRadius: 14,
    overflow: "hidden",
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.5)",
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

  // Card shadow wrapper — gives each row a 3D elevated feel
  cardShadow: {
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 16,
    // iOS shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    // Android elevation
    elevation: 4,
  },

  // User row — now a glass card
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.5)",
  },
  userAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 14,
    fontFamily: "Lato_700Bold",
  },
  userFullName: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    marginTop: 2,
  },
  followBtn: {
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  followBtnText: {
    fontSize: 13,
    fontFamily: "Lato_700Bold",
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
  },
});
