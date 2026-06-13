// components/shared/floating-tab-pill.tsx
// ── SHARED FLOATING BOTTOM TAB PILL ───────────────────────────────────────
// Extracted from athlete-view.tsx so all role views can use the same pill.
//
// Public API:
//   useTabCollapse()   → { collapsed: SharedValue<number>, onScroll }
//   FloatingTabPill    → the pill itself (glass-only, matching athlete-view)

import * as React from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

// ── useTabCollapse ─────────────────────────────────────────────────────────
// Returns a SharedValue (0 = expanded, 1 = collapsed) and a plain JS scroll
// handler that can be passed directly to ScrollView or FlashList onScroll.

export function useTabCollapse() {
  const collapsed = useSharedValue(0);
  const lastY = React.useRef(0);

  const onScroll = React.useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const dy = y - lastY.current;
      if (dy > 1.5 && y > 30) {
        collapsed.value = withTiming(1, { duration: 200 });
      } else if (dy < -1.5) {
        collapsed.value = withTiming(0, { duration: 200 });
      }
      lastY.current = y;
    },
    [collapsed],
  );

  return { collapsed, onScroll };
}

// ── FloatingTabPill ────────────────────────────────────────────────────────

interface FloatingTabPillProps<T extends string> {
  tabs: readonly T[];
  activeKey: T;
  onSelect: (key: T) => void;
  /** SharedValue<0|1> from useTabCollapse */
  collapsed: ReturnType<typeof useSharedValue<number>>;
  /** insets.bottom — passed in so this component stays pure */
  bottomInset: number;
}

export function FloatingTabPill<T extends string>({
  tabs,
  activeKey,
  onSelect,
  collapsed,
  bottomInset,
}: FloatingTabPillProps<T>) {
  const tabPillWidth = useSharedValue(0);
  const tabIndex = Math.max(0, tabs.indexOf(activeKey));
  const animatedTabIndex = useSharedValue(tabIndex);

  React.useEffect(() => {
    animatedTabIndex.value = withTiming(tabIndex, { duration: 180 });
  }, [tabIndex, animatedTabIndex]);

  const tabKnobStyle = useAnimatedStyle(() => {
    const segW = tabPillWidth.value / Math.max(tabs.length, 1);
    const inset = 4;
    return {
      width: Math.max(segW - inset * 2, 0),
      transform: [{ translateX: animatedTabIndex.value * segW + inset }],
    };
  });

  const floatingTabsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(collapsed.value, [0, 1], [1, 0.8]) }],
    opacity: interpolate(collapsed.value, [0, 1], [1, 0.85]),
  }));

  return (
    <View
      style={[styles.floatingTabsWrap, { bottom: bottomInset + 14 }]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[styles.tabSegmentedPill, floatingTabsStyle]}
        onLayout={(e) => {
          tabPillWidth.value = e.nativeEvent.layout.width;
        }}
      >
        <View style={styles.glassLayer} pointerEvents="none">
          <GlassView
            glassEffectStyle="regular"
            style={[StyleSheet.absoluteFill, { borderRadius: 21 }]}
          />
        </View>
        <Animated.View style={[styles.tabKnob, tabKnobStyle]} pointerEvents="none" />
        {tabs.map((label) => {
          const isActive = activeKey === label;
          return (
            <Pressable
              key={label}
              style={styles.tabSegment}
              onPress={() => onSelect(label)}
              accessibilityLabel={`${label} tab`}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>
                {String(label)}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

// ── Styles (identical to athlete-view reference) ──────────────────────────

const styles = StyleSheet.create({
  floatingTabsWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  tabSegmentedPill: {
    width: 240,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 21,
    overflow: 'hidden',
  },
  tabKnob: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tabSegment: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 21,
  },
  tabPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
  },
  tabPillTextActive: {
    color: '#EB621A',
    fontWeight: '800',
  },
});
