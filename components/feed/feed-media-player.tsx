import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Image,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
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
  onSingleTap?: () => void;
  overlay?: React.ReactNode;
  // Dynamic aspect ratio from backend
  aspectRatio?: number;
  mediaWidth?: number;
  mediaHeight?: number;
  // Media orientation (horizontal, vertical, square)
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
  onSingleTap,
  overlay,
  aspectRatio: propAspectRatio,
  mediaWidth,
  mediaHeight,
  // mediaOrientation - container sizing handles orientation automatically
  containerWidth = SCREEN_WIDTH * 0.85,
  maxHeight: propMaxHeight,
}: FeedMediaPlayerProps) {
  const { colors, isDark } = useAppTheme();
  const [detectedAspectRatio, setDetectedAspectRatio] = React.useState<number | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = React.useState<number | null>(null);
  const [isLoadingImageRatio, setIsLoadingImageRatio] = React.useState(
    mediaType === 'image' && !propAspectRatio && !mediaWidth
  );

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
            setVideoAspectRatio(detectedRatio);
          }
        }
      } catch (e) {
        // Fallback: keep default ratio
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
          setIsLoadingImageRatio(false);
        }
      );
    } else {
      setIsLoadingImageRatio(false);
    }
  }, [mediaType, imageUrl, propAspectRatio, mediaWidth]);

  // Safe wrappers — native player may already be released when cleanup runs
  const safePlay = React.useCallback(() => {
    try { player?.play(); } catch {}
  }, [player]);

  const safePause = React.useCallback(() => {
    try { player?.pause(); } catch {}
  }, [player]);

  // Handle video play/pause based on active state
  React.useEffect(() => {
    if (player && mediaType === 'video') {
      if (isActive) {
        safePlay();
      } else {
        safePause();
        try { player.currentTime = 0; } catch {}
      }
    }
    return () => {
      if (player && mediaType === 'video') {
        safePause();
      }
    };
  }, [isActive, player, mediaType, safePlay, safePause]);

  // Pause video when app goes to background
  React.useEffect(() => {
    if (!player || mediaType !== 'video') return;

    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        safePause();
      } else if (isActive) {
        safePlay();
      }
    });

    return () => subscription.remove();
  }, [player, mediaType, isActive, safePlay, safePause]);

  const handleTap = () => {
    if (onSingleTap) {
      onSingleTap();
    } else if (mediaType === 'video' && player) {
      if (player.playing) {
        safePause();
      } else {
        safePlay();
      }
    }
  };

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
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    fontSize: 16,
  },
});
