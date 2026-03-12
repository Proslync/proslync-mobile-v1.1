import { Stack } from "expo-router";

export default function ManageVenueLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "ios_from_right",
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        fullScreenGestureShadowEnabled: true,
        gestureDirection: "horizontal",
        customAnimationOnGesture: true,
        animationMatchesGesture: true,
        animationDuration: 350,
        freezeOnBlur: true,
        gestureResponseDistance: 300,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="events" />
      <Stack.Screen name="info" />
      <Stack.Screen name="tables" />
      <Stack.Screen name="menu" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="followers" />
    </Stack>
  );
}
