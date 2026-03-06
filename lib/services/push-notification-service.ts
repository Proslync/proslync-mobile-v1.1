import { AppState, type NativeEventSubscription, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { callsApi } from '@/lib/api/calls';
import { router } from 'expo-router';

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
  private responseSubscription: Notifications.Subscription | null = null;
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
        this.registerTokenWithBackend(newToken.data as string);
      });

    // Listen for notification taps
    this.responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        this.handleNotificationTap(response);
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

  private handleNotificationTap(
    response: Notifications.NotificationResponse,
  ) {
    const data = response.notification.request.content.data;
    if (!data) return;

    const type = data.type as string;

    switch (type) {
      case 'follow':
        if (data.followerId) {
          router.push(`/user/${data.followerId}` as any);
        }
        break;
      case 'like':
      case 'comment':
        if (data.postId) {
          router.push(`/post/${data.postId}` as any);
        }
        break;
      case 'payment':
        if (data.eventId) {
          router.push(`/manage-event/${data.eventId}` as any);
        }
        break;
      default:
        router.push('/notifications' as any);
    }
  }

  async unregister() {
    if (this.responseSubscription) {
      this.responseSubscription.remove();
      this.responseSubscription = null;
    }
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
