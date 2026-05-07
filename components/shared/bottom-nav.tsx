import * as React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/providers/auth-provider';
import { useAppTheme } from '@/hooks/use-app-theme';

const DEFAULT_AVATAR = require('@/assets/images/default-avatar.png');

type TabName = 'search' | 'explore' | 'index' | 'activity' | 'profile';

interface TabConfig {
  name: TabName;
  path: string;
  icon: string;
  iconFocused: string;
  size: number;
}

const TABS: TabConfig[] = [
  { name: 'search', path: '/map', icon: 'map-outline', iconFocused: 'map', size: 26 },
  { name: 'explore', path: '/messages', icon: 'paper-plane-outline', iconFocused: 'paper-plane', size: 24 },
  { name: 'index', path: '/(tabs)', icon: 'home-outline', iconFocused: 'home-sharp', size: 24 },
  { name: 'activity', path: '/(tabs)/activity', icon: 'wallet-outline', iconFocused: 'wallet', size: 26 },
  { name: 'profile', path: '/(tabs)/profile', icon: 'person-outline', iconFocused: 'person', size: 24 },
];

function ProfileTabIcon({ focused }: { focused: boolean }) {
  const { user } = useAuth();
  const avatarUrl = user?.avatar?.url;

  return (
    <View style={[styles.profileWrapper, focused && styles.profileWrapperActive]}>
      <Image
        source={avatarUrl ? { uri: avatarUrl } : DEFAULT_AVATAR}
        style={styles.profileImage}
      />
    </View>
  );
}

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const getActiveTab = (): TabName => {
    if (pathname.includes('/search')) return 'search';
    if (pathname.includes('/explore')) return 'explore';
    if (pathname.includes('/activity')) return 'activity';
    if (pathname.includes('/profile')) return 'profile';
    return 'index';
  };

  const activeTab = getActiveTab();

  const handleTabPress = (tab: TabConfig) => {
    router.push(tab.path as any);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 4, backgroundColor: colors.background }]}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.name;
        const isProfile = tab.name === 'profile';

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabButton}
            onPress={() => handleTabPress(tab)}
            activeOpacity={0.7}
          >
            {isProfile ? (
              <ProfileTabIcon focused={isActive} />
            ) : (
              <Ionicons
                name={(isActive ? tab.iconFocused : tab.icon) as any}
                size={tab.size}
                color={isActive ? '#fff' : 'rgba(255, 255, 255, 0.5)'}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    paddingTop: 4,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
