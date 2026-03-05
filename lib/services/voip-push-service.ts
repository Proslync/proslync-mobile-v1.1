import { Platform } from 'react-native';
import { addTokenListener, addNotificationListener, type Subscription } from '@/modules/voip-push';
import { callsApi } from '@/lib/api/calls';

class VoipPushService {
  private registered = false;
  private currentToken: string | null = null;
  private subscriptions: (Subscription | null)[] = [];

  /**
   * Register for VoIP push notifications (iOS only).
   * Must be called after the user is authenticated.
   *
   * Note: CallKit reporting happens natively in the AppDelegate push callback.
   * The JS notification listener is only for updating app state (e.g. incomingCall).
   */
  register() {
    if (Platform.OS !== 'ios' || this.registered) return;

    // Handle receiving the VoIP push token
    this.subscriptions.push(
      addTokenListener((token: string) => {
        this.currentToken = token;
        callsApi.registerDeviceToken(token, 'ios').catch((err) => {
          console.error('[VoipPush] Failed to register token:', err);
        });
      }),
    );

    // Handle incoming VoIP push notification (state only — CallKit already reported natively)
    this.subscriptions.push(
      addNotificationListener((payload: Record<string, any>) => {
        // Payload is available for call-provider to update state via a separate listener if needed
        // CallKit UI is already showing — no need to call reportIncomingCall from JS
        console.log('[VoipPush] Notification received:', payload.callId);
      }),
    );

    this.registered = true;
  }

  /**
   * Unregister the current VoIP token from the backend.
   */
  async unregister() {
    for (const sub of this.subscriptions) {
      sub?.remove();
    }
    this.subscriptions = [];
    this.registered = false;

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
