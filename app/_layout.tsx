import { useEffect, useState } from "react";
import { Appearance } from "react-native";
import {
  DarkTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";

// Force dark appearance app-wide so the iOS 26 native tab bar (which
// inherits system appearance) stays dark on a Light-mode simulator/device.
Appearance.setColorScheme("dark");
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import * as Font from "expo-font";
import * as Notifications from "expo-notifications";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import Ionicons from "@expo/vector-icons/Ionicons";
import "react-native-reanimated";
import { enableFreeze } from "react-native-screens";
import { registerGlobals } from "@livekit/react-native";

enableFreeze(true);

try {
  registerGlobals();
} catch (err) {
  console.warn('[LiveKit] registerGlobals failed:', err);
}

import { ThemeProvider, useAppTheme } from "@/lib/providers/theme-provider";
import { AuthProvider } from "@/lib/providers/auth-provider";
import { QueryProvider } from "@/lib/providers/query-provider";
import { ToastProvider } from "@/components/shared/toast";
import { TabNavigationProvider } from "@/lib/providers/tab-navigation-provider";
import { TabBarSheetProvider } from "@/lib/providers/tab-bar-sheet-provider";
import { LiveLocationProvider } from "@/lib/providers/live-location-provider";
import { StripeProvider } from "@/lib/providers/stripe-provider";
import { ChatSocketProvider } from "@/lib/providers/chat-socket-provider";
import { ChannelsSocketProvider } from "@/lib/providers/channels-socket-provider";
import { CallProvider } from "@/lib/providers/call-provider";
import { RoleProvider } from "@/lib/providers/role-provider";
import { ActorContextProvider } from "@/lib/providers/actor-context-provider";
import { ImpersonationProvider } from "@/lib/providers/impersonation-provider";
import { WalletProvider } from "@/lib/providers/wallet-provider";
import { RootErrorBoundary } from "@/components/shared/error-boundary";

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync("#000000");

function useNotificationObserver() {
  useEffect(() => {
    function redirect(notification: Notifications.Notification) {
      const data = notification.request.content.data as
        | { url?: string }
        | undefined;
      const url = data?.url;
      if (typeof url === "string") {
        router.push(url as any);
      }
    }

    // Cold start — app was killed, user tapped notification to launch
    const response = Notifications.getLastNotificationResponse();
    if (response?.notification) {
      redirect(response.notification);
    }

    // Foreground + background — user taps notification while app is running
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        redirect(response.notification);
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);
}

function RootLayoutNav() {
  const { isDark } = useAppTheme();
  useNotificationObserver();

  return (
    <NavigationThemeProvider value={DarkTheme}>
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
          // number. The gesture is horizontal, so the responsive distance maps
          // to the leading (`start`) edge — same 300px swipe region as before.
          gestureResponseDistance: { start: 300 },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="signin"
          options={{
            presentation: "fullScreenModal",
            animation: "fade",
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
        <Stack.Screen name="chat/[conversationId]" />
        <Stack.Screen name="channel/[id]" />
        <Stack.Screen name="channel/[id]/compose" options={{ presentation: "modal" }} />
        <Stack.Screen name="channel/[id]/settings" />
        <Stack.Screen name="create-channel" />
        <Stack.Screen name="discover-channels" />
        <Stack.Screen
          name="new-message"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            fullScreenGestureEnabled: false,
          }}
        />
        <Stack.Screen name="user-profile/[userId]" />
        <Stack.Screen name="post/[id]" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen
          name="create-post"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            fullScreenGestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="call"
          options={{
            presentation: "fullScreenModal",
            animation: "slide_from_bottom",
            gestureEnabled: false,
            fullScreenGestureEnabled: false,
          }}
        />
        <Stack.Screen name="messages" />
        <Stack.Screen name="map" />
        <Stack.Screen name="deal/[id]" />
        <Stack.Screen name="deal-engine/new" />
        <Stack.Screen name="deal-engine/[id]" />
        <Stack.Screen name="athlete/contract-scan" />
        <Stack.Screen name="section/[id]" />
        <Stack.Screen name="card/[id]" />
        <Stack.Screen name="game/[id]" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="notification-settings" />
        <Stack.Screen name="privacy-settings" />
        <Stack.Screen name="admin" />
        {__DEV__ && <Stack.Screen name="_dev" />}
        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
            title: "Modal",
            fullScreenGestureEnabled: false,
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        const { Orbitron_700Bold, Orbitron_900Black } = await import(
          "@expo-google-fonts/orbitron"
        );
        const {
          Montserrat_400Regular,
          Montserrat_500Medium,
          Montserrat_700Bold,
        } = await import("@expo-google-fonts/montserrat");
        const { Bangers_400Regular } = await import("@expo-google-fonts/bangers");
        await Font.loadAsync({
          ...Ionicons.font,
          Lato_300Light: require("../assets/fonts/Lato_300Light.ttf"),
          Lato_400Regular: require("../assets/fonts/Lato_400Regular.ttf"),
          Lato_700Bold: require("../assets/fonts/Lato_700Bold.ttf"),
          Lato_900Black: require("../assets/fonts/Lato_900Black.ttf"),
          Orbitron_700Bold,
          Orbitron_900Black,
          Montserrat_400Regular,
          Montserrat_500Medium,
          Montserrat_700Bold,
          Bangers_400Regular,
        });
        setFontsLoaded(true);
      } catch (e) {
        console.log("Font loading error:", e);
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
    <RootErrorBoundary>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider defaultTheme="light">
        <QueryProvider>
          <StripeProvider>
            <ToastProvider>
              <AuthProvider>
                <ImpersonationProvider>
                <RoleProvider>
                <WalletProvider>
                <ActorContextProvider>
                <ChatSocketProvider>
                  <ChannelsSocketProvider>
                  <CallProvider>
                      <LiveLocationProvider>
                        <TabNavigationProvider>
                          <TabBarSheetProvider>
                              <BottomSheetModalProvider>
                                <RootLayoutNav />
                              </BottomSheetModalProvider>
                          </TabBarSheetProvider>
                        </TabNavigationProvider>
                      </LiveLocationProvider>
                  </CallProvider>
                  </ChannelsSocketProvider>
                </ChatSocketProvider>
                </ActorContextProvider>
                </WalletProvider>
                </RoleProvider>
                </ImpersonationProvider>
              </AuthProvider>
            </ToastProvider>
          </StripeProvider>
        </QueryProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
    </RootErrorBoundary>
  );
}
