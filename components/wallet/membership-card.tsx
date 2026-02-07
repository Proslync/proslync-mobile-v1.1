// Membership Card - Premium animated status card with holographic effect
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { WalletUser } from '../../lib/types/wallet.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = CARD_WIDTH * 0.6;

interface MembershipCardProps {
  user: WalletUser;
  onPress?: () => void;
  enlarged?: boolean;
}

function formatMemberSince(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `Member since ${month} ${year}`;
}

// Animated shimmer line that sweeps across the card
function ShimmerEffect() {
  const translateX = useSharedValue(-CARD_WIDTH);

  useEffect(() => {
    translateX.value = withRepeat(
      withDelay(
        2000,
        withTiming(CARD_WIDTH * 2, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.shimmerContainer, animatedStyle]}>
      <LinearGradient
        colors={[
          'transparent',
          'rgba(255, 255, 255, 0.03)',
          'rgba(255, 255, 255, 0.08)',
          'rgba(255, 255, 255, 0.03)',
          'transparent',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.shimmerGradient}
      />
    </Animated.View>
  );
}

// Animated decorative orbs
function FloatingOrbs() {
  const orb1Y = useSharedValue(0);
  const orb2Y = useSharedValue(0);
  const orb1Opacity = useSharedValue(0.15);
  const orb2Opacity = useSharedValue(0.1);

  useEffect(() => {
    orb1Y.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb2Y.value = withRepeat(
      withSequence(
        withTiming(6, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb1Opacity.value = withRepeat(
      withSequence(
        withTiming(0.25, { duration: 3000 }),
        withTiming(0.15, { duration: 3000 })
      ),
      -1,
      true
    );
    orb2Opacity.value = withRepeat(
      withSequence(
        withTiming(0.18, { duration: 2500 }),
        withTiming(0.08, { duration: 2500 })
      ),
      -1,
      true
    );
  }, []);

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb1Y.value }],
    opacity: orb1Opacity.value,
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb2Y.value }],
    opacity: orb2Opacity.value,
  }));

  return (
    <>
      <Animated.View style={[styles.orb1, orb1Style]} />
      <Animated.View style={[styles.orb2, orb2Style]} />
    </>
  );
}

export function MembershipCard({ user, onPress, enlarged = false }: MembershipCardProps) {
  const cardWidth = enlarged ? SCREEN_WIDTH - 64 : CARD_WIDTH;
  const cardHeight = cardWidth * 0.6;

  const borderOpacity = useSharedValue(0.2);

  // Subtle pulse on the border
  useEffect(() => {
    borderOpacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 2000 }),
        withTiming(0.2, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const borderAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(255, 255, 255, ${borderOpacity.value})`,
  }));

  return (
    <View
      style={[styles.cardWrapper, { width: cardWidth }]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={1}
        disabled={!onPress}
      >
        <Animated.View
          style={[
            styles.card,
            { width: cardWidth, height: cardHeight },
            enlarged && styles.cardEnlarged,
            borderAnimatedStyle,
          ]}
        >
          {/* Background gradient */}
          <LinearGradient
            colors={['#0a0a0a', '#111111', '#0a0a0a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Floating orbs for depth */}
          <FloatingOrbs />

          {/* Shimmer effect */}
          <ShimmerEffect />

          {/* Corner accent */}
          <View style={styles.cornerAccent}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cornerGradient}
            />
          </View>

          {/* Logo area - top left */}
          <View
            style={styles.logoContainer}
          >
            <View style={styles.logoCircle}>
              <LinearGradient
                colors={['#ffffff', '#e0e0e0']}
                style={styles.logoGradient}
              >
                <Text style={styles.logoText}>S</Text>
              </LinearGradient>
            </View>
            <Text style={styles.brandText}>STATUS</Text>
          </View>

          {/* Tier badge - top right */}
          <View
            style={styles.tierBadge}
          >
            <View style={styles.tierDot} />
            <Text style={styles.tierText}>{user.statusTier}</Text>
          </View>

          {/* Card content - bottom */}
          <View
            style={styles.cardContent}
          >
            <Text style={styles.userName}>{user.name}</Text>
            <View style={styles.memberInfo}>
              <Ionicons name="calendar-outline" size={12} color="rgba(255, 255, 255, 0.4)" />
              <Text style={styles.sinceDate}>{formatMemberSince(user.memberSince)}</Text>
            </View>
          </View>

          {/* Decorative pattern */}
          <View style={styles.patternContainer}>
            {[...Array(5)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.patternLine,
                  {
                    right: 20 + i * 15,
                    opacity: 0.03 + i * 0.01,
                    height: 60 + i * 20,
                  },
                ]}
              />
            ))}
          </View>

          {/* Tap hint */}
          {onPress && (
            <View
              style={styles.tapHint}
            >
              <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.3)" />
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    // Premium shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  cardEnlarged: {
    marginHorizontal: 0,
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: CARD_WIDTH,
  },
  shimmerGradient: {
    width: 100,
    height: '100%',
  },
  orb1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
  },
  orb2: {
    position: 'absolute',
    bottom: -40,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
  },
  cornerAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 150,
    height: 150,
  },
  cornerGradient: {
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    position: 'absolute',
    top: 24,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    // Subtle glow
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontFamily: 'Lato_900Black',
    color: '#000',
  },
  brandText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 3,
  },
  tierBadge: {
    position: 'absolute',
    top: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  tierText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardContent: {
    position: 'absolute',
    bottom: 24,
    left: 24,
  },
  userName: {
    fontSize: 22,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sinceDate: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  patternContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 120,
  },
  patternLine: {
    position: 'absolute',
    bottom: 0,
    width: 1,
    backgroundColor: '#fff',
    transform: [{ rotate: '-25deg' }],
  },
  tapHint: {
    position: 'absolute',
    right: 24,
    top: '50%',
    marginTop: -8,
  },
});
