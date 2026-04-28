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

    try {
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

      let tokenData: Notifications.DevicePushToken;
      try {
        tokenData = await Notifications.getDevicePushTokenAsync();
      } catch (err) {
        console.warn('[PushNotification] Device token unavailable:', err);
        return;
      }
      this.registerTokenWithBackend(tokenData.data as string);

      this.tokenRefreshSubscription =
        Notifications.addPushTokenListener((newToken) => {
          const token = newToken.data as string;
          if (token === this.currentToken) return;
          this.registerTokenWithBackend(token);
        });

      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

      Notifications.setBadgeCountAsync(0).catch(() => {});

      this.registered = true;
    } catch (err) {
      console.warn('[PushNotification] register() failed:', err);
    }
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
