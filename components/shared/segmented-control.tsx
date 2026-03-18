// SegmentedControl — Native iOS segmented control with liquid glass on iOS 26+,
// custom glass fallback on older versions.

import React from 'react';
import { Platform, View, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import NativeSegmentedControl from '@react-native-segmented-control/segmented-control';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass, glassTint } from '@/constants/glass/liquid-glass';
import { useAppTheme } from '@/hooks/use-app-theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolateColor,
  interpolate,
} from 'react-native-reanimated';

const SPRING_CONFIG = { damping: 14, stiffness: 160, mass: 0.8 };
const SETTLE_SPRING = { damping: 10, stiffness: 200 };

// iOS 26+ has native liquid glass on UISegmentedControl
const USE_NATIVE = Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 26;

interface SegmentedControlProps {
  segments: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

// ── Native iOS 26+ version ──────────────────────────────────────
function NativeGlassSegmented({ segments, selectedIndex, onSelect }: SegmentedControlProps) {
  const { isDark } = useAppTheme();

  return (
    <View style={nativeStyles.wrapper}>
      <NativeSegmentedControl
        values={segments}
        selectedIndex={selectedIndex}
        onChange={(e) => onSelect(e.nativeEvent.selectedSegmentIndex)}
        appearance={isDark ? 'dark' : 'light'}
        style={nativeStyles.control}
        fontStyle={{ fontFamily: 'Lato_400Regular', fontSize: 13 }}
        activeFontStyle={{ fontFamily: 'Lato_700Bold', fontSize: 13 }}
      />
    </View>
  );
}

const nativeStyles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  control: {
    height: 36,
  },
});

// ── Custom fallback with glass bubble ───────────────────────────
function SegmentLabel({ label, index, selectedIndex }: {
  label: string;
  index: number;
  selectedIndex: number;
}) {
  const { isDark } = useAppTheme();
  const progress = useSharedValue(index === selectedIndex ? 1 : 0);

  React.useEffect(() => {
    progress.value = withSpring(index === selectedIndex ? 1 : 0, { damping: 20, stiffness: 200 });
  }, [selectedIndex, index]);

  const activeColor = isDark ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)';
  const inactiveColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.45)';

  const animatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [inactiveColor, activeColor]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.03]) }],
  }));

  return (
    <Animated.Text style={[styles.label, animatedStyle, index === selectedIndex && styles.labelActive]}>
      {label}
    </Animated.Text>
  );
}

function CustomGlassSegmented({ segments, selectedIndex, onSelect }: SegmentedControlProps) {
  const bubbleProgress = useSharedValue(selectedIndex);
  const bubbleScaleX = useSharedValue(1);
  const bubbleScaleY = useSharedValue(1);
  const [segmentWidth, setSegmentWidth] = React.useState(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    const containerWidth = e.nativeEvent.layout.width - 6;
    setSegmentWidth(containerWidth / segments.length);
  };

  React.useEffect(() => {
    bubbleProgress.value = withSpring(selectedIndex, SPRING_CONFIG);
    bubbleScaleX.value = withSequence(
      withTiming(1.4, { duration: 100 }),
      withSpring(1, SETTLE_SPRING),
    );
    bubbleScaleY.value = withSequence(
      withTiming(0.88, { duration: 100 }),
      withSpring(1, SETTLE_SPRING),
    );
  }, [selectedIndex]);

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: bubbleProgress.value * segmentWidth },
      { scaleX: bubbleScaleX.value },
      { scaleY: bubbleScaleY.value },
    ],
    width: segmentWidth,
  }));

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* @ts-expect-error — augmented GlassViewProps */}
      <GlassView
        {...liquidGlass.surface}
        borderRadius={10}
        style={styles.containerGlass}
        pointerEvents="none"
      />
      {segmentWidth > 0 && (
        <Animated.View style={[styles.bubbleWrapper, bubbleStyle]} pointerEvents="none">
          {/* @ts-expect-error — augmented GlassViewProps */}
          <GlassView
            {...liquidGlass.interactive}
            tintColor={glassTint.fillStrong}
            borderRadius={8}
            style={styles.bubbleGlass}
          />
        </Animated.View>
      )}
      {segments.map((label, index) => (
        <Pressable
          key={label}
          style={[styles.segment, { width: segmentWidth || undefined, flex: segmentWidth ? undefined : 1 }]}
          onPress={() => onSelect(index)}
        >
          <SegmentLabel label={label} index={index} selectedIndex={selectedIndex} />
        </Pressable>
      ))}
    </View>
  );
}

// ── Export: native on iOS 26+, custom fallback otherwise ────────
export function SegmentedControl(props: SegmentedControlProps) {
  if (USE_NATIVE) {
    return <NativeGlassSegmented {...props} />;
  }
  return <CustomGlassSegmented {...props} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    marginHorizontal: 16,
    marginVertical: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  containerGlass: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
  },
  bubbleWrapper: {
    position: 'absolute',
    top: 3,
    left: 3,
    height: 32,
    overflow: 'hidden',
    borderRadius: 8,
  },
  bubbleGlass: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  segment: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  labelActive: {
    fontFamily: 'Lato_700Bold',
  },
});
