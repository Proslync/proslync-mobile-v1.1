import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function SignInLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'fade',
        }}
      />
    </>
  );
}
