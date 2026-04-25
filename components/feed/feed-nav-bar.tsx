import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import * as React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const TAB_BAR_TOP_FROM_BOTTOM = 90; // iOS 26 floating glass tab bar — top edge from screen bottom

const FILTERS = ["For You", "Following"] as const;

export interface FeedNavBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onSearchPress: () => void;
  onSharePress?: () => void;
}

export function FeedNavBar({
  activeFilter,
  onFilterChange,
  onSearchPress,
  onSharePress,
}: FeedNavBarProps) {
  return (
    <View style={styles.bottomBar}>
      <Pressable
        style={styles.circle}
        onPress={onSearchPress}
        accessibilityLabel="Search"
        accessibilityRole="button"
      >
        <GlassView
          glassEffectStyle="regular"
          style={[StyleSheet.absoluteFill, { borderRadius: 23 }]}
        />
        <Ionicons name="search-outline" size={22} color="#FFF" />
      </Pressable>

      <View style={styles.pill}>
        <GlassView
          glassEffectStyle="regular"
          style={[StyleSheet.absoluteFill, { borderRadius: 23 }]}
        />
        {FILTERS.map((filter) => {
          const isActive = filter === activeFilter;
          return (
            <Pressable
              key={filter}
              style={styles.segment}
              onPress={() => onFilterChange(filter)}
              accessibilityLabel={`${filter} feed`}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={[
                  styles.segmentText,
                  isActive && styles.segmentTextActive,
                ]}
              >
                {filter}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={styles.circle}
        onPress={onSharePress}
        accessibilityLabel="Share"
        accessibilityRole="button"
      >
        <GlassView
          glassEffectStyle="regular"
          style={[StyleSheet.absoluteFill, { borderRadius: 23 }]}
        />
        <Ionicons name="share-outline" size={22} color="#FFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    position: "absolute",
    bottom: TAB_BAR_TOP_FROM_BOTTOM + 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
    zIndex: 100,
  },
  circle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  pill: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  segment: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  segmentText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: "#FFF",
    fontWeight: "700",
  },
});
