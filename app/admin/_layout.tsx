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
        // `customAnimationOnGesture` was removed from react-native-screens and
        // is now implied; the new API ignores it. `animationMatchesGesture`
        // remains the supported way to drive the gesture-matched animation.
        animationMatchesGesture: true,
        animationDuration: 350,
        freezeOnBlur: true,
        // react-native-screens now takes a per-edge object instead of a bare
        // number. The gesture is horizontal, so the responsive distance maps to
        // the leading (`start`) edge — same 300px swipe region as before.
        gestureResponseDistance: { start: 300 },
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
