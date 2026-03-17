// Bottom Sheet - Slides up from the floating tab bar with matching glass styling
import React, { useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/use-app-theme';
import { liquidGlass } from '@/constants/glass/liquid-glass';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 49;
const TAB_BAR_HORIZONTAL_PADDING = 12;
const TAB_BAR_RADIUS = 24;

const SPRING_CONFIG = { damping: 28, stiffness: 280, mass: 0.8 };

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: number | string;
}

export function BottomSheet({
  visible,
  onClose,
  children,
  maxHeight = '85%',
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const overlayOpacity = useSharedValue(0);

  // Sheet sits above the tab bar: tab bar height + safe area + small gap
  const tabBarTotalHeight = TAB_BAR_HEIGHT + insets.bottom;
  const sheetBottomMargin = tabBarTotalHeight + 6;

  const maxHeightValue = typeof maxHeight === 'string'
    ? SCREEN_HEIGHT * (parseInt(maxHeight) / 100)
    : maxHeight;

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, SPRING_CONFIG);
      overlayOpacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
      overlayOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const closeSheet = useCallback(() => {
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
    overlayOpacity.value = withTiming(0, { duration: 200 });
    setTimeout(onClose, 250);
  }, [onClose]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        runOnJS(closeSheet)();
      } else {
        translateY.value = withSpring(0, SPRING_CONFIG);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeSheet}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={closeSheet}>
          <Animated.View style={[styles.overlay, overlayStyle]} />
        </TouchableWithoutFeedback>

        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sheet,
              {
                maxHeight: maxHeightValue,
                marginBottom: sheetBottomMargin,
                marginHorizontal: TAB_BAR_HORIZONTAL_PADDING,
              },
              sheetStyle,
            ]}
          >
            <GlassView
              {...liquidGlass.surface}
              borderRadius={TAB_BAR_RADIUS}
              style={StyleSheet.absoluteFill}
            />
            <View style={[
              styles.handle,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)' }
            ]} />
            {children}
          </Animated.View>
        </GestureDetector>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    borderRadius: TAB_BAR_RADIUS,
    padding: 16,
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
});
