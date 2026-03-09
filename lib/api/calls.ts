import { apiClient } from './client';

export interface InitiateCallResponse {
  callId: string;
  roomName: string;
  token: string;
  wsUrl: string;
}

export interface AcceptCallResponse {
  callId: string;
  token: string;
  wsUrl: string;
}

export interface IncomingCallData {
  callId: string;
  callerId: number;
  callerName: string;
  isVideo: boolean;
  roomName: string;
  isGroup?: boolean;
  conversationId?: string;
}

export interface CallHistoryItem {
  id: string;
  type: 'audio' | 'video';
  status: 'pending' | 'active' | 'declined' | 'missed' | 'ended';
  initiator: { id: number; firstName: string | null; lastName: string | null; userName: string | null };
  recipient: { id: number; firstName: string | null; lastName: string | null; userName: string | null };
  isOutgoing: boolean;
  startedAt: string | null;
  endedAt: string | null;
  duration: number | null;
  createdAt: string;
}

export const callsApi = {
  initiateCall: (recipientId: number, isVideo: boolean) =>
    apiClient.post<InitiateCallResponse>('/api/calls/initiate', { recipientId, isVideo }),

  initiateGroupCall: (conversationId: string, isVideo: boolean) =>
    apiClient.post<InitiateCallResponse>('/api/calls/initiate-group', { conversationId, isVideo }),

  acceptCall: (callId: string) =>
    apiClient.post<AcceptCallResponse>(`/api/calls/${callId}/accept`),

  declineCall: (callId: string) =>
    apiClient.post<{ success: boolean }>(`/api/calls/${callId}/decline`),

  endCall: (callId: string) =>
    apiClient.post<{ success: boolean }>(`/api/calls/${callId}/end`),

  getCallHistory: () =>
    apiClient.get<{ calls: CallHistoryItem[] }>('/api/calls/history'),

  registerDeviceToken: (token: string, platform: 'ios' | 'android') =>
    apiClient.post<{ success: boolean }>('/api/calls/device-token', { token, platform }),

  unregisterDeviceToken: (token: string) =>
    apiClient.delete<{ success: boolean }>(`/api/calls/device-token/${token}`),
};
