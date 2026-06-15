// Fan-mode tab layout. Uses Apple's UITabBarController (via NativeTabs from
// expo-router/unstable-native-tabs) for real iOS 26+ liquid glass — same
// chrome as the pro `(tabs)` shell. The prior custom <PastelTabBar /> only
// approximated glass; the fan side now matches the pro side exactly.
//
// 4 fan tabs (post fan-dashboard-remix-2026-05-12):
//   • index     → Home (Fan HQ — canonical supporter landing)
//   • dashboard → Play (legacy fan dashboard: Feed + Pick'em + Perks — NOT a
//                 second home; index.tsx owns Home)
//   • explore   → universal ExploreView (Feed / Games / Discover)
//   • profile   → Account

import { NativeTabs } from "expo-router/unstable-native-tabs";
import * as React from "react";
import { StyleSheet, View } from "react-native";

import { FAN_ACCENT } from "@/constants/brand";

export default function FanTabLayout() {
  return (
    <View style={styles.container}>
      <NativeTabs tintColor={FAN_ACCENT} minimizeBehavior="onScrollDown">
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>{""}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "house", selected: "house.fill" }}
          />
        </NativeTabs.Trigger>
        {/* "Play" surface — Feed + Pick'em + Perks. Gamecontroller glyph (not a
            second house/grid) so it never reads as a duplicate Home tab. Label
            kept empty to match the icon-only fan spine. */}
        <NativeTabs.Trigger name="dashboard">
          <NativeTabs.Trigger.Label>{""}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "gamecontroller", selected: "gamecontroller.fill" }}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="explore">
          <NativeTabs.Trigger.Label>{""}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "safari", selected: "safari.fill" }}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Label>{""}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }}
          />
        </NativeTabs.Trigger>
      </NativeTabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
});
