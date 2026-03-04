import { Platform } from 'react-native';
import RNCallKeep from 'react-native-callkeep';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type CallAnswerHandler = (callId: string) => void;
type CallEndHandler = (callId: string) => void;

class CallKitService {
  private initialized = false;
  // Maps callId → CallKit UUID
  private callIdToUuid = new Map<string, string>();
  // Maps CallKit UUID → callId
  private uuidToCallId = new Map<string, string>();

  private onAnswerCallback: CallAnswerHandler | null = null;
  private onEndCallback: CallEndHandler | null = null;

  async setup() {
    if (Platform.OS !== 'ios' || this.initialized) return;

    try {
      await RNCallKeep.setup({
        ios: {
          appName: 'Status',
          supportsVideo: true,
          maximumCallGroups: 1,
          maximumCallsPerCallGroup: 1,
        },
        android: {
          alertTitle: 'Permissions required',
          alertDescription: 'This app needs access to your phone calls',
          cancelButton: 'Cancel',
          okButton: 'OK',
        },
      });

      RNCallKeep.setAvailable(true);

      // Wire up CallKit delegate callbacks
      RNCallKeep.addEventListener('answerCall', this.handleAnswerCall);
      RNCallKeep.addEventListener('endCall', this.handleEndCall);

      this.initialized = true;
    } catch (error) {
      console.error('[CallKit] Setup failed:', error);
    }
  }

  setOnAnswer(handler: CallAnswerHandler) {
    this.onAnswerCallback = handler;
  }

  setOnEnd(handler: CallEndHandler) {
    this.onEndCallback = handler;
  }

  /**
   * Show native incoming call UI.
   * Called from VoIP push handler or Socket.IO handler.
   * Idempotent — won't create duplicate entries for the same callId.
   */
  reportIncomingCall(callId: string, callerName: string, isVideo: boolean): string {
    if (Platform.OS !== 'ios') return '';

    // Idempotent: if we already have a UUID for this callId, return it
    const existingUuid = this.callIdToUuid.get(callId);
    if (existingUuid) return existingUuid;

    const callUuid = generateUUID();
    this.callIdToUuid.set(callId, callUuid);
    this.uuidToCallId.set(callUuid, callId);

    RNCallKeep.displayIncomingCall(
      callUuid,
      callId, // handle (used as caller identifier)
      callerName,
      'generic',
      isVideo,
    );

    return callUuid;
  }

  /**
   * Report an outgoing call to CallKit so it shows in the system call UI.
   */
  reportOutgoingCall(callId: string, callerName: string): string {
    if (Platform.OS !== 'ios') return '';

    const callUuid = generateUUID();
    this.callIdToUuid.set(callId, callUuid);
    this.uuidToCallId.set(callUuid, callId);

    RNCallKeep.startCall(callUuid, callId, callerName, 'generic', false);

    return callUuid;
  }

  /**
   * Tell CallKit the call connected (audio started flowing).
   */
  reportCallConnected(callId: string) {
    if (Platform.OS !== 'ios') return;

    const callUuid = this.callIdToUuid.get(callId);
    if (callUuid) {
      RNCallKeep.reportConnectedOutgoingCallWithUUID(callUuid);
    }
  }

  /**
   * End a call in CallKit.
   */
  endCall(callId: string) {
    if (Platform.OS !== 'ios') return;

    const callUuid = this.callIdToUuid.get(callId);
    if (callUuid) {
      RNCallKeep.endCall(callUuid);
      this.cleanup(callId, callUuid);
    }
  }

  private handleAnswerCall = ({ callUUID }: { callUUID: string }) => {
    const callId = this.uuidToCallId.get(callUUID);
    if (callId && this.onAnswerCallback) {
      this.onAnswerCallback(callId);
    }
  };

  private handleEndCall = ({ callUUID }: { callUUID: string }) => {
    const callId = this.uuidToCallId.get(callUUID);
    if (callId) {
      if (this.onEndCallback) {
        this.onEndCallback(callId);
      }
      this.cleanup(callId, callUUID);
    }
  };

  private cleanup(callId: string, callUuid: string) {
    this.callIdToUuid.delete(callId);
    this.uuidToCallId.delete(callUuid);
  }
}

export const callkitService = new CallKitService();
