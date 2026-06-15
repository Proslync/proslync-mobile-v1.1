// Native Tab Layout — uses Apple's UITabBarController for real liquid glass on iOS 26+
// The native tab bar provides the draggable glass indicator bubble automatically

import {
  TAB_ORDER,
  useTabNavigation,
} from "@/lib/providers/tab-navigation-provider";
import { useRole } from "@/lib/providers/role-provider";
import { personaFor } from "@/lib/demo/personas";
import { IdentityAvatar } from "@/components/shared/identity-avatar";
import { usePathname } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import * as React from "react";
import { View, StyleSheet } from "react-native";

// Player still uses the real Kiyan avatar photo for the tab icon.
const KIYAN_AVATAR_TAB = require("@/assets/images/kiyan-avatar-tab.png");
const COACH_AVATAR_TAB = require("@/assets/images/coach-avatar-tab.png");

/**
 * Returns the tab icon source for the profile trigger.
 * - player → real Kiyan photo (ImageSourcePropType)
 * - coach  → real coach photo (ImageSourcePropType)
 * - all other roles → IdentityAvatar React element (initials, role accent)
 *
 * NativeTabs.Trigger.Icon accepts `src` as ImageSourcePropType | React.ReactElement
 * so both branches are type-safe.
 *
 * TODO: if NativeTabs ignores React.ReactElement on a future SDK version,
 * fall back to a tinted SF symbol for non-player/coach roles.
 */
function getProfileTabIcon(role: ReturnType<typeof useRole>['role']): React.ReactElement | number {
  if (role === 'player') return KIYAN_AVATAR_TAB;
  if (role === 'coach') return COACH_AVATAR_TAB;
  const persona = personaFor(role);
  return (
    <IdentityAvatar
      name={persona.displayName}
      size={28}
      accent={persona.accent}
    />
  );
}

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

  const profileTabIcon = getProfileTabIcon(role);
  // tintColor is a static prop on NativeTabs — cannot read role at render time
  // for roles whose accent differs from copper without a re-mount.
  // TODO: thread persona accent into tintColor once NativeTabs supports
  //       dynamic tint without re-mounting the entire tab bar.
  const persona = personaFor(role);

  return (
    <View style={styles.container}>
    <NativeTabs tintColor={persona.accent} minimizeBehavior="onScrollDown" screenOptions={{ contentStyle: { backgroundColor: '#000' } }}>
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
            src={profileTabIcon}
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
