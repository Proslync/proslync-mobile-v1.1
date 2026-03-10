export type TextBlastAudience =
  | 'all'
  | 'my_list'
  | 'checked_in'
  | 'verified'
  | 'pending'
  | 'all_contacts';

export interface TextBlastResponse {
  id: number;
  eventId: number | null;
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

export interface SendCrossEventBlastRequest {
  message: string;
}

export interface SendTextBlastResponse {
  blastId: number;
  batchId: string;
  recipientCount: number;
}

export interface RecipientCountResponse {
  count: number;
}

export interface TemplateVariable {
  label: string;
  value: string;
}

export const PERSON_VARIABLES: TemplateVariable[] = [
  { label: 'First Name', value: '{first_name}' },
  { label: 'Last Name', value: '{last_name}' },
];

export const EVENT_VARIABLES: TemplateVariable[] = [
  { label: 'Event Name', value: '{event_name}' },
  { label: 'Event Date', value: '{event_date}' },
];
