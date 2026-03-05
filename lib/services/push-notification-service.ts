import { Platform } from 'react-native';
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
    this.currentToken = tokenData.data as string;

    // Send to backend
    callsApi
      .registerDeviceToken(this.currentToken, 'ios', 'push')
      .catch((err) => {
        console.error('[PushNotification] Failed to register token:', err);
      });

    // Listen for notification taps
    this.responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        this.handleNotificationTap(response);
      });

    this.registered = true;
  }

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
    this.currentToken = null;
    this.registered = false;
  }
}

export const pushNotificationService = new PushNotificationService();
