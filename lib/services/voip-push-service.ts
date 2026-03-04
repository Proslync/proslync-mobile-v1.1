import { Platform } from 'react-native';
import VoipPushNotification from 'react-native-voip-push-notification';
import { callkitService } from './callkit-service';
import { callsApi } from '@/lib/api/calls';

class VoipPushService {
  private registered = false;
  private currentToken: string | null = null;

  /**
   * Register for VoIP push notifications (iOS only).
   * Must be called after the user is authenticated.
   */
  register() {
    if (Platform.OS !== 'ios' || this.registered) return;

    // Guard: native module may not be available yet
    if (!VoipPushNotification?.requestPermissions) {
      console.warn('[VoipPush] Native module not available');
      return;
    }

    // Register for VoIP push
    VoipPushNotification.requestPermissions();

    // Handle receiving the VoIP push token
    VoipPushNotification.addEventListener('register', (token: string) => {
      this.currentToken = token;
      // Send token to backend
      callsApi.registerDeviceToken(token, 'ios').catch((err) => {
        console.error('[VoipPush] Failed to register token:', err);
      });
    });

    // Handle incoming VoIP push notification
    VoipPushNotification.addEventListener(
      'notification',
      (notification: any) => {
        const payload = notification.getData?.() || notification;

        const callId = payload.callId as string;
        const callerName = (payload.callerName as string) || 'Unknown';
        const isVideo = !!payload.isVideo;

        if (callId) {
          // MUST report to CallKit immediately or iOS will revoke push privileges
          callkitService.reportIncomingCall(callId, callerName, isVideo);
        }

        // Tell the system we handled it
        VoipPushNotification.onVoipNotificationCompleted();
      },
    );

    // Handle queued events from when the app was terminated
    VoipPushNotification.addEventListener(
      'didLoadWithEvents',
      (events: any[]) => {
        if (!events || events.length === 0) return;

        for (const event of events) {
          if (event.name === 'RNVoipPushRemoteNotificationsRegisteredEvent') {
            // Token event
            this.currentToken = event.data;
            callsApi.registerDeviceToken(event.data, 'ios').catch(() => {});
          } else if (
            event.name === 'RNVoipPushRemoteNotificationReceivedEvent'
          ) {
            // Push notification event
            const payload = event.data;
            const callId = payload?.callId as string;
            const callerName = (payload?.callerName as string) || 'Unknown';
            const isVideo = !!payload?.isVideo;

            if (callId) {
              callkitService.reportIncomingCall(callId, callerName, isVideo);
            }
          }
        }
      },
    );

    this.registered = true;
  }

  /**
   * Unregister the current VoIP token from the backend.
   */
  async unregister() {
    if (this.currentToken) {
      try {
        await callsApi.unregisterDeviceToken(this.currentToken);
      } catch {
        // Ignore errors during unregister
      }
      this.currentToken = null;
    }
  }
}

export const voipPushService = new VoipPushService();
