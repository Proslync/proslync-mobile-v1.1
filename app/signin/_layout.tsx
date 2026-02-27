import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '@/hooks/use-app-theme';

export default function SignInLayout() {
  const { isDark } = useAppTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
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
