import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import * as React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FILTERS = ["For You", "Following", "Events Near Me", "Tables"];

export interface FeedNavBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onAvatarPress: () => void;
  onNotificationPress: () => void;
  onSearchPress: () => void;
  avatarInitial: string;
}

export function FeedNavBar({
  activeFilter,
  onFilterChange,
  onAvatarPress,
  onNotificationPress,
  onSearchPress,
  avatarInitial,
}: FeedNavBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { top: insets.top + 16 }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Notification pill */}
        <Pressable
          style={styles.pill}
          onPress={onNotificationPress}
        >
          <View style={styles.glassLayer} pointerEvents="none">
            <GlassView {...liquidGlass.surface} tintColor="transparent" borderRadius={20} style={StyleSheet.absoluteFill} />
          </View>
          <Ionicons name="notifications-outline" size={18} color="#000" />
        </Pressable>

        {/* Search pill */}
        <Pressable
          style={styles.pill}
          onPress={onSearchPress}
        >
          <View style={styles.glassLayer} pointerEvents="none">
            <GlassView {...liquidGlass.surface} tintColor="transparent" borderRadius={20} style={StyleSheet.absoluteFill} />
          </View>
          <Ionicons name="search-outline" size={18} color="#000" />
        </Pressable>

        {/* Filter pills */}
        {FILTERS.map((filter) => {
          const isActive = filter === activeFilter;
          return (
            <Pressable
              key={filter}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
              onPress={() => onFilterChange(filter)}
            >
              <View style={styles.glassLayer} pointerEvents="none">
                <GlassView
                  {...liquidGlass.surface}
                  tintColor={isActive ? "rgba(0,0,0,0.12)" : "transparent"}
                  borderRadius={20}
                  style={StyleSheet.absoluteFill}
                />
              </View>
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {filter}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 100,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: "center",
  },
  pill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 15,
  },
  filterPill: {
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  glassLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    borderRadius: 19,
  },
  filterPillActive: {},
  filterText: {
    color: "rgba(0,0,0,0.5)",
    fontSize: 14,
    fontWeight: "500",
  },
  filterTextActive: {
    color: "rgba(0,0,0,0.8)",
    fontWeight: "500",
  },
});
