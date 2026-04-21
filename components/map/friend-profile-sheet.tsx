// Friend Profile Sheet — gorhom BottomSheet (detached, like ShareLocationSheet)
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
import { GlassView } from "expo-glass-effect";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStableRouter } from "@/hooks/use-stable-router";
import { useLiveLocation } from "@/lib/providers/live-location-provider";

const TAB_BAR_HEIGHT = 49;
const TAB_BAR_RADIUS = 24;

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
  const router = useStableRouter();
  const { sharingState } = useLiveLocation();

  React.useEffect(() => {
    if (visible && friend) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible, friend?.id]);

  const handleGetDirections = React.useCallback(() => {
    if (!friend) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bottomSheetRef.current?.close();
    const { latitude, longitude } = friend;
    if (Platform.OS === "ios") {
      Linking.openURL(`maps:?daddr=${latitude},${longitude}&dirflg=d&t=m`);
    } else {
      Linking.openURL(
        `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(friend.name)})`,
      );
    }
  }, [friend]);

  const handleShareBack = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    bottomSheetRef.current?.close();
    onShareBack?.();
  }, [onShareBack]);

  const handleViewProfile = React.useCallback(() => {
    if (!friend) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bottomSheetRef.current?.close();
    router.push({
      pathname: "/user/[username]",
      params: { username: friend.name || "_", userId: String(friend.id) },
    });
  }, [friend, router]);

  const lastActiveText = friend ? getTimeAgo(friend.updatedAt) : "";
  const hasCoordinates = friend
    ? friend.latitude !== 0 && friend.longitude !== 0
    : false;

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
        backgroundColor: "rgba(255,255,255,0.3)",
      }}
      style={{ marginHorizontal: 12 }}
      bottomInset={TAB_BAR_HEIGHT + insets.bottom + 12}
      detached
    >
      <BottomSheetView style={styles.sheetContent}>
        <GlassView
          {...liquidGlass.surface}
          borderRadius={TAB_BAR_RADIUS}
          style={StyleSheet.absoluteFill}
        />

        {friend && (
          <>
            {/* Profile row */}
            <View style={styles.profileRow}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: friend.imageUrl }}
                  style={styles.avatar}
                />
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                </View>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {friend.name}
                </Text>
                <View style={styles.statusRow}>
                  <Ionicons
                    name="time-outline"
                    size={13}
                    color="rgba(0,0,0,0.45)"
                  />
                  <Text style={styles.statusText}>
                    Last active {lastActiveText}
                  </Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsList}>
              <TouchableOpacity
                style={[
                  styles.actionItem,
                  !hasCoordinates && styles.actionItemDisabled,
                ]}
                onPress={handleGetDirections}
                activeOpacity={0.7}
                disabled={!hasCoordinates}
              >
                <GlassView
                  {...liquidGlass.fill}
                  borderRadius={12}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.actionIconCircle}>
                  <GlassView
                    {...liquidGlass.fillMedium}
                    borderRadius={14}
                    style={StyleSheet.absoluteFill}
                  />
                  <Ionicons name="navigate-outline" size={16} color="#fff" />
                </View>
                <Text style={styles.actionText}>Get Directions</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color="rgba(0,0,0,0.1)"
                />
              </TouchableOpacity>

              {!sharingState.isSharing && (
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={handleShareBack}
                  activeOpacity={0.7}
                >
                  <GlassView
                    {...liquidGlass.fill}
                    borderRadius={12}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.actionIconCircle}>
                    <GlassView
                      {...liquidGlass.fillMedium}
                      borderRadius={14}
                      style={StyleSheet.absoluteFill}
                    />
                    <Ionicons name="location-outline" size={16} color="#fff" />
                  </View>
                  <Text style={styles.actionText}>
                    Share Your Location Back
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color="rgba(0,0,0,0.1)"
                  />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.actionItem}
                onPress={handleViewProfile}
                activeOpacity={0.7}
              >
                <GlassView
                  {...liquidGlass.fill}
                  borderRadius={12}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.actionIconCircle}>
                  <GlassView
                    {...liquidGlass.fillMedium}
                    borderRadius={14}
                    style={StyleSheet.absoluteFill}
                  />
                  <Ionicons name="person-outline" size={16} color="#fff" />
                </View>
                <Text style={styles.actionText}>View Profile</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color="rgba(0,0,0,0.1)"
                />
              </TouchableOpacity>
            </View>
          </>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 14,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#34c759",
  },
  liveBadge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  liveDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#34c759",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    color: "#1A1A1A",
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusText: {
    fontSize: 13,
    color: "rgba(0,0,0,0.45)",
  },
  actionsList: {
    gap: 4,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    overflow: "hidden",
    gap: 12,
  },
  actionIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  actionItemDisabled: {
    opacity: 0.35,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    color: "#1A1A1A",
  },
});
