import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { TabType } from '@/lib/types/event-detail.types';

const TABS: { key: TabType; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'lineup', label: 'Lineup' },
  { key: 'tables', label: 'Tables' },
  { key: 'map', label: 'Map' },
];

interface EventTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function EventTabBar({ activeTab, onTabChange }: EventTabBarProps) {
  const { isDark, colors } = useAppTheme();
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const tabLayouts = React.useRef<Record<string, { x: number; width: number }>>({});

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
      indicatorX.value = withSpring(layout.x, { damping: 20, stiffness: 200 });
      indicatorWidth.value = withSpring(layout.width, { damping: 20, stiffness: 200 });
    }
  }, [activeTab]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth.value,
  }));

  return (
    <View style={[styles.container, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
      <GlassView {...liquidGlass.surface} borderRadius={12} style={StyleSheet.absoluteFillObject} />
      <Animated.View style={[styles.indicator, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }, indicatorStyle]} />
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onLayout={handleTabLayout(tab.key)}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
            style={styles.tab}
          >
            <Text style={[styles.tabText, { color: isActive ? colors.text : colors.textTertiary }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    marginTop: 16,
  },
  indicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    borderRadius: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
});
