export interface UserPreferences {
  // Notification - Activity
  notifyLikes: boolean;
  notifyComments: boolean;
  notifyMentions: boolean;
  notifyNewFollowers: boolean;
  // Notification - Events
  notifyEventReminders: boolean;
  notifyEventUpdates: boolean;
  notifyNearbyEvents: boolean;
  // Notification - Messages
  notifyDirectMessages: boolean;
  notifyMessageRequests: boolean;
  // Notification - Other
  notifyEmail: boolean;
  notifyPush: boolean;
  // Privacy
  privateAccount: boolean;
  activityStatus: boolean;
  readReceipts: boolean;
}
