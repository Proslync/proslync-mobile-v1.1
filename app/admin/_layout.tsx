import { Stack } from "expo-router";

export default function AdminLayout() {
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
      <Stack.Screen name="users" />
      <Stack.Screen name="events" />
      <Stack.Screen name="posts" />
      <Stack.Screen name="moderation" />
      <Stack.Screen name="rules" />
    </Stack>
  );
}
