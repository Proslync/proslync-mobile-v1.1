export type TextBlastAudience = 'all' | 'my_list' | 'checked_in' | 'verified' | 'pending';

export interface TextBlastResponse {
  id: number;
  eventId: number;
  message: string;
  recipientCount: number;
  batchId: string | null;
  sentBy: number;
  audienceFilter: string;
  createdAt: string;
  sentCount?: number;
  deliveredCount?: number;
  failedCount?: number;
}

export interface SendTextBlastRequest {
  message: string;
  audience?: TextBlastAudience;
}

export interface SendTextBlastResponse {
  blastId: number;
  batchId: string;
  recipientCount: number;
}

export interface RecipientCountResponse {
  count: number;
}
