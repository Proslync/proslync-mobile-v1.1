// Messages Context Provider - In-memory store for messages

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  MessagesContextType,
  Conversation,
  Message,
  User,
} from '../types/messages.types';
import {
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
  CURRENT_USER,
  MOCK_USERS,
} from '../data/messages-mock';

const MessagesContext = createContext<MessagesContextType | null>(null);

interface MessagesProviderProps {
  children: ReactNode;
}

export function MessagesProvider({ children }: MessagesProviderProps) {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [messages, setMessages] = useState<Record<string, Message[]>>(MOCK_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const currentUserId = CURRENT_USER.id;

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const sendMessage = useCallback((conversationId: string, messageData: Partial<Message>) => {
    const newMessage: Message = {
      id: generateId(),
      conversationId,
      senderId: currentUserId,
      type: messageData.type || 'text',
      text: messageData.text,
      imageUrl: messageData.imageUrl,
      eventCard: messageData.eventCard,
      createdAt: new Date().toISOString(),
      status: 'sending',
      reactions: {},
    };

    // Add message to conversation
    setMessages((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMessage],
    }));

    // Update conversation's lastMessage and updatedAt
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId
          ? { ...conv, lastMessage: newMessage, updatedAt: new Date().toISOString() }
          : conv
      )
    );

    // Simulate message status progression
    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [conversationId]: prev[conversationId].map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
        ),
      }));
    }, 500);

    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [conversationId]: prev[conversationId].map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
        ),
      }));
    }, 1500);

    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [conversationId]: prev[conversationId].map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: 'seen' } : msg
        ),
      }));
    }, 3000);
  }, [currentUserId]);

  const markAsRead = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      )
    );
  }, []);

  const pinConversation = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, isPinned: true } : conv
      )
    );
  }, []);

  const unpinConversation = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, isPinned: false } : conv
      )
    );
  }, []);

  const muteConversation = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, isMuted: true } : conv
      )
    );
  }, []);

  const unmuteConversation = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, isMuted: false } : conv
      )
    );
  }, []);

  const archiveConversation = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, isArchived: true } : conv
      )
    );
  }, []);

  const deleteConversation = useCallback((conversationId: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
    setMessages((prev) => {
      const newMessages = { ...prev };
      delete newMessages[conversationId];
      return newMessages;
    });
  }, []);

  const acceptRequest = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, isRequest: false } : conv
      )
    );
  }, []);

  const declineRequest = useCallback((conversationId: string) => {
    deleteConversation(conversationId);
  }, [deleteConversation]);

  const addReaction = useCallback(
    (conversationId: string, messageId: string, emoji: string) => {
      setMessages((prev) => ({
        ...prev,
        [conversationId]: prev[conversationId].map((msg) => {
          if (msg.id === messageId) {
            const reactions = { ...msg.reactions };
            if (!reactions[emoji]) {
              reactions[emoji] = [];
            }
            if (!reactions[emoji].includes(currentUserId)) {
              reactions[emoji] = [...reactions[emoji], currentUserId];
            }
            return { ...msg, reactions };
          }
          return msg;
        }),
      }));
    },
    [currentUserId]
  );

  const removeReaction = useCallback(
    (conversationId: string, messageId: string, emoji: string) => {
      setMessages((prev) => ({
        ...prev,
        [conversationId]: prev[conversationId].map((msg) => {
          if (msg.id === messageId) {
            const reactions = { ...msg.reactions };
            if (reactions[emoji]) {
              reactions[emoji] = reactions[emoji].filter((id) => id !== currentUserId);
              if (reactions[emoji].length === 0) {
                delete reactions[emoji];
              }
            }
            return { ...msg, reactions };
          }
          return msg;
        }),
      }));
    },
    [currentUserId]
  );

  const deleteMessage = useCallback((conversationId: string, messageId: string) => {
    setMessages((prev) => ({
      ...prev,
      [conversationId]: prev[conversationId].filter((msg) => msg.id !== messageId),
    }));

    // Update lastMessage if needed
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === conversationId) {
          const convMessages = messages[conversationId].filter((msg) => msg.id !== messageId);
          const lastMessage = convMessages[convMessages.length - 1];
          return { ...conv, lastMessage };
        }
        return conv;
      })
    );
  }, [messages]);

  const createConversation = useCallback(
    (participants: User[], initialMessage?: string): string => {
      const newConvId = generateId();
      const now = new Date().toISOString();

      const newConversation: Conversation = {
        id: newConvId,
        title: participants.map((p) => p.name).join(', '),
        participants,
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        createdAt: now,
        updatedAt: now,
      };

      setConversations((prev) => [newConversation, ...prev]);
      setMessages((prev) => ({ ...prev, [newConvId]: [] }));

      if (initialMessage) {
        setTimeout(() => {
          sendMessage(newConvId, { type: 'text', text: initialMessage });
        }, 100);
      }

      return newConvId;
    },
    [sendMessage]
  );

  const getConversation = useCallback(
    (conversationId: string): Conversation | undefined => {
      return conversations.find((conv) => conv.id === conversationId);
    },
    [conversations]
  );

  const getMessages = useCallback(
    (conversationId: string): Message[] => {
      return messages[conversationId] || [];
    },
    [messages]
  );

  const refreshConversations = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  }, []);

  const value: MessagesContextType = {
    conversations,
    messages,
    currentUserId,
    isLoading,
    sendMessage,
    markAsRead,
    pinConversation,
    unpinConversation,
    muteConversation,
    unmuteConversation,
    archiveConversation,
    deleteConversation,
    acceptRequest,
    declineRequest,
    addReaction,
    removeReaction,
    deleteMessage,
    createConversation,
    getConversation,
    getMessages,
    refreshConversations,
  };

  return (
    <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>
  );
}

export function useMessages(): MessagesContextType {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
}
