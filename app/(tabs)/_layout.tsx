// Swipeable Tab Layout - Instagram/Messenger style horizontal swipe navigation
// Uses react-native-pager-view for smooth 60fps interactive swipe with page peeking

import * as React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Dimensions } from 'react-native';
import PagerView, { PagerViewOnPageSelectedEvent } from 'react-native-pager-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/providers/auth-provider';
import { useTabNavigation } from '@/lib/providers/tab-navigation-provider';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useConversations } from '@/hooks/use-conversations';

// Safe imports - MapScreen uses @rnmapbox/maps native module which crashes in Expo Go
let MapScreen: React.ComponentType<any>;
try {
  MapScreen = require('./search').default;
} catch {
  // Fallback component defined inline - will use theme colors at render time
  MapScreen = () => {
    const { colors } = useAppTheme();
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text }}>Map requires a development build</Text>
      </View>
    );
  };
}

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
const DEFAULT_AVATAR = require('@/assets/images/default-avatar.png');

// Screen components array
const SCREENS = [MapScreen, MessagesScreen, HomeScreen, WalletScreen, ProfileScreen];

// Error boundary fallback component that uses theme
function ErrorFallback() {
  const { colors } = useAppTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: colors.text, fontSize: 16 }}>Something went wrong</Text>
    </View>
  );
}

// Error boundary to prevent one screen from crashing the entire tab layout
class ScreenErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}

// Tab page wrapper - memoized to prevent re-renders
interface TabPageWrapperProps {
  index: number;
  shouldRender: boolean;
  backgroundColor: string;
}

const TabPageWrapper = React.memo(function TabPageWrapper({ index, shouldRender, backgroundColor }: TabPageWrapperProps) {
  const ScreenComponent = SCREENS[index];

  if (!shouldRender) {
    return <View style={[styles.pageContainer, { backgroundColor }]} collapsable={false} />;
  }

  return (
    <View style={[styles.pageContainer, { backgroundColor }]} collapsable={false}>
      <ScreenErrorBoundary>
        <ScreenComponent />
      </ScreenErrorBoundary>
    </View>
  );
});

// Profile Tab Icon with avatar
function ProfileTabIcon({ focused, avatarUrl, defaultColor }: { focused: boolean; avatarUrl?: string; defaultColor: string }) {
  return (
    <View style={[styles.profileWrapper, { borderColor: focused ? '#fff' : defaultColor }]}>
      <Image
        source={avatarUrl ? { uri: avatarUrl } : require('@/assets/images/default-avatar.png')}
        style={styles.profileImage}
      />
    </View>
  );
}

// Regular Tab Icon
function TabIcon({ index, focused, color, showBadge }: { index: number; focused: boolean; color: string; showBadge?: boolean }) {
  const tab = TAB_CONFIG[index];
  const iconSize = tab.name === 'search' || tab.name === 'activity' ? 26 : 24;

  return (
    <View style={{ position: 'relative' }}>
      <Ionicons
        name={focused ? (tab.icon as any) : (tab.iconOutline as any)}
        size={iconSize}
        color={color}
      />
      {showBadge && (
        <View style={styles.unreadBadge} />
      )}
    </View>
  );
}

export default function SwipeableTabLayout() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { openAccountSwitcher, syncTabIndex } = useTabNavigation();
  const { colors, isDark } = useAppTheme();
  const { channelData } = useConversations(user?.id);
  const hasUnreadMessages = React.useMemo(
    () => channelData.some((ch) => ch.unreadCount > 0),
    [channelData],
  );

  const pagerRef = React.useRef<PagerView>(null);
  const [currentIndex, setCurrentIndex] = React.useState(DEFAULT_TAB_INDEX);
  const isNavigatingProgrammatically = React.useRef(false);

  // Pre-load adjacent pages immediately, remaining after first frame
  const [loadedPages, setLoadedPages] = React.useState<Set<number>>(
    () => new Set([DEFAULT_TAB_INDEX - 1, DEFAULT_TAB_INDEX, DEFAULT_TAB_INDEX + 1]),
  );

  React.useEffect(() => {
    // Load remaining pages on next frame so swipes are always smooth
    requestAnimationFrame(() => {
      setLoadedPages(new Set(TAB_CONFIG.map((_, i) => i)));
    });
  }, []);

  const avatarUrl = user?.avatar?.url;

  // Handle page selection (from swipe gesture or programmatic)
  const handlePageSelected = React.useCallback((e: PagerViewOnPageSelectedEvent) => {
    const newIndex = e.nativeEvent.position;

    // Avoid unnecessary state updates
    if (newIndex === currentIndex) return;

    setCurrentIndex(newIndex);
    // Sync with TabNavigationProvider so other components know which tab is active
    syncTabIndex(newIndex);

    // Haptic feedback on page change (only if from swipe, not programmatic)
    if (!isNavigatingProgrammatically.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    isNavigatingProgrammatically.current = false;
  }, [currentIndex, syncTabIndex]);

  // Navigate to tab programmatically (from tab bar tap)
  const goToPage = React.useCallback((index: number) => {
    if (index === currentIndex) return;

    isNavigatingProgrammatically.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pagerRef.current?.setPage(index);
  }, [currentIndex]);

  // Profile tab: navigate immediately, double-tap opens account switcher
  const lastProfileTapRef = React.useRef<number>(0);

  const handleProfilePress = React.useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastProfileTapRef.current;
    lastProfileTapRef.current = now;

    if (timeSinceLastTap < 300) {
      // Double tap — open account switcher
      openAccountSwitcher();
      lastProfileTapRef.current = 0;
    } else {
      // Single tap — navigate immediately (no delay)
      goToPage(4);
    }
  }, [goToPage, openAccountSwitcher]);

  const TAB_BAR_HEIGHT = 50 + insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Pager View - content extends behind tab bar for glass blur effect */}
      <View style={{ flex: 1 }}>
        <PagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={DEFAULT_TAB_INDEX}
          onPageSelected={handlePageSelected}
          overdrag={true}
          offscreenPageLimit={2}
        >
          {TAB_CONFIG.map((_, index) => (
            <View key={index} style={styles.pageWrapper} collapsable={false}>
              <TabPageWrapper index={index} shouldRender={loadedPages.has(index)} backgroundColor={colors.background} />
            </View>
          ))}
        </PagerView>
      </View>

      {/* Custom Tab Bar */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom + 4, height: TAB_BAR_HEIGHT }]}>
        <View style={[styles.tabBarBackground, { backgroundColor: colors.background, borderTopColor: colors.border }]} />
        {TAB_CONFIG.map((tab, index) => {
          const isFocused = currentIndex === index;
          const color = isFocused ? colors.tabIconSelected : colors.tabIconDefault;

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
                <ProfileTabIcon focused={isFocused} avatarUrl={avatarUrl} defaultColor={colors.tabIconDefault} />
              ) : (
                <TabIcon index={index} focused={isFocused} color={color} showBadge={tab.name === 'explore' && hasUnreadMessages} />
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
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingTop: 4,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 0.5,
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
    // borderColor set dynamically
  },
  profileImage: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
});
