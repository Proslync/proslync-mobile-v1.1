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
} from "react-native";
import { GlassView } from "expo-glass-effect";
import { liquidGlass, glassTint } from "@/constants/glass/liquid-glass";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/hooks/use-app-theme";
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

function UserRow({
  user,
  currentUserId,
  onNavigate,
}: {
  user: FollowUser;
  currentUserId?: number;
  onNavigate: () => void;
}) {
  const router = useStableRouter();
  const { colors } = useAppTheme();
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
    >
      <Image
        source={user.avatar ? { uri: user.avatar } : DefaultAvatarImage}
        style={styles.userAvatar}
      />
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
          {user.userName}
        </Text>
        <Text style={[styles.userFullName, { color: colors.textTertiary }]} numberOfLines={1}>
          {[user.firstName, user.lastName].filter(Boolean).join(" ") || "User"}
        </Text>
      </View>
      {!isSelf && (
        <TouchableOpacity
          style={[
            styles.followBtn,
            { overflow: "hidden" },
            isFollowing && { borderWidth: 1, borderColor: colors.border },
          ]}
          activeOpacity={0.8}
          onPress={handleFollowPress}
          disabled={followLoading || isActionInProgress}
        >
          <GlassView
            {...liquidGlass.fill}
            tintColor={isFollowing ? glassTint.fill : glassTint.fillMedium}
            borderRadius={8}
            style={StyleSheet.absoluteFill}
          />
          {isActionInProgress ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text
              style={[
                styles.followBtnText,
                { color: "#fff" },
              ]}
            >
              {isFollowing ? "Following" : "Follow"}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

function VenueRow({
  venue,
  onNavigate,
}: {
  venue: FollowVenue;
  onNavigate: () => void;
}) {
  const router = useStableRouter();
  const { colors } = useAppTheme();

  const handlePress = () => {
    onNavigate();
    router.push({
      pathname: "/venue/[id]",
      params: { id: venue.id },
    });
  };

  return (
    <TouchableOpacity
      style={styles.userRow}
      activeOpacity={0.7}
      onPress={handlePress}
    >
      <Image
        source={venue.logo ? { uri: venue.logo } : DefaultAvatarImage}
        style={styles.userAvatar}
      />
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
          {venue.name}
        </Text>
        <Text style={[styles.userFullName, { color: colors.textTertiary }]} numberOfLines={1}>
          Venue
        </Text>
      </View>
    </TouchableOpacity>
  );
}

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
  const { colors } = useAppTheme();
  const [activeTab, setActiveTab] = React.useState<SheetTab>(initialTab);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { overflow: "hidden" }]}>
            <GlassView
              {...liquidGlass.fillMedium}
              borderRadius={22}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {activeTab === "followers" ? "Followers" : "Following"}
          </Text>
          <View style={styles.closeBtn} />
        </View>

        {/* Tabs */}
        <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "followers" && { borderBottomColor: colors.text, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab("followers")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabCount,
                { color: activeTab === "followers" ? colors.text : colors.textTertiary },
              ]}
            >
              {followersCount}
            </Text>
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === "followers" ? colors.text : colors.textTertiary },
              ]}
            >
              Followers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "following" && { borderBottomColor: colors.text, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab("following")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabCount,
                { color: activeTab === "following" ? colors.text : colors.textTertiary },
              ]}
            >
              {followingCount}
            </Text>
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === "following" ? colors.text : colors.textTertiary },
              ]}
            >
              Following
            </Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.textTertiary} />
          </View>
        ) : activeTab === "followers" && followers.length > 0 ? (
          <FlatList
            data={followers}
            keyExtractor={(item) => item.id}
            renderItem={renderFollowerItem}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            showsVerticalScrollIndicator={false}
          />
        ) : activeTab === "following" && followingData.length > 0 ? (
          <FlatList
            data={followingData}
            keyExtractor={(item) => `${item.type}-${item.data.id}`}
            renderItem={renderFollowingItem}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              {activeTab === "followers"
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
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Lato_700Bold",
  },

  // Tabs
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabCount: {
    fontSize: 16,
    fontFamily: "Lato_700Bold",
  },
  tabLabel: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    marginTop: 1,
  },

  // User row
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
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
