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
import { WalletProvider } from "@/lib/providers/wallet-provider";
import { ToastProvider } from "@/components/shared/toast";
import { TabNavigationProvider } from "@/lib/providers/tab-navigation-provider";
import { TabBarSheetProvider } from "@/lib/providers/tab-bar-sheet-provider";
import { LiveLocationProvider } from "@/lib/providers/live-location-provider";
import { StripeProvider } from "@/lib/providers/stripe-provider";
// StripeTerminal removed for free-signing build (needs paid proximity-reader entitlement)
// import { TerminalProvider } from "@/lib/providers/terminal-provider";
import { ChatSocketProvider } from "@/lib/providers/chat-socket-provider";
import { ChannelsSocketProvider } from "@/lib/providers/channels-socket-provider";
import { BarSocketProvider } from "@/lib/providers/bar-socket-provider";
import { CallProvider } from "@/lib/providers/call-provider";
import { RoleProvider } from "@/lib/providers/role-provider";
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
          customAnimationOnGesture: true,
          animationMatchesGesture: true,
          animationDuration: 350,
          freezeOnBlur: true,
          gestureResponseDistance: 300,
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
        <Stack.Screen name="text-blast-compose" />
        <Stack.Screen
          name="new-message"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            fullScreenGestureEnabled: false,
          }}
        />
        <Stack.Screen name="user-profile/[userId]" />
        <Stack.Screen name="event/[id]" />
        <Stack.Screen name="event/my-tab" />
        <Stack.Screen name="post/[id]" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="create-event" />
        <Stack.Screen name="my-events" />
        <Stack.Screen name="manage-event/[id]" />
        <Stack.Screen name="manage-venue/[id]" />
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
        <Stack.Screen
          name="scan-qr"
          options={{
            presentation: "fullScreenModal",
            animation: "slide_from_bottom",
            fullScreenGestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="qr-card"
          options={{
            presentation: "fullScreenModal",
            animation: "slide_from_bottom",
            fullScreenGestureEnabled: false,
          }}
        />
        <Stack.Screen name="tap-to-pay" />
        <Stack.Screen
          name="wallet"
          options={{ animation: "none", gestureEnabled: false }}
        />
        <Stack.Screen name="map" />
        <Stack.Screen name="messages" />
        <Stack.Screen name="nil-manager/athlete/[id]" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="notification-settings" />
        <Stack.Screen name="privacy-settings" />
        <Stack.Screen name="admin" />
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
                <RoleProvider>
                <ChatSocketProvider>
                  <ChannelsSocketProvider>
                  <BarSocketProvider>
                  <CallProvider>
                      <LiveLocationProvider>
                        <TabNavigationProvider>
                          <TabBarSheetProvider>
                            <WalletProvider>
                              <BottomSheetModalProvider>
                                <RootLayoutNav />
                              </BottomSheetModalProvider>
                            </WalletProvider>
                          </TabBarSheetProvider>
                        </TabNavigationProvider>
                      </LiveLocationProvider>
                  </CallProvider>
                  </BarSocketProvider>
                  </ChannelsSocketProvider>
                </ChatSocketProvider>
                </RoleProvider>
              </AuthProvider>
            </ToastProvider>
          </StripeProvider>
        </QueryProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
    </RootErrorBoundary>
  );
}
