import { Platform } from 'react-native';
import { requireNativeModule, EventEmitter } from 'expo-modules-core';
export type { Subscription } from 'expo-modules-core';

const isIOS = Platform.OS === 'ios';

// requireNativeModule THROWS synchronously if the native module isn't registered
// (e.g., signed prod builds where entitlements / push capability differ from
// the dev binary). That throw at module-load time would crash the entire app
// before React mounts, so wrap it.
const VoipPush: any = (() => {
  if (!isIOS) return null;
  try {
    return requireNativeModule('VoipPush');
  } catch (err) {
    console.warn('[VoipPush] native module unavailable:', err);
    return null;
  }
})();
const emitter = VoipPush ? new EventEmitter(VoipPush) : null;

export function addTokenListener(
  listener: (token: string) => void,
): ReturnType<typeof emitter.addListener> | null {
  if (!emitter) return null;
  return emitter.addListener('onVoipToken', (event: { token: string }) => {
    listener(event.token);
  });
}

export function addNotificationListener(
  listener: (payload: Record<string, any>) => void,
): ReturnType<typeof emitter.addListener> | null {
  if (!emitter) return null;
  return emitter.addListener('onVoipNotification', (payload: Record<string, any>) => {
    listener(payload);
  });
}

export function addCallAnsweredListener(
  listener: (callId: string) => void,
): ReturnType<typeof emitter.addListener> | null {
  if (!emitter) return null;
  return emitter.addListener('onCallAnswered', (event: { callId: string }) => {
    listener(event.callId);
  });
}

export function addCallEndedListener(
  listener: (callId: string) => void,
): ReturnType<typeof emitter.addListener> | null {
  if (!emitter) return null;
  return emitter.addListener('onCallEnded', (event: { callId: string }) => {
    listener(event.callId);
  });
}

export function getToken(): string | null {
  if (!VoipPush) return null;
  return VoipPush.getToken() ?? null;
}

export function startOutgoingCall(callId: string, callerName: string, isVideo: boolean): void {
  if (!VoipPush) return;
  VoipPush.startOutgoingCall(callId, callerName, isVideo);
}

export function reportCallConnected(callId: string): void {
  if (!VoipPush) return;
  VoipPush.reportCallConnected(callId);
}

export function fulfillAnswerAction(callId: string): void {
  if (!VoipPush) return;
  VoipPush.fulfillAnswerAction(callId);
}

export function endNativeCall(callId: string): void {
  if (!VoipPush) return;
  VoipPush.endCall(callId);
}
