import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { FeedBottomCTA } from './feed-bottom-cta';
import { useFollowUser } from '@/hooks/use-follow-user';
import type { FeedItem as FeedItemType } from '@/lib/types/feed.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = SCREEN_WIDTH - (CARD_MARGIN * 2);
const CARD_BORDER_RADIUS = 20;

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
  isActive,
  isLiked,
  isRsvp,
  showDoubleTapHeart,
  onDoubleTap,
  onRsvp,
  onPendingRsvp,
  onPurchase,
  onUserClick,
  onEventPress,
}: FeedItemProps) {
  const insets = useSafeAreaInsets();
  const {
    isFollowing,
    isLoading: followLoading,
    follow,
    unfollow,
    isFollowInProgress,
    isUnfollowInProgress,
  } = useFollowUser(item.userId);
  const lastTapRef = React.useRef<number>(0);

  const flyerUrl = item.imageUrl || item.thumbnail;
  const isFollowActionInProgress = isFollowInProgress || isUnfollowInProgress;

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

  const handleFlyerTap = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap
      onDoubleTap();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (lastTapRef.current === now) {
          onEventPress();
        }
      }, 300);
    }
  };

  return (
    <View style={[styles.container, { height: SCREEN_HEIGHT }]}>
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
          tint="light"
          style={styles.blurOverlay}
        />

        {/* Gradient dark overlay - darker toward the bottom */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.9)', '#fff', '#fff']}
          locations={[0, 0.7, 0.8, 0.88, 0.93, 1]}
          style={styles.gradientOverlay}
        />
      </View>

      {/* Main content area */}
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 105,
          },
        ]}
      >
        {/* Instagram Story Card - Liquid Glass */}
        <View style={styles.card}>
          {/* Glass blur background for card */}
          <BlurView
            intensity={25}
            tint="light"
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
                  style={styles.organizerAvatar}
                />
              )}
              <View style={styles.organizerNameRow}>
                <Text style={styles.organizerName} numberOfLines={1}>
                  {item.username}
                </Text>
                <MaterialCommunityIcons name="check-decagram" size={16} color="#3897F0" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleFollowPress}
              activeOpacity={0.8}
              style={[
                styles.followButton,
                isFollowing && styles.followButtonFollowing,
              ]}
            >
              <Text
                style={[
                  styles.followButtonText,
                  isFollowing && styles.followButtonTextFollowing,
                ]}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Flyer Image - Rounded corners with glass padding */}
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={handleFlyerTap}
            style={styles.flyerContainer}
          >
            <View style={styles.flyerOutline}>
              {flyerUrl && (
                <Image
                  source={{ uri: flyerUrl }}
                  style={styles.flyerImage}
                  resizeMode="cover"
                />
              )}
            </View>

            {/* Double tap heart overlay */}
            {showDoubleTapHeart && (
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                style={styles.heartOverlay}
              >
                <Text style={styles.heartEmoji}>❤️</Text>
              </Animated.View>
            )}
          </TouchableOpacity>

          {/* Card Footer - Event title + date */}
          <View style={styles.cardFooter}>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {item.eventTitle || item.description || 'Untitled Event'}
            </Text>
            {item.eventDate && (
              <Text style={styles.eventDate}>
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
        isEvent={item.isEvent}
        price={item.price}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
    borderRadius: CARD_BORDER_RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
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
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
    color: '#1a1a1a',
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
    backgroundColor: '#e0e0e0',
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  followButtonText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  followButtonTextFollowing: {
    color: 'rgba(0, 0, 0, 0.5)',
  },

  // Flyer
  flyerContainer: {
    width: '100%',
    aspectRatio: 4 / 5,
  },
  flyerOutline: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  flyerImage: {
    width: '100%',
    height: '100%',
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
    color: '#1a1a1a',
    lineHeight: 26,
  },
  eventDate: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0, 0, 0, 0.55)',
  },

  // Heart overlay
  heartOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartEmoji: {
    fontSize: 80,
  },
});
