import * as React from 'react';
import type { Channel, ChannelSort, ChannelFilters } from 'stream-chat';
import { useChat } from '@/lib/providers/chat-provider';

export interface ChannelData {
  id: string;
  name: string;
  imageUrl?: string;
  lastMessage?: {
    text: string;
    createdAt: string;
    userId: string;
    attachmentType?: 'image' | 'video' | 'audio' | null;
  };
  unreadCount: number;
  memberCount: number;
  isOnline?: boolean;
  updatedAt: string;
}

export function useChannels() {
  const { client, status } = useChat();
  const [channels, setChannels] = React.useState<Channel[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchChannels = React.useCallback(async () => {
    if (!client || status !== 'connected') {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const filter: ChannelFilters = {
        type: 'messaging',
        members: { $in: [client.userID || ''] },
      };

      const sort: ChannelSort = { last_message_at: -1 };

      const result = await client.queryChannels(filter, sort, {
        watch: true,
        state: true,
        limit: 30,
      });

      setChannels(result);
      console.log('[Channels] Fetched', result.length, 'channels');
    } catch (err) {
      console.error('[Channels] Error fetching:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch channels'));
    } finally {
      setIsLoading(false);
    }
  }, [client, status]);

  // Initial fetch
  React.useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // Listen for channel updates
  React.useEffect(() => {
    if (!client) return;

    const handleNewMessage = () => {
      // Re-sort channels when new message arrives
      setChannels(prev => {
        const sorted = [...prev].sort((a, b) => {
          const aTime = a.state.last_message_at?.getTime() || 0;
          const bTime = b.state.last_message_at?.getTime() || 0;
          return bTime - aTime;
        });
        return sorted;
      });
    };

    const handleChannelUpdated = () => {
      fetchChannels();
    };

    const newMessageListener = client.on('message.new', handleNewMessage);
    const channelUpdatedListener = client.on('channel.updated', handleChannelUpdated);
    const channelDeletedListener = client.on('channel.deleted', handleChannelUpdated);
    const channelHiddenListener = client.on('channel.hidden', handleChannelUpdated);

    return () => {
      newMessageListener?.unsubscribe?.();
      channelUpdatedListener?.unsubscribe?.();
      channelDeletedListener?.unsubscribe?.();
      channelHiddenListener?.unsubscribe?.();
    };
  }, [client, fetchChannels]);

  // Transform channels to simpler format
  const channelData = React.useMemo((): ChannelData[] => {
    return channels.map((channel) => {
      const lastMessage = channel.state.messages[channel.state.messages.length - 1];
      const otherMembers = Object.values(channel.state.members).filter(
        (m) => m.user_id !== client?.userID
      );
      const firstMember = otherMembers[0];

      // Access channel data safely
      const channelDataObj = channel.data as Record<string, unknown> | undefined;

      // Determine attachment type from last message
      let attachmentType: 'image' | 'video' | 'audio' | null = null;
      if (lastMessage?.attachments && lastMessage.attachments.length > 0) {
        const firstAtt = lastMessage.attachments[0] as Record<string, unknown>;
        const attType = firstAtt.type as string;
        if (attType === 'audio' || attType === 'voice' || attType?.includes('audio')) {
          attachmentType = 'audio';
        } else if (attType?.includes('video')) {
          attachmentType = 'video';
        } else if (attType === 'image' || firstAtt.image_url) {
          attachmentType = 'image';
        }
      }

      return {
        id: channel.id || channel.cid,
        name: firstMember?.user?.name || (channelDataObj?.name as string) || 'Unknown',
        imageUrl: (firstMember?.user?.image || (channelDataObj?.image as string)) as string | undefined,
        lastMessage: lastMessage ? {
          text: lastMessage.text || '',
          createdAt: lastMessage.created_at?.toString() || new Date().toISOString(),
          userId: lastMessage.user?.id || '',
          attachmentType,
        } : undefined,
        unreadCount: channel.countUnread(),
        memberCount: Object.keys(channel.state.members).length,
        isOnline: firstMember?.user?.online,
        updatedAt: channel.state.last_message_at?.toISOString() || (channelDataObj?.updated_at as string) || new Date().toISOString(),
      };
    });
  }, [channels, client?.userID]);

  // Hide a channel (remove from user's list without needing admin permissions)
  const deleteChannel = React.useCallback(async (channelId: string) => {
    const channel = channels.find((c) => c.id === channelId || c.cid === channelId);
    if (!channel) {
      console.error('[Channels] Channel not found:', channelId);
      return false;
    }

    try {
      await channel.hide(null, true);
      // Remove from local state
      setChannels((prev) => prev.filter((c) => c.id !== channelId && c.cid !== channelId));
      console.log('[Channels] Hidden channel:', channelId);
      return true;
    } catch (err) {
      console.error('[Channels] Error hiding channel:', err);
      return false;
    }
  }, [channels]);

  return {
    channels,
    channelData,
    isLoading,
    error,
    refetch: fetchChannels,
    deleteChannel,
  };
}
