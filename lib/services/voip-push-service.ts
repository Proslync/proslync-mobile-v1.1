import { Platform } from 'react-native';
import { addTokenListener, addNotificationListener, getToken, type Subscription } from '@/modules/voip-push';
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
    console.log('[VoipPush] Registering for VoIP push...');

    // Check for a cached token (arrives before JS listeners are set up)
    const cachedToken = getToken();
    if (cachedToken) {
      console.log('[VoipPush] Cached token found:', cachedToken.substring(0, 8) + '...');
      this.registerTokenWithBackend(cachedToken);
    }

    // Handle receiving the VoIP push token (for future token refreshes)
    this.subscriptions.push(
      addTokenListener((token: string) => {
        if (token === this.currentToken) return;
        console.log('[VoipPush] Token received:', token.substring(0, 8) + '...');
        this.registerTokenWithBackend(token);
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

  private registerTokenWithBackend(token: string) {
    this.currentToken = token;
    callsApi.registerDeviceToken(token, 'ios').catch((err: unknown) => {
      console.error('[VoipPush] Failed to register token:', err);
    });
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
