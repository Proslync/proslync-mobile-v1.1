import Ionicons from "@expo/vector-icons/Ionicons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { GlassView } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  FAN_MODE_ROUTE_ORDER,
  getFanRouteSpineItem,
  getRoleSpineItemByRoute,
  type FanModeRouteName,
  type RoleSpineIconName,
  type RoleSpineRouteName,
} from "@/lib/navigation/role-spine";
import {
  TAB_ORDER,
  useTabNavigation,
  type TabName,
} from "@/lib/providers/tab-navigation-provider";
import { useAuth } from "@/lib/providers/auth-provider";
import { useMode, useRole } from "@/lib/providers/role-provider";

// PR-1 (nav-restoration 2026-05-11): restore Arshia's live-avatar profile-tab
// affordance. Arshia's NativeTabs config (commit 46df805, file
// app/(tabs)/_layout.tsx) rendered the profile tab with a real user image
// via `src={require('@/assets/images/kiyan-avatar-tab.png')}` + the
// `renderingMode="original"` flag. That was lost when this custom
// PastelTabBar replaced NativeTabs. We restore identity affordance here by
// swapping the Ionicon for an Image only on the 'profile' / 'account' slot.
const DEFAULT_AVATAR_IMAGE = require("@/assets/images/default-avatar.png");

function isProRouteName(name: string): name is TabName {
  return (TAB_ORDER as readonly string[]).includes(name);
}

function isFanRouteName(name: string): name is FanModeRouteName {
  return (FAN_MODE_ROUTE_ORDER as readonly string[]).includes(name);
}

interface TabVisual {
  label: string;
  icon: RoleSpineIconName;
  selectedIcon: RoleSpineIconName;
  color: string;
  surface: string;
}

export function PastelTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { role } = useRole();
  const { mode } = useMode();
  const { user } = useAuth();
  const { syncTabIndex, setTabBarTopOffset } = useTabNavigation();
  const avatarUrl = user?.avatar?.url;

  // tab-navigation-provider's index ordering is keyed on the pro spine.
  // Fan-mode has a different ordering, but the same provider is consumed by
  // both shells. Only sync from pro routes — fan routes don't have a stable
  // index in TAB_ORDER and shouldn't drive the provider's index state.
  React.useEffect(() => {
    if (mode !== 'pro') return;
    const focusedRouteName = state.routes[state.index]?.name;
    const focusedTabIndex = focusedRouteName
      ? TAB_ORDER.indexOf(focusedRouteName as TabName)
      : -1;
    if (focusedTabIndex >= 0) {
      syncTabIndex(focusedTabIndex);
    }
  }, [mode, state.index, state.routes, syncTabIndex]);

  return (
    <View
      style={[styles.safeArea, { paddingBottom: Math.max(insets.bottom, 8) }]}
      onLayout={(event) => setTabBarTopOffset(event.nativeEvent.layout.height)}
    >
      <LinearGradient
        colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.85)"]}
        locations={[0, 0.6, 1]}
        style={styles.fade}
        pointerEvents="none"
      />
      <View style={styles.glassPill}>
        <GlassView
          glassEffectStyle="regular"
          style={[StyleSheet.absoluteFill, { borderRadius: 26 }]}
        />
        <View style={styles.bar}>
        {state.routes.map((route, index) => {
          let visual: TabVisual | null = null;

          if (mode === 'fan' && isFanRouteName(route.name)) {
            const item = getFanRouteSpineItem(route.name);
            visual = {
              label: item.label,
              icon: item.icon,
              selectedIcon: item.selectedIcon,
              color: item.color,
              surface: item.surface,
            };
          } else if (mode === 'pro' && isProRouteName(route.name)) {
            const item = getRoleSpineItemByRoute(role, route.name as RoleSpineRouteName);
            visual = {
              label: item.label,
              icon: item.icon,
              selectedIcon: item.selectedIcon,
              color: item.color,
              surface: item.surface,
            };
          }

          if (!visual) return null;

          const focused = state.index === index;
          const descriptor = descriptors[route.key];

          const handlePress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              Haptics.selectionAsync();
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={descriptor.options.tabBarAccessibilityLabel}
              onPress={handlePress}
              style={({ pressed, hovered }) => [
                styles.tab,
                focused && styles.tabFocused,
                hovered && !focused && styles.tabHover,
                pressed && styles.tabPressed,
              ]}
            >
              {route.name === "profile" ? (
                <View
                  style={[
                    styles.avatarRing,
                    focused && { borderColor: visual.color, borderWidth: 1.5 },
                  ]}
                >
                  <Image
                    source={avatarUrl ? { uri: avatarUrl } : DEFAULT_AVATAR_IMAGE}
                    style={styles.avatarImage}
                  />
                </View>
              ) : (
                <Ionicons
                  name={focused ? visual.selectedIcon : visual.icon}
                  size={20}
                  color={focused ? visual.color : "rgba(255,255,255,0.58)"}
                />
              )}
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  focused && { color: visual.color, fontWeight: "800" },
                ]}
              >
                {visual.label}
              </Text>
            </Pressable>
          );
        })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Liquid-glass refactor (fan-dashboard-remix-2026-05-12 Phase E). The
  // shell is transparent so scroll content faintly bleeds through the
  // glass pill; a soft top-edge fade darkens the area just above the bar
  // so it reads as a floating chrome layer rather than a wall.
  safeArea: {
    backgroundColor: "transparent",
    overflow: "visible",
  },
  fade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: -64,
    height: 80,
  },
  glassPill: {
    marginHorizontal: 10,
    borderRadius: 26,
    overflow: "hidden",
  },
  bar: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    minHeight: 62,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  tab: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: 18,
    borderWidth: 0,
    flex: 1,
    gap: 3,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  // Focused tab — pure neutral glass-friendly white-bloom, no pastel hex
  // tint. The slot's accent color only travels via the icon + label, not
  // through a colored backdrop tile. Was `${visual.color}24` in the prior
  // pass; user flagged it as still reading "pastel" through the glass.
  tabFocused: {
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  tabHover: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  tabPressed: {
    backgroundColor: "rgba(255,255,255,0.14)",
    opacity: 0.9,
  },
  label: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 14,
  },
  // PR-1: live avatar slot for profile tab. Same 20pt visual weight as the
  // Ionicons it replaces, with a thin ring that picks up the slot's color
  // when the tab is focused.
  avatarRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderColor: "rgba(255,255,255,0.40)",
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});
