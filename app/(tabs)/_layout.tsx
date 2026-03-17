// Native Tab Layout — uses Apple's UITabBarController for real liquid glass on iOS 26+
// The native tab bar provides the draggable glass indicator bubble automatically

import * as React from 'react';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { usePathname } from 'expo-router';
import { useAuth } from '@/lib/providers/auth-provider';
import { useTabNavigation, TAB_ORDER } from '@/lib/providers/tab-navigation-provider';
import { useConversations } from '@/hooks/use-conversations';

export default function TabLayout() {
  const { user } = useAuth();
  const { syncTabIndex } = useTabNavigation();
  const { channelData } = useConversations(user?.id);
  const pathname = usePathname();

  React.useEffect(() => {
    const segment = pathname === '/' ? 'index' : pathname.replace('/', '');
    const index = TAB_ORDER.indexOf(segment as any);
    if (index >= 0) {
      syncTabIndex(index);
    }
  }, [pathname, syncTabIndex]);

  const unreadCount = React.useMemo(
    () => channelData.reduce((sum, ch) => sum + ch.unreadCount, 0),
    [channelData],
  );

  return (
    <NativeTabs tintColor="#fff">
      <NativeTabs.Trigger
        name="search"
        options={{
          title: '',
          icon: { sf: 'map' as any },
          selectedIcon: { sf: 'map.fill' as any },
        }}
      />
      <NativeTabs.Trigger
        name="explore"
        options={{
          title: '',
          icon: { sf: 'paperplane' as any },
          selectedIcon: { sf: 'paperplane.fill' as any },
          badgeValue: unreadCount > 0 ? String(unreadCount) : undefined,
        }}
      />
      <NativeTabs.Trigger
        name="index"
        options={{
          title: '',
          icon: { sf: 'house' as any },
          selectedIcon: { sf: 'house.fill' as any },
        }}
      />
      <NativeTabs.Trigger
        name="activity"
        options={{
          title: '',
          icon: { sf: 'wallet.bifold' as any },
          selectedIcon: { sf: 'wallet.bifold.fill' as any },
        }}
      />
      <NativeTabs.Trigger
        name="profile"
        options={{
          title: '',
          icon: { sf: 'person.crop.circle' as any },
          selectedIcon: { sf: 'person.crop.circle.fill' as any },
        }}
      />
    </NativeTabs>
  );
}
