import { FollowersSheet } from "@/components/feed/followers-sheet";
import { LinkifiedText } from "@/components/shared/linkified-text";
import { SwipeableTabView } from "@/components/shared/swipeable-tab-view";
import { VideoThumbnailImage } from "@/components/shared/video-thumbnail";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import { useUserFeed } from "@/hooks";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useRefreshControl } from "@/hooks/use-refresh-control";
import { useStableRouter } from "@/hooks/use-stable-router";
import { useUserFollowers, useUserFollowing } from "@/hooks/use-user-follows";
import { eventsApi } from "@/lib/api/events";
import { useQuery } from "@tanstack/react-query";
import type { Event } from "@/lib/types/events.types";
import { useAuth } from "@/lib/providers/auth-provider";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { LiquidGlassView, isLiquidGlassSupported } from "@callstack/liquid-glass";
import { LinearGradient } from "expo-linear-gradient";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const POST_GAP = 1;
const GRID_COLS = 3;
const CARD_H_PAD = 16; // postsSection paddingHorizontal
const CARD_INNER_PAD = 10; // postsCard padding
// Card inner width = screen - outer padding*2 - inner padding*2 - hairline borders
const CARD_INNER_WIDTH = SCREEN_WIDTH - CARD_H_PAD * 2 - CARD_INNER_PAD * 2;
const GRID_POST_SIZE = Math.floor(
  (SCREEN_WIDTH - POST_GAP * (GRID_COLS - 1)) / GRID_COLS
);

const DefaultAvatarImage = require("@/assets/images/default-avatar.png");

// Hero gradient — grey at top fading to light
const HERO_GRADIENT = [
  "rgba(140,140,148,0.65)",
  "rgba(165,165,172,0.45)",
  "rgba(200,200,206,0.22)",
  "rgba(242,242,247,0)",
] as const;

// ─── Main Profile Screen ────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { user, isLoading } = useAuth();
  const { colors } = useAppTheme();
  const [followersSheetVisible, setFollowersSheetVisible] =
    React.useState(false);
  const [followersSheetTab, setFollowersSheetTab] = React.useState<
    "followers" | "following"
  >("followers");
  const [showCreateMenu, setShowCreateMenu] = React.useState(false);
  const [profileTab, setProfileTab] = React.useState<'posts' | 'events'>('posts');
  const { data: userEvents = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ['userEvents', user?.id],
    queryFn: () => {
      if (!user?.id) return [];
      return eventsApi.getUserEvents(user.id, { sortBy: 'date', sortOrder: 'desc' });
    },
    enabled: !!user?.id && profileTab === 'events',
    staleTime: 1000 * 60 * 2,
  });
  const [showAvatarViewer, setShowAvatarViewer] = React.useState(false);
  const closeAvatarViewer = React.useCallback(() => setShowAvatarViewer(false), []);
  const lastTapRef = React.useRef<number>(0);

  const createMenuOptions: ActionSheetOption[] = React.useMemo(
    () => [
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
    ],
    [router],
  );

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

  const { displayName, username, bio, avatarUrl, initial } = React.useMemo(
    () => ({
      displayName: user?.firstName
        ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
        : "User",
      username: user?.userName || "username",
      bio: user?.bio || "",
      avatarUrl: user?.avatar?.url,
      initial: (user?.userName?.[0] || user?.firstName?.[0] || "?").toUpperCase(),
    }),
    [user],
  );

  const avatarTapTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    return () => {
      if (avatarTapTimer.current) clearTimeout(avatarTapTimer.current);
    };
  }, []);

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
          <ActivityIndicator size="large" color={colors.textTertiary} />
        </View>
      </SwipeableTabView>
    );
  }

  return (
    <SwipeableTabView>
      <View style={[s.container, { backgroundColor: '#f2f2f2' }]}>

        {/* Top bar — plus (left), username (center), hamburger (right) */}
        <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={s.topBarGlassCircle}
            activeOpacity={0.7}
            onPress={() => setShowCreateMenu(true)}
            accessibilityLabel="Create post or event"
            accessibilityRole="button"
          >
            {isLiquidGlassSupported ? (
              <LiquidGlassView effect="regular" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 19 }]} />
            )}
            <Ionicons name="add" size={22} color="#000" />
          </TouchableOpacity>
          <View style={s.topBarCenter}>
            <Text style={s.topBarUsername}>{username}</Text>
            {user?.isVerified && <MaterialCommunityIcons name="check-decagram" size={18} color="#3897F0" />}
          </View>
          <TouchableOpacity
            style={s.topBarGlassCircle}
            activeOpacity={0.7}
            onPress={() => router.push("/settings")}
            accessibilityLabel="Settings"
            accessibilityRole="button"
          >
            {isLiquidGlassSupported ? (
              <LiquidGlassView effect="regular" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 19 }]} />
            )}
            <Ionicons name="menu" size={22} color="#000" />
          </TouchableOpacity>
        </View>

        <LinearGradient colors={['#f2f2f2', 'rgba(242,242,242,0)']} style={s.topFade} pointerEvents="none" />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: insets.top + 56, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {/* Profile info row — avatar left, name + stats right */}
          <View style={s.profileRow}>
            <TouchableOpacity
              onPress={handleAvatarTap}
              activeOpacity={0.9}
              accessibilityLabel="View profile photo"
              accessibilityRole="imagebutton"
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={s.igAvatar} />
              ) : (
                <View style={[s.igAvatar, { backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 32, fontWeight: '700', color: 'rgba(0,0,0,0.3)' }}>{initial}</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={s.rightCol}>
              <Text style={s.igName}>{displayName}</Text>
              <View style={s.statsRow}>
                <View style={s.statCol}>
                  <Text style={s.statNum}>{userPosts.length}</Text>
                  <Text style={s.statLabel}>posts</Text>
                </View>
                <TouchableOpacity
                  style={s.statCol}
                  activeOpacity={0.7}
                  onPress={() => { setFollowersSheetTab("followers"); setFollowersSheetVisible(true); }}
                  accessibilityLabel={`${followerCount} followers`}
                  accessibilityRole="button"
                >
                  <Text style={s.statNum}>{followerCount}</Text>
                  <Text style={s.statLabel}>followers</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.statCol}
                  activeOpacity={0.7}
                  onPress={() => { setFollowersSheetTab("following"); setFollowersSheetVisible(true); }}
                  accessibilityLabel={`${followingCount} following`}
                  accessibilityRole="button"
                >
                  <Text style={s.statNum}>{followingCount}</Text>
                  <Text style={s.statLabel}>following</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bio */}
          {bio ? (
            <View style={s.bioSection}>
              <LinkifiedText style={s.igBio}>{bio}</LinkifiedText>
            </View>
          ) : null}

          {/* Action buttons */}
          <View style={s.igActionRow}>
            <TouchableOpacity
              style={[s.igBtn, { flex: 1 }]}
              activeOpacity={0.7}
              onPress={() => router.push("/edit-profile")}
              accessibilityRole="button"
            >
              <Text style={s.igBtnText}>Edit profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.igBtn, { flex: 1 }]}
              activeOpacity={0.7}
              onPress={handleShareProfile}
              accessibilityRole="button"
            >
              <Text style={s.igBtnText}>Share profile</Text>
            </TouchableOpacity>
          </View>

          {/* Grid tab icons */}
          <View style={s.gridTabs}>
            <TouchableOpacity
              style={profileTab === 'posts' ? s.gridTabActive : s.gridTab}
              onPress={() => setProfileTab('posts')}
              activeOpacity={0.7}
              accessibilityLabel="Posts"
              accessibilityRole="tab"
              accessibilityState={{ selected: profileTab === 'posts' }}
            >
              <Ionicons name="grid-outline" size={22} color={profileTab === 'posts' ? '#000' : 'rgba(0,0,0,0.3)'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={profileTab === 'events' ? s.gridTabActive : s.gridTab}
              onPress={() => setProfileTab('events')}
              activeOpacity={0.7}
              accessibilityLabel="Events"
              accessibilityRole="tab"
              accessibilityState={{ selected: profileTab === 'events' }}
            >
              <Ionicons name="calendar-outline" size={22} color={profileTab === 'events' ? '#000' : 'rgba(0,0,0,0.3)'} />
            </TouchableOpacity>
          </View>

          {/* Grid content */}
          <View style={s.igGridSection}>
            {profileTab === 'posts' ? (
              postsLoading ? (
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
                                params: { id: String(post.eventId) },
                              })
                            : router.push({
                                pathname: "/post/[id]",
                                params: { id: String(post.id) },
                              })
                        }
                        accessibilityLabel={post.eventId ? "Open event" : "Open post"}
                        accessibilityRole="button"
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
                    color="rgba(0,0,0,0.15)"
                  />
                  <Text style={s.noPostsText}>No posts yet</Text>
                </View>
              )
            ) : (
              eventsLoading ? (
                <View style={s.postsLoading}>
                  <ActivityIndicator color={colors.textTertiary} size="small" />
                </View>
              ) : userEvents.length > 0 ? (
                <View style={s.postsGrid}>
                  {userEvents.map((event) => {
                    const eventFlyerUrl = event.flyer?.url || event.imageUrl;
                    return (
                      <TouchableOpacity
                        key={event.id}
                        activeOpacity={0.9}
                        style={s.postContainer}
                        onPress={() => router.push({ pathname: "/event/[id]", params: { id: String(event.id) } })}
                        accessibilityLabel="Open event"
                        accessibilityRole="button"
                      >
                        {eventFlyerUrl ? (
                          <Image source={{ uri: eventFlyerUrl }} style={s.postImage} />
                        ) : (
                          <View style={[s.postImage, s.postPlaceholder]}>
                            <Ionicons name="calendar-outline" size={22} color={colors.textTertiary} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={s.noPosts}>
                  <Ionicons name="calendar-outline" size={40} color="rgba(0,0,0,0.15)" />
                  <Text style={s.noPostsText}>No events yet</Text>
                </View>
              )
            )}
          </View>
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
          onRequestClose={closeAvatarViewer}
        >
          <TouchableOpacity
            style={s.avatarViewerOverlay}
            activeOpacity={1}
            onPress={closeAvatarViewer}
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
              onPress={closeAvatarViewer}
              accessibilityLabel="Close photo"
              accessibilityRole="button"
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
    backgroundColor: "#f2f2f2",
  },
  // Instagram-style layout
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 10, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 140, zIndex: 9 },
  topBarGlassCircle: { width: 38, height: 38, borderRadius: 19, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  topBarCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topBarUsername: { fontSize: 20, fontWeight: '700', color: '#000' },
  profileRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  igAvatar: { width: 86, height: 86, borderRadius: 43 },
  rightCol: { flex: 1, marginLeft: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 6 },
  statCol: { alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '700', color: '#000' },
  statLabel: { fontSize: 13, color: 'rgba(0,0,0,0.5)', marginTop: 2 },
  bioSection: { paddingHorizontal: 16, paddingBottom: 12 },
  igName: { fontSize: 14, fontWeight: '700', color: '#000' },
  igBio: { fontSize: 14, color: '#000', lineHeight: 20, marginTop: 2 },
  igActionRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  igBtn: { height: 36, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' },
  igBtnText: { fontSize: 14, fontWeight: '600', color: '#000' },
  gridTabs: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.1)', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.1)' },
  gridTab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  gridTabActive: { flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: '#000' },
  igGridSection: { },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    gap: POST_GAP,
  },
  postContainer: {
    position: "relative",
    width: GRID_POST_SIZE,
    height: GRID_POST_SIZE,
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

