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
  const { colors } = useAppTheme();
  const router = useStableRouter();
  const { sharingState } = useLiveLocation();

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
      pathname: "/user/[username]",
      params: { username: friend.name || "_", userId: String(friend.id) },
    });
  };

  if (!friend || !visible) return null;

  const lastActiveText = getTimeAgo(friend.updatedAt);
  const hasCoordinates = friend.latitude !== 0 && friend.longitude !== 0;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      enableDynamicSizing
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={[styles.content, { paddingBottom: insets.bottom || 16 }]}>
        {/* Profile row with photo */}
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
                color="rgba(255,255,255,0.5)"
              />
              <Text style={styles.statusText}>
                Last active {lastActiveText}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={[
            styles.actionItem,
            styles.actionItemBorder,
            !hasCoordinates && styles.actionItemDisabled,
          ]}
          onPress={handleGetDirections}
          activeOpacity={0.7}
          disabled={!hasCoordinates}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="navigate-outline" size={18} color="#fff" />
          </View>
          <Text style={styles.actionText}>Get Directions</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color="rgba(255,255,255,0.2)"
          />
        </TouchableOpacity>

        {!sharingState.isSharing && (
          <TouchableOpacity
            style={[styles.actionItem, styles.actionItemBorder]}
            onPress={handleShareBack}
            activeOpacity={0.7}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="location-outline" size={18} color="#fff" />
            </View>
            <Text style={styles.actionText}>Share Your Location Back</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color="rgba(255,255,255,0.2)"
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionItem, styles.actionItemBorder]}
          onPress={handleViewProfile}
          activeOpacity={0.7}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="person-outline" size={18} color="#fff" />
          </View>
          <Text style={styles.actionText}>View Profile</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color="rgba(255,255,255,0.2)"
          />
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: "#000",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255,255,255,0.08)",
  },
  handleIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  content: {
    paddingHorizontal: 0,
  },

  // Profile row
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
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
    fontFamily: "Lato_700Bold",
    color: "#fff",
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusText: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    color: "rgba(255,255,255,0.5)",
  },

  // Action items
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  actionItemBorder: {
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  actionItemDisabled: {
    opacity: 0.35,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Lato_400Regular",
    color: "#fff",
  },
});
