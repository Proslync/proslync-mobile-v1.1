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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Animated shimmer effect component
 */
function ShimmerOverlay() {
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

  return (
    <Animated.View style={[styles.shimmerContainer, animatedStyle]}>
      <LinearGradient
        colors={[
          'transparent',
          'rgba(255, 255, 255, 0.08)',
          'rgba(255, 255, 255, 0.15)',
          'rgba(255, 255, 255, 0.08)',
          'transparent',
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.shimmerGradient}
      />
    </Animated.View>
  );
}

/**
 * Skeleton placeholder for a single feed item
 */
export function FeedItemSkeleton() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { height: SCREEN_HEIGHT }]}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#1a1a1a', '#0d0d0d', '#000']}
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
          <View style={styles.avatarSkeleton}>
            <ShimmerOverlay />
          </View>
          <View style={styles.nameSkeleton}>
            <ShimmerOverlay />
          </View>
        </View>

        {/* Flyer/Media skeleton */}
        <View style={styles.flyerContainer}>
          <View style={styles.flyerSkeleton}>
            <ShimmerOverlay />
            {/* Decorative elements to make it look like a flyer */}
            <View style={styles.flyerInner}>
              <View style={styles.flyerTitleSkeleton}>
                <ShimmerOverlay />
              </View>
              <View style={styles.flyerSubtitleSkeleton}>
                <ShimmerOverlay />
              </View>
              <View style={styles.flyerDetailsSkeleton}>
                <ShimmerOverlay />
              </View>
            </View>
          </View>
        </View>

        {/* Event info skeleton */}
        <View style={styles.eventInfoSkeleton}>
          <View style={styles.eventTitleSkeleton}>
            <ShimmerOverlay />
          </View>
          <View style={styles.eventDateSkeleton}>
            <ShimmerOverlay />
          </View>
        </View>
      </View>

      {/* Bottom CTA skeleton */}
      <View style={[styles.ctaSkeleton, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.ctaButtonSkeleton}>
          <ShimmerOverlay />
        </View>
      </View>
    </View>
  );
}

/**
 * Full-screen loading state with multiple skeleton cards
 */
export function FeedLoadingSkeleton() {
  return (
    <View style={styles.loadingContainer}>
      <FeedItemSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    width: SCREEN_WIDTH,
    backgroundColor: '#000',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  nameSkeleton: {
    width: 100,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  flyerSubtitleSkeleton: {
    width: '50%',
    height: 18,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
    overflow: 'hidden',
  },
  flyerDetailsSkeleton: {
    width: '40%',
    height: 14,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  eventDateSkeleton: {
    width: '60%',
    height: 18,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
});
