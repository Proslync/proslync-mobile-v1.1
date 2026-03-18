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
import { LinearGradient } from "expo-linear-gradient";
import { liquidGlass, glassTint, activeGradient, activeGradientLight, glassBorder, glassText, glassSurfaceTint } from "@/constants/glass/liquid-glass";
import { SegmentedControl } from "@/components/shared/segmented-control";
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
  themeKey,
}: {
  user: FollowUser;
  currentUserId?: number;
  onNavigate: () => void;
  themeKey: 'dark' | 'light';
}) {
  const router = useStableRouter();
  const ut = glassText[themeKey];
  const uBorder = glassBorder[themeKey];
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
        <Text style={[styles.userName, { color: ut.primary }]} numberOfLines={1}>
          {user.userName}
        </Text>
        <Text style={[styles.userFullName, { color: ut.tertiary }]} numberOfLines={1}>
          {[user.firstName, user.lastName].filter(Boolean).join(" ") || "User"}
        </Text>
      </View>
      {!isSelf && (
        <TouchableOpacity
          style={[
            styles.followBtn,
            { overflow: "hidden", borderColor: uBorder },
          ]}
          activeOpacity={0.8}
          onPress={handleFollowPress}
          disabled={followLoading || isActionInProgress}
        >
          {/* @ts-expect-error — augmented GlassViewProps */}
          <GlassView
            {...liquidGlass.surface}
            tintColor={glassSurfaceTint[themeKey]}
            borderRadius={10}
            style={StyleSheet.absoluteFill}
          />
          {isActionInProgress ? (
            <ActivityIndicator size="small" color={ut.primary} />
          ) : (
            <Text
              style={[
                styles.followBtnText,
                { color: ut.primary },
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
  themeKey,
}: {
  venue: FollowVenue;
  onNavigate: () => void;
  themeKey: 'dark' | 'light';
}) {
  const router = useStableRouter();
  const vt = glassText[themeKey];

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
        <Text style={[styles.userName, { color: vt.primary }]} numberOfLines={1}>
          {venue.name}
        </Text>
        <Text style={[styles.userFullName, { color: vt.tertiary }]} numberOfLines={1}>
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
  const { colors, isDark } = useAppTheme();
  const theme = isDark ? 'dark' : 'light';
  const t = glassText[theme];
  const border = glassBorder[theme];
  const surfaceTint = glassSurfaceTint[theme];
  const gradient = isDark ? activeGradient : activeGradientLight;
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
      <UserRow user={item} currentUserId={currentUserId} onNavigate={onClose} themeKey={theme} />
    ),
    [currentUserId, onClose, theme],
  );

  const renderFollowingItem = React.useCallback(
    ({ item }: { item: { type: 'user'; data: FollowUser } | { type: 'venue'; data: FollowVenue } }) => {
      if (item.type === 'venue') {
        return <VenueRow venue={item.data} onNavigate={onClose} themeKey={theme} />;
      }
      return <UserRow user={item.data} currentUserId={currentUserId} onNavigate={onClose} themeKey={theme} />;
    },
    [currentUserId, onClose, theme],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
        <LinearGradient
          colors={[...gradient.colors]}
          locations={[...gradient.locations]}
          start={gradient.start}
          end={gradient.end}
          style={StyleSheet.absoluteFill}
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { borderColor: border }]}>
            {/* @ts-expect-error — augmented GlassViewProps */}
            <GlassView
              {...liquidGlass.surface}
              tintColor={surfaceTint}
              borderRadius={18}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="close" size={22} color={t.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: t.primary }]}>
            {activeTab === "followers" ? "Followers" : "Following"}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Glass Segmented Tabs */}
        <View style={styles.tabBar}>
          <SegmentedControl
            segments={[`${followersCount} Followers`, `${followingCount} Following`]}
            selectedIndex={activeTab === "followers" ? 0 : 1}
            onSelect={(index) => setActiveTab(index === 0 ? "followers" : "following")}
          />
        </View>

        {/* List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={t.muted} />
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
            <Text style={[styles.emptyText, { color: t.muted }]}>
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
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Lato_700Bold",
  },

  headerSpacer: {
    width: 36,
  },

  // Tabs
  tabBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
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
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)", // always dark in pageSheet
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
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
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
