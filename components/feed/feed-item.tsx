import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ImageBackground,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FeedMediaPlayer } from './feed-media-player';
import { FeedBottomCTA } from './feed-bottom-cta';
import type { FeedItem as FeedItemType } from '@/lib/types/feed.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function formatEventDate(dateString: string, venueName?: string): string {
  try {
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNum = date.getDate();
    const ordinal = getOrdinalSuffix(dayNum);

    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;

    let result = `${dayName}, ${monthName} ${dayNum}${ordinal} at ${hours}:${minutesStr}${ampm}`;
    if (venueName) {
      result += ` at ${venueName}`;
    }
    return result;
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
  index,
  isActive,
  isLiked,
  isRsvp,
  isPendingRsvp,
  isPurchased,
  showDoubleTapHeart,
  onDoubleTap,
  onRsvp,
  onPendingRsvp,
  onPurchase,
  onRefer,
  onUserClick,
  onEventPress,
}: FeedItemProps) {
  const insets = useSafeAreaInsets();
  const backgroundImageUrl =
    item.mediaType === 'video'
      ? item.thumbnail
      : item.imageUrl || item.thumbnail;

  return (
    <View style={[styles.container, { height: SCREEN_HEIGHT }]}>
      {/* Blurred background */}
      {backgroundImageUrl && (
        <ImageBackground
          source={{ uri: backgroundImageUrl }}
          style={styles.backgroundImage}
          blurRadius={12}
        >
          <View style={styles.backgroundOverlay} />
        </ImageBackground>
      )}

      {/* Gradient overlay - darker at bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.95)']}
        locations={[0, 0.4, 0.7, 1]}
        style={styles.gradientOverlay}
      />

      {/* Main content */}
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 60, // Reduced header height for flyer to be higher
            paddingBottom: insets.bottom + 105, // Bottom CTA + tab bar height
          },
        ]}
      >
        {/* Media Player with Organizer Overlay */}
        <View style={styles.mediaContainer}>
          <FeedMediaPlayer
            mediaType={item.mediaType}
            videoUrl={item.videoUrl}
            imageUrl={item.imageUrl}
            poster={item.thumbnail}
            isActive={isActive}
            onDoubleTap={onDoubleTap}
            onSingleTap={onEventPress}
            isLiked={isLiked}
            aspectRatio={item.aspectRatio}
            mediaOrientation={item.mediaOrientation}
            overlay={
              item.username && item.userAvatar ? (
                <TouchableOpacity
                  onPress={onUserClick}
                  activeOpacity={0.8}
                  style={styles.organizerOverlay}
                >
                  <View style={styles.organizerContainer}>
                    <Image
                      source={{ uri: item.userAvatar }}
                      style={styles.organizerAvatar}
                    />
                    <Text style={styles.organizerName} numberOfLines={1}>
                      @{item.username}
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : null
            }
          />
        </View>

        {/* Event Info Section - Title & Date */}
        <View style={styles.eventInfoContainer}>
          {item.eventTitle && (
            <Text style={styles.eventTitle} numberOfLines={2}>
              {item.eventTitle}
            </Text>
          )}
          {item.eventDate && (
            <Text style={styles.eventDate}>
              {formatEventDate(item.eventDate, item.venueName)}
            </Text>
          )}
          {!item.eventTitle && item.description && (
            <Text style={styles.eventTitle} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
      </View>

      {/* Bottom CTA Bar */}
      <FeedBottomCTA
        onRsvp={item.isPaid ? onPurchase : (item.isPrivate ? onPendingRsvp : onRsvp)}
        isPaid={item.isPaid}
        isRsvpd={isRsvp || item.isUserRegistered}
        isEvent={item.isEvent}
      />

      {/* Double tap heart overlay */}
      {showDoubleTapHeart && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.doubleTapHeart}
        >
          <Text style={styles.heartEmoji}>❤️</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    backgroundColor: '#000',
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    paddingHorizontal: 16,
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0,
  },
  // Organizer overlay styles
  organizerOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
  },
  organizerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    paddingRight: 14,
    borderRadius: 20,
    gap: 8,
  },
  organizerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  organizerName: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    maxWidth: 120,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Event info styles
  eventInfoContainer: {
    paddingHorizontal: 8,
    paddingBottom: 12,
    marginTop: 16,
  },
  eventTitle: {
    fontSize: 26,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  eventDate: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  doubleTapHeart: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  heartEmoji: {
    fontSize: 96,
  },
});
