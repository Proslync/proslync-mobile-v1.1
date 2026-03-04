import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Linking,
  Platform,
  TouchableOpacity,
} from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useStableRouter } from "@/hooks/use-stable-router";
import { useLiveLocation } from "@/lib/providers/live-location-provider";
import { radius, spacing } from "../../constants/glass/tokens";

interface FriendProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  onShareBack?: () => void;
  friend: {
    id: string;
    name: string;
    imageUrl: string;
    latitude: number;
    longitude: number;
    updatedAt: number;
  } | null;
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins === 1) return "1 minute ago";
  if (diffMins < 60) return `${diffMins} minutes ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;

  return "Over a day ago";
}

export function FriendProfileSheet({
  visible,
  onClose,
  onShareBack,
  friend,
}: FriendProfileSheetProps) {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const router = useStableRouter();
  const { sharingState } = useLiveLocation();

  // Snap height: profile row (~70) + actions (~3×50) + cancel (~50) + padding
  const snapHeight = sharingState.isSharing ? 340 : 390;

  const handleGetDirections = () => {
    if (!friend) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { latitude, longitude, name } = friend;

    if (Platform.OS === "ios") {
      Linking.openURL(`maps:?daddr=${latitude},${longitude}&dirflg=d&t=m`);
    } else {
      Linking.openURL(
        `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(name)})`,
      );
    }
  };

  const handleShareBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    onShareBack?.();
  };

  const handleViewProfile = () => {
    if (!friend) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    router.push({
      pathname: "/user-profile/[userId]",
      params: { userId: friend.id },
    });
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  if (!friend || !visible) return null;

  const lastActiveText = getTimeAgo(friend.updatedAt);
  const hasCoordinates =
    friend.latitude !== 0 && friend.longitude !== 0;

  // Theme-aware colors
  const sheetBackgroundColor = isDark
    ? "#000000"
    : "rgba(255, 255, 255, 0.97)";
  const sheetBorderColor = isDark
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.08)";
  const indicatorColor = isDark
    ? "rgba(255, 255, 255, 0.3)"
    : "rgba(0, 0, 0, 0.2)";
  const iconColor = isDark ? "#ffffff" : "#1a1a1a";
  const liveBadgeBgColor = isDark
    ? "rgba(30, 30, 32, 0.95)"
    : "rgba(255, 255, 255, 0.95)";
  const statusTextColor = isDark
    ? "rgba(255, 255, 255, 0.5)"
    : "rgba(0, 0, 0, 0.5)";
  const separatorColor = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(0, 0, 0, 0.08)";
  const actionTextColor = isDark ? "#ffffff" : "#1a1a1a";
  const actionIconBgColor = isDark
    ? "rgba(255, 255, 255, 0.06)"
    : "rgba(0, 0, 0, 0.04)";
  const actionIconBorderColor = isDark
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.08)";

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={[snapHeight]}
      enablePanDownToClose
      enableDynamicSizing={false}
      onClose={onClose}
      backgroundStyle={[
        styles.sheetBackground,
        {
          backgroundColor: sheetBackgroundColor,
          borderColor: sheetBorderColor,
        },
      ]}
      handleIndicatorStyle={[
        styles.sheetIndicator,
        { backgroundColor: indicatorColor },
      ]}
    >
      <BottomSheetView
        style={[styles.container, { paddingBottom: insets.bottom || 16 }]}
      >
        {/* Profile header */}
        <View style={styles.profileRow}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: friend.imageUrl }} style={styles.avatar} />
            <View
              style={[styles.liveBadge, { backgroundColor: liveBadgeBgColor }]}
            >
              <View style={styles.liveDot} />
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text
              style={[styles.name, { color: colors.text }]}
              numberOfLines={1}
            >
              {friend.name}
            </Text>
            <View style={styles.statusRow}>
              <Ionicons name="time-outline" size={13} color={statusTextColor} />
              <Text style={[styles.statusText, { color: statusTextColor }]}>
                Last active {lastActiveText}
              </Text>
            </View>
          </View>
        </View>

        {/* Separator */}
        <View style={[styles.separator, { backgroundColor: separatorColor }]} />

        {/* Action: Get Directions */}
        <TouchableOpacity
          style={[styles.actionRow, !hasCoordinates && styles.actionRowDisabled]}
          onPress={handleGetDirections}
          activeOpacity={0.6}
          disabled={!hasCoordinates}
        >
          <View
            style={[
              styles.actionIcon,
              {
                backgroundColor: actionIconBgColor,
                borderColor: actionIconBorderColor,
              },
            ]}
          >
            <Ionicons
              name="navigate-outline"
              size={18}
              color={hasCoordinates ? iconColor : statusTextColor}
            />
          </View>
          <Text
            style={[
              styles.actionText,
              { color: hasCoordinates ? actionTextColor : statusTextColor },
            ]}
          >
            Get Directions
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}
          />
        </TouchableOpacity>

        {/* Action: Share Your Location Back (only if not sharing) */}
        {!sharingState.isSharing && (
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleShareBack}
            activeOpacity={0.6}
          >
            <View
              style={[
                styles.actionIcon,
                {
                  backgroundColor: actionIconBgColor,
                  borderColor: actionIconBorderColor,
                },
              ]}
            >
              <Ionicons name="location-outline" size={18} color={iconColor} />
            </View>
            <Text style={[styles.actionText, { color: actionTextColor }]}>
              Share Your Location Back
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}
            />
          </TouchableOpacity>
        )}

        {/* Action: View Profile */}
        <TouchableOpacity
          style={styles.actionRow}
          onPress={handleViewProfile}
          activeOpacity={0.6}
        >
          <View
            style={[
              styles.actionIcon,
              {
                backgroundColor: actionIconBgColor,
                borderColor: actionIconBorderColor,
              },
            ]}
          >
            <Ionicons name="person-outline" size={18} color={iconColor} />
          </View>
          <Text style={[styles.actionText, { color: actionTextColor }]}>
            View Profile
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}
          />
        </TouchableOpacity>

        {/* Separator */}
        <View style={[styles.separator, { backgroundColor: separatorColor }]} />

        {/* Cancel */}
        <TouchableOpacity
          style={styles.cancelRow}
          onPress={handleCancel}
          activeOpacity={0.6}
        >
          <Text style={[styles.cancelText, { color: statusTextColor }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    borderWidth: 1,
  },
  sheetIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  container: {
    paddingHorizontal: spacing.lg,
  },

  // Profile header
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#34c759",
  },
  liveBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#34c759",
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontFamily: "Lato_700Bold",
    marginBottom: 3,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusText: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
  },

  // Separator
  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },

  // Action rows
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  actionRowDisabled: {
    opacity: 0.35,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Lato_400Regular",
  },

  // Cancel
  cancelRow: {
    alignItems: "center",
    paddingVertical: 14,
  },
  cancelText: {
    fontSize: 16,
    fontFamily: "Lato_400Regular",
  },
});
