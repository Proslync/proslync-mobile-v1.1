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
import { useAppTheme } from '@/hooks/use-app-theme';
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
  if (seconds <= 0) return '0m';

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m remaining`;
  }
  if (hours > 0) {
    return `${hours}h remaining`;
  }
  return `${mins}m remaining`;
}

export function ShareLocationSheet({ isVisible, onClose }: ShareLocationSheetProps) {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
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

  // Animated pulse for live dot
  const dotPulse = useSharedValue(1);

  React.useEffect(() => {
    if (sharingState.isSharing) {
      dotPulse.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    }
  }, [sharingState.isSharing]);

  const dotPulseStyle = useAnimatedStyle(() => ({
    opacity: dotPulse.value,
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

  // Theme-aware colors
  const sheetBackgroundColor = isDark ? 'rgba(20, 20, 22, 0.97)' : 'rgba(255, 255, 255, 0.97)';
  const sheetBorderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
  const indicatorColor = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)';
  const iconColor = isDark ? '#ffffff' : '#1a1a1a';
  const subtleIconColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
  const mutedIconColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
  const faintIconColor = isDark ? 'rgba(255, 255, 255, 0.3)' : textColor.faint;
  const separatorColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const iconBgColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const optionIconBgColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
  const optionIconBorderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
  const glowGradientColors = isDark
    ? ['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.02)', 'transparent'] as const
    : ['rgba(0, 0, 0, 0.06)', 'rgba(0, 0, 0, 0.02)', 'transparent'] as const;
  const highlightGradientColors = isDark
    ? ['rgba(255, 255, 255, 0.02)', 'transparent'] as const
    : ['rgba(0, 0, 0, 0.02)', 'transparent'] as const;

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={[sharingState.isSharing ? 340 : 500]}
        enablePanDownToClose
        onClose={onClose}
        backgroundStyle={[
          styles.sheetBackground,
          { backgroundColor: sheetBackgroundColor, borderColor: sheetBorderColor },
        ]}
        handleIndicatorStyle={[styles.sheetIndicator, { backgroundColor: indicatorColor }]}
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
                    <ActivityIndicator size="small" color={subtleIconColor} />
                    <GlassText hierarchy="secondary" size={13}>Connecting...</GlassText>
                  </View>
                ) : (
                  <View style={styles.connectionContent}>
                    <Ionicons name="cloud-offline-outline" size={14} color={mutedIconColor} />
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
              {/* Live badge */}
              <View style={styles.liveBadgeWrap}>
                <View style={styles.liveBadge}>
                  <Animated.View style={[styles.liveDot, { backgroundColor: '#00D632' }, dotPulseStyle]} />
                  <GlassText weight="bold" size={11} style={{ ...styles.liveText, color: iconColor }}>LIVE</GlassText>
                </View>
              </View>

              {/* Title */}
              <GlassText weight="bold" size={18} style={styles.activeTitle}>
                Sharing your location
              </GlassText>
              <GlassText hierarchy="muted" size={13}>
                Visible to: {visibilityLabel}
              </GlassText>

              {/* Timer display */}
              <View style={styles.timerWrap}>
                <GlassCard
                  fill="subtle"
                  border="subtle"
                  cornerRadius="lg"
                  shadowLevel="sm"
                  blurIntensity="light"
                  style={styles.timerCard}
                >
                  <View style={styles.timerContent}>
                    {sharingState.duration === 0 ? (
                      <View style={styles.timerRow}>
                        <Ionicons name="infinite" size={20} color={iconColor} />
                        <GlassText hierarchy="secondary" size={15}>Sharing permanently</GlassText>
                      </View>
                    ) : (
                      <View style={styles.timerRow}>
                        <Ionicons name="time-outline" size={18} color={subtleIconColor} />
                        <GlassText hierarchy="secondary" size={15}>
                          {remainingTime !== null ? formatRemainingTime(remainingTime) : '--'}
                        </GlassText>
                      </View>
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
                  <View style={[styles.visibilityIcon, { backgroundColor: iconBgColor }]}>
                    <Ionicons name="eye-outline" size={15} color={isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'} />
                  </View>
                  <GlassText hierarchy="secondary" size={14} style={{ flex: 1 }}>
                    {visibilityLabel}
                  </GlassText>
                  <Ionicons name="chevron-forward" size={14} color={faintIconColor} />
                </TouchableOpacity>
              </GlassCard>

              {/* Stop button */}
              <TouchableOpacity
                onPress={handleStopSharing}
                activeOpacity={0.7}
                style={styles.stopButton}
              >
                <Ionicons name="stop-circle" size={16} color="#fff" />
                <GlassText weight="bold" size={14} style={{ color: '#fff' }}>
                  Stop Sharing
                </GlassText>
              </TouchableOpacity>
            </View>
          ) : (
            /* Pick duration */
            <View style={styles.pickContainer}>
              {/* Header icon with glow */}
              <View style={styles.headerIconWrap}>
                <View style={styles.headerGlow}>
                  <LinearGradient
                    colors={glowGradientColors}
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
                  <Ionicons name="location" size={26} color={iconColor} />
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
                  colors={highlightGradientColors}
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
                      isDark={isDark}
                      iconColor={iconColor}
                      optionIconBgColor={optionIconBgColor}
                      optionIconBorderColor={optionIconBorderColor}
                      faintIconColor={faintIconColor}
                    />
                    {index < SHARE_DURATION_OPTIONS.length - 1 && (
                      <View style={[styles.separator, { backgroundColor: separatorColor }]} />
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
                  <View style={[styles.whoCanSeeIcon, { backgroundColor: optionIconBgColor, borderColor: optionIconBorderColor }]}>
                    <Ionicons name="eye-outline" size={16} color={isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'} />
                  </View>
                  <View style={styles.whoCanSeeContent}>
                    <GlassText hierarchy="secondary" size={14}>Who can see</GlassText>
                    <GlassText hierarchy="muted" size={12}>{visibilityLabel}</GlassText>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={faintIconColor} />
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
  isDark,
  iconColor,
  optionIconBgColor,
  optionIconBorderColor,
  faintIconColor,
}: {
  label: string;
  icon: string;
  onPress: () => void;
  disabled: boolean;
  isStarting: boolean;
  isDark: boolean;
  iconColor: string;
  optionIconBgColor: string;
  optionIconBorderColor: string;
  faintIconColor: string;
}) {
  const mutedColor = isDark ? 'rgba(255, 255, 255, 0.5)' : textColor.muted;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.6}
    >
      <View style={[styles.optionRow, disabled && styles.optionRowDisabled]}>
        <View style={[styles.optionIcon, { backgroundColor: optionIconBgColor, borderColor: optionIconBorderColor }]}>
          <Ionicons
            name={icon as any}
            size={18}
            color={disabled ? mutedColor : iconColor}
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
          <ActivityIndicator size="small" color={mutedColor} />
        ) : (
          <Ionicons name="chevron-forward" size={16} color={faintIconColor} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    borderWidth: 1,
  },
  sheetIndicator: {
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
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  liveText: {
    letterSpacing: 1.5,
  },
  activeTitle: {
    marginBottom: 2,
  },

  // Timer
  timerWrap: {
    width: '100%',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
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
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  // Stop button
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(220, 38, 38, 0.85)',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'center',
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
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
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
    borderWidth: 1,
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
