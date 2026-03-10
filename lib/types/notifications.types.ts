export type NotificationType =
  | 'follow'
  | 'rsvp'
  | 'event_update'
  | 'payment'
  | 'chat'
  | 'like'
  | 'comment';

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface NotificationsResponse {
  items: AppNotification[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}
