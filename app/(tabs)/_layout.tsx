// Native Tab Layout — uses Apple's UITabBarController for real liquid glass on iOS 26+
// The native tab bar provides the draggable glass indicator bubble automatically

import { useConversations } from "@/hooks/use-conversations";
import { useAuth } from "@/lib/providers/auth-provider";
import {
  TAB_ORDER,
  useTabNavigation,
} from "@/lib/providers/tab-navigation-provider";
import { usePathname } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import * as React from "react";

export default function TabLayout() {
  const { user } = useAuth();
  const { syncTabIndex } = useTabNavigation();
  const { channelData } = useConversations(user?.id);
  const pathname = usePathname();

  React.useEffect(() => {
    const segment = pathname === "/" ? "index" : pathname.replace("/", "");
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
    <NativeTabs tintColor="#fff" minimizeBehavior="onScrollDown">
        <NativeTabs.Trigger name="search">
          <NativeTabs.Trigger.Icon
            sf={{ default: "map", selected: "map.fill" }}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="explore">
          <NativeTabs.Trigger.Icon
            sf={{ default: "paperplane", selected: "paperplane.fill" }}
          />
          {unreadCount > 0 && (
            <NativeTabs.Trigger.Badge>
              {String(unreadCount)}
            </NativeTabs.Trigger.Badge>
          )}
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon
            sf={{ default: "house", selected: "house.fill" }}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="activity">
          <NativeTabs.Trigger.Icon
            sf={{ default: "wallet.bifold", selected: "wallet.bifold.fill" }}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Icon
            sf={{
              default: "person.crop.circle",
              selected: "person.crop.circle.fill",
            }}
          />
        </NativeTabs.Trigger>
      </NativeTabs>
  );
}
