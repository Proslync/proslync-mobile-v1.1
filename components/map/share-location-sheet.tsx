// Share Location Sheet — Liquid glass design
// Single-sheet with internal screen navigation (no stacked modals)

import { useLiveLocation } from "@/lib/providers/live-location-provider";
import {
  SHARE_DURATION_OPTIONS,
  ShareDurationSeconds,
} from "@/lib/types/live-location.types";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { GlassView } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as React from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/glass/glass-card";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassText } from "@/components/glass/glass-text";
import { GlassOverlay } from "@/components/glass/glass-overlay";
import { useLocationVisibility } from "@/hooks/use-location-visibility";
import {
  VISIBILITY_MODE_LABELS,
  VISIBILITY_MODE_ICONS,
} from "@/lib/types/location-visibility.types";
import type { LocationVisibilityMode } from "@/lib/types/location-visibility.types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useAuth } from "@/lib/providers/auth-provider";
import { followsApi } from "@/lib/api/follows";
import type { UserFollowItem } from "@/lib/types/follows.types";
import {
  spacing,
  radius,
  textColor,
  glassFill,
  glassBorder,
} from "@/constants/glass/tokens";
import { liquidGlass } from "@/constants/glass/liquid-glass";

const DefaultAvatarImage = require("@/assets/images/default-avatar.png");

const TAB_BAR_HEIGHT = 49;
const TAB_BAR_RADIUS = 24;

type Screen = "main" | "visibility" | "picker";
type PickerTarget = "allow" | "block";

interface ShareLocationSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) return "0m";
  if (seconds > 86400) return "Until I turn it off";

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (hours > 0 && mins > 0) return `${hours}h ${mins}m remaining`;
  if (hours > 0) return `${hours}h remaining`;
  return `${mins}m remaining`;
}

const MODE_DESCRIPTIONS: Record<LocationVisibilityMode, string> = {
  everyone: "All Status users",
  friends: "People who follow you",
  only: "Hand-picked friends only",
  except: "Everyone except specific people",
};

const MODE_ACCENT_DARK: Record<LocationVisibilityMode, string> = {
  everyone: "#ffffff",
  friends: "rgba(255, 255, 255, 0.8)",
  only: "rgba(255, 255, 255, 0.7)",
  except: "rgba(255, 255, 255, 0.6)",
};

const MODE_ACCENT_LIGHT: Record<LocationVisibilityMode, string> = {
  everyone: "#1a1a1a",
  friends: "rgba(0, 0, 0, 0.8)",
  only: "rgba(0, 0, 0, 0.7)",
  except: "rgba(0, 0, 0, 0.6)",
};

const MODES: LocationVisibilityMode[] = [
  "everyone",
  "friends",
  "only",
  "except",
];

export function ShareLocationSheet({
  isVisible,
  onClose,
}: ShareLocationSheetProps) {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuth();
  const {
    sharingState,
    remainingTime,
    connectionState,
    startSharing,
    stopSharing,
    hasLocationPermission,
    requestLocationPermission,
  } = useLiveLocation();
  const { settings, setMode, toggleAllowList, toggleBlockList } =
    useLocationVisibility();

  const [isStarting, setIsStarting] = React.useState(false);
  const [screen, setScreen] = React.useState<Screen>("main");
  const [pickerTarget, setPickerTarget] = React.useState<PickerTarget>("allow");
  const [followers, setFollowers] = React.useState<UserFollowItem[]>([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Animated pulse for live dot
  const dotPulse = useSharedValue(1);

  React.useEffect(() => {
    if (sharingState.isSharing) {
      dotPulse.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 800 }),
          withTiming(1, { duration: 800 }),
        ),
        -1,
        true,
      );
    }
  }, [sharingState.isSharing]);

  const dotPulseStyle = useAnimatedStyle(() => ({
    opacity: dotPulse.value,
  }));

  React.useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
      setScreen("main");
      setSearchQuery("");
      if (!hasLocationPermission) {
        requestLocationPermission();
      }
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  // Force re-layout when switching internal screens
  React.useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
    }
  }, [screen]);

  const fetchFollowers = React.useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingFollowers(true);
    try {
      const data = await followsApi.getUserFollowers(user.id);
      setFollowers(data.userFollowers);
    } catch (e) {
      console.error("[ShareLocationSheet] Failed to fetch followers:", e);
    } finally {
      setIsLoadingFollowers(false);
    }
  }, [user?.id]);

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
      console.error("[ShareLocationSheet] Failed to start sharing:", error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopSharing = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await stopSharing();
    onClose();
  };

  const handleOpenVisibility = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScreen("visibility");
  };

  const handleModePress = (mode: LocationVisibilityMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode(mode);
    if (mode === "only") {
      setPickerTarget("allow");
      setScreen("picker");
      fetchFollowers();
    } else if (mode === "except") {
      setPickerTarget("block");
      setScreen("picker");
      fetchFollowers();
    }
  };

  const handleToggleUser = (userId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (pickerTarget === "allow") {
      toggleAllowList(userId);
    } else {
      toggleBlockList(userId);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (screen === "picker") {
      setScreen("visibility");
      setSearchQuery("");
    } else {
      setScreen("main");
    }
  };

  const handlePickerDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScreen("main");
    setSearchQuery("");
  };

  const isConnected = connectionState === "connected";
  const isConnecting = connectionState === "connecting";
  const visibilityLabel = VISIBILITY_MODE_LABELS[settings.mode];

  // Theme-aware colors
  const MODE_ACCENT = isDark ? MODE_ACCENT_DARK : MODE_ACCENT_LIGHT;
  const iconColor = isDark ? "#ffffff" : "#1a1a1a";
  const subtleIconColor = isDark
    ? "rgba(255, 255, 255, 0.5)"
    : "rgba(0, 0, 0, 0.5)";
  const mutedIconColor = isDark
    ? "rgba(255, 255, 255, 0.4)"
    : "rgba(0, 0, 0, 0.4)";
  const faintIconColor = isDark ? "rgba(255, 255, 255, 0.3)" : textColor.faint;
  const separatorColor = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(0, 0, 0, 0.08)";
  const iconBgColor = isDark
    ? "rgba(255, 255, 255, 0.06)"
    : "rgba(0, 0, 0, 0.06)";
  const optionIconBgColor = isDark
    ? "rgba(255, 255, 255, 0.06)"
    : "rgba(0, 0, 0, 0.04)";
  const optionIconBorderColor = isDark
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.08)";
  const glowGradientColors = isDark
    ? ([
        "rgba(255, 255, 255, 0.06)",
        "rgba(255, 255, 255, 0.02)",
        "transparent",
      ] as const)
    : (["rgba(0, 0, 0, 0.06)", "rgba(0, 0, 0, 0.02)", "transparent"] as const);
  const highlightGradientColors = isDark
    ? (["rgba(255, 255, 255, 0.02)", "transparent"] as const)
    : (["rgba(0, 0, 0, 0.02)", "transparent"] as const);
  const checkmarkColor = isDark ? "#ffffff" : "#1a1a1a";
  const checkCircleBgActive = isDark ? "#ffffff" : "#1a1a1a";
  const checkCircleBorderColor = isDark
    ? "rgba(255, 255, 255, 0.2)"
    : "rgba(0, 0, 0, 0.2)";
  const checkIconColor = isDark ? "#000" : "#fff";
  const modeRowActiveBg = isDark
    ? "rgba(255, 255, 255, 0.04)"
    : "rgba(0, 0, 0, 0.04)";
  const friendRowSelectedBg = isDark
    ? "rgba(255, 255, 255, 0.06)"
    : "rgba(0, 0, 0, 0.06)";
  const avatarRingColor = isDark ? "#ffffff" : "#1a1a1a";
  const searchInputColor = isDark ? "#fff" : "#1a1a1a";
  const primaryIconColor = isDark ? "#ffffff" : textColor.primary;

  const selectedList =
    pickerTarget === "allow" ? settings.allowList : settings.blockList;

  const filteredFollowers = React.useMemo(() => {
    if (!searchQuery.trim()) return followers;
    const q = searchQuery.toLowerCase();
    return followers.filter(
      (f) =>
        (f.firstName?.toLowerCase().includes(q) ?? false) ||
        (f.lastName?.toLowerCase().includes(q) ?? false) ||
        (f.userName?.toLowerCase().includes(q) ?? false),
    );
  }, [followers, searchQuery]);

  // ─── Render helpers ───

  const renderMainScreen = () => {
    if (sharingState.isSharing) {
      return (
        <View style={styles.activeContainer}>
          {/* Live badge */}
          <View style={styles.liveBadgeWrap}>
            <View style={styles.liveBadge}>
              <Animated.View
                style={[
                  styles.liveDot,
                  { backgroundColor: "#00D632" },
                  dotPulseStyle,
                ]}
              />
              <GlassText
                weight="bold"
                size={11}
                style={{ ...styles.liveText, color: iconColor }}
              >
                LIVE
              </GlassText>
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
                    <GlassText hierarchy="secondary" size={15}>
                      Sharing permanently
                    </GlassText>
                  </View>
                ) : (
                  <View style={styles.timerRow}>
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={subtleIconColor}
                    />
                    <GlassText hierarchy="secondary" size={15}>
                      {remainingTime !== null
                        ? formatRemainingTime(remainingTime)
                        : "--"}
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
              onPress={handleOpenVisibility}
              activeOpacity={0.6}
            >
              <View
                style={[
                  styles.visibilityIcon,
                  { backgroundColor: iconBgColor },
                ]}
              >
                <Ionicons
                  name="eye-outline"
                  size={15}
                  color={
                    isDark
                      ? "rgba(255, 255, 255, 0.6)"
                      : "rgba(0, 0, 0, 0.6)"
                  }
                />
              </View>
              <GlassText
                hierarchy="secondary"
                size={14}
                style={{ flex: 1 }}
              >
                {visibilityLabel}
              </GlassText>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={faintIconColor}
              />
            </TouchableOpacity>
          </GlassCard>

          {/* Stop button */}
          <TouchableOpacity
            onPress={handleStopSharing}
            activeOpacity={0.7}
            style={styles.stopButton}
          >
            <Ionicons name="stop-circle" size={16} color="#fff" />
            <GlassText weight="bold" size={14} style={{ color: "#1A1A1A" }}>
              Stop Sharing
            </GlassText>
          </TouchableOpacity>
        </View>
      );
    }

    return (
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
            borderRadius={radius["2xl"]}
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

        {/* Duration options */}
        <GlassCard
          fill="light"
          border="subtle"
          cornerRadius="2xl"
          shadowLevel="md"
          blurIntensity="medium"
          style={styles.optionsList}
        >
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
                icon={option.isPermanent ? "infinite" : "time-outline"}
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
                <View
                  style={[
                    styles.separator,
                    { backgroundColor: separatorColor },
                  ]}
                />
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
            onPress={handleOpenVisibility}
            activeOpacity={0.6}
          >
            <View
              style={[
                styles.whoCanSeeIcon,
                {
                  backgroundColor: optionIconBgColor,
                  borderColor: optionIconBorderColor,
                },
              ]}
            >
              <Ionicons
                name="eye-outline"
                size={16}
                color={
                  isDark
                    ? "rgba(255, 255, 255, 0.6)"
                    : "rgba(0, 0, 0, 0.6)"
                }
              />
            </View>
            <View style={styles.whoCanSeeContent}>
              <GlassText hierarchy="secondary" size={14}>
                Who can see
              </GlassText>
              <GlassText hierarchy="muted" size={12}>
                {visibilityLabel}
              </GlassText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={faintIconColor}
            />
          </TouchableOpacity>
        </GlassCard>

        {!hasLocationPermission && (
          <GlassText
            hierarchy="muted"
            size={12}
            style={styles.permissionNote}
          >
            Location permission required
          </GlassText>
        )}
      </View>
    );
  };

  const renderVisibilityScreen = () => (
    <View style={styles.visibilityContainer}>
      {/* Back header */}
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <GlassOverlay
            blurIntensity="light"
            fillLevel="subtle"
            borderLevel="subtle"
            borderRadius={radius.md}
            style={styles.backButtonInner}
          >
            <Ionicons name="chevron-back" size={20} color={primaryIconColor} />
          </GlassOverlay>
        </TouchableOpacity>
        <GlassText weight="bold" size={18} style={styles.screenTitle}>
          Who Can See
        </GlassText>
        <View style={styles.backButton} />
      </View>

      <GlassText hierarchy="muted" size={13} style={styles.visibilitySubtitle}>
        Control who sees your live location
      </GlassText>

      {/* Mode rows */}
      <GlassCard
        fill="light"
        border="subtle"
        cornerRadius="2xl"
        shadowLevel="md"
        blurIntensity="medium"
        style={styles.modesList}
      >
        <LinearGradient
          colors={highlightGradientColors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
          style={styles.innerHighlight}
        />
        {MODES.map((mode, index) => {
          const isActive = settings.mode === mode;
          const hasPicker = mode === "only" || mode === "except";
          const count =
            mode === "only"
              ? settings.allowList.length
              : mode === "except"
                ? settings.blockList.length
                : 0;

          return (
            <React.Fragment key={mode}>
              <TouchableOpacity
                onPress={() => handleModePress(mode)}
                activeOpacity={0.6}
              >
                <View
                  style={[
                    styles.modeRow,
                    isActive && [
                      styles.modeRowActive,
                      { backgroundColor: modeRowActiveBg },
                    ],
                  ]}
                >
                  <View
                    style={[
                      styles.modeIcon,
                      {
                        backgroundColor: `${MODE_ACCENT[mode]}18`,
                        borderColor: `${MODE_ACCENT[mode]}30`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={VISIBILITY_MODE_ICONS[mode] as any}
                      size={18}
                      color={MODE_ACCENT[mode]}
                    />
                  </View>
                  <View style={styles.modeLabelContainer}>
                    <GlassText
                      hierarchy={isActive ? "primary" : "secondary"}
                      weight={isActive ? "bold" : "regular"}
                      size={17}
                    >
                      {VISIBILITY_MODE_LABELS[mode]}
                    </GlassText>
                    <GlassText hierarchy="muted" size={12}>
                      {MODE_DESCRIPTIONS[mode]}
                      {hasPicker && count > 0
                        ? ` · ${count} ${count === 1 ? "person" : "people"}`
                        : ""}
                    </GlassText>
                  </View>
                  {hasPicker ? (
                    <View style={styles.modeTrailing}>
                      {isActive && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={checkmarkColor}
                        />
                      )}
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={faintIconColor}
                      />
                    </View>
                  ) : isActive ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={checkmarkColor}
                    />
                  ) : null}
                </View>
              </TouchableOpacity>
              {index < MODES.length - 1 && (
                <View
                  style={[
                    styles.separator,
                    { backgroundColor: separatorColor },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </GlassCard>
    </View>
  );

  const renderPickerScreen = () => (
    <View style={styles.pickerContainer}>
      {/* Header */}
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <GlassOverlay
            blurIntensity="light"
            fillLevel="subtle"
            borderLevel="subtle"
            borderRadius={radius.md}
            style={styles.backButtonInner}
          >
            <Ionicons name="chevron-back" size={20} color={primaryIconColor} />
          </GlassOverlay>
        </TouchableOpacity>
        <GlassText weight="bold" size={18} style={styles.screenTitle}>
          {pickerTarget === "allow" ? "Select Friends" : "Exclude People"}
        </GlassText>
        <View style={styles.backButton} />
      </View>

      {/* Search */}
      <GlassCard
        fill="light"
        border="subtle"
        cornerRadius="xl"
        shadowLevel="sm"
        blurIntensity="light"
        style={styles.searchCard}
      >
        <View style={styles.searchContent}>
          <Ionicons name="search" size={16} color={mutedIconColor} />
          <TextInput
            style={[styles.searchInput, { color: searchInputColor }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search..."
            placeholderTextColor={mutedIconColor}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={16}
                color={mutedIconColor}
              />
            </TouchableOpacity>
          )}
        </View>
      </GlassCard>

      {/* Selected count */}
      {selectedList.length > 0 && (
        <GlassText
          hierarchy="tertiary"
          size={13}
          style={styles.selectedCount}
        >
          {selectedList.length} selected
        </GlassText>
      )}

      {/* Friend list */}
      {isLoadingFollowers ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={mutedIconColor} />
          <GlassText hierarchy="muted" size={14}>
            Loading...
          </GlassText>
        </View>
      ) : filteredFollowers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <GlassOverlay
            blurIntensity="light"
            fillLevel="subtle"
            borderRadius={radius.xl}
            style={styles.emptyIcon}
          >
            <Ionicons
              name="people-outline"
              size={32}
              color={faintIconColor}
            />
          </GlassOverlay>
          <GlassText hierarchy="muted" size={14}>
            {searchQuery ? "No results" : "No followers yet"}
          </GlassText>
        </View>
      ) : (
        <BottomSheetScrollView
          style={styles.friendList}
          contentContainerStyle={styles.friendListContent}
          showsVerticalScrollIndicator={false}
        >
          <GlassCard
            fill="light"
            border="subtle"
            cornerRadius="2xl"
            shadowLevel="sm"
            blurIntensity="light"
            style={styles.friendListCard}
          >
            {filteredFollowers.map((follower, index) => {
              const isSelected = selectedList.includes(follower.id);
              const displayName =
                follower.firstName || follower.lastName
                  ? `${follower.firstName ?? ""} ${follower.lastName ?? ""}`.trim()
                  : (follower.userName ?? `User ${follower.id}`);

              return (
                <React.Fragment key={follower.id}>
                  <TouchableOpacity
                    onPress={() => handleToggleUser(follower.id)}
                    activeOpacity={0.6}
                  >
                    <View
                      style={[
                        styles.friendRow,
                        isSelected && [
                          styles.friendRowSelected,
                          { backgroundColor: friendRowSelectedBg },
                        ],
                      ]}
                    >
                      <View style={styles.friendAvatarWrap}>
                        <Image
                          source={
                            follower.avatarUrl
                              ? { uri: follower.avatarUrl }
                              : DefaultAvatarImage
                          }
                          style={styles.friendAvatar}
                        />
                        {isSelected && (
                          <View
                            style={[
                              styles.friendAvatarRing,
                              { borderColor: avatarRingColor },
                            ]}
                          />
                        )}
                      </View>
                      <GlassText
                        hierarchy="primary"
                        size={16}
                        style={styles.friendName}
                      >
                        {displayName}
                      </GlassText>
                      <View
                        style={[
                          styles.checkCircle,
                          { borderColor: checkCircleBorderColor },
                          isSelected && [
                            styles.checkCircleActive,
                            {
                              backgroundColor: checkCircleBgActive,
                              borderColor: checkCircleBgActive,
                            },
                          ],
                        ]}
                      >
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={14}
                            color={checkIconColor}
                          />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                  {index < filteredFollowers.length - 1 && (
                    <View
                      style={[
                        styles.friendSeparator,
                        { backgroundColor: separatorColor },
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </GlassCard>
        </BottomSheetScrollView>
      )}

      {/* Done button */}
      <View style={styles.doneButtonContainer}>
        <GlassButton
          label="Done"
          variant="glass"
          size="lg"
          fullWidth
          onPress={handlePickerDone}
        />
      </View>
    </View>
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      enableDynamicSizing
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{
        backgroundColor: "transparent",
        borderRadius: TAB_BAR_RADIUS,
      }}
      handleIndicatorStyle={{
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
      }}
      style={{ marginHorizontal: 12 }}
      bottomInset={TAB_BAR_HEIGHT + insets.bottom + 12}
      detached
    >
      <BottomSheetView
        style={styles.container}
      >
        <GlassView
          {...liquidGlass.surface}
          borderRadius={TAB_BAR_RADIUS}
          style={StyleSheet.absoluteFill}
        />

        {/* Connection banner */}
        {screen === "main" && !isConnected && (
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
                  <GlassText hierarchy="secondary" size={13}>
                    Connecting...
                  </GlassText>
                </View>
              ) : (
                <View style={styles.connectionContent}>
                  <Ionicons
                    name="cloud-offline-outline"
                    size={14}
                    color={mutedIconColor}
                  />
                  <GlassText hierarchy="secondary" size={13}>
                    No connection
                  </GlassText>
                </View>
              )}
            </GlassCard>
          </Animated.View>
        )}

        {screen === "main" && renderMainScreen()}
        {screen === "visibility" && renderVisibilityScreen()}
        {screen === "picker" && renderPickerScreen()}
      </BottomSheetView>
    </BottomSheet>
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
  const mutedColor = isDark ? "rgba(255, 255, 255, 0.5)" : textColor.muted;
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.6}>
      <View style={[styles.optionRow, disabled && styles.optionRowDisabled]}>
        <View
          style={[
            styles.optionIcon,
            {
              backgroundColor: optionIconBgColor,
              borderColor: optionIconBorderColor,
            },
          ]}
        >
          <Ionicons
            name={icon as any}
            size={18}
            color={disabled ? mutedColor : iconColor}
          />
        </View>
        <GlassText
          hierarchy={disabled ? "muted" : "primary"}
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
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },

  // Connection
  connectionBanner: {
    marginBottom: spacing.sm,
  },
  connectionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },

  // Active sharing
  activeContainer: {
    alignItems: "center",
    paddingTop: spacing.lg,
  },

  // Live badge
  liveBadgeWrap: {
    marginBottom: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
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
    width: "100%",
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  timerCard: {
    width: "100%",
  },
  innerHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "60%",
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
  },
  timerContent: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  // Stop button
  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(220, 38, 38, 0.85)",
    paddingVertical: 12,
    borderRadius: 14,
    width: "100%",
    marginTop: spacing.sm,
  },

  // Visibility row (active state)
  visibilityCard: {
    width: "100%",
    marginBottom: spacing.md,
  },
  visibilityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  visibilityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  // Pick duration
  pickContainer: {
    alignItems: "center",
    paddingTop: spacing.xs,
  },
  headerIconWrap: {
    position: "relative",
    marginBottom: spacing.md,
    alignItems: "center",
  },
  headerGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    top: -24,
  },
  headerIcon: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  pickTitle: {
    textAlign: "center",
    marginBottom: 2,
  },
  pickSubtitle: {
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  optionsList: {
    width: "100%",
    overflow: "hidden",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
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
    justifyContent: "center",
    alignItems: "center",
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
    width: "100%",
    marginTop: spacing.md,
  },
  whoCanSeeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  whoCanSeeIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  whoCanSeeContent: {
    flex: 1,
    gap: 1,
  },
  permissionNote: {
    textAlign: "center",
    marginTop: spacing.md,
  },

  // ─── Shared screen header ───
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonInner: {
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  screenTitle: {
    textAlign: "center",
    flex: 1,
  },

  // ─── Visibility modes screen ───
  visibilityContainer: {
    paddingTop: spacing.xs,
  },
  visibilitySubtitle: {
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  modesList: {
    width: "100%",
    overflow: "hidden",
  },
  modeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  modeRowActive: {},
  modeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modeLabelContainer: {
    flex: 1,
    gap: 2,
  },
  modeTrailing: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  // ─── Friend picker screen ───
  pickerContainer: {},
  searchCard: {
    marginBottom: spacing.md,
  },
  searchContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    height: 42,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  selectedCount: {
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 200,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 200,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
  },
  friendList: {
    maxHeight: 350,
  },
  friendListContent: {
    paddingBottom: spacing.md,
  },
  friendListCard: {
    overflow: "hidden",
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  friendRowSelected: {},
  friendAvatarWrap: {
    position: "relative",
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `rgba(255, 255, 255, ${glassFill.subtle})`,
  },
  friendAvatarRing: {
    position: "absolute",
    top: -2,
    left: -2,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
  },
  friendName: {
    flex: 1,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  checkCircleActive: {},
  friendSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.lg + 40 + spacing.md,
  },
  doneButtonContainer: {
    paddingTop: spacing.md,
  },
});
