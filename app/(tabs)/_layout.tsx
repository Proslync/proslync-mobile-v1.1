// Native Tab Layout — uses Apple's UITabBarController for real liquid glass on iOS 26+
// The native tab bar provides the draggable glass indicator bubble automatically

import {
  TAB_ORDER,
  useTabNavigation,
} from "@/lib/providers/tab-navigation-provider";
import { useRole } from "@/lib/providers/role-provider";
import { usePathname } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import * as React from "react";
import { View, StyleSheet } from "react-native";

const ROLE_AVATARS = {
  player: require("@/assets/images/kiyan-avatar-tab.png"),
  coach: require("@/assets/images/coach-avatar-tab.png"),
  agent: require("@/assets/images/kiyan-avatar-tab.png"),
  brand: require("@/assets/images/kiyan-avatar-tab.png"),
  fan: require("@/assets/images/kiyan-avatar-tab.png"),
  school: require("@/assets/images/kiyan-avatar-tab.png"),
  nilManager: require("@/assets/images/kiyan-avatar-tab.png"),
} as const;

export default function TabLayout() {
  const { syncTabIndex } = useTabNavigation();
  const { role } = useRole();
  const pathname = usePathname();

  React.useEffect(() => {
    const segment = pathname === "/" ? "index" : pathname.replace("/", "");
    const index = TAB_ORDER.indexOf(segment as any);
    if (index >= 0) {
      syncTabIndex(index);
    }
  }, [pathname, syncTabIndex]);

  return (
    <View style={styles.container}>
    <NativeTabs tintColor="#FF6F3C" minimizeBehavior="onScrollDown" screenOptions={{ contentStyle: { backgroundColor: '#000' } }}>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>{""}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "house", selected: "house.fill" }}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="activity">
          <NativeTabs.Trigger.Label>{""}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Label>{""}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            src={ROLE_AVATARS[role]}
            renderingMode="original"
          />
        </NativeTabs.Trigger>
      </NativeTabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
