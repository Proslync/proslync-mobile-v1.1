import {
  ActionSheet,
  type ActionSheetOption,
} from "@/components/shared/action-sheet";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFollowUser } from "@/hooks/use-follow-user";
import { usersApi } from "@/lib/api/users";
import { useAuth } from "@/lib/providers/auth-provider";
import type { FeedItem as FeedItemType } from "@/lib/types/feed.types";
import { formatEventDate } from "@/lib/utils/date";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "@/lib/utils/layout";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import * as React from "react";
import {
  ActivityIndicator,
  AppState,
  Image,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FeedBottomCTA } from "./feed-bottom-cta";
import { FeedMediaPlayer } from "./feed-media-player";

const MAX_MEDIA_HEIGHT = SCREEN_WIDTH * 1.25;

interface FeedItemProps {
  item: FeedItemType;
  index: number;
  itemHeight: number;
  isActive: boolean;
  isLiked: boolean;
  isRsvp: boolean;
  isPendingRsvp: boolean;
  isPurchased: boolean;
  onRsvp: () => void;
  onPendingRsvp: () => void;
  onPurchase: () => void;
  onRefer: () => void;
  onUserClick: () => void;
  onEventPress: () => void;
  onBlock?: (userId: string) => void;
}

export function FeedItem({
  item,
  itemHeight,
  isActive,
  isLiked,
  isRsvp,
  isPurchased,
  onRsvp,
  onPendingRsvp,
  onPurchase,
  onUserClick,
  onEventPress,
  onBlock,
}: FeedItemProps) {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const currentUserId = authUser ? String(authUser.id) : null;
  const {
    isFollowing,
    isLoading: followLoading,
    follow,
    unfollow,
    isFollowInProgress,
    isUnfollowInProgress,
  } = useFollowUser(item.userId);

  const flyerUrl = item.imageUrl || item.thumbnail;
  const isVideoItem = item.mediaType === "video" && !!item.videoUrl;
  const isFollowActionInProgress = isFollowInProgress || isUnfollowInProgress;

  const isSelf =
    currentUserId && item.userId && currentUserId === String(item.userId);
  const [showMenu, setShowMenu] = React.useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = React.useState(false);

  const handleFollowPress = async () => {
    if (isFollowActionInProgress || followLoading) return;
    try {
      if (isFollowing) {
        await unfollow();
      } else {
        await follow();
      }
    } catch (error) {
      console.error("[FeedItem] Follow error:", error);
    }
  };

  // Background video player for the glow effect — muted, loops with main player
  const bgPlayer = useVideoPlayer(isVideoItem ? item.videoUrl! : null, (p) => {
    p.loop = true;
    p.muted = true;
  });

  React.useEffect(() => {
    if (!bgPlayer || !isVideoItem) return;
    if (isActive) {
      try {
        bgPlayer.play();
      } catch {}
    } else {
      try {
        bgPlayer.pause();
        bgPlayer.currentTime = 0;
      } catch {}
    }
    return () => {
      try {
        bgPlayer.pause();
      } catch {}
    };
  }, [isActive, bgPlayer, isVideoItem]);

  React.useEffect(() => {
    if (!bgPlayer || !isVideoItem) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        try {
          bgPlayer.pause();
        } catch {}
      } else if (isActive) {
        try {
          bgPlayer.play();
        } catch {}
      }
    });
    return () => sub.remove();
  }, [bgPlayer, isVideoItem, isActive]);

  const gradientColors = isDark
    ? ([
        "transparent",
        "rgba(15, 9, 12, 0.15)",
        "rgba(15, 9, 12, 0.5)",
        "rgba(15, 9, 12, 0.85)",
        colors.background,
      ] as const)
    : ([
        "transparent",
        "rgba(255, 255, 255, 0.15)",
        "rgba(255, 255, 255, 0.5)",
        "rgba(255, 255, 255, 0.85)",
        colors.background,
      ] as const);

  const menuItems: ActionSheetOption[] = [
    {
      label: "View Profile",
      icon: "person-outline",
      onPress: () => {
        setShowMenu(false);
        onUserClick();
      },
    },
    {
      label: "Share Post",
      icon: "share-outline",
      onPress: async () => {
        setShowMenu(false);
        try {
          const url = item.eventId
            ? `status://event/${item.eventId}`
            : undefined;
          await Share.share({
            message: item.eventTitle
              ? `Check out ${item.eventTitle} on Status!`
              : "Check out this event on Status!",
            ...(url && { url }),
          });
        } catch {}
      },
    },
    {
      label: "Block",
      icon: "ban",
      destructive: true,
      onPress: () => {
        setShowMenu(false);
        setShowBlockConfirm(true);
      },
    },
  ];

  return (
    <View
      style={[
        styles.container,
        { height: itemHeight, paddingBottom: 50 + insets.bottom },
      ]}
    >
      {/* Background glow — blurred image/video behind card */}
      <View style={styles.glowWrapper}>
        {isVideoItem && bgPlayer ? (
          <VideoView
            player={bgPlayer}
            style={styles.glowMedia}
            contentFit="cover"
            nativeControls={false}
          />
        ) : flyerUrl ? (
          <Image
            source={{ uri: flyerUrl }}
            style={styles.glowMedia}
            resizeMode="cover"
          />
        ) : null}
        <BlurView
          intensity={40}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={gradientColors}
          locations={[0, 0.3, 0.6, 0.85, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Glassy card */}
      <View style={[styles.card, { borderColor: colors.border }]}>
        <BlurView
          intensity={25}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />

        {/* Card Header — organizer + follow */}
        <View style={styles.cardHeader}>
          <TouchableOpacity
            onPress={onUserClick}
            activeOpacity={0.7}
            style={styles.organizerSection}
          >
            {item.userAvatar && (
              <Image
                source={{ uri: item.userAvatar }}
                style={[
                  styles.organizerAvatar,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.backgroundSecondary,
                  },
                ]}
              />
            )}
            <View style={styles.organizerNameRow}>
              <Text
                style={[styles.organizerName, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.username}
              </Text>
              {item.verified && (
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={16}
                  color={colors.verified}
                />
              )}
            </View>
          </TouchableOpacity>

          {!isSelf && (
            <TouchableOpacity
              onPress={handleFollowPress}
              activeOpacity={0.8}
              disabled={followLoading || isFollowActionInProgress}
              style={[
                styles.followButton,
                isFollowing && styles.followButtonFollowing,
              ]}
            >
              {isFollowActionInProgress ? (
                <ActivityIndicator
                  size="small"
                  color={isFollowing ? colors.textSecondary : "#fff"}
                />
              ) : (
                <Text
                  style={[
                    styles.followButtonText,
                    isFollowing && { color: "rgba(255, 255, 255, 0.7)" },
                  ]}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Media */}
        {item.imageUrl || item.thumbnail || item.videoUrl ? (
          <View style={styles.flyerContainer}>
            <FeedMediaPlayer
              mediaType={item.mediaType}
              videoUrl={item.videoUrl}
              imageUrl={item.imageUrl || item.thumbnail}
              poster={item.thumbnail}
              isActive={isActive}
              onSingleTap={onEventPress}
              aspectRatio={item.aspectRatio}
              mediaWidth={item.mediaWidth}
              mediaHeight={item.mediaHeight}
              mediaOrientation={item.mediaOrientation}
              containerWidth={SCREEN_WIDTH}
              maxHeight={MAX_MEDIA_HEIGHT}
            />
          </View>
        ) : null}

        {/* Card Footer — event title + date */}
        <View style={styles.cardFooter}>
          <Text
            style={[styles.eventTitle, { color: colors.text }]}
            numberOfLines={2}
          >
            {item.eventTitle || item.description || "Untitled Event"}
          </Text>
          {item.eventDate && (
            <Text style={[styles.eventDate, { color: colors.textSecondary }]}>
              {formatEventDate(item.eventDate)}
            </Text>
          )}
        </View>

        {/* RSVP / Ticket CTA inside card */}
        <FeedBottomCTA
          onRsvp={
            item.isPaid ? onPurchase : item.isPrivate ? onPendingRsvp : onRsvp
          }
          isPaid={item.isPaid}
          isRsvpd={isRsvp || item.isUserRegistered}
          isPurchased={isPurchased}
          isEvent={item.isEvent}
          price={item.price}
        />
      </View>

      <ActionSheet
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        options={menuItems}
      />

      <ConfirmModal
        visible={showBlockConfirm}
        onClose={() => setShowBlockConfirm(false)}
        onConfirm={async () => {
          setShowBlockConfirm(false);
          try {
            await usersApi.blockUser(Number(item.userId));
            onBlock?.(item.userId ?? "");
          } catch (error) {
            console.error("[FeedItem] Block error:", error);
          }
        }}
        title="Block User"
        message="They won't be able to find your profile, see your posts, or message you."
        confirmLabel="Block"
        destructive
        icon="ban"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    overflow: "hidden",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 0,
  },
  glowWrapper: {
    position: "absolute",
    top: -(SCREEN_HEIGHT / 2),
    left: 0,
    right: 0,
    bottom: -(SCREEN_HEIGHT / 2),
    overflow: "hidden",
  },
  glowMedia: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: SCREEN_WIDTH,
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
    minHeight: SCREEN_HEIGHT * 0.77,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  organizerSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
    gap: 8,
  },
  organizerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  organizerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 4,
  },
  organizerName: {
    fontSize: 15,
    fontFamily: "Lato_700Bold",
    flexShrink: 1,
  },
  followButton: {
    backgroundColor: "#0095F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  followButtonFollowing: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  followButtonText: {
    fontSize: 14,
    fontFamily: "Lato_700Bold",
    color: "#fff",
  },
  flyerContainer: {
    width: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardFooter: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 4,
  },
  eventTitle: {
    fontSize: 20,
    fontFamily: "Lato_700Bold",
    lineHeight: 26,
  },
  eventDate: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
  },
});
