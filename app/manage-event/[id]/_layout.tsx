import { Stack } from 'expo-router';

export default function ManageEventLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="overview" />
      <Stack.Screen name="attendees" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="pricing" />
      <Stack.Screen name="marketing" />
      <Stack.Screen name="payments" />
      <Stack.Screen name="team" />
      <Stack.Screen name="artists" />
    </Stack>
  );
}
