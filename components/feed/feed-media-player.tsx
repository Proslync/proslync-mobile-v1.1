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
import { useAppTheme } from '@/hooks/use-app-theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Default aspect ratio (4:5 portrait) when no dimensions provided
const DEFAULT_ASPECT_RATIO = 4 / 5;

type MediaOrientation = 'horizontal' | 'vertical' | 'square';

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
  mediaWidth?: number;
  mediaHeight?: number;
  // Media orientation from GetStream (horizontal, vertical, square)
  mediaOrientation?: MediaOrientation;
  // Container width for sizing calculations
  containerWidth?: number;
  // Maximum height for media (to fit within available screen space)
  maxHeight?: number;
}

/**
 * Calculate media dimensions based on aspect ratio
 * Ensures media fits within screen bounds while respecting aspect ratio
 */
function calculateMediaDimensions(
  aspectRatio: number,
  containerWidth: number,
  maxHeight: number
): { width: number; height: number } {
  // Always use full container width; cap height at maxHeight
  const width = containerWidth;
  const height = Math.min(containerWidth / aspectRatio, maxHeight);

  return { width, height };
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
  aspectRatio: propAspectRatio,
  mediaWidth,
  mediaHeight,
  // mediaOrientation - available from GetStream but container sizing handles orientation automatically
  containerWidth = SCREEN_WIDTH * 0.85,
  maxHeight: propMaxHeight,
}: FeedMediaPlayerProps) {
  const { colors, isDark } = useAppTheme();
  const lastTapRef = React.useRef<number>(0);
  const [showHeartAnimation, setShowHeartAnimation] = React.useState(false);
  const [detectedAspectRatio, setDetectedAspectRatio] = React.useState<number | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = React.useState<number | null>(null);
  const [isLoadingImageRatio, setIsLoadingImageRatio] = React.useState(
    mediaType === 'image' && !propAspectRatio && !mediaWidth
  );
  const heartScale = useSharedValue(0);

  // Track if video ratio detection is in progress
  const [isLoadingVideoRatio, setIsLoadingVideoRatio] = React.useState(
    mediaType === 'video' && !propAspectRatio
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
    if (!player || mediaType !== 'video' || propAspectRatio) {
      setIsLoadingVideoRatio(false);
      return;
    }

    // Listen for sourceLoad event to get video dimensions
    const subscription = player.addListener('sourceLoad', () => {
      try {
        const tracks = (player as any).availableVideoTracks;
        if (tracks && tracks.length > 0 && tracks[0].size) {
          const { width, height } = tracks[0].size;
          if (width && height && height > 0) {
            const detectedRatio = width / height;
            console.log('[FeedMediaPlayer] Detected video dimensions:', width, 'x', height, 'ratio:', detectedRatio);
            setVideoAspectRatio(detectedRatio);
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
  }, [player, mediaType, propAspectRatio]);

  // Determine aspect ratio: prop > calculated from dimensions > video detected > image detected > default
  const effectiveAspectRatio = React.useMemo(() => {
    if (propAspectRatio && propAspectRatio > 0) {
      return propAspectRatio;
    }
    if (mediaWidth && mediaHeight && mediaHeight > 0) {
      return mediaWidth / mediaHeight;
    }
    if (mediaType === 'video' && videoAspectRatio) {
      return videoAspectRatio;
    }
    if (mediaType === 'image' && detectedAspectRatio) {
      return detectedAspectRatio;
    }
    return DEFAULT_ASPECT_RATIO;
  }, [propAspectRatio, mediaWidth, mediaHeight, videoAspectRatio, detectedAspectRatio, mediaType]);

  // Calculate dimensions for media display
  // Use provided maxHeight or fallback to 58% of screen height
  const maxHeight = propMaxHeight || SCREEN_HEIGHT * 0.58;
  const mediaDimensions = React.useMemo(
    () => calculateMediaDimensions(effectiveAspectRatio, containerWidth, maxHeight),
    [effectiveAspectRatio, containerWidth, maxHeight]
  );

  // Use 'cover' since container is sized to match aspect ratio exactly
  // This ensures video fills container completely with no gaps

  // Detect aspect ratio from image if not provided
  React.useEffect(() => {
    if (mediaType === 'image' && imageUrl && !propAspectRatio && !mediaWidth) {
      setIsLoadingImageRatio(true);
      Image.getSize(
        imageUrl,
        (width, height) => {
          if (height > 0) {
            setDetectedAspectRatio(width / height);
          }
          setIsLoadingImageRatio(false);
        },
        (error) => {
          console.log('[FeedMediaPlayer] Failed to get image size:', error);
          setIsLoadingImageRatio(false);
        }
      );
    } else {
      setIsLoadingImageRatio(false);
    }
  }, [mediaType, imageUrl, propAspectRatio, mediaWidth]);

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

  // Dynamic media wrapper style based on calculated dimensions
  // Background uses theme-aware secondary background color
  const mediaWrapperStyle = {
    width: mediaDimensions.width,
    height: mediaDimensions.height,
    borderRadius: 0, // No border radius - card has its own
    overflow: 'hidden' as const,
    backgroundColor: colors.backgroundSecondary,
  };

  // Theme-aware loading overlay color
  const loadingOverlayColor = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)';
  const loadingIndicatorColor = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.7)';

  // Image display
  if (mediaType === 'image' && imageUrl) {
    return (
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={styles.container}>
          <View style={mediaWrapperStyle}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.media}
              resizeMode="cover"
            />
            {/* Loading indicator while detecting aspect ratio */}
            {isLoadingImageRatio && (
              <View style={[styles.loadingOverlay, { backgroundColor: loadingOverlayColor }]}>
                <ActivityIndicator size="small" color={loadingIndicatorColor} />
              </View>
            )}
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
          <View style={mediaWrapperStyle}>
            <VideoView
              player={player}
              style={styles.media}
              contentFit="cover"
              nativeControls={false}
            />
            {/* Loading indicator while detecting aspect ratio */}
            {isLoadingVideoRatio && (
              <View style={[styles.loadingOverlay, { backgroundColor: loadingOverlayColor }]}>
                <ActivityIndicator size="small" color={loadingIndicatorColor} />
              </View>
            )}
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
        <Text style={[styles.fallbackText, { color: colors.textTertiary }]}>Media not available</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 16,
  },
});
