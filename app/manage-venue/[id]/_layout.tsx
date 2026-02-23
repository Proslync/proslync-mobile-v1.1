import { Stack } from 'expo-router';

export default function ManageVenueLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="events" />
      <Stack.Screen name="info" />
      <Stack.Screen name="tables" />
      <Stack.Screen name="analytics" />
    </Stack>
  );
}
