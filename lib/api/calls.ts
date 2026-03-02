import { apiClient } from './client';

export interface CallTokenResponse {
  token: string;
  wsUrl: string;
  callId: string;
  roomName: string;
}

export interface AcceptCallResponse {
  token: string;
  wsUrl: string;
}

export interface CallHistoryItem {
  id: string;
  type: 'audio' | 'video';
  status: 'pending' | 'active' | 'declined' | 'missed' | 'ended';
  initiator: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    userName: string | null;
  };
  recipient: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    userName: string | null;
  };
  isOutgoing: boolean;
  startedAt: string | null;
  endedAt: string | null;
  duration: number | null;
  createdAt: string;
}

export interface CallHistoryResponse {
  calls: CallHistoryItem[];
}

export const callsApi = {
  initiateCall: (recipientId: number, isVideo: boolean) =>
    apiClient.post<CallTokenResponse>('/api/calls/initiate', {
      recipientId,
      isVideo,
    }),

  acceptCall: (callId: string) =>
    apiClient.post<AcceptCallResponse>(`/api/calls/${callId}/accept`, {}),

  declineCall: (callId: string) =>
    apiClient.post<{ success: boolean }>(`/api/calls/${callId}/decline`, {}),

  endCall: (callId: string) =>
    apiClient.post<{ success: boolean }>(`/api/calls/${callId}/end`, {}),

  getCallHistory: () =>
    apiClient.get<CallHistoryResponse>('/api/calls/history'),
};
