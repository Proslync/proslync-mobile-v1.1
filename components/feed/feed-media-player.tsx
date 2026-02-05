import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FeedMediaPlayerProps {
  mediaType: 'video' | 'image';
  videoUrl?: string;
  imageUrl?: string;
  poster?: string;
  isActive: boolean;
  onDoubleTap?: () => void;
  onSingleTap?: () => void;
  isLiked?: boolean;
  overlay?: React.ReactNode;
}

export function FeedMediaPlayer({
  mediaType,
  videoUrl,
  imageUrl,
  poster,
  isActive,
  onDoubleTap,
  onSingleTap,
  isLiked,
  overlay,
}: FeedMediaPlayerProps) {
  const lastTapRef = React.useRef<number>(0);
  const [showHeartAnimation, setShowHeartAnimation] = React.useState(false);
  const heartScale = useSharedValue(0);

  // Create video player using expo-video
  const player = useVideoPlayer(
    mediaType === 'video' && videoUrl ? videoUrl : null,
    (player) => {
      player.loop = true;
      player.muted = false;
    }
  );

  // Handle video play/pause based on active state
  React.useEffect(() => {
    if (player && mediaType === 'video') {
      if (isActive) {
        player.play();
      } else {
        player.pause();
        player.currentTime = 0;
      }
    }
  }, [isActive, player, mediaType]);

  const handleTap = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap - trigger like animation
      if (onDoubleTap) {
        onDoubleTap();
        setShowHeartAnimation(true);
        heartScale.value = withSequence(
          withSpring(1.2, { damping: 10, stiffness: 400 }),
          withTiming(1, { duration: 100 }),
          withTiming(0, { duration: 300 })
        );
        setTimeout(() => setShowHeartAnimation(false), 800);
      }
      lastTapRef.current = 0;
    } else {
      // Single tap
      lastTapRef.current = now;
      setTimeout(() => {
        if (lastTapRef.current === now) {
          // Single tap confirmed - navigate to event
          if (onSingleTap) {
            onSingleTap();
          } else if (mediaType === 'video' && player) {
            // Fallback: Toggle play/pause for video if no single tap handler
            if (player.playing) {
              player.pause();
            } else {
              player.play();
            }
          }
        }
      }, 300);
    }
  };

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartScale.value,
  }));

  // Image display
  if (mediaType === 'image' && imageUrl) {
    return (
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={styles.container}>
          <View style={styles.mediaWrapper}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.media}
              resizeMode="cover"
            />
            {/* Overlay (e.g., organizer info) */}
            {overlay}
          </View>

          {/* Heart animation on double tap */}
          {showHeartAnimation && (
            <Animated.View style={[styles.heartContainer, heartAnimatedStyle]}>
              <Text style={styles.heartIcon}>❤️</Text>
            </Animated.View>
          )}
        </View>
      </TouchableWithoutFeedback>
    );
  }

  // Video display
  if (mediaType === 'video' && videoUrl && player) {
    return (
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={styles.container}>
          <View style={styles.mediaWrapper}>
            <VideoView
              player={player}
              style={styles.media}
              contentFit="cover"
              nativeControls={false}
            />
            {/* Overlay (e.g., organizer info) */}
            {overlay}
          </View>

          {/* Heart animation on double tap */}
          {showHeartAnimation && (
            <Animated.View style={[styles.heartContainer, heartAnimatedStyle]}>
              <Text style={styles.heartIcon}>❤️</Text>
            </Animated.View>
          )}
        </View>
      </TouchableWithoutFeedback>
    );
  }

  // Fallback
  return (
    <View style={styles.container}>
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Media not available</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaWrapper: {
    width: SCREEN_WIDTH * 0.85,
    aspectRatio: 3 / 4,
    maxHeight: SCREEN_HEIGHT * 0.5,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    // Subtle glow effect
    shadowColor: 'rgba(255, 255, 255, 0.2)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 10,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  heartContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIcon: {
    fontSize: 96,
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
  },
});
