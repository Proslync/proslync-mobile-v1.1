import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import * as React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

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
  const activeIndex = Math.max(0, FILTERS.indexOf(activeFilter as (typeof FILTERS)[number]));
  const pillWidth = useSharedValue(0);
  const animatedIndex = useSharedValue(activeIndex);
  React.useEffect(() => {
    animatedIndex.value = withTiming(activeIndex, { duration: 180 });
  }, [activeIndex, animatedIndex]);
  const knobStyle = useAnimatedStyle(() => {
    const segW = pillWidth.value / Math.max(FILTERS.length, 1);
    const inset = 4;
    return {
      width: Math.max(segW - inset * 2, 0),
      transform: [{ translateX: animatedIndex.value * segW + inset }],
    };
  });

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

      <View
        style={styles.pill}
        onLayout={(e) => {
          pillWidth.value = e.nativeEvent.layout.width;
        }}
      >
        <GlassView
          glassEffectStyle="regular"
          style={[StyleSheet.absoluteFill, { borderRadius: 23 }]}
        />
        <Animated.View style={[styles.knob, knobStyle]} pointerEvents="none" />
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
  knob: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 0,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  segmentText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: "#FF6F3C",
    fontWeight: "700",
  },
});
