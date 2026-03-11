import { AppState, type NativeEventSubscription, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { callsApi } from '@/lib/api/calls';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class PushNotificationService {
  private registered = false;
  private currentToken: string | null = null;
  private tokenRefreshSubscription: Notifications.Subscription | null = null;
  private appStateSubscription: NativeEventSubscription | null = null;

  async register() {
    if (Platform.OS !== 'ios' || this.registered) return;

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[PushNotification] Permission not granted');
      return;
    }

    // Get the native APNs device token (NOT Expo push token)
    const tokenData = await Notifications.getDevicePushTokenAsync();
    this.registerTokenWithBackend(tokenData.data as string);

    // Listen for token changes (OS update, restore from backup, etc.)
    this.tokenRefreshSubscription =
      Notifications.addPushTokenListener((newToken) => {
        const token = newToken.data as string;
        // Skip if same token already registered (avoids duplicate calls on login)
        if (token === this.currentToken) return;
        this.registerTokenWithBackend(token);
      });

    // Clear badge when app comes to foreground
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

    // Clear badge on initial register (app just opened)
    Notifications.setBadgeCountAsync(0).catch(() => {});

    this.registered = true;
  }

  private registerTokenWithBackend(token: string) {
    this.currentToken = token;
    callsApi
      .registerDeviceToken(token, 'ios', 'push')
      .catch((err) => {
        console.error('[PushNotification] Failed to register token:', err);
      });
  }

  private handleAppStateChange = (state: string) => {
    if (state === 'active') {
      Notifications.setBadgeCountAsync(0).catch(() => {});
    }
  };

  async unregister() {
    if (this.tokenRefreshSubscription) {
      this.tokenRefreshSubscription.remove();
      this.tokenRefreshSubscription = null;
    }
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    // Deactivate push token on backend so logged-out users don't get pushes
    if (this.currentToken) {
      try {
        await callsApi.unregisterDeviceToken(this.currentToken);
      } catch {
        // Ignore errors during unregister
      }
      this.currentToken = null;
    }

    this.registered = false;
  }
}

export const pushNotificationService = new PushNotificationService();
