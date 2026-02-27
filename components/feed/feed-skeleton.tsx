import * as React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/use-app-theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function ShimmerOverlay({ isDark }: { isDark: boolean }) {
  const shimmerPosition = useSharedValue(0);

  React.useEffect(() => {
    shimmerPosition.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1, // infinite
      false
    );
  }, [shimmerPosition]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerPosition.value,
      [0, 1],
      [-SCREEN_WIDTH, SCREEN_WIDTH]
    );

    return {
      transform: [{ translateX }],
    };
  });

  // Theme-aware shimmer colors
  const shimmerColors = isDark
    ? [
        'transparent',
        'rgba(255, 255, 255, 0.04)',
        'rgba(255, 255, 255, 0.08)',
        'rgba(255, 255, 255, 0.04)',
        'transparent',
      ] as const
    : [
        'transparent',
        'rgba(0, 0, 0, 0.04)',
        'rgba(0, 0, 0, 0.08)',
        'rgba(0, 0, 0, 0.04)',
        'transparent',
      ] as const;

  return (
    <Animated.View style={[styles.shimmerContainer, animatedStyle]}>
      <LinearGradient
        colors={shimmerColors}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.shimmerGradient}
      />
    </Animated.View>
  );
}

export function FeedItemSkeleton() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  // Theme-aware skeleton background colors
  const skeletonBgLight = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const skeletonBgMedium = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const skeletonBgSubtle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';

  // Theme-aware gradient colors for background
  const backgroundGradientColors = isDark
    ? [colors.backgroundSecondary, colors.backgroundTertiary, colors.background] as const
    : ['#f5f5f5', '#fafafa', colors.background] as const;

  return (
    <View style={[styles.container, { height: SCREEN_HEIGHT, backgroundColor: colors.background }]}>
      {/* Background gradient */}
      <LinearGradient
        colors={backgroundGradientColors}
        style={styles.background}
      />

      {/* Content area */}
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 105,
          },
        ]}
      >
        {/* Organizer skeleton */}
        <View style={styles.organizerSkeleton}>
          <View style={[styles.avatarSkeleton, { backgroundColor: skeletonBgLight }]}>
            <ShimmerOverlay isDark={isDark} />
          </View>
          <View style={[styles.nameSkeleton, { backgroundColor: skeletonBgLight }]}>
            <ShimmerOverlay isDark={isDark} />
          </View>
        </View>

        {/* Flyer/Media skeleton */}
        <View style={styles.flyerContainer}>
          <View style={[styles.flyerSkeleton, { backgroundColor: skeletonBgMedium }]}>
            <ShimmerOverlay isDark={isDark} />
            {/* Decorative elements to make it look like a flyer */}
            <View style={styles.flyerInner}>
              <View style={[styles.flyerTitleSkeleton, { backgroundColor: skeletonBgLight }]}>
                <ShimmerOverlay isDark={isDark} />
              </View>
              <View style={[styles.flyerSubtitleSkeleton, { backgroundColor: skeletonBgMedium }]}>
                <ShimmerOverlay isDark={isDark} />
              </View>
              <View style={[styles.flyerDetailsSkeleton, { backgroundColor: skeletonBgSubtle }]}>
                <ShimmerOverlay isDark={isDark} />
              </View>
            </View>
          </View>
        </View>

        {/* Event info skeleton */}
        <View style={styles.eventInfoSkeleton}>
          <View style={[styles.eventTitleSkeleton, { backgroundColor: skeletonBgLight }]}>
            <ShimmerOverlay isDark={isDark} />
          </View>
          <View style={[styles.eventDateSkeleton, { backgroundColor: skeletonBgMedium }]}>
            <ShimmerOverlay isDark={isDark} />
          </View>
        </View>
      </View>

      {/* Bottom CTA skeleton */}
      <View style={[styles.ctaSkeleton, { paddingBottom: insets.bottom + 20 }]}>
        <View style={[styles.ctaButtonSkeleton, { backgroundColor: skeletonBgLight }]}>
          <ShimmerOverlay isDark={isDark} />
        </View>
      </View>
    </View>
  );
}

export function FeedLoadingSkeleton() {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <FeedItemSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
  container: {
    width: SCREEN_WIDTH,
    position: 'relative',
    overflow: 'hidden',
  },
  background: {
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
  // Shimmer effect
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  shimmerGradient: {
    flex: 1,
    width: SCREEN_WIDTH * 2,
  },
  // Organizer skeleton
  organizerSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
  },
  avatarSkeleton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  nameSkeleton: {
    width: 100,
    height: 16,
    borderRadius: 8,
    marginLeft: 10,
    overflow: 'hidden',
  },
  // Flyer skeleton
  flyerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flyerSkeleton: {
    width: SCREEN_WIDTH - 32,
    aspectRatio: 0.7,
    maxHeight: SCREEN_HEIGHT * 0.55,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  flyerInner: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  flyerTitleSkeleton: {
    width: '70%',
    height: 28,
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  flyerSubtitleSkeleton: {
    width: '50%',
    height: 18,
    borderRadius: 6,
    marginBottom: 8,
    overflow: 'hidden',
  },
  flyerDetailsSkeleton: {
    width: '40%',
    height: 14,
    borderRadius: 6,
    overflow: 'hidden',
  },
  // Event info skeleton
  eventInfoSkeleton: {
    paddingHorizontal: 8,
    paddingBottom: 12,
    marginTop: 16,
  },
  eventTitleSkeleton: {
    width: '80%',
    height: 28,
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  eventDateSkeleton: {
    width: '60%',
    height: 18,
    borderRadius: 6,
    overflow: 'hidden',
  },
  // CTA skeleton
  ctaSkeleton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  ctaButtonSkeleton: {
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
});
