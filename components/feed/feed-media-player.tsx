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
  muted?: boolean;
  onSingleTap?: () => void;
  overlay?: React.ReactNode;
  aspectRatio?: number;
  mediaWidth?: number;
  mediaHeight?: number;
  mediaOrientation?: MediaOrientation;
  containerWidth?: number;
  maxHeight?: number;
}

function calculateMediaDimensions(
  aspectRatio: number,
  containerWidth: number,
  maxHeight: number
): { width: number; height: number } {
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
  muted = false,
  onSingleTap,
  overlay,
  aspectRatio: propAspectRatio,
  mediaWidth,
  mediaHeight,
  containerWidth = SCREEN_WIDTH * 0.85,
  maxHeight: propMaxHeight,
}: FeedMediaPlayerProps) {
  const { colors, isDark } = useAppTheme();
  const [detectedAspectRatio, setDetectedAspectRatio] = React.useState<number | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = React.useState<number | null>(null);
  const [isLoadingImageRatio, setIsLoadingImageRatio] = React.useState(
    mediaType === 'image' && !propAspectRatio && !mediaWidth
  );
  const [isLoadingVideoRatio, setIsLoadingVideoRatio] = React.useState(
    mediaType === 'video' && !propAspectRatio && !mediaWidth
  );

  const isVideo = mediaType === 'video' && !!videoUrl;

  // Create video player using expo-video
  const player = useVideoPlayer(
    isVideo ? videoUrl : null,
    (p) => {
      p.loop = true;
      p.muted = muted;
    }
  );

  // Detect video dimensions from player metadata when video loads
  React.useEffect(() => {
    if (!player || !isVideo || propAspectRatio || (mediaWidth && mediaHeight)) {
      setIsLoadingVideoRatio(false);
      return;
    }

    // Check if tracks are already available (source already loaded)
    try {
      const tracks = (player as any).availableVideoTracks;
      if (tracks && tracks.length > 0 && tracks[0].size) {
        const { width, height } = tracks[0].size;
        if (width && height && height > 0) {
          setVideoAspectRatio(width / height);
          setIsLoadingVideoRatio(false);
          return;
        }
      }
    } catch {}

    const subscription = player.addListener('sourceLoad', () => {
      try {
        const tracks = (player as any).availableVideoTracks;
        if (tracks && tracks.length > 0 && tracks[0].size) {
          const { width, height } = tracks[0].size;
          if (width && height && height > 0) {
            setVideoAspectRatio(width / height);
          }
        }
      } catch {}
      setIsLoadingVideoRatio(false);
    });

    return () => {
      subscription.remove();
    };
  }, [player, isVideo, propAspectRatio, mediaWidth, mediaHeight]);

  // Determine aspect ratio priority: prop > calculated from dimensions > video detected > image detected > default
  const effectiveAspectRatio = React.useMemo(() => {
    if (propAspectRatio && propAspectRatio > 0) return propAspectRatio;
    if (mediaWidth && mediaHeight && mediaHeight > 0) return mediaWidth / mediaHeight;
    if (isVideo && videoAspectRatio) return videoAspectRatio;
    if (mediaType === 'image' && detectedAspectRatio) return detectedAspectRatio;
    return DEFAULT_ASPECT_RATIO;
  }, [propAspectRatio, mediaWidth, mediaHeight, videoAspectRatio, detectedAspectRatio, mediaType, isVideo]);

  const maxHeight = propMaxHeight || SCREEN_HEIGHT * 0.58;
  const mediaDimensions = React.useMemo(
    () => calculateMediaDimensions(effectiveAspectRatio, containerWidth, maxHeight),
    [effectiveAspectRatio, containerWidth, maxHeight]
  );

  // Detect aspect ratio from image if not provided
  React.useEffect(() => {
    const url = mediaType === 'image' ? imageUrl : poster;
    if (url && !propAspectRatio && !mediaWidth) {
      setIsLoadingImageRatio(mediaType === 'image');
      Image.getSize(
        url,
        (width, height) => {
          if (height > 0) setDetectedAspectRatio(width / height);
          setIsLoadingImageRatio(false);
        },
        () => setIsLoadingImageRatio(false)
      );
    } else {
      setIsLoadingImageRatio(false);
    }
  }, [mediaType, imageUrl, poster, propAspectRatio, mediaWidth]);

  // Safe wrappers
  const safePlay = React.useCallback(() => {
    try { player?.play(); } catch {}
  }, [player]);

  const safePause = React.useCallback(() => {
    try { player?.pause(); } catch {}
  }, [player]);

  // Handle video play/pause based on active state
  React.useEffect(() => {
    if (player && isVideo) {
      if (isActive) {
        safePlay();
      } else {
        safePause();
        try { player.currentTime = 0; } catch {}
      }
    }
    return () => {
      if (player && isVideo) safePause();
    };
  }, [isActive, player, isVideo, safePlay, safePause]);

  // Pause video when app goes to background
  React.useEffect(() => {
    if (!player || !isVideo) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') safePause();
      else if (isActive) safePlay();
    });
    return () => subscription.remove();
  }, [player, isVideo, isActive, safePlay, safePause]);

  const handleTap = () => {
    if (onSingleTap) {
      onSingleTap();
    } else if (isVideo && player) {
      if (player.playing) safePause();
      else safePlay();
    }
  };

  const mediaWrapperStyle = {
    width: mediaDimensions.width,
    height: mediaDimensions.height,
    borderRadius: 0,
    overflow: 'hidden' as const,
    backgroundColor: colors.backgroundSecondary,
  };

  const loadingOverlayColor = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)';
  const loadingIndicatorColor = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.7)';

  // Poster/thumbnail URL for video background
  const posterUrl = poster || imageUrl;

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
            {isLoadingImageRatio && (
              <View style={[styles.loadingOverlay, { backgroundColor: loadingOverlayColor }]}>
                <ActivityIndicator size="small" color={loadingIndicatorColor} />
              </View>
            )}
            {overlay}
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  // Video display
  if (isVideo && player) {
    return (
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={styles.container}>
          <View style={mediaWrapperStyle}>
            {/* Show poster image behind video while loading */}
            {posterUrl && (
              <Image
                source={{ uri: posterUrl }}
                style={styles.posterImage}
                resizeMode="cover"
              />
            )}
            <VideoView
              player={player}
              style={styles.media}
              contentFit="cover"
              nativeControls={false}
            />
            {isLoadingVideoRatio && (
              <View style={[styles.loadingOverlay, { backgroundColor: loadingOverlayColor }]}>
                <ActivityIndicator size="small" color={loadingIndicatorColor} />
              </View>
            )}
            {overlay}
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  // Fallback — show image if available even when mediaType is video but no videoUrl
  if (imageUrl || poster) {
    return (
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={styles.container}>
          <View style={mediaWrapperStyle}>
            <Image
              source={{ uri: (imageUrl || poster)! }}
              style={styles.media}
              resizeMode="cover"
            />
            {overlay}
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.fallback, { width: containerWidth, height: 200, backgroundColor: colors.backgroundSecondary }]}>
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
  posterImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  fallbackText: {
    fontSize: 16,
  },
});
