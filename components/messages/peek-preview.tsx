// Peek Preview - Snapchat-style half-swipe message preview

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Conversation, Message } from '../../lib/types/messages.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PREVIEW_WIDTH = SCREEN_WIDTH * 0.85;

interface PeekPreviewProps {
  conversation: Conversation | null;
  messages: Message[];
  translateX: SharedValue<number>;
  currentUserId: string;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function PreviewMessage({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const renderContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <Text style={[styles.messageText, isOwn && styles.messageTextOwn]} numberOfLines={3}>
            {message.text}
          </Text>
        );
      case 'image':
        return (
          <View style={styles.imagePreview}>
            <Ionicons name="image" size={14} color="rgba(0, 0, 0, 0.6)" />
            <Text style={styles.imagePreviewText}>Photo</Text>
          </View>
        );
      case 'eventCard':
        return (
          <View style={styles.imagePreview}>
            <Ionicons name="calendar" size={14} color="rgba(0, 0, 0, 0.6)" />
            <Text style={styles.imagePreviewText}>{message.eventCard?.eventTitle || 'Event'}</Text>
          </View>
        );
      case 'system':
        return (
          <Text style={styles.systemText}>{message.text}</Text>
        );
      default:
        return null;
    }
  };

  if (message.type === 'system') {
    return (
      <View style={styles.systemMessage}>
        {renderContent()}
      </View>
    );
  }

  return (
    <View style={[styles.messageBubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
      {renderContent()}
      <Text style={styles.messageTime}>{formatTime(message.createdAt)}</Text>
    </View>
  );
}

export function PeekPreview({
  conversation,
  messages,
  translateX,
  currentUserId,
}: PeekPreviewProps) {
  const animatedOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SCREEN_WIDTH * 0.15, -SCREEN_WIDTH * 0.4],
      [0, 0.6],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const animatedContainerStyle = useAnimatedStyle(() => {
    const translateXValue = interpolate(
      translateX.value,
      [-SCREEN_WIDTH * 0.15, -SCREEN_WIDTH * 0.5],
      [PREVIEW_WIDTH, 0],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      translateX.value,
      [-SCREEN_WIDTH * 0.15, -SCREEN_WIDTH * 0.3],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateX: translateXValue }],
      opacity,
    };
  });

  if (!conversation) return null;

  const participant = conversation.participants[0];
  const lastMessages = messages.slice(-6).reverse();

  return (
    <>
      {/* Dim overlay */}
      <Animated.View style={[styles.overlay, animatedOverlayStyle]} pointerEvents="none" />

      {/* Preview panel */}
      <Animated.View style={[styles.container, animatedContainerStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={{ uri: participant?.avatarUrl || 'https://i.pravatar.cc/150?u=default' }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.name} numberOfLines={1}>{conversation.title}</Text>
              <Text style={styles.peekLabel}>Peek</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Ionicons name="chevron-back" size={16} color="rgba(0, 0, 0, 0.3)" />
            <Text style={styles.releaseText}>Release</Text>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {lastMessages.length === 0 ? (
            <Text style={styles.emptyText}>No messages yet</Text>
          ) : (
            lastMessages.map((msg) => (
              <PreviewMessage
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === currentUserId}
              />
            ))
          )}
        </ScrollView>

        {/* Footer hint */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Swipe more to open</Text>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 998,
  },
  container: {
    position: 'absolute',
    top: 100,
    right: 0,
    width: PREVIEW_WIDTH,
    maxHeight: SCREEN_HEIGHT * 0.6,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    zIndex: 999,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  name: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#1a1a1a',
    maxWidth: 150,
  },
  peekLabel: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: '#0095f6',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  releaseText: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0, 0, 0, 0.35)',
  },
  messagesContainer: {
    flex: 1,
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  messagesContent: {
    padding: 12,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0, 0, 0, 0.4)',
    textAlign: 'center',
    paddingVertical: 40,
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bubbleOwn: {
    backgroundColor: '#D3D3D3',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: '#1a1a1a',
    lineHeight: 18,
  },
  messageTextOwn: {
    color: '#1a1a1a',
  },
  messageTime: {
    fontSize: 10,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0, 0, 0, 0.4)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  imagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  imagePreviewText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0, 0, 0, 0.7)',
  },
  systemMessage: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  systemText: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0, 0, 0, 0.4)',
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0, 0, 0, 0.35)',
  },
});
