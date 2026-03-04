import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ActivityIndicator,
  Share,
  ActionSheetIOS,
  AppState,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';
import { usersApi } from '@/lib/api/users';
import { FeedBottomCTA } from './feed-bottom-cta';
import { FeedMediaPlayer } from './feed-media-player';
import { useFollowUser } from '@/hooks/use-follow-user';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuth } from '@/lib/providers/auth-provider';
import type { FeedItem as FeedItemType } from '@/lib/types/feed.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = SCREEN_WIDTH - (CARD_MARGIN * 2);
const CARD_BORDER_RADIUS = 20;
const HEADER_HEIGHT = 50;
const CARD_HEADER_HEIGHT = 56;
const CARD_FOOTER_HEIGHT = 80;

function formatEventDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNum = date.getDate();

    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;

    return `${dayName}, ${monthName} ${dayNum} at ${hours}:${minutesStr}${ampm}`;
  } catch {
    return dateString;
  }
}

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
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
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
  const isVideoItem = item.mediaType === 'video' && !!item.videoUrl;
  const isFollowActionInProgress = isFollowInProgress || isUnfollowInProgress;

  const isSelf = currentUserId && item.userId && currentUserId === String(item.userId);

  const availableHeight = itemHeight
    - (insets.top + HEADER_HEIGHT + 8)
    - 80
    - CARD_HEADER_HEIGHT
    - CARD_FOOTER_HEIGHT
    - 32;

  const maxMediaHeight = Math.max(availableHeight, 200);

  const handleFollowPress = async () => {
    if (isFollowActionInProgress || followLoading) return;
    try {
      if (isFollowing) {
        await unfollow();
      } else {
        await follow();
      }
    } catch (error) {
      console.error('[FeedItem] Follow error:', error);
    }
  };

  const handleMoreMenu = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['View Profile', 'Share Post', 'Block', 'Cancel'],
        destructiveButtonIndex: 2,
        cancelButtonIndex: 3,
      },
      async (buttonIndex) => {
        if (buttonIndex === 0) {
          onUserClick();
        } else if (buttonIndex === 1) {
          try {
            await Share.share({
              message: item.eventTitle
                ? `Check out ${item.eventTitle} on Status!`
                : 'Check out this event on Status!',
            });
          } catch {}
        } else if (buttonIndex === 2) {
          try {
            await usersApi.blockUser(Number(item.userId));
            onBlock?.(item.userId);
          } catch (error) {
            console.error('[FeedItem] Block error:', error);
          }
        }
      },
    );
  };

  // Background video player for the glow effect — muted, loops with main player
  const bgPlayer = useVideoPlayer(
    isVideoItem ? item.videoUrl! : null,
    (p) => { p.loop = true; p.muted = true; }
  );

  React.useEffect(() => {
    if (!bgPlayer || !isVideoItem) return;
    if (isActive) {
      try { bgPlayer.play(); } catch {}
    } else {
      try { bgPlayer.pause(); bgPlayer.currentTime = 0; } catch {}
    }
    return () => { try { bgPlayer.pause(); } catch {} };
  }, [isActive, bgPlayer, isVideoItem]);

  React.useEffect(() => {
    if (!bgPlayer || !isVideoItem) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') { try { bgPlayer.pause(); } catch {} }
      else if (isActive) { try { bgPlayer.play(); } catch {} }
    });
    return () => sub.remove();
  }, [bgPlayer, isVideoItem, isActive]);

  const gradientColors = isDark
    ? ['rgba(15, 9, 12, 0.35)', 'rgba(15, 9, 12, 0.35)', 'rgba(15, 9, 12, 0.6)', 'rgba(15, 9, 12, 0.9)', colors.background, colors.background] as const
    : ['rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.9)', colors.background, colors.background] as const;

  return (
    <View style={[styles.container, { height: itemHeight, backgroundColor: colors.background }]}>
      {/* Background wrapper — blurred image or video glow */}
      <View style={styles.backgroundWrapper}>
        {isVideoItem && bgPlayer ? (
          <VideoView
            player={bgPlayer}
            style={styles.backgroundImage}
            contentFit="cover"
            nativeControls={false}
          />
        ) : flyerUrl ? (
          <Image
            source={{ uri: flyerUrl }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        ) : null}
        <BlurView
          intensity={60}
          tint={isDark ? 'dark' : 'light'}
          style={styles.blurOverlay}
        />
        <LinearGradient
          colors={gradientColors}
          locations={[0, 0.7, 0.8, 0.88, 0.93, 1]}
          style={styles.gradientOverlay}
        />
      </View>

      {/* Main content area */}
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + HEADER_HEIGHT + 8,
            paddingBottom: 80,
          },
        ]}
      >
        {/* Single unified card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <BlurView
            intensity={25}
            tint={isDark ? 'dark' : 'light'}
            style={styles.cardBlurBackground}
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
                  style={[styles.organizerAvatar, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
                />
              )}
              <View style={styles.organizerNameRow}>
                <Text style={[styles.organizerName, { color: colors.text }]} numberOfLines={1}>
                  {item.username}
                </Text>
                <MaterialCommunityIcons name="check-decagram" size={16} color={colors.verified} />
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
                  <ActivityIndicator size="small" color={isFollowing ? colors.textSecondary : '#fff'} />
                ) : (
                  <Text
                    style={[
                      styles.followButtonText,
                      isFollowing && { color: 'rgba(255, 255, 255, 0.7)' },
                    ]}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleMoreMenu}
              activeOpacity={0.7}
              style={styles.moreButton}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Media */}
          {(item.imageUrl || item.thumbnail || item.videoUrl) ? (
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
                containerWidth={CARD_WIDTH - 2}
                maxHeight={maxMediaHeight}
              />
            </View>
          ) : null}

          {/* Card Footer — event title + date */}
          <View style={styles.cardFooter}>
            <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
              {item.eventTitle || item.description || 'Untitled Event'}
            </Text>
            {item.eventDate && (
              <Text style={[styles.eventDate, { color: colors.textSecondary }]}>
                {formatEventDate(item.eventDate)}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Bottom CTA Bar */}
      <FeedBottomCTA
        onRsvp={item.isPaid ? onPurchase : (item.isPrivate ? onPendingRsvp : onRsvp)}
        isPaid={item.isPaid}
        isRsvpd={isRsvp || item.isUserRegistered}
        isPurchased={isPurchased}
        isEvent={item.isEvent}
        price={item.price}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
  },
  backgroundWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: CARD_MARGIN,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: CARD_BORDER_RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  cardBlurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  organizerSection: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  organizerName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    flexShrink: 1,
  },
  followButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  followButtonFollowing: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  followButtonText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  moreButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  flyerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  cardFooter: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
  },
  eventTitle: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    lineHeight: 26,
  },
  eventDate: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
});
