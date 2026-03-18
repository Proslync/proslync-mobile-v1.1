import { FollowersSheet } from "@/components/feed/followers-sheet";
import { DarkGradientBg } from "@/components/shared/dark-gradient-bg";
import { LinkifiedText } from "@/components/shared/linkified-text";
import { SwipeableTabView } from "@/components/shared/swipeable-tab-view";
import { useToast } from "@/components/shared/toast";
import { VideoThumbnailImage } from "@/components/shared/video-thumbnail";
import { liquidGlass, glassBorder, glassText, glassSurfaceTint } from "@/constants/glass/liquid-glass";
import { useUserFeed } from "@/hooks";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useUnreadNotificationCount } from "@/hooks/use-notifications";
import { useRefreshControl } from "@/hooks/use-refresh-control";
import { useStableRouter } from "@/hooks/use-stable-router";
import { useUserFollowers, useUserFollowing } from "@/hooks/use-user-follows";
import { useMyVenues } from "@/hooks/use-venues-query";
import { useAuth } from "@/lib/providers/auth-provider";
import { useTabNavigation } from "@/lib/providers/tab-navigation-provider";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GlassView } from "expo-glass-effect";
import * as SecureStore from "expo-secure-store";
import * as React from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  TouchableOpacity as GHTouchableOpacity,
} from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// 3 columns with 2px gaps between them (2 gaps × 2px = 4px total)
const POST_GAP = 2;
const POST_SIZE = (SCREEN_WIDTH - POST_GAP * 2) / 3;

// Default avatar placeholder
const DefaultAvatarImage = require("@/assets/images/default-avatar.png");

// Storage key for saved accounts
const SAVED_ACCOUNTS_KEY = "saved_accounts";

interface SavedAccount {
  id: number;
  phoneNumber: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  accessToken?: string;
  refreshToken?: string;
}

function StatButton({
  value,
  label,
  onPress,
}: {
  value: number;
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.statButton}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

interface VenueItem {
  id: number;
  name: string;
  imageUrl?: string;
  ownerId?: number;
}

function AccountSwitcherModal({
  visible,
  currentUserId,
  savedAccounts,
  venues,
  unreadCount,
  onClose,
  onSelectAccount,
  onAddAccount,
  onSelectVenue,
}: {
  visible: boolean;
  currentUserId?: number;
  savedAccounts: SavedAccount[];
  venues: VenueItem[];
  unreadCount: number;
  onClose: () => void;
  onSelectAccount: (account: SavedAccount) => void;
  onAddAccount: () => void;
  onSelectVenue: (venue: VenueItem) => void;
}) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(400);

  React.useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  const dismiss = React.useCallback(() => {
    translateY.value = withTiming(400, { duration: 200 });
    setTimeout(onClose, 200);
  }, [onClose]);

  const panGesture = Gesture.Pan()
    .activeOffsetY(10)
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 80 || e.velocityY > 500) {
        translateY.value = withTiming(400, { duration: 200 });
        runOnJS(onClose)();
      } else {
        translateY.value = withTiming(0, { duration: 200 });
      }
    });

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={dismiss}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={dismiss}
        />

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.modalSheet, sheetAnimStyle]}>
            <View style={styles.modalContent}>
              <GlassView
                {...liquidGlass.surface}
                borderRadius={20}
                style={styles.modalGlassBg}
              />

              {/* Handle bar */}
              <View style={styles.modalHandle} />

              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Switch Account</Text>
                <GHTouchableOpacity
                  onPress={dismiss}
                  style={styles.modalCloseButton}
                >
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color="rgba(255,255,255,0.4)"
                  />
                </GHTouchableOpacity>
              </View>

              {/* Account list */}
              <View style={styles.accountList}>
                {savedAccounts.map((account, index) => {
                  const isCurrentAccount = account.id === currentUserId;
                  const displayName = account.firstName
                    ? `${account.firstName}${account.lastName ? " " + account.lastName : ""}`
                    : account.userName || "User";

                  return (
                    <GHTouchableOpacity
                      key={account.id}
                      style={[
                        styles.accountItem,
                        index < savedAccounts.length - 1 &&
                          styles.accountItemBorder,
                      ]}
                      onPress={() =>
                        !isCurrentAccount && onSelectAccount(account)
                      }
                      activeOpacity={isCurrentAccount ? 1 : 0.7}
                    >
                      <Image
                        source={
                          account.avatarUrl
                            ? { uri: account.avatarUrl }
                            : DefaultAvatarImage
                        }
                        style={[
                          styles.accountAvatar,
                          isCurrentAccount && styles.accountAvatarActive,
                        ]}
                      />
                      <View style={styles.accountInfo}>
                        <Text style={styles.accountUsername}>
                          {account.userName || "username"}
                        </Text>
                        <Text style={styles.accountName}>{displayName}</Text>
                      </View>
                      {isCurrentAccount && unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </Text>
                        </View>
                      )}
                      {isCurrentAccount && (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color="#fff"
                        />
                      )}
                    </GHTouchableOpacity>
                  );
                })}

                {/* Venues Section */}
                {venues.length > 0 && (
                  <>
                    <View style={styles.venuesSectionHeader}>
                      <Ionicons
                        name="business-outline"
                        size={14}
                        color="rgba(255,255,255,0.4)"
                      />
                      <Text style={styles.venuesSectionTitle}>Your Venues</Text>
                    </View>
                    {venues.map((venue, vIndex) => (
                      <GHTouchableOpacity
                        key={`venue-${venue.id}`}
                        style={[
                          styles.accountItem,
                          vIndex < venues.length - 1 &&
                            styles.accountItemBorder,
                        ]}
                        onPress={() => onSelectVenue(venue)}
                        activeOpacity={0.7}
                      >
                        <Image
                          source={
                            venue.imageUrl
                              ? { uri: venue.imageUrl }
                              : DefaultAvatarImage
                          }
                          style={styles.accountAvatar}
                        />
                        <View style={styles.accountInfo}>
                          <Text style={styles.accountUsername}>
                            {venue.name}
                          </Text>
                          <Text style={styles.accountName}>Venue</Text>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color="rgba(255,255,255,0.3)"
                        />
                      </GHTouchableOpacity>
                    ))}
                  </>
                )}

                {/* Add Account Button */}
                <GHTouchableOpacity
                  style={[
                    styles.addAccountButton,
                    { paddingBottom: insets.bottom + 14 },
                  ]}
                  onPress={onAddAccount}
                  activeOpacity={0.7}
                >
                  <View style={styles.addAccountIcon}>
                    <GlassView
                      {...liquidGlass.fillFaint}
                      borderRadius={22}
                      style={styles.glassCircleBg}
                    />
                    <Ionicons name="add" size={22} color="#fff" />
                  </View>
                  <Text style={styles.addAccountText}>Add Account</Text>
                </GHTouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { user, isLoading, logout, switchAccount } = useAuth();
  const { showSuccess, showError } = useToast();
  const { isAccountSwitcherOpen, closeAccountSwitcher, openAccountSwitcher } =
    useTabNavigation();
  const { colors, isDark } = useAppTheme();
  const theme = isDark ? 'dark' : 'light';
  const t = glassText[theme];
  const border = glassBorder[theme];
  const surfaceTint = glassSurfaceTint[theme];
  const { data: myVenues = [] } = useMyVenues();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const [followersSheetVisible, setFollowersSheetVisible] =
    React.useState(false);
  const [followersSheetTab, setFollowersSheetTab] = React.useState<
    "followers" | "following"
  >("followers");
  const [savedAccounts, setSavedAccounts] = React.useState<SavedAccount[]>([]);
  const lastTapRef = React.useRef<number>(0);

  // Fetch posts/activities - uses React Query for proper cache invalidation
  const {
    activities: userPosts,
    isLoading: postsLoading,
    refetch: refetchPosts,
  } = useUserFeed(user?.id);

  // Fetch followers/following from backend API
  // Fetches on mount to get counts, data is cached for modal
  const {
    followers,
    totalFollowers: followerCount,
    isLoading: followersLoading,
    refetch: refetchFollowers,
  } = useUserFollowers(user?.id);

  const {
    following,
    totalFollowing: followingCount,
    isLoading: followingLoading,
    refetch: refetchFollowing,
  } = useUserFollowing(user?.id);

  // Pull-to-refresh
  const { refreshControl } = useRefreshControl({
    onRefresh: async () => {
      await Promise.all([
        refetchPosts(),
        refetchFollowers(),
        refetchFollowing(),
      ]);
    },
    tintColor: "#1a1a1a",
  });

  // Derive display values from user data
  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : "User";
  const username = user?.userName || "username";
  const bio = user?.bio || "";
  const avatarUrl = user?.avatar?.url;

  // Use real counts from activities
  const postsCount = userPosts.length;

  // Load saved accounts from storage on mount
  React.useEffect(() => {
    async function loadSavedAccounts() {
      try {
        const stored = await AsyncStorage.getItem(SAVED_ACCOUNTS_KEY);
        if (stored) {
          const accounts = JSON.parse(stored) as SavedAccount[];
          setSavedAccounts(accounts);
        }
      } catch (error) {
        console.error("Error loading saved accounts:", error);
      }
    }
    loadSavedAccounts();
  }, []);

  // Add current user to saved accounts if not already there
  React.useEffect(() => {
    async function saveCurrentAccount() {
      if (!user) return;

      // Get current tokens from SecureStore (where apiClient stores them)
      const accessToken = await SecureStore.getItemAsync("accessToken");
      const refreshToken = await SecureStore.getItemAsync("refreshToken");

      setSavedAccounts((prev) => {
        const exists = prev.some((a) => a.id === user.id);
        if (!exists) {
          const newAccount: SavedAccount = {
            id: user.id,
            phoneNumber: user.phoneNumber,
            userName: user.userName,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatar?.url,
            accessToken: accessToken || undefined,
            refreshToken: refreshToken || undefined,
          };
          const updated = [...prev, newAccount];
          // Save to storage
          AsyncStorage.setItem(
            SAVED_ACCOUNTS_KEY,
            JSON.stringify(updated),
          ).catch(() => {});
          return updated;
        } else {
          // Update existing account info (in case user updated their profile or got new tokens)
          const updated = prev.map((a) =>
            a.id === user.id
              ? {
                  ...a,
                  userName: user.userName,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  avatarUrl: user.avatar?.url,
                  accessToken: accessToken || a.accessToken,
                  refreshToken: refreshToken || a.refreshToken,
                }
              : a,
          );
          // Save updated info to storage
          AsyncStorage.setItem(
            SAVED_ACCOUNTS_KEY,
            JSON.stringify(updated),
          ).catch((err) => console.error("Error updating account:", err));
          return updated;
        }
      });
    }
    saveCurrentAccount();
  }, [user]);

  const handleAvatarDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected - show account switcher
      openAccountSwitcher();
    }
    lastTapRef.current = now;
  };

  // Remove a saved account from storage (expired session)
  const removeSavedAccount = React.useCallback(async (accountId: number) => {
    setSavedAccounts((prev) => {
      const updated = prev.filter((a) => a.id !== accountId);
      AsyncStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated)).catch(
        () => {},
      );
      return updated;
    });
  }, []);

  const handleSelectAccount = async (account: SavedAccount) => {
    if (!account.accessToken) {
      showError(
        `Session expired for @${account.userName || "user"}. Please log in again.`,
      );
      removeSavedAccount(account.id);
      closeAccountSwitcher();
      return;
    }

    closeAccountSwitcher();

    // Try to switch to the account using saved tokens
    const success = await switchAccount(
      account.accessToken,
      account.refreshToken,
    );

    if (success) {
      showSuccess(`Switched to @${account.userName || "user"}`);
    } else {
      showError(
        `Session expired for @${account.userName || "user"}. Please log in again.`,
      );
      removeSavedAccount(account.id);
    }
  };

  const handleAddAccount = async () => {
    closeAccountSwitcher();
    // Log out first so the auth guard doesn't bounce us back to (tabs).
    // The current account's tokens are already persisted in savedAccounts,
    // so the user can switch back later.
    logout();
  };

  const handleSelectVenue = React.useCallback(
    async (venue: VenueItem) => {
      if (!venue.ownerId) {
        closeAccountSwitcher();
        router.push({
          pathname: "/venue-profile/[venueId]",
          params: { venueId: String(venue.id) },
        });
        return;
      }

      // If the current user IS the owner, just go to manage venue
      if (user && venue.ownerId === user.id) {
        closeAccountSwitcher();
        router.push(`/manage-venue/${venue.id}`);
        return;
      }

      // Try to switch to the venue owner's account
      const ownerAccount = savedAccounts.find((a) => a.id === venue.ownerId);
      if (!ownerAccount || !ownerAccount.accessToken) {
        showError("Venue owner account not saved on this device.");
        closeAccountSwitcher();
        return;
      }

      closeAccountSwitcher();
      const success = await switchAccount(
        ownerAccount.accessToken,
        ownerAccount.refreshToken,
      );
      if (success) {
        showSuccess(`Switched to ${venue.name}'s account`);
      } else {
        showError("Session expired for venue owner. Please log in again.");
        removeSavedAccount(ownerAccount.id);
      }
    },
    [
      closeAccountSwitcher,
      router,
      user,
      savedAccounts,
      switchAccount,
      showSuccess,
      showError,
      removeSavedAccount,
    ],
  );

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Check out @${username} on Status!`,
        url: `status://user/${username}`,
      });
    } catch (error) {
      console.log("Share error:", error);
    }
  };

  if (isLoading) {
    return (
      <SwipeableTabView>
        <View
          style={[
            styles.container,
            styles.loadingContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <DarkGradientBg />
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </SwipeableTabView>
    );
  }

  return (
    <SwipeableTabView>
      <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
        <DarkGradientBg />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 8 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {/* Header - Centered Username */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
            <TouchableOpacity
              style={[styles.headerIconWrapper, { borderColor: border }]}
              activeOpacity={0.7}
            >
              {/* @ts-expect-error — augmented GlassViewProps */}
              <GlassView
                {...liquidGlass.surface}
                tintColor={surfaceTint}
                borderRadius={20}
                style={styles.headerIconGlass}
              />
              <Ionicons name="add" size={20} color={t.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.usernameButton}
              onPress={openAccountSwitcher}
              activeOpacity={0.7}
            >
              <Text style={[styles.headerUsername, { color: t.primary }]}>
                {username}
              </Text>
              {user?.isVerified && (
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={20}
                  color="#3897F0"
                />
              )}
              <Ionicons
                name="chevron-down"
                size={16}
                color={t.tertiary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.headerIconWrapper, { borderColor: border }]}
              activeOpacity={0.7}
              onPress={() => router.push("/settings")}
            >
              {/* @ts-expect-error — augmented GlassViewProps */}
              <GlassView
                {...liquidGlass.surface}
                tintColor={surfaceTint}
                borderRadius={20}
                style={styles.headerIconGlass}
              />
              <Ionicons name="settings-outline" size={20} color={t.primary} />
            </TouchableOpacity>
          </Animated.View>

          {/* Profile Info Row */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(500).springify()}
            style={styles.profileRow}
          >
            <TouchableOpacity
              onPress={handleAvatarDoubleTap}
              activeOpacity={0.9}
            >
              <Image
                source={avatarUrl ? { uri: avatarUrl } : DefaultAvatarImage}
                style={[
                  styles.avatar,
                  { borderColor: border },
                ]}
              />
            </TouchableOpacity>
            <View style={[styles.statsCard, { borderColor: border }]}>
              {/* @ts-expect-error — augmented GlassViewProps */}
              <GlassView
                {...liquidGlass.surface}
                tintColor={surfaceTint}
                borderRadius={16}
                style={styles.statsCardGlass}
              />
              <View style={styles.statsRow}>
                <TouchableOpacity style={styles.statButton} activeOpacity={1}>
                  <Text style={[styles.statValue, { color: t.primary }]}>{postsCount}</Text>
                  <Text style={[styles.statLabel, { color: t.tertiary }]}>Posts</Text>
                </TouchableOpacity>
                <View style={[styles.statDivider, { backgroundColor: border }]} />
                <TouchableOpacity
                  style={styles.statButton}
                  activeOpacity={0.7}
                  onPress={() => {
                    setFollowersSheetTab("followers");
                    setFollowersSheetVisible(true);
                  }}
                >
                  <Text style={[styles.statValue, { color: t.primary }]}>{followerCount}</Text>
                  <Text style={[styles.statLabel, { color: t.tertiary }]}>Followers</Text>
                </TouchableOpacity>
                <View style={[styles.statDivider, { backgroundColor: border }]} />
                <TouchableOpacity
                  style={styles.statButton}
                  activeOpacity={0.7}
                  onPress={() => {
                    setFollowersSheetTab("following");
                    setFollowersSheetVisible(true);
                  }}
                >
                  <Text style={[styles.statValue, { color: t.primary }]}>{followingCount}</Text>
                  <Text style={[styles.statLabel, { color: t.tertiary }]}>Following</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Name and Bio */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(500).springify()}
            style={styles.bioSection}
          >
            <Text style={[styles.displayName, { color: t.primary }]}>
              {displayName}
            </Text>
            {bio ? (
              <LinkifiedText
                style={{ ...styles.bio, color: t.secondary }}
              >
                {bio}
              </LinkifiedText>
            ) : null}
          </Animated.View>

          {/* Dashboard Button */}
          <Animated.View
            entering={FadeInDown.delay(250).duration(500).springify()}
            style={styles.dashboardButtonContainer}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/dashboard")}
            >
              <View style={[styles.glassButton, { borderColor: border }]}>
                {/* @ts-expect-error — augmented GlassViewProps */}
                <GlassView
                  {...liquidGlass.surface}
                  tintColor={surfaceTint}
                  borderRadius={14}
                  style={styles.glassButtonBg}
                />
                <View style={styles.glassButtonContent}>
                  <Ionicons name="grid-outline" size={18} color={t.primary} />
                  <Text style={[styles.glassButtonText, { color: t.primary }]}>Dashboard</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Action Buttons - Edit Profile and Share Profile */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(500).springify()}
            style={styles.actionButtons}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/edit-profile")}
              style={{ flex: 1 }}
            >
              <View style={[styles.glassButton, { borderColor: border }]}>
                {/* @ts-expect-error — augmented GlassViewProps */}
                <GlassView
                  {...liquidGlass.surface}
                  tintColor={surfaceTint}
                  borderRadius={14}
                  style={styles.glassButtonBg}
                />
                <View style={styles.glassButtonContent}>
                  <Text style={[styles.glassButtonText, { color: t.primary }]}>Edit Profile</Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleShareProfile}
              style={{ flex: 1 }}
            >
              <View style={[styles.glassButton, { borderColor: border }]}>
                {/* @ts-expect-error — augmented GlassViewProps */}
                <GlassView
                  {...liquidGlass.surface}
                  tintColor={surfaceTint}
                  borderRadius={14}
                  style={styles.glassButtonBg}
                />
                <View style={styles.glassButtonContent}>
                  <Text style={[styles.glassButtonText, { color: t.primary }]}>Share Profile</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Posts Grid Header */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(500).springify()}
            style={[styles.gridHeader, { borderTopColor: border }]}
          >
            <View
              style={[
                styles.gridTab,
                styles.gridTabActive,
                { borderBottomColor: t.primary },
              ]}
            >
              <Ionicons name="grid-outline" size={24} color={t.primary} />
            </View>
          </Animated.View>

          {/* Posts Grid */}
          <Animated.View
            entering={FadeInDown.delay(500).duration(500).springify()}
            style={styles.postsGrid}
          >
            {postsLoading ? (
              <View style={styles.postsLoadingContainer}>
                <ActivityIndicator color={t.primary} size="small" />
              </View>
            ) : userPosts.length > 0 ? (
              userPosts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  activeOpacity={0.9}
                  style={styles.postContainer}
                  onPress={() =>
                    router.push({
                      pathname: "/post/[id]",
                      params: { id: post.id },
                    })
                  }
                >
                  {post.mediaType === "video" && post.videoUrl ? (
                    <VideoThumbnailImage
                      videoUrl={post.videoUrl}
                      fallbackUri={post.thumbUrl || post.imageUrl}
                      style={[
                        styles.postImage,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                      ]}
                    />
                  ) : (
                    <Image
                      source={{ uri: post.imageUrl }}
                      style={[
                        styles.postImage,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                      ]}
                    />
                  )}
                  {post.mediaType === "video" && (
                    <View style={styles.videoIndicator}>
                      <Ionicons name="play" size={32} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noPostsContainer}>
                <Ionicons
                  name="images-outline"
                  size={48}
                  color={t.muted}
                />
                <Text
                  style={[styles.noPostsText, { color: t.muted }]}
                >
                  No posts yet
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Logout Button */}
          <Animated.View
            entering={FadeInDown.delay(600).duration(500).springify()}
            style={styles.logoutButtonContainer}
          >
            <TouchableOpacity activeOpacity={0.8} onPress={logout}>
              <View style={[styles.glassButton, { borderColor: border }]}>
                {/* @ts-expect-error — augmented GlassViewProps */}
                <GlassView
                  {...liquidGlass.surface}
                  tintColor="rgba(255, 59, 48, 0.15)"
                  borderRadius={14}
                  style={styles.glassButtonBg}
                />
                <View style={styles.glassButtonContent}>
                  <Ionicons name="log-out-outline" size={18} color="#ff3b30" />
                  <Text style={[styles.glassButtonText, { color: "#ff4444" }]}>
                    Log Out
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Bottom spacing */}
          <View style={{ height: insets.bottom + 100 }} />
        </ScrollView>

        {/* Followers / Following Sheet */}
        {user?.id && (
          <FollowersSheet
            visible={followersSheetVisible}
            onClose={() => setFollowersSheetVisible(false)}
            initialTab={followersSheetTab}
            userId={user.id}
            followersCount={followerCount}
            followingCount={followingCount}
            currentUserId={user.id}
          />
        )}

        {/* Account Switcher Modal - only show accounts with active sessions */}
        <AccountSwitcherModal
          visible={isAccountSwitcherOpen}
          currentUserId={user?.id}
          savedAccounts={savedAccounts.filter(
            (a) => a.id === user?.id || !!a.accessToken,
          )}
          venues={myVenues}
          unreadCount={unreadCount}
          onClose={closeAccountSwitcher}
          onSelectAccount={handleSelectAccount}
          onAddAccount={handleAddAccount}
          onSelectVenue={handleSelectVenue}
        />
      </View>
    </SwipeableTabView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contextBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
    transform: [{ scale: 1.5 }],
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  usernameButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerUsername: {
    fontSize: 22,
    fontFamily: "Lato_700Bold",
  },
  headerIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerIconGlass: {
    ...StyleSheet.absoluteFillObject,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
  },
  statsCard: {
    flex: 1,
    marginLeft: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
  },
  statsCardGlass: {
    ...StyleSheet.absoluteFillObject,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  statButton: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Lato_700Bold",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Lato_400Regular",
    marginTop: 2,
  },
  bioSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  displayName: {
    fontSize: 14,
    fontFamily: "Lato_700Bold",
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
    lineHeight: 20,
  },
  dashboardButtonContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  glassButton: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
  },
  glassButtonBg: {
    ...StyleSheet.absoluteFillObject,
  },
  glassButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    gap: 8,
  },
  glassButtonText: {
    fontSize: 14,
    fontFamily: "Lato_700Bold",
  },
  glassCircleBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  gridHeader: {
    flexDirection: "row",
    borderTopWidth: 1,
  },
  gridTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  gridTabActive: {
    borderBottomWidth: 1,
  },
  postsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: POST_GAP,
  },
  postContainer: {
    position: "relative",
    width: POST_SIZE,
    height: POST_SIZE,
  },
  postImage: {
    width: "100%",
    height: "100%",
  },
  videoIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  postsLoadingContainer: {
    width: "100%",
    paddingVertical: 40,
    alignItems: "center",
  },
  noPostsContainer: {
    width: "100%",
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  noPostsText: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
  },
  logoutButtonContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  // Account switcher modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalSheet: {
    paddingHorizontal: 0,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  modalGlassBg: {
    ...StyleSheet.absoluteFillObject,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: "Lato_700Bold",
    color: "#fff",
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  accountList: {},
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  accountItemBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  accountAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  accountAvatarActive: {
    borderColor: "#fff",
  },
  accountInfo: {
    flex: 1,
    marginLeft: 12,
  },
  accountUsername: {
    fontSize: 15,
    fontFamily: "Lato_700Bold",
    color: "#fff",
  },
  accountName: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
  addAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  addAccountIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  addAccountText: {
    fontSize: 15,
    fontFamily: "Lato_700Bold",
    color: "#fff",
    marginLeft: 12,
  },
  unreadBadge: {
    backgroundColor: "#ff3b30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontFamily: "Lato_700Bold",
    color: "#fff",
  },
  venuesSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  venuesSectionTitle: {
    fontSize: 12,
    fontFamily: "Lato_700Bold",
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
