import {
  glassBorder,
  glassTint,
  liquidGlass,
} from "@/constants/glass/liquid-glass";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { TabType } from "@/lib/types/event-detail.types";
import { GlassView } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import * as React from "react";
import {
  LayoutChangeEvent,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const TABS: { key: TabType; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "lineup", label: "Lineup" },
  { key: "tables", label: "Tables1" },
  { key: "map", label: "Map" },
];

const BUBBLE_SPRING = { damping: 14, stiffness: 160, mass: 0.8 };
const SETTLE_SPRING = { damping: 10, stiffness: 200 };

interface EventTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

function TabLabel({
  label,
  index,
  activeIndex,
}: {
  label: string;
  index: number;
  activeIndex: number;
}) {
  const { isDark } = useAppTheme();
  const progress = useSharedValue(index === activeIndex ? 1 : 0);

  React.useEffect(() => {
    progress.value = withSpring(index === activeIndex ? 1 : 0, {
      damping: 20,
      stiffness: 200,
    });
  }, [activeIndex, index]);

  const activeColor = isDark ? "rgba(255, 255, 255, 1)" : "rgba(0, 0, 0, 1)";
  const inactiveColor = isDark
    ? "rgba(255, 255, 255, 0.45)"
    : "rgba(0, 0, 0, 0.4)";

  const animatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [inactiveColor, activeColor],
    ),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.03]) }],
  }));

  return (
    <Animated.Text
      style={[
        styles.tabText,
        animatedStyle,
        index === activeIndex && styles.tabTextActive,
      ]}
    >
      {label}
    </Animated.Text>
  );
}

export function EventTabBar({ activeTab, onTabChange }: EventTabBarProps) {
  const { isDark } = useAppTheme();
  const border = glassBorder[isDark ? "dark" : "light"];

  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const bubbleScaleX = useSharedValue(1);
  const bubbleScaleY = useSharedValue(1);
  const tabLayouts = React.useRef<Record<string, { x: number; width: number }>>(
    {},
  );
  const activeIndex = TABS.findIndex((t) => t.key === activeTab);

  const handleTabLayout = (key: string) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    tabLayouts.current[key] = { x, width };
    if (key === activeTab) {
      indicatorX.value = x;
      indicatorWidth.value = width;
    }
  };

  React.useEffect(() => {
    const layout = tabLayouts.current[activeTab];
    if (layout) {
      indicatorX.value = withSpring(layout.x, BUBBLE_SPRING);
      indicatorWidth.value = withSpring(layout.width, BUBBLE_SPRING);

      // Liquid stretch
      bubbleScaleX.value = withSequence(
        withTiming(1.25, { duration: 80 }),
        withSpring(1, SETTLE_SPRING),
      );
      bubbleScaleY.value = withSequence(
        withTiming(0.88, { duration: 80 }),
        withSpring(1, SETTLE_SPRING),
      );
    }
  }, [activeTab]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: indicatorX.value },
      { scaleX: bubbleScaleX.value },
      { scaleY: bubbleScaleY.value },
    ],
    width: indicatorWidth.value,
  }));

  const handlePress = (tab: TabType) => {
    if (tab !== activeTab) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onTabChange(tab);
  };

  return (
    <View style={[styles.container, { borderColor: border }]}>
      <GlassView
        {...liquidGlass.surface}
        borderRadius={12}
        style={StyleSheet.absoluteFillObject}
      />
      <Animated.View style={[styles.indicator, indicatorStyle]}>
        <GlassView
          {...liquidGlass.interactive}
          tintColor={glassTint.fillStrong}
          borderRadius={9}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      {TABS.map((tab, index) => (
        <TouchableOpacity
          key={tab.key}
          onLayout={handleTabLayout(tab.key)}
          onPress={() => handlePress(tab.key)}
          activeOpacity={0.7}
          style={styles.tab}
        >
          <TabLabel label={tab.label} index={index} activeIndex={activeIndex} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    marginTop: 16,
    overflow: "hidden",
  },
  indicator: {
    position: "absolute",
    top: 3,
    bottom: 3,
    borderRadius: 9,
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabText: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
  },
  tabTextActive: {
    fontFamily: "Lato_700Bold",
  },
});
