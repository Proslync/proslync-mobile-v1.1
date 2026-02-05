import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { MediaOrientation } from '../../lib/types/feed.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Maximum dimensions for media container
const MAX_MEDIA_WIDTH = SCREEN_WIDTH * 0.9;
const MAX_MEDIA_HEIGHT = SCREEN_HEIGHT * 0.55;
// Default aspect ratio (portrait 3:4) used while detecting actual ratio
const DEFAULT_ASPECT_RATIO = 0.75;

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
  // Dynamic aspect ratio from GetStream
  aspectRatio?: number;
  mediaOrientation?: MediaOrientation;
}

/**
 * Calculate container dimensions based on aspect ratio
 * Container is sized to exactly match the media's aspect ratio,
 * so media fills it completely without cropping or letterboxing.
 *
 * Sizing strategy (matches frontend):
 * - Horizontal (landscape): fit width, calculate height
 * - Vertical (portrait): fit height, calculate width
 * - Square: balanced dimensions
 */
function calculateMediaDimensions(ratio: number): { width: number; height: number } {
  if (ratio > 1.1) {
    // Horizontal (landscape): fit width, calculate height
    const width = MAX_MEDIA_WIDTH;
    const height = Math.min(width / ratio, MAX_MEDIA_HEIGHT);
    // If height was capped, recalculate width to maintain ratio
    const finalHeight = Math.min(height, MAX_MEDIA_HEIGHT);
    const finalWidth = finalHeight * ratio > MAX_MEDIA_WIDTH ? MAX_MEDIA_WIDTH : finalHeight * ratio;
    return { width: Math.min(finalWidth, MAX_MEDIA_WIDTH), height: finalHeight };
  } else if (ratio < 0.9) {
    // Vertical (portrait): fit height, calculate width
    const height = MAX_MEDIA_HEIGHT;
    const width = height * ratio;
    return { width: Math.min(width, MAX_MEDIA_WIDTH), height };
  } else {
    // Square: use smaller of max dimensions to ensure it fits
    const size = Math.min(MAX_MEDIA_WIDTH, MAX_MEDIA_HEIGHT);
    return { width: size, height: size };
  }
}

/**
 * Hook to detect image aspect ratio when not provided by GetStream
 * Uses Image.getSize to get actual dimensions from the image URL
 */
function useDetectedAspectRatio(
  imageUrl: string | undefined,
  providedRatio: number | undefined
): { ratio: number; isLoading: boolean } {
  const [detectedRatio, setDetectedRatio] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(!providedRatio && !!imageUrl);

  React.useEffect(() => {
    // Use provided ratio if available
    if (providedRatio) {
      setIsLoading(false);
      return;
    }

    if (!imageUrl) {
      setDetectedRatio(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    Image.getSize(
      imageUrl,
      (width, height) => {
        if (height > 0) {
          setDetectedRatio(width / height);
        }
        setIsLoading(false);
      },
      () => {
        // On error, fall back to default
        setDetectedRatio(null);
        setIsLoading(false);
      }
    );
  }, [imageUrl, providedRatio]);

  return {
    ratio: providedRatio ?? detectedRatio ?? DEFAULT_ASPECT_RATIO,
    isLoading,
  };
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
  aspectRatio: providedAspectRatio,
  mediaOrientation,
}: FeedMediaPlayerProps) {
  const lastTapRef = React.useRef<number>(0);
  const [showHeartAnimation, setShowHeartAnimation] = React.useState(false);
  const heartScale = useSharedValue(0);

  // For images: detect aspect ratio if not provided by GetStream
  const { ratio: imageRatio, isLoading: isLoadingRatio } = useDetectedAspectRatio(
    mediaType === 'image' ? imageUrl : undefined,
    providedAspectRatio
  );

  // For videos: detect aspect ratio from video metadata if not provided
  const [detectedVideoRatio, setDetectedVideoRatio] = React.useState<number | null>(null);
  const [isLoadingVideoRatio, setIsLoadingVideoRatio] = React.useState(
    mediaType === 'video' && !providedAspectRatio
  );

  // Use provided ratio first, then detected, then default
  const videoRatio = providedAspectRatio ?? detectedVideoRatio ?? DEFAULT_ASPECT_RATIO;

  // Use appropriate ratio based on media type
  const effectiveRatio = mediaType === 'image' ? imageRatio : videoRatio;

  // Calculate container dimensions to exactly match media aspect ratio
  // This ensures media fills container completely (no letterboxing)
  const mediaDimensions = React.useMemo(
    () => calculateMediaDimensions(effectiveRatio),
    [effectiveRatio]
  );

  // Create video player using expo-video
  const player = useVideoPlayer(
    mediaType === 'video' && videoUrl ? videoUrl : null,
    (player) => {
      player.loop = true;
      player.muted = false;
    }
  );

  // Detect video dimensions from player metadata when video loads
  React.useEffect(() => {
    if (!player || mediaType !== 'video' || providedAspectRatio) {
      setIsLoadingVideoRatio(false);
      return;
    }

    // Listen for sourceLoad event to get video dimensions
    const subscription = player.addListener('sourceLoad', () => {
      try {
        const tracks = player.availableVideoTracks;
        if (tracks && tracks.length > 0 && tracks[0].size) {
          const { width, height } = tracks[0].size;
          if (width && height && height > 0) {
            setDetectedVideoRatio(width / height);
          }
        }
      } catch (e) {
        // Fallback: keep default ratio
        console.log('[FeedMediaPlayer] Could not detect video dimensions:', e);
      }
      setIsLoadingVideoRatio(false);
    });

    return () => {
      subscription.remove();
    };
  }, [player, mediaType, providedAspectRatio]);

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
          <View style={[styles.mediaWrapper, { width: mediaDimensions.width, height: mediaDimensions.height }]}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.media}
              // Use 'cover' since container is sized to match aspect ratio exactly
              // This ensures image fills container completely with no gaps
              resizeMode="cover"
            />
            {/* Loading indicator while detecting aspect ratio */}
            {isLoadingRatio && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.7)" />
              </View>
            )}
            {/* Overlay (e.g., organizer info) - always inside media bounds */}
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
          <View style={[styles.mediaWrapper, { width: mediaDimensions.width, height: mediaDimensions.height }]}>
            <VideoView
              player={player}
              style={styles.media}
              // Use 'cover' since container is sized to match aspect ratio exactly
              // This ensures video fills container completely with no gaps
              contentFit="cover"
              nativeControls={false}
            />
            {/* Loading indicator while detecting aspect ratio */}
            {isLoadingVideoRatio && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.7)" />
              </View>
            )}
            {/* Overlay (e.g., organizer info) - always inside media bounds */}
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
    // Width and height are set dynamically based on aspect ratio
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
