// Message Bubble - Individual message bubble with various message types

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinkifiedText } from '@/components/shared/linkified-text';
import { Ionicons } from '@expo/vector-icons';
import { Message, User } from '../../lib/types/messages.types';
import { formatMessageTime } from '@/lib/utils/date';
import { SCREEN_WIDTH } from '@/lib/utils/layout';

const DefaultAvatarImage = require('@/assets/images/default-avatar.png');

const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.72;
const MAX_IMAGE_WIDTH = SCREEN_WIDTH * 0.65;

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showTimestamp: boolean;
  onLongPress: () => void;
  onDoubleTap: () => void;
  onImagePress?: (imageUrl: string) => void;
  onEventPress?: (eventId: string) => void;
  sender?: User;
  isGroupStart?: boolean;
  isGroupEnd?: boolean;
}

export function MessageBubble({
  message,
  isOwn,
  showTimestamp,
  onLongPress,
  onDoubleTap,
  onImagePress,
  onEventPress,
  sender,
  isGroupStart,
  isGroupEnd,
}: MessageBubbleProps) {
  const [lastTap, setLastTap] = useState<number | null>(null);

  const handlePress = () => {
    const now = Date.now();
    if (lastTap && now - lastTap < 300) {
      onDoubleTap();
      setLastTap(null);
    } else {
      setLastTap(now);
    }
  };

  const reactions = message.reactions || {};
  const reactionEntries = Object.entries(reactions).filter(([, users]) => users.length > 0);

  // Calculate spacing based on grouping
  const topMargin = isGroupStart ? 12 : 3;

  if (message.type === 'system') {
    return (
      <View style={[styles.systemContainer, { marginTop: 16 }]}>
        <Text style={styles.systemText}>{message.text}</Text>
        {showTimestamp && (
          <Text style={styles.systemTime}>{formatMessageTime(message.createdAt)}</Text>
        )}
      </View>
    );
  }

  const renderContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <LinkifiedText style={[styles.messageText, isOwn && styles.messageTextOwn] as any}>
            {message.text}
          </LinkifiedText>
        );

      case 'image':
        // Image messages - no bubble background, just rounded image
        return (
          <TouchableOpacity
            onPress={() => onImagePress?.(message.imageUrl!)}
            activeOpacity={0.9}
            style={styles.imageContainer}
          >
            <Image
              source={{ uri: message.imageUrl }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        );

      case 'eventCard':
        return (
          <TouchableOpacity
            style={styles.eventCard}
            onPress={() => onEventPress?.(message.eventCard!.eventId)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: message.eventCard!.flyerUrl }}
              style={styles.eventFlyer}
              resizeMode="cover"
            />
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle} numberOfLines={2}>
                {message.eventCard!.eventTitle}
              </Text>
              <Text style={styles.eventMeta}>
                {message.eventCard!.dateTimeLabel}
              </Text>
              <Text style={styles.eventVenue} numberOfLines={1}>
                {message.eventCard!.venueName}
              </Text>
              <View style={styles.eventButton}>
                <Text style={styles.eventButtonText}>View Event</Text>
              </View>
            </View>
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  const renderStatus = () => {
    if (!isOwn || !message.status) return null;

    const statusIcons: Record<string, { icon: string; color: string }> = {
      sending: { icon: 'time-outline', color: 'rgba(255, 255, 255, 0.5)' },
      sent: { icon: 'checkmark', color: 'rgba(255, 255, 255, 0.5)' },
      delivered: { icon: 'checkmark-done', color: 'rgba(255, 255, 255, 0.5)' },
      seen: { icon: 'checkmark-done', color: '#fff' },
    };

    const status = statusIcons[message.status];
    return (
      <View style={styles.statusContainer}>
        <Ionicons name={status.icon as any} size={14} color={status.color} />
      </View>
    );
  };

  // Image messages have different rendering (no bubble)
  if (message.type === 'image') {
    return (
      <View style={[styles.container, isOwn && styles.containerOwn, { marginTop: topMargin }]}>
        {!isOwn && isGroupStart && sender && (
          <Image
            source={sender.avatarUrl ? { uri: sender.avatarUrl } : DefaultAvatarImage}
            style={styles.senderAvatar}
          />
        )}
        {!isOwn && !isGroupStart && <View style={styles.avatarPlaceholder} />}

        <TouchableOpacity
          onPress={handlePress}
          onLongPress={onLongPress}
          activeOpacity={0.9}
          delayLongPress={300}
        >
          {renderContent()}

          {reactionEntries.length > 0 && (
            <View style={[styles.reactionsContainer, isOwn && styles.reactionsContainerOwn]}>
              {reactionEntries.map(([emoji, users]) => (
                <View key={emoji} style={styles.reactionBubble}>
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  {users.length > 1 && (
                    <Text style={styles.reactionCount}>{users.length}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>

        {showTimestamp && (
          <View style={[styles.timestampRow, isOwn && styles.timestampRowOwn]}>
            <Text style={styles.timestamp}>{formatMessageTime(message.createdAt)}</Text>
            {renderStatus()}
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, isOwn && styles.containerOwn, { marginTop: topMargin }]}>
      {!isOwn && isGroupStart && sender && (
        <Image
          source={sender.avatarUrl ? { uri: sender.avatarUrl } : DefaultAvatarImage}
          style={styles.senderAvatar}
        />
      )}
      {!isOwn && !isGroupStart && <View style={styles.avatarPlaceholder} />}

      <TouchableOpacity
        style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
          message.type === 'eventCard' && styles.bubbleEventCard,
        ]}
        onPress={handlePress}
        onLongPress={onLongPress}
        activeOpacity={0.9}
        delayLongPress={300}
      >
        {renderContent()}

        {reactionEntries.length > 0 && (
          <View style={[styles.reactionsContainer, isOwn && styles.reactionsContainerOwn]}>
            {reactionEntries.map(([emoji, users]) => (
              <View key={emoji} style={styles.reactionBubble}>
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                {users.length > 1 && (
                  <Text style={styles.reactionCount}>{users.length}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>

      {showTimestamp && (
        <View style={[styles.timestampRow, isOwn && styles.timestampRowOwn]}>
          <Text style={styles.timestamp}>{formatMessageTime(message.createdAt)}</Text>
          {renderStatus()}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 1,
    paddingHorizontal: 12,
  },
  containerOwn: {
    flexDirection: 'row-reverse',
  },
  senderAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 4,
  },
  avatarPlaceholder: {
    width: 28,
    marginRight: 8,
  },
  bubble: {
    maxWidth: MAX_BUBBLE_WIDTH,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleOwn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderBottomRightRadius: 6,
  },
  bubbleOther: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderBottomLeftRadius: 6,
  },
  bubbleEventCard: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: 16,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
    lineHeight: 22,
  },
  messageTextOwn: {
    color: '#fff',
  },
  imageContainer: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  messageImage: {
    width: MAX_IMAGE_WIDTH,
    height: MAX_IMAGE_WIDTH * 1.2,
    borderRadius: 18,
  },
  eventCard: {
    width: 220,
  },
  eventFlyer: {
    width: '100%',
    height: 120,
  },
  eventInfo: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  eventTitle: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    marginBottom: 4,
  },
  eventMeta: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  eventVenue: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 10,
  },
  eventButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  eventButtonText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'absolute',
    bottom: -14,
    left: 8,
    gap: 4,
  },
  reactionsContainerOwn: {
    left: undefined,
    right: 8,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 10,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
    marginLeft: 2,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 44,
  },
  timestampRowOwn: {
    marginLeft: 0,
    marginRight: 8,
    flexDirection: 'row-reverse',
  },
  timestamp: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  statusContainer: {
    marginRight: 4,
  },
  systemContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  systemText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  systemTime: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 4,
  },
});
