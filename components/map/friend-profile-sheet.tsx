import React from "react";
import { View, Text, Image, StyleSheet, Linking, Platform } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/use-app-theme";
import { GlassButton } from "../glass/glass-button";
import { radius, spacing, glassBorder } from "../../constants/glass/tokens";

interface FriendProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  friend: {
    id: string;
    name: string;
    imageUrl: string;
    latitude: number;
    longitude: number;
  } | null;
}

export function FriendProfileSheet({
  visible,
  onClose,
  friend,
}: FriendProfileSheetProps) {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleGetDirections = () => {
    if (!friend) return;
    const { latitude, longitude, name } = friend;

    if (Platform.OS === "ios") {
      Linking.openURL(`maps:?daddr=${latitude},${longitude}&dirflg=d&t=m`);
    } else {
      Linking.openURL(
        `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(name)})`,
      );
    }
  };

  if (!friend) return null;

  // Time-based sharing status text
  const sharingText = "Sharing location now";

  // Theme-aware colors
  const sheetBackgroundColor = isDark ? "#000000" : "rgba(255, 255, 255, 0.97)";
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
  const coordPillBorderColor = isDark
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.1)";
  const coordFillColor = isDark
    ? "rgba(255, 255, 255, 0.03)"
    : "rgba(0, 0, 0, 0.03)";
  const coordIconColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";
  const coordTextColor = isDark
    ? "rgba(255,255,255,0.4)"
    : "rgba(0, 0, 0, 0.4)";
  const statusTextColor = isDark
    ? "rgba(255, 255, 255, 0.5)"
    : "rgba(0, 0, 0, 0.5)";

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      enablePanDownToClose
      enableDynamicSizing
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
        {/* Profile section */}
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
              <Ionicons name="location" size={14} color="#34c759" />
              <Text style={[styles.statusText, { color: statusTextColor }]}>
                {sharingText}
              </Text>
            </View>
          </View>
        </View>

        {/* Coordinates pill */}
        <View style={[styles.coordPill, { borderColor: coordPillBorderColor }]}>
          <BlurView
            intensity={25}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[styles.coordFill, { backgroundColor: coordFillColor }]}
          />
          <Ionicons name="navigate-outline" size={14} color={coordIconColor} />
          <Text style={[styles.coordText, { color: coordTextColor }]}>
            {friend.latitude.toFixed(4)}, {friend.longitude.toFixed(4)}
          </Text>
        </View>

        {/* Directions button */}
        <GlassButton
          label="Get Directions"
          icon={<Ionicons name="map-outline" size={18} color={iconColor} />}
          variant="glass"
          size="lg"
          fullWidth
          onPress={handleGetDirections}
        />
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

  // Profile
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
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

  // Coordinate pill
  coordPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 34,
    borderRadius: 17,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 16,
  },
  coordFill: {
    ...StyleSheet.absoluteFillObject,
  },
  coordText: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
  },
});
