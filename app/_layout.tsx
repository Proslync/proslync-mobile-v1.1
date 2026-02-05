import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { useCallback, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/lib/providers/auth-provider';
import { StreamProvider } from '@/lib/providers/stream-provider';
import { WalletProvider } from '@/lib/providers/wallet-provider';
import { ToastProvider } from '@/components/shared/toast';
import { TabNavigationProvider } from '@/lib/providers/tab-navigation-provider';
import { ChatProvider } from '@/lib/providers/chat-provider';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Lato_300Light': require('../assets/fonts/Lato_300Light.ttf'),
          'Lato_400Regular': require('../assets/fonts/Lato_400Regular.ttf'),
          'Lato_700Bold': require('../assets/fonts/Lato_700Bold.ttf'),
          'Lato_900Black': require('../assets/fonts/Lato_900Black.ttf'),
        });
        setFontsLoaded(true);
      } catch (e) {
        console.log('Font loading error:', e);
        setFontsLoaded(true); // Continue anyway
      }
    }
    loadFonts();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ToastProvider>
        <AuthProvider>
          <TabNavigationProvider>
            <StreamProvider>
              <ChatProvider>
                <WalletProvider>
                  <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="index" />
                      <Stack.Screen name="signin" />
                      <Stack.Screen name="(tabs)" />
                      <Stack.Screen name="chat/[conversationId]" options={{ animation: 'slide_from_right' }} />
                      <Stack.Screen name="new-message" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                      <Stack.Screen name="user-profile/[userId]" options={{ animation: 'slide_from_right' }} />
                      <Stack.Screen
                        name="event/[id]"
                        options={{
                          presentation: 'modal',
                          animation: 'slide_from_bottom',
                          gestureEnabled: true,
                          gestureDirection: 'vertical',
                        }}
                      />
                      <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_right' }} />
                      <Stack.Screen name="dashboard" options={{ animation: 'slide_from_right' }} />
                      <Stack.Screen name="create-event" options={{ animation: 'slide_from_right' }} />
                      <Stack.Screen name="my-events" options={{ animation: 'slide_from_right' }} />
                      <Stack.Screen name="create-post" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                      <Stack.Screen name="scan-qr" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
                      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                    </Stack>
                    <StatusBar style="light" />
                  </ThemeProvider>
                </WalletProvider>
              </ChatProvider>
            </StreamProvider>
          </TabNavigationProvider>
        </AuthProvider>
      </ToastProvider>
    </GestureHandlerRootView>
  );
}
