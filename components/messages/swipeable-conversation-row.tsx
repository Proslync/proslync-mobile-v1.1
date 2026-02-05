// Swipeable Conversation Row - Row with half-swipe peek preview gesture

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  withSpring,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Conversation } from '../../lib/types/messages.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PEEK_THRESHOLD = -SCREEN_WIDTH * 0.25;
const OPEN_THRESHOLD = -SCREEN_WIDTH * 0.5;

interface SwipeableConversationRowProps {
  conversation: Conversation;
  onPress: () => void;
  onLongPress: () => void;
  onPeekStart: (conversation: Conversation) => void;
  onPeekEnd: () => void;
  onPeekOpen: () => void;
  translateX: SharedValue<number>;
  isActive: boolean;
}

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getMessagePreview(conversation: Conversation, currentUserId: string): string {
  const msg = conversation.lastMessage;
  if (!msg) return 'No messages yet';

  const isOwn = msg.senderId === currentUserId;
  const prefix = isOwn ? 'You: ' : '';

  switch (msg.type) {
    case 'text':
      return prefix + (msg.text || '');
    case 'image':
      return prefix + 'Sent a photo';
    case 'eventCard':
      return prefix + `Shared an event: ${msg.eventCard?.eventTitle || 'Event'}`;
    case 'system':
      return msg.text || '';
    default:
      return '';
  }
}

export function SwipeableConversationRow({
  conversation,
  onPress,
  onLongPress,
  onPeekStart,
  onPeekEnd,
  onPeekOpen,
  translateX,
  isActive,
}: SwipeableConversationRowProps) {
  const participant = conversation.participants[0];
  const isVerified = participant?.isVerified;
  const hasUnread = conversation.unreadCount > 0;

  const handlePeekStart = useCallback(() => {
    onPeekStart(conversation);
  }, [conversation, onPeekStart]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onStart(() => {
      runOnJS(handlePeekStart)();
    })
    .onUpdate((event) => {
      if (event.translationX < 0) {
        translateX.value = Math.max(event.translationX, -SCREEN_WIDTH * 0.6);
      }
    })
    .onEnd((event) => {
      if (event.translationX < OPEN_THRESHOLD) {
        // Full open - navigate to chat
        translateX.value = withSpring(0, { damping: 20 });
        runOnJS(onPeekOpen)();
      } else {
        // Snap back
        translateX.value = withSpring(0, { damping: 20 });
        runOnJS(onPeekEnd)();
      }
    });

  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(onPress)();
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(300)
    .onEnd(() => {
      runOnJS(onLongPress)();
    });

  const composedGesture = Gesture.Race(
    panGesture,
    Gesture.Exclusive(longPressGesture, tapGesture)
  );

  const animatedRowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: isActive ? translateX.value : 0 }],
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, animatedRowStyle]}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: participant?.avatarUrl || 'https://i.pravatar.cc/150?u=default' }}
            style={styles.avatar}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.nameContainer}>
              <Text style={[styles.name, hasUnread && styles.nameUnread]} numberOfLines={1}>
                {conversation.title}
              </Text>
              {isVerified && (
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color="#3b82f6"
                  style={styles.verifiedIcon}
                />
              )}
              {conversation.isPinned && (
                <Ionicons
                  name="pin"
                  size={12}
                  color="rgba(255, 255, 255, 0.5)"
                  style={styles.statusIcon}
                />
              )}
              {conversation.isMuted && (
                <Ionicons
                  name="notifications-off"
                  size={12}
                  color="rgba(255, 255, 255, 0.5)"
                  style={styles.statusIcon}
                />
              )}
            </View>
            <Text style={styles.timestamp}>
              {conversation.lastMessage
                ? formatTimestamp(conversation.lastMessage.createdAt)
                : ''}
            </Text>
          </View>

          <View style={styles.bottomRow}>
            <Text
              style={[styles.preview, hasUnread && styles.previewUnread]}
              numberOfLines={1}
            >
              {getMessagePreview(conversation, 'current-user')}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={16}
          color="rgba(255, 255, 255, 0.3)"
          style={styles.chevron}
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
    flexShrink: 1,
  },
  nameUnread: {
    fontFamily: 'Lato_700Bold',
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  statusIcon: {
    marginLeft: 6,
  },
  timestamp: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preview: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    flex: 1,
    marginRight: 8,
  },
  previewUnread: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  unreadBadge: {
    backgroundColor: '#0095f6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
  },
  chevron: {
    marginLeft: 4,
  },
});
