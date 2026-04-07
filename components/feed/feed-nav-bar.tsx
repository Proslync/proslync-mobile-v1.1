import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import * as React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FILTERS = ["For You", "Following", "Events Near Me", "Tables"];

export interface FeedNavBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onAvatarPress: () => void;
  onNotificationPress: () => void;
  onSearchPress: () => void;
  avatarInitial: string;
  /** Inline search mode */
  isSearchActive?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchCancel?: () => void;
}

export function FeedNavBar({
  activeFilter,
  onFilterChange,
  onAvatarPress,
  onNotificationPress,
  onSearchPress,
  avatarInitial,
  isSearchActive,
  searchQuery = "",
  onSearchChange,
  onSearchCancel,
}: FeedNavBarProps) {
  const insets = useSafeAreaInsets();
  const inputRef = React.useRef<TextInput>(null);

  React.useEffect(() => {
    if (isSearchActive) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isSearchActive]);

  return (
    <View style={[styles.container, { top: insets.top + 16 }]}>
      {isSearchActive ? (
        /* Search mode — input bar + close */
        <Animated.View entering={FadeIn.duration(200)} style={styles.searchRow}>
          <View style={styles.searchBar}>
            <View style={styles.glassLayer} pointerEvents="none">
              <GlassView {...liquidGlass.fillMedium} borderRadius={20} style={StyleSheet.absoluteFill} />
            </View>
            <Ionicons name="search" size={18} color="rgba(0,0,0,0.4)" />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={onSearchChange}
              placeholder="Search events, venues..."
              placeholderTextColor="rgba(0,0,0,0.35)"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => onSearchChange?.("")}>
                <Ionicons name="close-circle" size={18} color="rgba(0,0,0,0.3)" />
              </Pressable>
            )}
          </View>
          <Pressable style={styles.pill} onPress={onSearchCancel}>
            <View style={styles.glassLayer} pointerEvents="none">
              <GlassView {...liquidGlass.fillMedium} borderRadius={20} style={StyleSheet.absoluteFill} />
            </View>
            <Ionicons name="close" size={18} color="rgba(0,0,0,0.7)" />
          </Pressable>
        </Animated.View>
      ) : (
        /* Normal mode — pills */
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Notification pill */}
          <Pressable style={styles.pill} onPress={onNotificationPress}>
            <View style={styles.glassLayer} pointerEvents="none">
              <GlassView {...liquidGlass.surface} tintColor="transparent" borderRadius={20} style={StyleSheet.absoluteFill} />
            </View>
            <Ionicons name="notifications-outline" size={18} color="#000" />
          </Pressable>

          {/* Search pill */}
          <Pressable style={styles.pill} onPress={onSearchPress}>
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
      )}
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
  // Search mode
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Lato_400Regular",
    color: "#1A1A1A",
    paddingVertical: 0,
  },
});
