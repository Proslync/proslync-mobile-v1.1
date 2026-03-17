import React, { createContext, useContext, useCallback, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

const SPRING_CONFIG = { damping: 24, stiffness: 260, mass: 0.8 };
const TAB_BAR_HEIGHT = 49; // Native tab bar height

interface TabBarSheetContextType {
  isExpanded: boolean;
  show: (content: React.ReactNode, onClose?: () => void) => (() => void);
  hide: () => void;
}

const TabBarSheetContext = createContext<TabBarSheetContextType | null>(null);

export function TabBarSheetProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  // Use state (not ref) for content so updates always trigger re-renders
  const [sheetContent, setSheetContent] = useState<React.ReactNode>(null);
  const onCloseRef = useRef<(() => void) | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isShowingRef = useRef(false);
  const tokenRef = useRef(0);
  const insets = useSafeAreaInsets();

  // Animation values
  const sheetHeight = useSharedValue(0);
  const measuredHeight = useSharedValue(0);

  const hide = useCallback(() => {
    // Idempotent — safe to call multiple times
    if (!isShowingRef.current) return;
    isShowingRef.current = false;
    setIsExpanded(false);
    sheetHeight.value = withSpring(0, SPRING_CONFIG);
    const cb = onCloseRef.current;
    hideTimeoutRef.current = setTimeout(() => {
      hideTimeoutRef.current = null;
      setSheetVisible(false);
      setSheetContent(null);
      onCloseRef.current = null;
      cb?.();
    }, 350);
  }, []);

  const show = useCallback((content: React.ReactNode, onClose?: () => void) => {
    // Cancel any pending hide timeout to prevent race conditions
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    isShowingRef.current = true;
    const token = ++tokenRef.current;
    setSheetContent(content);
    onCloseRef.current = onClose ?? null;
    setIsExpanded(true);
    setSheetVisible(true);
    // Return scoped dismiss — only hides if this content is still active
    return () => {
      if (tokenRef.current === token && isShowingRef.current) {
        hide();
      }
    };
  }, [hide]);

  // Measure content and animate open
  const handleContentLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && isExpanded) {
      measuredHeight.value = h;
      sheetHeight.value = withSpring(h, SPRING_CONFIG);
    }
  }, [isExpanded]);

  // Swipe down gesture
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        sheetHeight.value = Math.max(0, measuredHeight.value - e.translationY);
      }
    })
    .onEnd((e) => {
      if (e.translationY > 60 || e.velocityY > 400) {
        sheetHeight.value = withSpring(0, SPRING_CONFIG);
        runOnJS(hide)();
      } else {
        sheetHeight.value = withSpring(measuredHeight.value, SPRING_CONFIG);
      }
    });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    height: sheetHeight.value,
    overflow: 'hidden' as const,
  }));

  const bottomOffset = TAB_BAR_HEIGHT + insets.bottom + 12;

  return (
    <TabBarSheetContext.Provider value={{ isExpanded, show, hide }}>
      {children}

      {/* Floating glass sheet */}
      {sheetVisible && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          style={[styles.overlay, { bottom: bottomOffset }]}
          pointerEvents="box-none"
        >
          {/* Dismiss backdrop — tapping outside closes */}
          <Pressable style={StyleSheet.absoluteFill} onPress={hide} />

          {/* Sheet */}
          <View style={styles.sheetOuter}>
            <GestureDetector gesture={panGesture}>
              <Animated.View style={[styles.sheetContainer, sheetAnimatedStyle]}>
                <GlassView
                  {...liquidGlass.surface}
                  borderRadius={24}
                  style={StyleSheet.absoluteFill}
                />
                <View onLayout={handleContentLayout}>
                  {/* Handle */}
                  <View style={styles.handle} />
                  {/* Content */}
                  <View style={styles.content}>
                    {sheetContent}
                  </View>
                </View>
              </Animated.View>
            </GestureDetector>
          </View>
        </Animated.View>
      )}
    </TabBarSheetContext.Provider>
  );
}

export function useTabBarSheet() {
  const ctx = useContext(TabBarSheetContext);
  if (!ctx) throw new Error('useTabBarSheet must be used within TabBarSheetProvider');
  return ctx;
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 99999,
    elevation: 99999,
    justifyContent: 'flex-end',
  },
  sheetOuter: {
    paddingHorizontal: 12,
  },
  sheetContainer: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  content: {
    paddingBottom: 12,
  },
});
