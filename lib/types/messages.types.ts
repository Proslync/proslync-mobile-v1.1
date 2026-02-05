// Messages Types - TypeScript interfaces for the Messages feature

export type UserRole = 'guest' | 'venue' | 'promoter' | 'support';

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  isVerified?: boolean;
  role: UserRole;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface EventContext {
  eventId: string;
  eventTitle: string;
  venueName: string;
  flyerUrl: string;
  dateTimeLabel?: string;
}

export interface EventCard {
  eventId: string;
  eventTitle: string;
  dateTimeLabel: string;
  venueName: string;
  flyerUrl: string;
}

export type MessageType = 'text' | 'image' | 'eventCard' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'seen';

export interface MessageReactions {
  [emoji: string]: string[]; // emoji -> userIds
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  text?: string;
  imageUrl?: string;
  eventCard?: EventCard;
  createdAt: string;
  status?: MessageStatus;
  reactions?: MessageReactions;
  replyTo?: string; // message id being replied to
}

export interface Conversation {
  id: string;
  title: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isRequest?: boolean;
  isArchived?: boolean;
  context?: EventContext;
  createdAt: string;
  updatedAt: string;
}

export type ConversationFilter = 'all' | 'requests' | 'events';

export interface MessagesState {
  conversations: Conversation[];
  messages: Record<string, Message[]>; // conversationId -> messages
  currentUserId: string;
  isLoading: boolean;
}

export interface MessagesActions {
  sendMessage: (conversationId: string, message: Partial<Message>) => void;
  markAsRead: (conversationId: string) => void;
  pinConversation: (conversationId: string) => void;
  unpinConversation: (conversationId: string) => void;
  muteConversation: (conversationId: string) => void;
  unmuteConversation: (conversationId: string) => void;
  archiveConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  acceptRequest: (conversationId: string) => void;
  declineRequest: (conversationId: string) => void;
  addReaction: (conversationId: string, messageId: string, emoji: string) => void;
  removeReaction: (conversationId: string, messageId: string, emoji: string) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  createConversation: (participants: User[], initialMessage?: string) => string;
  getConversation: (conversationId: string) => Conversation | undefined;
  getMessages: (conversationId: string) => Message[];
  refreshConversations: () => Promise<void>;
}

export interface MessagesContextType extends MessagesState, MessagesActions {}
