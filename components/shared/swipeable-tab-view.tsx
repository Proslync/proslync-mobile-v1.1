import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useSharedValue } from 'react-native-reanimated';
import { useTabNavigation } from '@/lib/providers/tab-navigation-provider';

const SWIPE_THRESHOLD = 50;
const VELOCITY_THRESHOLD = 500;

interface SwipeableTabViewProps {
  children: React.ReactNode;
  disabled?: boolean;
}

export function SwipeableTabView({ children, disabled = false }: SwipeableTabViewProps) {
  const { goToNextTab, goToPreviousTab } = useTabNavigation();
  const hasSwiped = useSharedValue(false);

  // Wrap navigation functions for safe calling from worklet
  const handleNextTab = React.useCallback(() => {
    goToNextTab();
  }, [goToNextTab]);

  const handlePreviousTab = React.useCallback(() => {
    goToPreviousTab();
  }, [goToPreviousTab]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20]) // Only activate after 20px horizontal movement
    .failOffsetY([-20, 20])   // Fail if vertical movement exceeds 20px first
    .onStart(() => {
      'worklet';
      hasSwiped.value = false;
    })
    .onEnd((event) => {
      'worklet';
      if (disabled || hasSwiped.value) return;

      const { translationX, velocityX, velocityY } = event;

      // Check if it's a horizontal swipe
      const isHorizontalSwipe =
        Math.abs(translationX) > SWIPE_THRESHOLD &&
        Math.abs(velocityX) > Math.abs(velocityY);

      // Also allow fast horizontal flicks
      const isFastHorizontalFlick =
        Math.abs(velocityX) > VELOCITY_THRESHOLD &&
        Math.abs(velocityX) > Math.abs(velocityY) * 1.5;

      if (!isHorizontalSwipe && !isFastHorizontalFlick) return;

      hasSwiped.value = true;

      if (translationX < 0) {
        // Swipe left -> go to next tab (right)
        runOnJS(handleNextTab)();
      } else {
        // Swipe right -> go to previous tab (left)
        runOnJS(handlePreviousTab)();
      }
    });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={styles.container}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
