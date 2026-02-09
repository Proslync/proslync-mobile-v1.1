import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { FeedBottomCTA } from './feed-bottom-cta';
import { FeedMediaPlayer } from './feed-media-player';
import { useFollowUser } from '@/hooks/use-follow-user';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useStream } from '@/lib/providers/stream-provider';
import type { FeedItem as FeedItemType } from '@/lib/types/feed.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = SCREEN_WIDTH - (CARD_MARGIN * 2);
const CARD_BORDER_RADIUS = 20;
// Extra top padding to account for the FeedHeader (For You / Following tabs)
const HEADER_HEIGHT = 50;
// Bottom CTA height
const BOTTOM_CTA_HEIGHT = 105;
// Card header and footer heights (approximate)
const CARD_HEADER_HEIGHT = 56; // 12px padding * 2 + 32px avatar
const CARD_FOOTER_HEIGHT = 80; // 14px padding * 2 + title + date

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
  showDoubleTapHeart: boolean;
  onDoubleTap: () => void;
  onRsvp: () => void;
  onPendingRsvp: () => void;
  onPurchase: () => void;
  onRefer: () => void;
  onUserClick: () => void;
  onEventPress: () => void;
}

export function FeedItem({
  item,
  itemHeight,
  isActive,
  isLiked,
  isRsvp,
  isPurchased,
  // showDoubleTapHeart - handled by FeedMediaPlayer's internal animation
  onDoubleTap,
  onRsvp,
  onPendingRsvp,
  onPurchase,
  onUserClick,
  onEventPress,
}: FeedItemProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { userId: currentUserId } = useStream();
  const {
    isFollowing,
    isLoading: followLoading,
    follow,
    unfollow,
    isFollowInProgress,
    isUnfollowInProgress,
  } = useFollowUser(item.userId);

  const flyerUrl = item.imageUrl || item.thumbnail;
  const isFollowActionInProgress = isFollowInProgress || isUnfollowInProgress;

  // Check if this is the current user's own post
  const isSelf = currentUserId && item.userId && currentUserId === String(item.userId);

  // Calculate maximum height for media to ensure card fits within available space
  // with adequate spacing between card and bottom CTA button
  const availableHeight = itemHeight
    - (insets.top + HEADER_HEIGHT + 8)  // Top: safe area + header + margin
    - 80  // Bottom: CTA area
    - CARD_HEADER_HEIGHT  // Card header
    - CARD_FOOTER_HEIGHT  // Card footer
    - 32;  // Gap between card and bottom CTA

  const maxMediaHeight = Math.max(availableHeight, 200); // Minimum 200px for media

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

  // Theme-aware gradient colors
  const gradientColors = isDark
    ? ['rgba(15, 9, 12, 0.35)', 'rgba(15, 9, 12, 0.35)', 'rgba(15, 9, 12, 0.6)', 'rgba(15, 9, 12, 0.9)', colors.background, colors.background] as const
    : ['rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.9)', colors.background, colors.background] as const;

  return (
    <View style={[styles.container, { height: itemHeight, backgroundColor: colors.background }]}>
      {/* Background wrapper with rounded bottom corners */}
      <View style={styles.backgroundWrapper}>
        {/* Background with flyer image - blurred */}
        {flyerUrl && (
          <Image
            source={{ uri: flyerUrl }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        )}

        {/* Blur layer over background */}
        <BlurView
          intensity={60}
          tint={isDark ? 'dark' : 'light'}
          style={styles.blurOverlay}
        />

        {/* Gradient dark overlay - darker toward the bottom */}
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
        {/* Instagram Story Card - Liquid Glass */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Glass blur background for card */}
          <BlurView
            intensity={25}
            tint={isDark ? 'dark' : 'light'}
            style={styles.cardBlurBackground}
          />
          {/* Card Header - Organizer info + Follow button */}
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
                  isFollowing && [styles.followButtonFollowing, { backgroundColor: colors.buttonSecondary, borderColor: colors.border }],
                ]}
              >
                {isFollowActionInProgress ? (
                  <ActivityIndicator size="small" color={isFollowing ? colors.textSecondary : '#fff'} />
                ) : (
                  <Text
                    style={[
                      styles.followButtonText,
                      isFollowing && { color: colors.textSecondary },
                    ]}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Media Player - Supports video and image with dynamic aspect ratio */}
          <View style={styles.flyerContainer}>
            <FeedMediaPlayer
              mediaType={item.mediaType}
              videoUrl={item.videoUrl}
              imageUrl={item.imageUrl || item.thumbnail}
              poster={item.thumbnail}
              isActive={isActive}
              onDoubleTap={onDoubleTap}
              onSingleTap={onEventPress}
              isLiked={isLiked}
              aspectRatio={item.aspectRatio}
              mediaWidth={item.mediaWidth}
              mediaHeight={item.mediaHeight}
              mediaOrientation={item.mediaOrientation}
              containerWidth={CARD_WIDTH - 2} // Account for card border
              maxHeight={maxMediaHeight}
            />
          </View>

          {/* Card Footer - Event title + date */}
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

  // Card container - Liquid Glass
  card: {
    width: CARD_WIDTH,
    borderRadius: CARD_BORDER_RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    // Soft shadow for lift
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

  // Card Header
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

  // Follow Button - Glass aesthetic
  followButton: {
    backgroundColor: '#3897F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 151, 240, 0.3)',
  },
  followButtonFollowing: {
    // Colors applied via inline styles for theming
  },
  followButtonText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },

  // Flyer/Media container
  flyerContainer: {
    width: '100%',
    alignItems: 'center',
  },

  // Card Footer
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
