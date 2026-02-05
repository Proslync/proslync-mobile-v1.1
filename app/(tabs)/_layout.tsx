// Swipeable Tab Layout - Instagram/Messenger style horizontal swipe navigation
// Uses react-native-pager-view for smooth 60fps interactive swipe with page peeking

import * as React from 'react';
import { View, StyleSheet, Pressable, Image, Dimensions } from 'react-native';
import PagerView, { PagerViewOnPageSelectedEvent, PagerViewOnPageScrollEvent } from 'react-native-pager-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/providers/auth-provider';
import { useTabNavigation } from '@/lib/providers/tab-navigation-provider';

// Direct imports (React.lazy doesn't work well in Expo Go)
import MapScreen from './search';
import MessagesScreen from './explore';
import HomeScreen from './index';
import WalletScreen from './activity';
import ProfileScreen from './profile';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Tab configuration
const TAB_CONFIG = [
  { name: 'search', title: 'Map', icon: 'map', iconOutline: 'map-outline' },
  { name: 'explore', title: 'Messages', icon: 'paper-plane', iconOutline: 'paper-plane-outline' },
  { name: 'index', title: 'Home', icon: 'home-sharp', iconOutline: 'home-outline' },
  { name: 'activity', title: 'Wallet', icon: 'wallet', iconOutline: 'wallet-outline' },
  { name: 'profile', title: 'Profile', icon: 'person', iconOutline: 'person-outline' },
] as const;

const DEFAULT_TAB_INDEX = 2; // 'index' (Home) tab
const DEFAULT_AVATAR = 'https://picsum.photos/200';

// Screen components array
const SCREENS = [MapScreen, MessagesScreen, HomeScreen, WalletScreen, ProfileScreen];

// Tab page wrapper - memoized to prevent re-renders
interface TabPageWrapperProps {
  index: number;
  shouldRender: boolean;
}

const TabPageWrapper = React.memo(function TabPageWrapper({ index, shouldRender }: TabPageWrapperProps) {
  const ScreenComponent = SCREENS[index];

  if (!shouldRender) {
    return <View style={styles.pageContainer} collapsable={false} />;
  }

  return (
    <View style={styles.pageContainer} collapsable={false}>
      <ScreenComponent />
    </View>
  );
});

// Profile Tab Icon with avatar
function ProfileTabIcon({ focused, avatarUrl }: { focused: boolean; avatarUrl?: string }) {
  return (
    <View style={[styles.profileWrapper, focused && styles.profileWrapperActive]}>
      <Image
        source={avatarUrl ? { uri: avatarUrl } : require('@/assets/images/default-avatar.png')}
        style={styles.profileImage}
      />
    </View>
  );
}

// Regular Tab Icon
function TabIcon({ index, focused, color }: { index: number; focused: boolean; color: string }) {
  const tab = TAB_CONFIG[index];
  const iconSize = tab.name === 'search' || tab.name === 'activity' ? 26 : 24;

  return (
    <Ionicons
      name={focused ? (tab.icon as any) : (tab.iconOutline as any)}
      size={iconSize}
      color={color}
    />
  );
}

export default function SwipeableTabLayout() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { openAccountSwitcher } = useTabNavigation();

  const pagerRef = React.useRef<PagerView>(null);
  const [currentIndex, setCurrentIndex] = React.useState(DEFAULT_TAB_INDEX);
  const isNavigatingProgrammatically = React.useRef(false);

  // Track which pages have been loaded (for lazy rendering)
  const [loadedPages, setLoadedPages] = React.useState<Set<number>>(() => new Set([DEFAULT_TAB_INDEX]));

  const avatarUrl = user?.avatar?.url || DEFAULT_AVATAR;

  // Handle page selection (from swipe gesture or programmatic)
  const handlePageSelected = React.useCallback((e: PagerViewOnPageSelectedEvent) => {
    const newIndex = e.nativeEvent.position;

    // Avoid unnecessary state updates
    if (newIndex === currentIndex) return;

    setCurrentIndex(newIndex);

    // Mark page as loaded
    setLoadedPages(prev => {
      if (prev.has(newIndex)) return prev;
      return new Set([...prev, newIndex]);
    });

    // Haptic feedback on page change (only if from swipe, not programmatic)
    if (!isNavigatingProgrammatically.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    isNavigatingProgrammatically.current = false;
  }, [currentIndex]);

  // Handle page scroll for preloading adjacent pages
  const handlePageScroll = React.useCallback((e: PagerViewOnPageScrollEvent) => {
    const { position, offset } = e.nativeEvent;

    // When swiping right (offset > 0), preload next page
    if (offset > 0.1 && position + 1 < TAB_CONFIG.length) {
      setLoadedPages(prev => {
        if (prev.has(position + 1)) return prev;
        return new Set([...prev, position + 1]);
      });
    }
    // When on a page and offset indicates left swipe starting
    if (position > 0 && offset < 0.9 && offset > 0) {
      setLoadedPages(prev => {
        if (prev.has(position)) return prev;
        return new Set([...prev, position]);
      });
    }
  }, []);

  // Navigate to tab programmatically (from tab bar tap)
  const goToPage = React.useCallback((index: number) => {
    if (index === currentIndex) return;

    // Pre-load the target page
    setLoadedPages(prev => {
      if (prev.has(index)) return prev;
      return new Set([...prev, index]);
    });

    isNavigatingProgrammatically.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pagerRef.current?.setPage(index);
  }, [currentIndex]);

  // Double-tap handler for profile tab
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
          goToPage(4);
        }
      }, DOUBLE_TAP_DELAY);
    }
  }, [goToPage, openAccountSwitcher]);

  return (
    <View style={styles.container}>
      {/* Pager View - handles horizontal swipe between tabs */}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={DEFAULT_TAB_INDEX}
        onPageSelected={handlePageSelected}
        onPageScroll={handlePageScroll}
        overdrag={true}
        offscreenPageLimit={1}
      >
        {TAB_CONFIG.map((_, index) => (
          <View key={index} style={styles.pageWrapper} collapsable={false}>
            <TabPageWrapper index={index} shouldRender={loadedPages.has(index)} />
          </View>
        ))}
      </PagerView>

      {/* Custom Tab Bar - fixed at bottom */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom + 4, height: 50 + insets.bottom }]}>
        {TAB_CONFIG.map((tab, index) => {
          const isFocused = currentIndex === index;
          const color = isFocused ? '#fff' : 'rgba(255, 255, 255, 0.5)';

          return (
            <Pressable
              key={tab.name}
              style={styles.tabButton}
              onPress={tab.name === 'profile' ? handleProfilePress : () => goToPage(index)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={tab.title}
            >
              {tab.name === 'profile' ? (
                <ProfileTabIcon focused={isFocused} avatarUrl={avatarUrl} />
              ) : (
                <TabIcon index={index} focused={isFocused} color={color} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  pager: {
    flex: 1,
  },
  pageWrapper: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  pageContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    backgroundColor: '#000',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#000',
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
