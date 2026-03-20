import { Stack } from "expo-router";

export default function ManageEventLayout() {
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
      <Stack.Screen name="overview" />
      <Stack.Screen name="attendees" />
      <Stack.Screen name="check-ins" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="pricing" />
      <Stack.Screen name="marketing" />
      <Stack.Screen name="text-blast" />
      <Stack.Screen name="text-blast-audience" />
      <Stack.Screen name="payments" />
      <Stack.Screen name="revenue" />
      <Stack.Screen name="team" />
      <Stack.Screen name="bar" />
      <Stack.Screen name="bar-tab-detail" />
    </Stack>
  );
}
