import { FollowersSheet } from "@/components/feed/followers-sheet";
import { DarkGradientBg } from "@/components/shared/dark-gradient-bg";
import { LinkifiedText } from "@/components/shared/linkified-text";
import { SwipeableTabView } from "@/components/shared/swipeable-tab-view";
import { useToast } from "@/components/shared/toast";
import { VideoThumbnailImage } from "@/components/shared/video-thumbnail";
import { liquidGlass } from "@/constants/glass/liquid-glass";
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
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import * as React from "react";
import {
  ActionSheet,
  type ActionSheetOption,
} from "@/components/ui/action-sheet";
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
const POST_GAP = 2;
const GRID_COLS = 3;
const CARD_H_PAD = 16; // postsSection paddingHorizontal
const CARD_INNER_PAD = 10; // postsCard padding
// Card inner width = screen - outer padding*2 - inner padding*2 - hairline borders
const CARD_INNER_WIDTH = SCREEN_WIDTH - CARD_H_PAD * 2 - CARD_INNER_PAD * 2;
const GRID_POST_SIZE = Math.floor(
  (CARD_INNER_WIDTH - POST_GAP * (GRID_COLS - 1)) / GRID_COLS
);

const DefaultAvatarImage = require("@/assets/images/default-avatar.png");

// Hero gradient — grey at top fading to light
const HERO_GRADIENT = [
  "rgba(140,140,148,0.65)",
  "rgba(165,165,172,0.45)",
  "rgba(200,200,206,0.22)",
  "rgba(242,242,247,0)",
] as const;

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

interface VenueItem {
  id: number;
  name: string;
  imageUrl?: string;
  ownerId?: number;
}

// ─── Account Switcher Modal (unchanged) ─────────────────────────

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
      <View style={modalStyles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={dismiss}
        />

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[modalStyles.sheet, sheetAnimStyle]}>
            <View style={modalStyles.content}>
              <GlassView
                {...liquidGlass.surface}
                borderRadius={20}
                style={StyleSheet.absoluteFillObject}
              />

              <View style={modalStyles.handle} />

              <View style={modalStyles.header}>
                <Text style={modalStyles.title}>Switch Account</Text>
                <GHTouchableOpacity
                  onPress={dismiss}
                  style={modalStyles.closeButton}
                >
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color="rgba(0,0,0,0.3)"
                  />
                </GHTouchableOpacity>
              </View>

              <View>
                {savedAccounts.map((account, index) => {
                  const isCurrentAccount = account.id === currentUserId;
                  const name = account.firstName
                    ? `${account.firstName}${account.lastName ? " " + account.lastName : ""}`
                    : account.userName || "User";

                  return (
                    <GHTouchableOpacity
                      key={account.id}
                      style={[
                        modalStyles.accountItem,
                        index < savedAccounts.length - 1 &&
                          modalStyles.accountItemBorder,
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
                          modalStyles.accountAvatar,
                          isCurrentAccount && modalStyles.accountAvatarActive,
                        ]}
                      />
                      <View style={modalStyles.accountInfo}>
                        <Text style={modalStyles.accountUsername}>
                          {account.userName || "username"}
                        </Text>
                        <Text style={modalStyles.accountName}>{name}</Text>
                      </View>
                      {isCurrentAccount && unreadCount > 0 && (
                        <View style={modalStyles.unreadBadge}>
                          <Text style={modalStyles.unreadBadgeText}>
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </Text>
                        </View>
                      )}
                      {isCurrentAccount && (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color="#1A1A1A"
                        />
                      )}
                    </GHTouchableOpacity>
                  );
                })}

                {venues.length > 0 && (
                  <>
                    <View style={modalStyles.venuesSectionHeader}>
                      <Ionicons
                        name="business-outline"
                        size={14}
                        color="rgba(0,0,0,0.3)"
                      />
                      <Text style={modalStyles.venuesSectionTitle}>
                        Your Venues
                      </Text>
                    </View>
                    {venues.map((venue, vIndex) => (
                      <GHTouchableOpacity
                        key={`venue-${venue.id}`}
                        style={[
                          modalStyles.accountItem,
                          vIndex < venues.length - 1 &&
                            modalStyles.accountItemBorder,
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
                          style={modalStyles.accountAvatar}
                        />
                        <View style={modalStyles.accountInfo}>
                          <Text style={modalStyles.accountUsername}>
                            {venue.name}
                          </Text>
                          <Text style={modalStyles.accountName}>Venue</Text>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color="rgba(0,0,0,0.25)"
                        />
                      </GHTouchableOpacity>
                    ))}
                  </>
                )}

                <GHTouchableOpacity
                  style={[
                    modalStyles.addAccountButton,
                    { paddingBottom: insets.bottom + 14 },
                  ]}
                  onPress={onAddAccount}
                  activeOpacity={0.7}
                >
                  <View style={modalStyles.addAccountIcon}>
                    <GlassView
                      {...liquidGlass.fillFaint}
                      borderRadius={22}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Ionicons name="add" size={22} color="rgba(0,0,0,0.5)" />
                  </View>
                  <Text style={modalStyles.addAccountText}>Add Account</Text>
                </GHTouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

// ─── Main Profile Screen ────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { user, isLoading, logout, switchAccount } = useAuth();
  const { showSuccess, showError } = useToast();
  const { isAccountSwitcherOpen, closeAccountSwitcher, openAccountSwitcher } =
    useTabNavigation();
  const { colors } = useAppTheme();
  const { data: myVenues = [] } = useMyVenues();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const [followersSheetVisible, setFollowersSheetVisible] =
    React.useState(false);
  const [followersSheetTab, setFollowersSheetTab] = React.useState<
    "followers" | "following"
  >("followers");
  const [savedAccounts, setSavedAccounts] = React.useState<SavedAccount[]>([]);
  const [showCreateMenu, setShowCreateMenu] = React.useState(false);
  const [showAvatarViewer, setShowAvatarViewer] = React.useState(false);
  const lastTapRef = React.useRef<number>(0);

  const createMenuOptions: ActionSheetOption[] = [
    {
      label: "New Post",
      icon: "image-outline",
      onPress: () => router.push("/create-post"),
    },
    {
      label: "New Event",
      icon: "calendar-outline",
      onPress: () => router.push("/create-event"),
    },
    {
      label: "Story (Coming Soon)",
      icon: "add-circle-outline",
      onPress: () => {},
    },
  ];

  const {
    posts: userPosts,
    isLoading: postsLoading,
    refetch: refetchPosts,
  } = useUserFeed(user?.id);

  const {
    totalFollowers: followerCount,
    refetch: refetchFollowers,
  } = useUserFollowers(user?.id);

  const {
    totalFollowing: followingCount,
    refetch: refetchFollowing,
  } = useUserFollowing(user?.id);

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

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : "User";
  const username = user?.userName || "username";
  const bio = user?.bio || "";
  const avatarUrl = user?.avatar?.url;
  const initial = (user?.userName?.[0] || user?.firstName?.[0] || "?").toUpperCase();

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
          AsyncStorage.setItem(
            SAVED_ACCOUNTS_KEY,
            JSON.stringify(updated),
          ).catch(() => {});
          return updated;
        } else {
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
          AsyncStorage.setItem(
            SAVED_ACCOUNTS_KEY,
            JSON.stringify(updated),
          ).catch(() => {});
          return updated;
        }
      });
    }
    saveCurrentAccount();
  }, [user]);

  const avatarTapTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAvatarTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap — no-op (account switcher removed)
      if (avatarTapTimer.current) clearTimeout(avatarTapTimer.current);
    } else {
      // Single tap → open avatar viewer (delayed to detect double tap)
      avatarTapTimer.current = setTimeout(() => {
        if (avatarUrl) setShowAvatarViewer(true);
      }, 300);
    }
    lastTapRef.current = now;
  };

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

      if (user && venue.ownerId === user.id) {
        closeAccountSwitcher();
        router.push(`/manage-venue/${venue.id}`);
        return;
      }

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
    } catch {}
  };

  if (isLoading) {
    return (
      <SwipeableTabView>
        <View style={[s.container, s.centerContent]}>
          <DarkGradientBg />
          <ActivityIndicator size="large" color={colors.textTertiary} />
        </View>
      </SwipeableTabView>
    );
  }

  return (
    <SwipeableTabView>
      <View style={s.container}>
        <DarkGradientBg />

        {/* Floating Header — stays fixed on scroll */}
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[s.floatingHeader, { paddingTop: insets.top + 8 }]}
        >
          <LinearGradient
            colors={[...HERO_GRADIENT]}
            locations={[0, 0.35, 0.7, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <TouchableOpacity
            style={s.glassCircle}
            activeOpacity={0.7}
            onPress={() => setShowCreateMenu(true)}
          >
            <GlassView {...liquidGlass.fillMedium} borderRadius={20} style={StyleSheet.absoluteFill} />
            <Ionicons name="add" size={22} color="rgba(0,0,0,0.7)" />
          </TouchableOpacity>

          <View style={s.usernameCenter}>
            <View style={s.usernameSpacer}>
              {user?.isVerified && <View style={{ width: 16 + 5 }} />}
              <View style={{ width: 13 + 3 }} />
            </View>
            <Text style={s.heroUsername}>@{username}</Text>
            <View style={s.usernameBadges}>
              {user?.isVerified && (
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={16}
                  color="#3897F0"
                />
              )}
            </View>
          </View>

          <TouchableOpacity
            style={s.glassCircle}
            activeOpacity={0.7}
            onPress={() => router.push("/settings")}
          >
            <GlassView {...liquidGlass.fillMedium} borderRadius={20} style={StyleSheet.absoluteFill} />
            <Ionicons name="settings-outline" size={20} color="rgba(0,0,0,0.7)" />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView
          style={{ flex: 1, backgroundColor: "rgba(160,160,168,0.35)" }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100, backgroundColor: "#f2f2f2" }}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {/* ── Hero Section ── */}
          <View style={[s.hero, { paddingTop: insets.top + 56 }]}>
            <LinearGradient
              colors={[...HERO_GRADIENT]}
              locations={[0, 0.35, 0.7, 1]}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Avatar */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(500).springify()}
              style={s.avatarContainer}
            >
              <TouchableOpacity onPress={handleAvatarTap} activeOpacity={0.9}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={s.avatarImage} />
                ) : (
                  <View style={s.avatarSquare}>
                    <GlassView {...liquidGlass.surface} borderRadius={24} style={StyleSheet.absoluteFill} />
                    <Text style={s.avatarInitial}>{initial}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Display name */}
            <Animated.View
              entering={FadeInDown.delay(130).duration(500).springify()}
            >
              <Text style={s.heroDisplayName}>{displayName}</Text>
            </Animated.View>

            {/* Stats */}
            <Animated.View
              entering={FadeInDown.delay(150).duration(500).springify()}
              style={s.heroStats}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setFollowersSheetTab("followers");
                  setFollowersSheetVisible(true);
                }}
              >
                <Text style={s.heroStatText}>
                  {followerCount} {followerCount === 1 ? "follower" : "followers"}
                </Text>
              </TouchableOpacity>
              <Text style={s.heroStatDot}> · </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setFollowersSheetTab("following");
                  setFollowersSheetVisible(true);
                }}
              >
                <Text style={s.heroStatText}>{followingCount} following</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Bio */}
            {bio ? (
              <Animated.View
                entering={FadeInDown.delay(170).duration(500).springify()}
                style={s.heroBioWrap}
              >
                <LinkifiedText style={s.heroBio as any}>{bio}</LinkifiedText>
              </Animated.View>
            ) : null}
          </View>

          {/* ── Content Section ── */}

          {/* Edit Profile / Share Profile */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(500).springify()}
            style={s.actionRow}
          >
            <TouchableOpacity
              style={[s.glassBtn, { flex: 1 }]}
              activeOpacity={0.7}
              onPress={() => router.push("/edit-profile")}
            >
              <GlassView {...liquidGlass.surface} borderRadius={14} style={StyleSheet.absoluteFill} />
              <Text style={s.glassBtnText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.glassBtn, { flex: 1 }]}
              activeOpacity={0.7}
              onPress={handleShareProfile}
            >
              <GlassView {...liquidGlass.surface} borderRadius={14} style={StyleSheet.absoluteFill} />
              <Text style={s.glassBtnText}>Share Profile</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Posts Card */}
          <Animated.View
            entering={FadeInDown.delay(350).duration(500).springify()}
            style={s.postsSection}
          >
            <View style={s.postsCard}>
              <GlassView {...liquidGlass.surface} borderRadius={20} style={StyleSheet.absoluteFill} />
              {/* Letterhead header */}
              <View style={s.postsHeader}>
                <Text style={s.postsHeaderText}>Posts</Text>
              </View>
              <View style={s.postsDivider} />

              {postsLoading ? (
                <View style={s.postsLoading}>
                  <ActivityIndicator color={colors.textTertiary} size="small" />
                </View>
              ) : userPosts.length > 0 ? (
                <View style={s.postsGrid}>
                  {userPosts.map((post) => {
                    const firstMedia = post.media?.[0];
                    const imageUrl =
                      firstMedia?.type === "image"
                        ? firstMedia.url
                        : post.eventFlyerUrl || post.eventImageUrl;
                    const videoUrl =
                      firstMedia?.type === "video" ? firstMedia.url : undefined;
                    const isVideo = firstMedia?.type === "video";

                    return (
                      <TouchableOpacity
                        key={post.id}
                        activeOpacity={0.9}
                        style={s.postContainer}
                        onPress={() =>
                          post.eventId
                            ? router.push({
                                pathname: "/event/[id]",
                                params: { id: post.eventId.toString() },
                              })
                            : router.push({
                                pathname: "/post/[id]",
                                params: { id: String(post.id) },
                              })
                        }
                      >
                        {isVideo && videoUrl ? (
                          <VideoThumbnailImage
                            videoUrl={videoUrl}
                            fallbackUri={firstMedia?.thumbnailUrl || imageUrl || undefined}
                            style={s.postImage}
                          />
                        ) : imageUrl ? (
                          <Image
                            source={{ uri: imageUrl }}
                            style={s.postImage}
                          />
                        ) : (
                          <View style={[s.postImage, s.postPlaceholder]}>
                            <Ionicons
                              name="document-text-outline"
                              size={22}
                              color={colors.textTertiary}
                            />
                          </View>
                        )}
                        {isVideo && (
                          <View style={s.videoIndicator}>
                            <Ionicons name="play" size={14} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={s.noPosts}>
                  <Ionicons
                    name="images-outline"
                    size={40}
                    color={colors.textTertiary}
                  />
                  <Text style={s.noPostsText}>No posts yet</Text>
                </View>
              )}
            </View>
          </Animated.View>
        </ScrollView>

        {/* Followers Sheet */}
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

        <ActionSheet
          visible={showCreateMenu}
          onClose={() => setShowCreateMenu(false)}
          options={createMenuOptions}
        />

        {/* Avatar Viewer */}
        <Modal
          visible={showAvatarViewer}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAvatarViewer(false)}
        >
          <TouchableOpacity
            style={s.avatarViewerOverlay}
            activeOpacity={1}
            onPress={() => setShowAvatarViewer(false)}
          >
            <View style={s.avatarViewerContainer}>
              {avatarUrl && (
                <Image
                  source={{ uri: avatarUrl }}
                  style={s.avatarViewerImage}
                  resizeMode="contain"
                />
              )}
            </View>
            <TouchableOpacity
              style={s.avatarViewerClose}
              onPress={() => setShowAvatarViewer(false)}
            >
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </View>
    </SwipeableTabView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────

const AVATAR_SIZE = 100;
const AVATAR_RADIUS = 24;

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f7",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Hero ──
  hero: {
    paddingBottom: 12,
  },

  // ── Floating Header ──
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  glassCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  usernameCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  usernameSpacer: {
    flexDirection: "row",
    opacity: 0,
  },
  usernameBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginLeft: 5,
  },
  heroUsername: {
    fontSize: 20,
    fontFamily: "Lato_700Bold",
    color: "rgba(0,0,0,0.75)",
  },

  // ── Avatar ──
  avatarContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  avatarSquare: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_RADIUS,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
    // Subtle shadow for 3D lift
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_RADIUS,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  avatarInitial: {
    fontSize: 38,
    fontFamily: "Lato_700Bold",
    color: "rgba(0,0,0,0.5)",
  },

  // ── Hero stats ──
  heroStats: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  heroStatText: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
    color: "rgba(0,0,0,0.45)",
  },
  heroStatDot: {
    fontSize: 14,
    color: "rgba(0,0,0,0.25)",
  },

  // ── Hero display name ──
  heroDisplayName: {
    fontSize: 18,
    fontFamily: "Lato_700Bold",
    color: "rgba(0,0,0,0.75)",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 2,
  },

  // ── Hero bio ──
  heroBioWrap: {
    paddingHorizontal: 32,
    marginTop: 4,
  },
  heroBio: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
    color: "rgba(0,0,0,0.45)",
    lineHeight: 20,
    textAlign: "center",
  },

  // ── Buttons ──
  btnSection: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  actionRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  glassBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 46,
    borderRadius: 14,
    gap: 8,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  glassBtnText: {
    fontSize: 14,
    fontFamily: "Lato_700Bold",
    color: "#1A1A1A",
  },

  // ── Posts Card ──
  postsSection: {
    paddingHorizontal: CARD_H_PAD,
    paddingTop: 16,
  },
  postsCard: {
    borderRadius: 20,
    overflow: "hidden",
    padding: CARD_INNER_PAD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  postsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  postsHeaderText: {
    fontSize: 13,
    fontFamily: "Lato_700Bold",
    color: "#1A1A1A",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  postsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginHorizontal: -CARD_INNER_PAD,
    marginBottom: 10,
  },
  postsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: POST_GAP,
  },
  postContainer: {
    position: "relative",
    width: GRID_POST_SIZE,
    height: GRID_POST_SIZE,
    borderRadius: 8,
    overflow: "hidden",
  },
  postImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  postPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  videoIndicator: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 4,
    padding: 3,
  },
  postsLoading: {
    paddingVertical: 40,
    alignItems: "center",
  },
  noPosts: {
    paddingVertical: 32,
    alignItems: "center",
    gap: 8,
  },
  noPostsText: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
    color: "rgba(0,0,0,0.35)",
  },

  // ── Avatar Viewer ──
  avatarViewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarViewerContainer: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_WIDTH - 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  avatarViewerImage: {
    width: "100%",
    height: "100%",
  },
  avatarViewerClose: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Modal Styles (Account Switcher) ────────────────────────────

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sheet: {
    paddingHorizontal: 0,
  },
  content: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.12)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  title: {
    fontSize: 17,
    fontFamily: "Lato_700Bold",
    color: "#1A1A1A",
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  accountItemBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  accountAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  accountAvatarActive: {
    borderColor: "#1A1A1A",
  },
  accountInfo: {
    flex: 1,
    marginLeft: 12,
  },
  accountUsername: {
    fontSize: 15,
    fontFamily: "Lato_700Bold",
    color: "#1A1A1A",
  },
  accountName: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    color: "rgba(0,0,0,0.45)",
    marginTop: 2,
  },
  addAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.06)",
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
    color: "#1A1A1A",
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
    color: "rgba(0,0,0,0.35)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
