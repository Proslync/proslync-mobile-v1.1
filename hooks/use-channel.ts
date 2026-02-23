import * as React from 'react';
import type { Channel, Event, MessageResponse } from 'stream-chat';
import { useChat } from '@/lib/providers/chat-provider';

export interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userImage?: string;
  createdAt: Date;
  isOwn: boolean;
  // Media attachments
  attachments?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    thumbUrl?: string;
    width?: number;
    height?: number;
    // Audio specific
    duration?: number;
    waveformData?: number[];
    mimeType?: string;
  }[];
}

export interface ChannelInfo {
  id: string;
  name: string;
  imageUrl?: string;
  memberCount: number;
  isOnline?: boolean;
  // Other member info for 1-on-1 chats
  otherMember?: {
    id: string;
    name: string;
    image?: string;
    online?: boolean;
  };
}

export function useChannel(channelId: string | undefined) {
  const { client, status } = useChat();
  const [channel, setChannel] = React.useState<Channel | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [channelInfo, setChannelInfo] = React.useState<ChannelInfo | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [isTyping, setIsTyping] = React.useState(false);

  const currentUserId = client?.userID;

  const transformMessage = React.useCallback(
    (msg: MessageResponse | Record<string, unknown>): ChatMessage => {
      const message = msg as Record<string, unknown>;
      const user = message.user as Record<string, unknown> | undefined;
      const rawAttachments = message.attachments as Array<Record<string, unknown>> | undefined;

      // Transform attachments
      const attachments = rawAttachments?.map((att) => {
        const attType = att.type as string;
        const isAudio = attType === 'audio' || attType === 'voice' || attType?.includes('audio');
        const isVideo = attType?.includes('video');

        return {
          type: isAudio ? 'audio' as const : isVideo ? 'video' as const : 'image' as const,
          url: (att.asset_url || att.image_url || att.og_scrape_url) as string,
          thumbUrl: att.thumb_url as string | undefined,
          width: att.original_width as number | undefined,
          height: att.original_height as number | undefined,
          // Audio specific fields
          duration: (att.duration || att.audio_length) as number | undefined,
          waveformData: att.waveform_data as number[] | undefined,
          mimeType: att.mime_type as string | undefined,
        };
      }).filter((att) => att.url);

      return {
        id: (message.id as string) || '',
        text: (message.text as string) || '',
        userId: (user?.id as string) || '',
        userName: (user?.name as string) || 'Unknown',
        userImage: user?.image as string | undefined,
        createdAt: new Date((message.created_at as string) || Date.now()),
        isOwn: (user?.id as string) === currentUserId,
        attachments: attachments?.length ? attachments : undefined,
      };
    },
    [currentUserId]
  );

  // Initialize channel
  React.useEffect(() => {
    if (!client || status !== 'connected' || !channelId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const initChannel = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get or create channel
        const ch = client.channel('messaging', channelId);
        await ch.watch();

        if (cancelled) return;

        setChannel(ch);

        // Get channel info
        const channelData = ch.data as Record<string, unknown> | undefined;
        const otherMembers = Object.values(ch.state.members).filter(
          (m) => m.user_id !== currentUserId
        );
        const firstMember = otherMembers[0];

        setChannelInfo({
          id: ch.id || ch.cid,
          name: firstMember?.user?.name || (channelData?.name as string) || 'Chat',
          imageUrl: (firstMember?.user?.image || (channelData?.image as string)) as string | undefined,
          memberCount: Object.keys(ch.state.members).length,
          isOnline: firstMember?.user?.online,
          otherMember: firstMember?.user ? {
            id: firstMember.user.id,
            name: firstMember.user.name || firstMember.user.id,
            image: firstMember.user.image as string | undefined,
            online: firstMember.user.online,
          } : undefined,
        });

        // Transform existing messages
        const existingMessages = ch.state.messages.map((msg) =>
          transformMessage(msg as unknown as Record<string, unknown>)
        );
        setMessages(existingMessages);

        // Mark as read
        await ch.markRead();

        console.log('[Channel] Initialized with', existingMessages.length, 'messages');
      } catch (err) {
        console.error('[Channel] Error initializing:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load channel'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void initChannel();

    return () => {
      cancelled = true;
    };
  }, [client, status, channelId, currentUserId, transformMessage]);

  // Listen for new messages and typing events
  React.useEffect(() => {
    if (!channel) return;

    const handleNewMessage = (event: Event) => {
      if (event.message) {
        const newMsg = transformMessage(event.message as unknown as Record<string, unknown>);
        setMessages((prev) => [...prev, newMsg]);

        // Mark as read if app is active
        void channel.markRead();
      }
    };

    const handleMessageUpdated = (event: Event) => {
      if (event.message) {
        const updatedMsg = transformMessage(event.message as unknown as Record<string, unknown>);
        setMessages((prev) =>
          prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
        );
      }
    };

    const handleMessageDeleted = (event: Event) => {
      if (event.message?.id) {
        setMessages((prev) => prev.filter((m) => m.id !== event.message?.id));
      }
    };

    const handleTypingStart = (event: Event) => {
      if (event.user?.id !== currentUserId) {
        setIsTyping(true);
      }
    };

    const handleTypingStop = (event: Event) => {
      if (event.user?.id !== currentUserId) {
        setIsTyping(false);
      }
    };

    const newMessageListener = channel.on('message.new', handleNewMessage);
    const messageUpdatedListener = channel.on('message.updated', handleMessageUpdated);
    const messageDeletedListener = channel.on('message.deleted', handleMessageDeleted);
    const typingStartListener = channel.on('typing.start', handleTypingStart);
    const typingStopListener = channel.on('typing.stop', handleTypingStop);

    return () => {
      newMessageListener?.unsubscribe?.();
      messageUpdatedListener?.unsubscribe?.();
      messageDeletedListener?.unsubscribe?.();
      typingStartListener?.unsubscribe?.();
      typingStopListener?.unsubscribe?.();
    };
  }, [channel, currentUserId, transformMessage]);

  // Send message (with optional attachments)
  const sendMessage = React.useCallback(
    async (text: string, attachments?: { type: 'image' | 'video'; uri: string }[]) => {
      if (!channel) return;
      if (!text.trim() && (!attachments || attachments.length === 0)) return;

      try {
        const messageData: Record<string, unknown> = {};

        if (text.trim()) {
          messageData.text = text.trim();
        }

        // Handle attachments - upload to Stream first
        if (attachments && attachments.length > 0) {
          const uploadedAttachments = await Promise.all(
            attachments.map(async (att) => {
              try {
                // For Stream Chat, we upload the file and get back a URL
                const response = await channel.sendImage(att.uri);
                return {
                  type: 'image',
                  image_url: response.file,
                  fallback: 'Image',
                };
              } catch (uploadError) {
                console.error('[Channel] Failed to upload attachment:', uploadError);
                return null;
              }
            })
          );

          const validAttachments = uploadedAttachments.filter(Boolean);
          if (validAttachments.length > 0) {
            messageData.attachments = validAttachments;
          }
        }

        await channel.sendMessage(messageData as any);
      } catch (err) {
        console.error('[Channel] Error sending message:', err);
        throw err;
      }
    },
    [channel]
  );

  // Send voice message
  const sendVoiceMessage = React.useCallback(
    async (uri: string, duration: number) => {
      if (!channel) return;

      try {
        // Upload the audio file
        const response = await channel.sendFile(uri, 'voice_message.m4a', 'audio/m4a');

        // Send message with audio attachment
        await channel.sendMessage({
          attachments: [
            {
              type: 'voice',
              asset_url: response.file,
              mime_type: 'audio/m4a',
              duration: duration,
              fallback: 'Voice message',
            },
          ],
        } as any);
      } catch (err) {
        console.error('[Channel] Error sending voice message:', err);
        throw err;
      }
    },
    [channel]
  );

  // Delete a message
  const deleteMessage = React.useCallback(
    async (messageId: string) => {
      if (!client) return;
      try {
        await client.deleteMessage(messageId);
      } catch (err) {
        console.error('[Channel] Error deleting message:', err);
        throw err;
      }
    },
    [client]
  );

  // Send typing indicator
  const sendTypingStart = React.useCallback(async () => {
    if (!channel) return;
    try {
      await channel.keystroke();
    } catch (err) {
      // Ignore typing errors
    }
  }, [channel]);

  const sendTypingStop = React.useCallback(async () => {
    if (!channel) return;
    try {
      await channel.stopTyping();
    } catch (err) {
      // Ignore typing errors
    }
  }, [channel]);

  return {
    channel,
    messages,
    channelInfo,
    isLoading,
    error,
    isTyping,
    currentUserId,
    sendMessage,
    sendVoiceMessage,
    sendTypingStart,
    sendTypingStop,
    deleteMessage,
  };
}
