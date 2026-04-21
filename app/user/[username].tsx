import {
  ActionSheet,
  type ActionSheetOption,
} from "@/components/ui/action-sheet";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { useToast } from "@/components/shared/toast";
import { useStableRouter } from "@/hooks/use-stable-router";
import { chatApi } from "@/lib/api/chat";
import { usersApi } from "@/lib/api/users";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
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
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { FollowersSheet } from "@/components/feed/followers-sheet";
import { LinkifiedText } from "@/components/shared/linkified-text";
import { VideoThumbnailImage } from "@/components/shared/video-thumbnail";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFollowUser } from "@/hooks/use-follow-user";
import { useMutualFollowers } from "@/hooks/use-mutual-followers";
import { useRefreshControl } from "@/hooks/use-refresh-control";
import { useUserFeed } from "@/hooks/use-user-feed";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useAuth } from "@/lib/providers/auth-provider";
import { useQueryClient } from "@tanstack/react-query";
import { useBlockUser, useUnblockUser, BLOCKED_USERS_KEY } from "@/hooks/use-blocked-users";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassView } from "expo-glass-effect";

const DEFAULT_AVATAR = require("@/assets/images/default-avatar.png");
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const POST_GAP = 2;
const POST_SIZE = (SCREEN_WIDTH - POST_GAP * 2) / 3;

// Hero gradient colors — grey at top fading to light
const HERO_GRADIENT = [
  "rgba(140,140,148,0.65)",
  "rgba(165,165,172,0.45)",
  "rgba(200,200,206,0.22)",
  "rgba(242,242,247,0)",
] as const;
const HERO_HEIGHT = 340;

export default function UserProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { username, userId } = useLocalSearchParams<{
    username: string;
    userId?: string;
  }>();
  const { showError, showSuccess } = useToast();
  const queryClient = useQueryClient();
  const { colors } = useAppTheme();
  const {
    data: user,
    isLoading,
    error: queryError,
    refetch: refetchUser,
  } = useUserProfile({ username, userId });
  const [isCreatingChat, setIsCreatingChat] = React.useState(false);
  const [followersSheetVisible, setFollowersSheetVisible] =
    React.useState(false);
  const [followersSheetTab, setFollowersSheetTab] = React.useState<
    "followers" | "following"
  >("followers");
  const [showMenu, setShowMenu] = React.useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = React.useState(false);
  const [showReportConfirm, setShowReportConfirm] = React.useState(false);
  const [showAvatarViewer, setShowAvatarViewer] = React.useState(false);

  // Block status
  const isBlocked = user?.isBlocked ?? false;
  const isBlockedBy = user?.isBlockedBy ?? false;
  const isAnyBlock = isBlocked || isBlockedBy;
  const { block, isBlocking } = useBlockUser();
  const { unblock, isUnblocking } = useUnblockUser();

  // Fetch user posts from our backend
  const {
    posts: userPosts,
    isLoading: postsLoading,
    refetch: refetchPosts,
  } = useUserFeed(user?.id, !isAnyBlock);
  const followerCount = user?.followStats?.followers ?? 0;
  const followingCount = user?.followStats?.following ?? 0;

  // Pull-to-refresh with haptic feedback
  const { refreshControl } = useRefreshControl({
    onRefresh: async () => {
      await Promise.all([refetchUser(), refetchPosts()]);
    },
  });

  // Follow/unfollow via backend
  const {
    isFollowing,
    follow,
    unfollow,
    isFollowInProgress,
    isUnfollowInProgress,
  } = useFollowUser(user?.id);

  const { user: currentUser } = useAuth();
  const { mutuals, totalCount: mutualCount } = useMutualFollowers(
    currentUser?.id !== user?.id && !isAnyBlock ? user?.id : undefined,
  );

  const error =
    queryError?.message || (!user && !isLoading ? "User not found" : null);

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : username || "User";

  const avatarUrl = user?.avatar?.url;

  // Initial letter for avatar fallback
  const initial = (user?.userName?.[0] || user?.firstName?.[0] || "?").toUpperCase();

  const handleFollow = async () => {
    if (!user?.id || isFollowInProgress || isUnfollowInProgress || isAnyBlock) return;
    try {
      if (isFollowing) {
        await unfollow();
      } else {
        await follow();
      }
      await refetchPosts();
    } catch (err: any) {
      console.error("Follow error:", err);
      if (err?.statusCode === 403) {
        showError("You can't follow this user");
      } else {
        showError(err?.message || "Failed to update follow status");
      }
    }
  };

  const handleMessage = async () => {
    if (!user?.id || isAnyBlock) {
      if (isAnyBlock) showError("You can't message this user");
      else showError("Unable to start chat. Please try again.");
      return;
    }

    if (isCreatingChat) return;

    setIsCreatingChat(true);
    try {
      const conversation = await chatApi.createConversation([user.id]);
      router.push({
        pathname: "/chat/[conversationId]",
        params: { conversationId: conversation.id },
      });
    } catch (err: any) {
      console.error("Error creating chat:", err);
      if (err?.statusCode === 403) {
        showError("You can't message this user");
      } else {
        showError(err?.message || "Failed to start conversation");
      }
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${displayName}'s profile on Status!`,
        url: `status://user/${username}`,
      });
    } catch {}
  };

  const isSelf =
    currentUser && user?.id && String(currentUser.id) === String(user.id);

  const menuOptions: ActionSheetOption[] = [
    {
      label: "Share this profile",
      icon: "share-outline",
      onPress: handleShare,
    },
    ...(isBlocked
      ? [
          {
            label: "Unblock",
            icon: "ban" as keyof typeof Ionicons.glyphMap,
            onPress: async () => {
              if (!user?.id) return;
              try {
                await unblock(user.id);
                showSuccess(`Unblocked ${displayName}`);
              } catch {
                showError("Failed to unblock user");
              }
            },
          },
        ]
      : [
          {
            label: "Block",
            icon: "ban" as keyof typeof Ionicons.glyphMap,
            destructive: true,
            onPress: () => setShowBlockConfirm(true),
          },
        ]),
    ...(!isBlocked
      ? [
          {
            label: "Report",
            icon: "flag-outline" as keyof typeof Ionicons.glyphMap,
            destructive: true,
            onPress: () => setShowReportConfirm(true),
          },
        ]
      : []),
  ];

  // ─── Loading ───
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.textTertiary} />
      </View>
    );
  }

  // ─── Error / Not Found ───
  if (error || !user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <View style={styles.errorHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.glassCircle}>
            <GlassView {...liquidGlass.surface} borderRadius={20} style={StyleSheet.absoluteFill} />
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContent}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="person-outline" size={48} color={colors.textTertiary} />
          </View>
          <Text style={styles.errorTitle}>User Not Found</Text>
          <Text style={styles.errorSubtitle}>
            @{username} doesn't exist or has been removed
          </Text>
          <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
            <GlassView {...liquidGlass.fillMedium} borderRadius={10} style={StyleSheet.absoluteFill} />
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Main Profile ───
  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1, backgroundColor: "rgba(160,160,168,0.35)" }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, backgroundColor: "#f2f2f7" }}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {/* ── Hero Section ── */}
        <View style={styles.hero}>
          <LinearGradient
            colors={[...HERO_GRADIENT]}
            locations={[0, 0.35, 0.7, 1]}
            style={styles.heroGradient}
          />

          {/* Header */}
          <Animated.View
            entering={FadeIn.duration(300)}
            style={[styles.headerRow, { paddingTop: insets.top + 8 }]}
          >
            <TouchableOpacity
              style={styles.glassCircle}
              activeOpacity={0.7}
              onPress={() => router.back()}
            >
              <GlassView {...liquidGlass.fillMedium} borderRadius={20} style={StyleSheet.absoluteFill} />
              <Ionicons name="chevron-back" size={20} color="rgba(0,0,0,0.7)" />
            </TouchableOpacity>

            <View style={styles.headerRight}>
              {!isSelf && (
                <TouchableOpacity
                  style={styles.followPill}
                  activeOpacity={0.7}
                  onPress={handleFollow}
                  disabled={isFollowInProgress || isUnfollowInProgress}
                >
                  <GlassView {...liquidGlass.fillMedium} borderRadius={18} style={StyleSheet.absoluteFill} />
                  {isFollowInProgress || isUnfollowInProgress ? (
                    <ActivityIndicator size="small" color="rgba(0,0,0,0.6)" />
                  ) : (
                    <Text style={styles.followPillText}>
                      {isFollowing ? "Following" : "Follow"}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.glassCircle}
                activeOpacity={0.7}
                onPress={handleShare}
              >
                <GlassView {...liquidGlass.fillMedium} borderRadius={20} style={StyleSheet.absoluteFill} />
                <Ionicons name="share-outline" size={18} color="rgba(0,0,0,0.7)" />
              </TouchableOpacity>
              {!isSelf && (
                <TouchableOpacity
                  style={styles.glassCircle}
                  activeOpacity={0.7}
                  onPress={() => setShowMenu(true)}
                >
                  <GlassView {...liquidGlass.fillMedium} borderRadius={20} style={StyleSheet.absoluteFill} />
                  <Ionicons name="ellipsis-horizontal" size={18} color="rgba(0,0,0,0.7)" />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Blocked States */}
          {isBlockedBy ? (
            <Animated.View
              entering={FadeInDown.delay(100).duration(500).springify()}
              style={styles.blockedHero}
            >
              <View style={styles.avatarSquare}>
                <GlassView {...liquidGlass.surface} borderRadius={24} style={StyleSheet.absoluteFill} />
                <Ionicons name="lock-closed" size={40} color="rgba(0,0,0,0.35)" />
              </View>
              <Text style={styles.heroName}>This account is unavailable</Text>
              <Text style={styles.heroSub}>You can't view this profile.</Text>
            </Animated.View>
          ) : isBlocked ? (
            <Animated.View
              entering={FadeInDown.delay(100).duration(500).springify()}
              style={styles.blockedHero}
            >
              <View style={styles.avatarSquare}>
                <GlassView {...liquidGlass.surface} borderRadius={24} style={StyleSheet.absoluteFill} />
                <Ionicons name="ban" size={40} color="rgba(0,0,0,0.35)" />
              </View>
              <Text style={styles.heroName}>You blocked {displayName}</Text>
              <Text style={styles.heroSub}>
                They can't see your profile or message you.
              </Text>
              <View style={{ marginTop: 16, width: 140 }}>
                <GlassButton
                  label={isUnblocking ? "Unblocking..." : "Unblock"}
                  variant="glass"
                  size="md"
                  disabled={isUnblocking}
                  onPress={async () => {
                    if (!user?.id) return;
                    try {
                      await unblock(user.id);
                      showSuccess(`Unblocked ${displayName}`);
                    } catch {
                      showError("Failed to unblock user");
                    }
                  }}
                />
              </View>
            </Animated.View>
          ) : (
            <>
              {/* Avatar */}
              <Animated.View
                entering={FadeInDown.delay(100).duration(500).springify()}
                style={styles.avatarContainer}
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => avatarUrl && setShowAvatarViewer(true)}
                >
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarSquare}>
                      <GlassView {...liquidGlass.surface} borderRadius={24} style={StyleSheet.absoluteFill} />
                      <Text style={styles.avatarInitial}>{initial}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* Follower count — tappable */}
              <Animated.View
                entering={FadeInDown.delay(150).duration(500).springify()}
                style={styles.heroStats}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setFollowersSheetTab("followers");
                    setFollowersSheetVisible(true);
                  }}
                >
                  <Text style={styles.heroStatText}>
                    {followerCount} {followerCount === 1 ? "follower" : "followers"}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.heroStatDot}> · </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setFollowersSheetTab("following");
                    setFollowersSheetVisible(true);
                  }}
                >
                  <Text style={styles.heroStatText}>{followingCount} following</Text>
                </TouchableOpacity>
              </Animated.View>
            </>
          )}
        </View>

        {/* ── Content Section (light bg) ── */}
        {!isAnyBlock && (
          <>
            {/* Username + Verified */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(500).springify()}
              style={styles.nameSection}
            >
              <View style={styles.usernameRow}>
                {user.isVerified && (
                  <MaterialCommunityIcons
                    name="check-decagram"
                    size={16}
                    color={colors.verified}
                  />
                )}
                <Text style={styles.usernameText} numberOfLines={1}>
                  @{user.userName}
                </Text>
              </View>
              <Text style={styles.displayName}>{displayName}</Text>
              {user.bio ? (
                <LinkifiedText style={styles.bio as any}>
                  {user.bio}
                </LinkifiedText>
              ) : null}
            </Animated.View>

            {/* Mutual Followers */}
            {mutualCount > 0 && (
              <Animated.View
                entering={FadeInDown.delay(250).duration(500).springify()}
                style={styles.mutualsSection}
              >
                <TouchableOpacity
                  style={styles.mutualsRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    setFollowersSheetTab("followers");
                    setFollowersSheetVisible(true);
                  }}
                >
                  <View style={styles.mutualsAvatars}>
                    {mutuals.slice(0, 3).map((m, i) => (
                      <Image
                        key={m.id}
                        source={m.avatarUrl ? { uri: m.avatarUrl } : DEFAULT_AVATAR}
                        style={[
                          styles.mutualAvatar,
                          { marginLeft: i > 0 ? -8 : 0, zIndex: 3 - i },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={styles.mutualsText} numberOfLines={2}>
                    Followed by{" "}
                    <Text style={{ }}>
                      {mutuals
                        .slice(0, 2)
                        .map((m) => m.userName || m.firstName || "User")
                        .join(", ")}
                    </Text>
                    {mutualCount > 2 && (
                      <Text>
                        , and {mutualCount - 2}{" "}
                        {mutualCount - 2 === 1 ? "other" : "others"}
                      </Text>
                    )}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Message button */}
            {!isSelf && (
              <Animated.View
                entering={FadeInDown.delay(300).duration(500).springify()}
                style={styles.messageSection}
              >
                <TouchableOpacity
                  style={styles.messageBtn}
                  activeOpacity={0.7}
                  onPress={handleMessage}
                  disabled={isCreatingChat}
                >
                  <GlassView {...liquidGlass.surface} borderRadius={14} style={StyleSheet.absoluteFill} />
                  {isCreatingChat ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <>
                      <Ionicons name="chatbubble-outline" size={16} color={colors.text} />
                      <Text style={styles.messageBtnText}>Message</Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Posts Card */}
            <Animated.View
              entering={FadeInDown.delay(350).duration(500).springify()}
              style={styles.postsSection}
            >
              <View style={styles.postsCard}>
                <GlassView {...liquidGlass.surface} borderRadius={20} style={StyleSheet.absoluteFill} />
                <Text style={styles.postsSectionTitle}>
                  Posts{userPosts.length > 0 ? ` (${userPosts.length})` : ""}
                </Text>

                {postsLoading ? (
                  <View style={styles.postsLoadingContainer}>
                    <ActivityIndicator color={colors.textTertiary} size="small" />
                  </View>
                ) : userPosts.length > 0 ? (
                  <View style={styles.postsGrid}>
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
                          style={styles.postContainer}
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
                              fallbackUri={
                                firstMedia?.thumbnailUrl || imageUrl || undefined
                              }
                              style={styles.postImage}
                            />
                          ) : imageUrl ? (
                            <Image
                              source={{ uri: imageUrl }}
                              style={styles.postImage}
                            />
                          ) : (
                            <View
                              style={[
                                styles.postImage,
                                styles.postPlaceholder,
                              ]}
                            >
                              <Ionicons
                                name="document-text-outline"
                                size={22}
                                color={colors.textTertiary}
                              />
                            </View>
                          )}
                          {isVideo && (
                            <View style={styles.videoIndicator}>
                              <Ionicons name="play" size={14} color="#fff" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.noPostsContainer}>
                    <Ionicons
                      name="images-outline"
                      size={40}
                      color={colors.textTertiary}
                    />
                    <Text style={styles.noPostsText}>No posts yet</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>

      {/* Sheets & Modals */}
      <ActionSheet
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        options={menuOptions}
      />

      <ConfirmSheet
        visible={showBlockConfirm}
        onClose={() => setShowBlockConfirm(false)}
        onConfirm={async () => {
          setShowBlockConfirm(false);
          if (!user?.id) return;
          try {
            await block(user.id);
            showSuccess(`Blocked ${displayName}`);
            if (router.canGoBack()) {
              router.dismissAll();
            }
          } catch {
            showError("Failed to block user");
          }
        }}
        title="Block User"
        message="They won't be able to find your profile, see your posts, or message you."
        confirmLabel="Block"
        destructive
        icon="ban"
      />

      <ConfirmSheet
        visible={showReportConfirm}
        onClose={() => setShowReportConfirm(false)}
        onConfirm={async () => {
          setShowReportConfirm(false);
          if (!user?.id) return;
          try {
            await usersApi.reportUser(user.id, "inappropriate");
            showSuccess("Report submitted");
          } catch {
            showError("Failed to submit report");
          }
        }}
        title="Report User"
        message="We'll review this report and take action if it violates our guidelines."
        confirmLabel="Report"
        destructive
        icon="flag-outline"
      />

      {user?.id && (
        <FollowersSheet
          visible={followersSheetVisible}
          onClose={() => setFollowersSheetVisible(false)}
          initialTab={followersSheetTab}
          userId={user.id}
          followersCount={followerCount}
          followingCount={followingCount}
        />
      )}

      {/* Avatar Viewer */}
      <Modal
        visible={showAvatarViewer}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAvatarViewer(false)}
      >
        <TouchableOpacity
          style={styles.avatarViewerOverlay}
          activeOpacity={1}
          onPress={() => setShowAvatarViewer(false)}
        >
          <View style={styles.avatarViewerContainer}>
            {avatarUrl && (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarViewerImage}
                resizeMode="contain"
              />
            )}
          </View>
          <TouchableOpacity
            style={styles.avatarViewerClose}
            onPress={() => setShowAvatarViewer(false)}
          >
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────

const AVATAR_SIZE = 100;
const AVATAR_RADIUS = 24;
const GRID_GAP = 2;
const GRID_COLS = 3;
const CARD_H_PAD = 16;
const CARD_INNER_PAD = 10;
const CARD_INNER_WIDTH = SCREEN_WIDTH - CARD_H_PAD * 2 - CARD_INNER_PAD * 2;
const GRID_POST_SIZE = Math.floor(
  (CARD_INNER_WIDTH - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS
);

const styles = StyleSheet.create({
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
    minHeight: HERO_HEIGHT,
    paddingBottom: 24,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },

  // ── Header ──
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  glassCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  followPill: {
    height: 36,
    paddingHorizontal: 22,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  followPillText: {
    fontSize: 15,
    color: "rgba(0,0,0,0.7)",
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
    color: "rgba(0,0,0,0.45)",
  },
  heroStatDot: {
    fontSize: 14,
    color: "rgba(0,0,0,0.25)",
  },

  // ── Blocked hero ──
  blockedHero: {
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 8,
    paddingBottom: 20,
  },

  // ── Hero name (used in blocked states) ──
  heroName: {
    fontSize: 17,
    color: "rgba(0,0,0,0.75)",
    marginTop: 12,
    textAlign: "center",
  },
  heroSub: {
    fontSize: 14,
    color: "rgba(0,0,0,0.45)",
    marginTop: 4,
    textAlign: "center",
  },

  // ── Content — Name & Bio ──
  nameSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  usernameText: {
    fontSize: 13,
    color: "rgba(0,0,0,0.45)",
  },
  displayName: {
    fontSize: 18,
    color: "#1A1A1A",
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: "rgba(0,0,0,0.55)",
    lineHeight: 20,
  },

  // ── Mutuals ──
  mutualsSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  mutualsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mutualsAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  mutualAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#f2f2f7",
  },
  mutualsText: {
    flex: 1,
    fontSize: 12,
    color: "rgba(0,0,0,0.45)",
    lineHeight: 16,
  },

  // ── Message ──
  messageSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 14,
    gap: 8,
    overflow: "hidden",
  },
  messageBtnText: {
    fontSize: 15,
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
    borderColor: "rgba(255,255,255,0.5)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  postsSectionTitle: {
    fontSize: 18,
    color: "#1A1A1A",
    marginBottom: 12,
    marginLeft: 4,
  },
  postsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
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
  postsLoadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  noPostsContainer: {
    paddingVertical: 32,
    alignItems: "center",
    gap: 8,
  },
  noPostsText: {
    fontSize: 14,
    color: "rgba(0,0,0,0.35)",
  },

  // ── Error ──
  errorHeader: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  errorIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 22,
    color: "#1A1A1A",
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 15,
    color: "rgba(0,0,0,0.4)",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  goBackButton: {
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    overflow: "hidden",
  },
  goBackButtonText: {
    fontSize: 15,
    color: "#1A1A1A",
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
