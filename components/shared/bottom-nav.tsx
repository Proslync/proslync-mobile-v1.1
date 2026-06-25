import * as React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/providers/auth-provider';
import { useRole, type ProfileRole } from '@/lib/providers/role-provider';
import { personaFor } from '@/lib/demo/personas';
import { IdentityAvatar } from '@/components/shared/identity-avatar';
import { useAppTheme } from '@/hooks/use-app-theme';

// Per-role tab photo. Roles without a photo fall back to their IdentityAvatar
// (colored initials circle) so EVERY role shows a real profile pic in the
// bottom-right — not the generic default.
const ROLE_TAB_PHOTO: Partial<Record<ProfileRole, ReturnType<typeof require>>> = {
  player: require('@/assets/images/kiyan-avatar-tab.png'),
  coach: require('@/assets/images/coach-avatar-tab.png'),
};

type TabName = 'search' | 'explore' | 'index' | 'activity' | 'profile';

interface TabConfig {
  name: TabName;
  label: string;
  path: string;
  icon: string;
  iconFocused: string;
  size: number;
}

const TABS: TabConfig[] = [
  { name: 'search', label: 'Map', path: '/map', icon: 'map-outline', iconFocused: 'map', size: 26 },
  { name: 'explore', label: 'Messages', path: '/messages', icon: 'paper-plane-outline', iconFocused: 'paper-plane', size: 24 },
  { name: 'index', label: 'Home', path: '/(tabs)', icon: 'home-outline', iconFocused: 'home-sharp', size: 24 },
  { name: 'activity', label: 'Wallet', path: '/(tabs)/activity', icon: 'wallet-outline', iconFocused: 'wallet', size: 26 },
  { name: 'profile', label: 'Profile', path: '/(tabs)/profile', icon: 'person-outline', iconFocused: 'person', size: 24 },
];

function ProfileTabIcon({ focused }: { focused: boolean }) {
  const { user } = useAuth();
  const { role } = useRole();
  const persona = personaFor(role);

  // Player keeps any custom-uploaded avatar; otherwise each role shows its
  // own identity (photo where we have one, else a colored initials circle).
  const photo =
    role === 'player' && user?.avatar?.url
      ? { uri: user.avatar.url }
      : ROLE_TAB_PHOTO[role];

  return (
    <View style={[styles.profileWrapper, focused && styles.profileWrapperActive]}>
      {photo ? (
        <Image source={photo} style={styles.profileImage} />
      ) : (
        <IdentityAvatar name={persona.displayName} size={26} accent={persona.accent} />
      )}
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
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
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
