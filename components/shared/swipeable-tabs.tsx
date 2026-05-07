// Swipeable Tabs - Instagram/Messenger style horizontal swipe navigation
// Uses react-native-pager-view for smooth 60fps interactive swipe with page peeking

import * as React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import PagerView, { PagerViewOnPageSelectedEvent, PagerViewOnPageScrollEvent } from 'react-native-pager-view';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter, usePathname } from 'expo-router';
import { useAppTheme } from '@/hooks/use-app-theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Tab configuration matching the app's tab order
export const TAB_CONFIG = [
  { name: 'search', title: 'Map', icon: 'map', iconOutline: 'map-outline', route: '/map' },
  { name: 'explore', title: 'Messages', icon: 'paper-plane', iconOutline: 'paper-plane-outline', route: '/messages' },
  { name: 'index', title: 'Home', icon: 'home-sharp', iconOutline: 'home-outline', route: '/(tabs)' },
  { name: 'activity', title: 'Wallet', icon: 'wallet', iconOutline: 'wallet-outline', route: '/(tabs)/activity' },
  { name: 'profile', title: 'Profile', icon: 'person', iconOutline: 'person-outline', route: '/(tabs)/profile' },
] as const;

const NUM_TABS = TAB_CONFIG.length;
const DEFAULT_TAB_INDEX = 2; // 'index' (Home) tab

// Context for swipeable tabs state
interface SwipeableTabsContextType {
  pagerRef: React.RefObject<PagerView | null>;
  currentIndex: number;
  scrollOffset: number;
  goToPage: (index: number, animated?: boolean) => void;
  isAccountSwitcherOpen: boolean;
  openAccountSwitcher: () => void;
  closeAccountSwitcher: () => void;
}

const SwipeableTabsContext = React.createContext<SwipeableTabsContextType | null>(null);

export function useSwipeableTabs() {
  const context = React.useContext(SwipeableTabsContext);
  if (!context) {
    throw new Error('useSwipeableTabs must be used within SwipeableTabsProvider');
  }
  return context;
}

// Provider component
interface SwipeableTabsProviderProps {
  children: React.ReactNode;
  initialIndex?: number;
}

export function SwipeableTabsProvider({ children, initialIndex = DEFAULT_TAB_INDEX }: SwipeableTabsProviderProps) {
  const pagerRef = React.useRef<PagerView>(null);
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const [scrollOffset, setScrollOffset] = React.useState(0);
  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = React.useState(false);

  const goToPage = React.useCallback((index: number, animated = true) => {
    const clampedIndex = Math.max(0, Math.min(index, NUM_TABS - 1));
    if (animated) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    pagerRef.current?.setPage(clampedIndex);
  }, []);

  const openAccountSwitcher = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsAccountSwitcherOpen(true);
  }, []);

  const closeAccountSwitcher = React.useCallback(() => {
    setIsAccountSwitcherOpen(false);
  }, []);

  // Internal update from pager events
  const handlePageSelected = React.useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const handlePageScroll = React.useCallback((offset: number) => {
    setScrollOffset(offset);
  }, []);

  const value = React.useMemo(() => ({
    pagerRef,
    currentIndex,
    scrollOffset,
    goToPage,
    isAccountSwitcherOpen,
    openAccountSwitcher,
    closeAccountSwitcher,
  }), [currentIndex, scrollOffset, goToPage, isAccountSwitcherOpen, openAccountSwitcher, closeAccountSwitcher]);

  return (
    <SwipeableTabsContext.Provider value={value}>
      <SwipeableTabsInternalProvider
        onPageSelected={handlePageSelected}
        onPageScroll={handlePageScroll}
      >
        {children}
      </SwipeableTabsInternalProvider>
    </SwipeableTabsContext.Provider>
  );
}

// Internal provider to pass callbacks to PagerView without circular deps
const InternalCallbackContext = React.createContext<{
  onPageSelected: (index: number) => void;
  onPageScroll: (offset: number) => void;
} | null>(null);

function SwipeableTabsInternalProvider({
  children,
  onPageSelected,
  onPageScroll,
}: {
  children: React.ReactNode;
  onPageSelected: (index: number) => void;
  onPageScroll: (offset: number) => void;
}) {
  const value = React.useMemo(() => ({ onPageSelected, onPageScroll }), [onPageSelected, onPageScroll]);
  return (
    <InternalCallbackContext.Provider value={value}>
      {children}
    </InternalCallbackContext.Provider>
  );
}

// Tab Bar Icon component
interface TabIconProps {
  index: number;
  focused: boolean;
  color: string;
  avatarUrl?: string;
}

function TabIcon({ index, focused, color, avatarUrl }: TabIconProps) {
  const tab = TAB_CONFIG[index];

  // Profile tab has special avatar icon
  if (tab.name === 'profile') {
    return (
      <View style={[styles.profileWrapper, focused && styles.profileWrapperActive]}>
        <Image
          source={avatarUrl ? { uri: avatarUrl } : require('@/assets/images/default-avatar.png')}
          style={styles.profileImage}
        />
      </View>
    );
  }

  return (
    <Ionicons
      name={focused ? (tab.icon as any) : (tab.iconOutline as any)}
      size={tab.name === 'search' || tab.name === 'activity' ? 26 : 24}
      color={color}
    />
  );
}

// Custom Tab Bar component
interface SwipeableTabBarProps {
  avatarUrl?: string;
}

export function SwipeableTabBar({ avatarUrl }: SwipeableTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { currentIndex, scrollOffset, goToPage, openAccountSwitcher } = useSwipeableTabs();

  // Animated position indicator
  const indicatorPosition = useSharedValue(currentIndex);

  React.useEffect(() => {
    indicatorPosition.value = withTiming(currentIndex + scrollOffset, { duration: 0 });
  }, [currentIndex, scrollOffset, indicatorPosition]);

  const handleTabPress = React.useCallback((index: number) => {
    goToPage(index);
  }, [goToPage]);

  // Double-tap for profile tab
  const lastProfileTapRef = React.useRef<number>(0);
  const DOUBLE_TAP_DELAY = 300;

  const handleProfilePress = React.useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastProfileTapRef.current;

    if (timeSinceLastTap < DOUBLE_TAP_DELAY) {
      // Double tap - open account switcher
      openAccountSwitcher();
      lastProfileTapRef.current = 0;
    } else {
      lastProfileTapRef.current = now;
      setTimeout(() => {
        if (lastProfileTapRef.current === now) {
          // Single tap - navigate
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          goToPage(4); // Profile index
        }
      }, DOUBLE_TAP_DELAY);
    }
  }, [goToPage, openAccountSwitcher]);

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom + 4, height: 50 + insets.bottom, backgroundColor: colors.background }]}>
      {TAB_CONFIG.map((tab, index) => {
        const isFocused = currentIndex === index;
        const color = isFocused ? '#fff' : 'rgba(255, 255, 255, 0.5)';

        return (
          <Pressable
            key={tab.name}
            style={styles.tabButton}
            onPress={tab.name === 'profile' ? handleProfilePress : () => handleTabPress(index)}
          >
            <TabIcon
              index={index}
              focused={isFocused}
              color={color}
              avatarUrl={avatarUrl}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

// Tab Page wrapper - lazy loads content
interface TabPageProps {
  index: number;
  children: React.ReactNode;
  isFocused: boolean;
}

export function TabPage({ index, children, isFocused }: TabPageProps) {
  const { colors } = useAppTheme();
  // Track if this page has ever been focused (for lazy loading)
  const hasBeenFocused = React.useRef(false);
  if (isFocused) {
    hasBeenFocused.current = true;
  }

  // Only render content if it has been focused at least once
  // This provides lazy loading while preserving state after initial load
  if (!hasBeenFocused.current) {
    return <View style={[styles.page, { backgroundColor: colors.background }]} />;
  }

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      {children}
    </View>
  );
}

// Props passed to children of SwipeableTabPager
export interface SwipeableTabChildProps {
  isFocused?: boolean;
}

// Main PagerView container
interface SwipeableTabPagerProps {
  children: React.ReactElement<SwipeableTabChildProps>[];
  initialIndex?: number;
}

export function SwipeableTabPager({ children, initialIndex = DEFAULT_TAB_INDEX }: SwipeableTabPagerProps) {
  const { pagerRef, currentIndex, goToPage } = useSwipeableTabs();
  const callbacks = React.useContext(InternalCallbackContext);

  const handlePageSelected = React.useCallback((e: PagerViewOnPageSelectedEvent) => {
    const index = e.nativeEvent.position;
    callbacks?.onPageSelected(index);
  }, [callbacks]);

  const handlePageScroll = React.useCallback((e: PagerViewOnPageScrollEvent) => {
    const { position, offset } = e.nativeEvent;
    // Offset is the fractional part of the current page position
    // When scrolling right, offset goes 0 -> 1
    // When scrolling left, offset goes 0 -> -1 (but reported as previous page + high offset)
    callbacks?.onPageScroll(offset);
  }, [callbacks]);

  return (
    <PagerView
      ref={pagerRef}
      style={styles.pager}
      initialPage={initialIndex}
      onPageSelected={handlePageSelected}
      onPageScroll={handlePageScroll}
      overdrag={true}
      offscreenPageLimit={1} // Render 1 page on each side for peeking
    >
      {React.Children.map(children, (child, index) => (
        <View key={index} style={styles.pageContainer}>
          {React.cloneElement(child, { isFocused: currentIndex === index })}
        </View>
      ))}
    </PagerView>
  );
}

const styles = StyleSheet.create({
  pager: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  page: {
    flex: 1,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingTop: 4,
    paddingHorizontal: 20,
    borderTopWidth: 0,
    elevation: 0,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileWrapperActive: {
    borderColor: '#fff',
  },
  profileImage: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
});
