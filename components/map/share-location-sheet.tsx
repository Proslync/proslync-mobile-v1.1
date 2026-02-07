// Share Location Sheet — Liquid glass design

import { useLiveLocation } from '@/lib/providers/live-location-provider';
import {
  SHARE_DURATION_OPTIONS,
  ShareDurationSeconds,
} from '@/lib/types/live-location.types';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '@/components/glass/glass-card';
import { GlassButton } from '@/components/glass/glass-button';
import { GlassText } from '@/components/glass/glass-text';
import { GlassOverlay } from '@/components/glass/glass-overlay';
import { LocationVisibilitySheet } from '@/components/map/location-visibility-sheet';
import { useLocationVisibility } from '@/hooks/use-location-visibility';
import { VISIBILITY_MODE_LABELS } from '@/lib/types/location-visibility.types';
import {
  spacing,
  radius,
  textColor,
  glassFill,
  glassBorder,
} from '@/constants/glass/tokens';

interface ShareLocationSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ShareLocationSheet({ isVisible, onClose }: ShareLocationSheetProps) {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const {
    sharingState,
    remainingTime,
    connectionState,
    startSharing,
    stopSharing,
    hasLocationPermission,
    requestLocationPermission,
  } = useLiveLocation();
  const { settings } = useLocationVisibility();

  const [isStarting, setIsStarting] = React.useState(false);
  const [showVisibility, setShowVisibility] = React.useState(false);

  // Animated pulse for live indicator
  const livePulse = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  React.useEffect(() => {
    if (sharingState.isSharing) {
      livePulse.value = withRepeat(
        withSequence(
          withTiming(1.4, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1500 }),
          withTiming(0.2, { duration: 1500 })
        ),
        -1,
        true
      );
    }
  }, [sharingState.isSharing]);

  const livePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: livePulse.value }],
    opacity: 2 - livePulse.value,
  }));

  const timerGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  React.useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
      if (!hasLocationPermission) {
        requestLocationPermission();
      }
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  const handleDurationSelect = async (duration: ShareDurationSeconds) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsStarting(true);

    try {
      if (!hasLocationPermission) {
        const granted = await requestLocationPermission();
        if (!granted) {
          setIsStarting(false);
          return;
        }
      }

      await startSharing(duration);
    } catch (error) {
      console.error('[ShareLocationSheet] Failed to start sharing:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopSharing = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await stopSharing();
    onClose();
  };

  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';

  const visibilityLabel = VISIBILITY_MODE_LABELS[settings.mode];

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={[sharingState.isSharing ? 440 : 500]}
        enablePanDownToClose
        onClose={onClose}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetIndicator}
        enableDynamicSizing={false}
      >
        <BottomSheetView style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>

          {/* Connection banner */}
          {!isConnected && (
            <Animated.View entering={FadeIn} exiting={FadeOut}>
              <GlassCard
                fill="light"
                border="subtle"
                cornerRadius="md"
                shadowLevel="sm"
                blurIntensity="medium"
                style={styles.connectionBanner}
              >
                {isConnecting ? (
                  <View style={styles.connectionContent}>
                    <ActivityIndicator size="small" color="rgba(0, 0, 0, 0.5)" />
                    <GlassText hierarchy="secondary" size={13}>Connecting...</GlassText>
                  </View>
                ) : (
                  <View style={styles.connectionContent}>
                    <Ionicons name="cloud-offline-outline" size={14} color="rgba(0, 0, 0, 0.4)" />
                    <GlassText hierarchy="secondary" size={13}>
                      No connection
                    </GlassText>
                  </View>
                )}
              </GlassCard>
            </Animated.View>
          )}

          {/* Active sharing state */}
          {sharingState.isSharing ? (
            <View style={styles.activeContainer}>
              {/* Live badge with pulse ring */}
              <View style={styles.liveBadgeWrap}>
                <Animated.View style={[styles.livePulseRing, livePulseStyle]} />
                <GlassOverlay
                  blurIntensity="medium"
                  fillLevel="light"
                  borderLevel="subtle"
                  borderRadius={radius.md}
                  style={styles.liveBadge}
                >
                  <View style={styles.liveDot} />
                  <GlassText weight="bold" size={11} style={styles.liveText}>LIVE</GlassText>
                </GlassOverlay>
              </View>

              {/* Title */}
              <GlassText weight="bold" size={18} style={styles.activeTitle}>
                Sharing your location
              </GlassText>
              <GlassText hierarchy="muted" size={13}>
                Visible to: {visibilityLabel}
              </GlassText>

              {/* Timer card with glow */}
              <View style={styles.timerWrap}>
                {/* Ambient glow behind timer */}
                <Animated.View style={[styles.timerGlow, timerGlowStyle]}>
                  <LinearGradient
                    colors={['rgba(0, 0, 0, 0.06)', 'rgba(0, 0, 0, 0.02)', 'transparent']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
                <GlassCard
                  fill="medium"
                  border="medium"
                  cornerRadius="2xl"
                  shadowLevel="lg"
                  blurIntensity="strong"
                  style={styles.timerCard}
                >
                  {/* Inner gradient highlight */}
                  <LinearGradient
                    colors={['rgba(0, 0, 0, 0.02)', 'transparent']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 0.6 }}
                    style={styles.innerHighlight}
                  />
                  <View style={styles.timerContent}>
                    {sharingState.duration === 0 ? (
                      <>
                        <Ionicons name="infinite" size={52} color="#1a1a1a" style={{ marginBottom: 4 }} />
                        <GlassText hierarchy="secondary" size={14}>Always on</GlassText>
                      </>
                    ) : (
                      <>
                        <GlassText weight="light" size={56} style={styles.timerValue}>
                          {remainingTime !== null ? formatRemainingTime(remainingTime) : '--:--'}
                        </GlassText>
                        <GlassText hierarchy="muted" size={14}>remaining</GlassText>
                      </>
                    )}
                  </View>
                </GlassCard>
              </View>

              {/* Visibility row */}
              <GlassCard
                fill="subtle"
                border="subtle"
                cornerRadius="lg"
                shadowLevel="sm"
                blurIntensity="light"
                style={styles.visibilityCard}
              >
                <TouchableOpacity
                  style={styles.visibilityRow}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowVisibility(true);
                  }}
                  activeOpacity={0.6}
                >
                  <View style={styles.visibilityIcon}>
                    <Ionicons name="eye-outline" size={15} color="rgba(0, 0, 0, 0.6)" />
                  </View>
                  <GlassText hierarchy="secondary" size={14} style={{ flex: 1 }}>
                    {visibilityLabel}
                  </GlassText>
                  <Ionicons name="chevron-forward" size={14} color={textColor.faint} />
                </TouchableOpacity>
              </GlassCard>

              {/* Stop button */}
              <GlassButton
                label="Stop Sharing"
                variant="glass"
                size="lg"
                fullWidth
                onPress={handleStopSharing}
                icon={<Ionicons name="stop-circle" size={18} color="#1a1a1a" />}
              />
            </View>
          ) : (
            /* Pick duration */
            <View style={styles.pickContainer}>
              {/* Header icon with glow */}
              <View style={styles.headerIconWrap}>
                <View style={styles.headerGlow}>
                  <LinearGradient
                    colors={['rgba(0, 0, 0, 0.06)', 'rgba(0, 0, 0, 0.02)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0.5, y: 0.3 }}
                    end={{ x: 0.5, y: 1 }}
                  />
                </View>
                <GlassOverlay
                  blurIntensity="medium"
                  fillLevel="light"
                  borderLevel="medium"
                  borderRadius={radius['2xl']}
                  style={styles.headerIcon}
                >
                  <Ionicons name="location" size={26} color="#1a1a1a" />
                </GlassOverlay>
              </View>

              <GlassText weight="bold" size={20} style={styles.pickTitle}>
                Share Live Location
              </GlassText>
              <GlassText hierarchy="muted" size={13} style={styles.pickSubtitle}>
                Choose how long to share with friends
              </GlassText>

              {/* Duration options — blurred glass group */}
              <GlassCard
                fill="light"
                border="subtle"
                cornerRadius="2xl"
                shadowLevel="md"
                blurIntensity="medium"
                style={styles.optionsList}
              >
                {/* Top highlight */}
                <LinearGradient
                  colors={['rgba(0, 0, 0, 0.02)', 'transparent']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 0.5 }}
                  style={styles.innerHighlight}
                />
                {SHARE_DURATION_OPTIONS.map((option, index) => (
                  <React.Fragment key={option.value}>
                    <DurationRow
                      label={option.label}
                      icon={option.isPermanent ? 'infinite' : 'time-outline'}
                      onPress={() => handleDurationSelect(option.value)}
                      disabled={!isConnected || isStarting}
                      isStarting={isStarting}
                    />
                    {index < SHARE_DURATION_OPTIONS.length - 1 && (
                      <View style={styles.separator} />
                    )}
                  </React.Fragment>
                ))}
              </GlassCard>

              {/* Who can see row */}
              <GlassCard
                fill="subtle"
                border="subtle"
                cornerRadius="xl"
                shadowLevel="sm"
                blurIntensity="light"
                style={styles.whoCanSeeCard}
              >
                <TouchableOpacity
                  style={styles.whoCanSeeRow}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowVisibility(true);
                  }}
                  activeOpacity={0.6}
                >
                  <View style={styles.whoCanSeeIcon}>
                    <Ionicons name="eye-outline" size={16} color="rgba(0, 0, 0, 0.6)" />
                  </View>
                  <View style={styles.whoCanSeeContent}>
                    <GlassText hierarchy="secondary" size={14}>Who can see</GlassText>
                    <GlassText hierarchy="muted" size={12}>{visibilityLabel}</GlassText>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={textColor.faint} />
                </TouchableOpacity>
              </GlassCard>

              {!hasLocationPermission && (
                <GlassText hierarchy="muted" size={12} style={styles.permissionNote}>
                  Location permission required
                </GlassText>
              )}
            </View>
          )}
        </BottomSheetView>
      </BottomSheet>

      {/* Visibility settings sheet */}
      <LocationVisibilitySheet
        isVisible={showVisibility}
        onClose={() => setShowVisibility(false)}
      />
    </>
  );
}

function DurationRow({
  label,
  icon,
  onPress,
  disabled,
  isStarting,
}: {
  label: string;
  icon: string;
  onPress: () => void;
  disabled: boolean;
  isStarting: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.6}
    >
      <View style={[styles.optionRow, disabled && styles.optionRowDisabled]}>
        <View style={styles.optionIcon}>
          <Ionicons
            name={icon as any}
            size={18}
            color={disabled ? textColor.muted : '#1a1a1a'}
          />
        </View>
        <GlassText
          hierarchy={disabled ? 'muted' : 'primary'}
          size={17}
          style={styles.optionLabel}
        >
          {label}
        </GlassText>
        {isStarting ? (
          <ActivityIndicator size="small" color={textColor.muted} />
        ) : (
          <Ionicons name="chevron-forward" size={16} color={textColor.faint} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  sheetIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  // Connection
  connectionBanner: {
    marginBottom: spacing.sm,
  },
  connectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },

  // Active sharing
  activeContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xs,
  },

  // Live badge
  liveBadgeWrap: {
    position: 'relative',
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  livePulseRing: {
    position: 'absolute',
    width: 72,
    height: 32,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: '#1a1a1a',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#1a1a1a',
  },
  liveText: {
    color: '#1a1a1a',
    letterSpacing: 1.5,
  },
  activeTitle: {
    marginBottom: 2,
  },

  // Timer
  timerWrap: {
    width: '100%',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    position: 'relative',
  },
  timerGlow: {
    position: 'absolute',
    top: -20,
    left: '10%',
    right: '10%',
    height: 80,
    borderRadius: 40,
  },
  timerCard: {
    width: '100%',
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
  },
  timerContent: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  timerValue: {
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },

  // Visibility row (active state)
  visibilityCard: {
    width: '100%',
    marginBottom: spacing.md,
  },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  visibilityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Pick duration
  pickContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  headerIconWrap: {
    position: 'relative',
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  headerGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    top: -24,
  },
  headerIcon: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickTitle: {
    textAlign: 'center',
    marginBottom: 2,
  },
  pickSubtitle: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  optionsList: {
    width: '100%',
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  optionRowDisabled: {
    opacity: 0.35,
  },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginLeft: spacing.lg + 34 + spacing.md,
  },

  // Who can see row
  whoCanSeeCard: {
    width: '100%',
    marginTop: spacing.md,
  },
  whoCanSeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  whoCanSeeIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whoCanSeeContent: {
    flex: 1,
    gap: 1,
  },

  permissionNote: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
