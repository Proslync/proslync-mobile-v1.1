// Peek Preview - Snapchat-style half-swipe message preview

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { Conversation, Message } from '../../lib/types/messages.types';
import { formatMessageTime } from '@/lib/utils/date';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '@/lib/utils/layout';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useAppTheme } from '@/hooks/use-app-theme';

const DefaultAvatarImage = require('@/assets/images/default-avatar.png');

const PREVIEW_WIDTH = SCREEN_WIDTH * 0.85;

interface PeekPreviewProps {
  conversation: Conversation | null;
  messages: Message[];
  translateX: SharedValue<number>;
  currentUserId: string;
}

function PreviewMessage({ message, isOwn, isDark }: { message: Message; isOwn: boolean; isDark: boolean }) {
  const textColor = isDark ? '#fff' : '#1a1a1a';
  const secondaryColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
  const tertiaryColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';

  const renderContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <Text style={[styles.messageText, { color: textColor }]} numberOfLines={3}>
            {message.text}
          </Text>
        );
      case 'image':
        return (
          <View style={styles.imagePreview}>
            <Ionicons name="image" size={14} color={secondaryColor} />
            <Text style={[styles.imagePreviewText, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }]}>Photo</Text>
          </View>
        );
      case 'eventCard':
        return (
          <View style={styles.imagePreview}>
            <Ionicons name="calendar" size={14} color={secondaryColor} />
            <Text style={[styles.imagePreviewText, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }]}>{message.eventCard?.eventTitle || 'Event'}</Text>
          </View>
        );
      case 'system':
        return (
          <Text style={[styles.systemText, { color: tertiaryColor }]}>{message.text}</Text>
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
    <View style={[
      styles.messageBubble,
      isOwn
        ? [styles.bubbleOwn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#D3D3D3' }]
        : [styles.bubbleOther, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f0f0f0' }],
    ]}>
      {renderContent()}
      <Text style={[styles.messageTime, { color: tertiaryColor }]}>{formatMessageTime(message.createdAt)}</Text>
    </View>
  );
}

export function PeekPreview({
  conversation,
  messages,
  translateX,
  currentUserId,
}: PeekPreviewProps) {
  const { isDark, colors } = useAppTheme();

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
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <>
      {/* Dim overlay */}
      <Animated.View style={[styles.overlay, animatedOverlayStyle]} pointerEvents="none" />

      {/* Preview panel */}
      <Animated.View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }, animatedContainerStyle]}>
        {/* Glass background for dark mode */}
        {isDark && (
          <GlassView
            {...liquidGlass.surface}
            borderRadius={20}
            style={StyleSheet.absoluteFillObject}
          />
        )}

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <View style={styles.headerLeft}>
            <Image
              source={participant?.avatarUrl ? { uri: participant.avatarUrl } : DefaultAvatarImage}
              style={styles.avatar}
            />
            <View>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{conversation.title}</Text>
              <Text style={[styles.peekLabel, { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)' }]}>Peek</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Ionicons name="chevron-back" size={16} color={isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'} />
            <Text style={[styles.releaseText, { color: isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)' }]}>Release</Text>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {lastMessages.length === 0 ? (
            <Text style={[styles.emptyText, { color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }]}>No messages yet</Text>
          ) : (
            lastMessages.map((msg) => (
              <PreviewMessage
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === currentUserId}
                isDark={isDark}
              />
            ))
          )}
        </ScrollView>

        {/* Footer hint */}
        <View style={[styles.footer, { borderTopColor: borderColor }]}>
          <Text style={[styles.footerText, { color: isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)' }]}>Swipe more to open</Text>
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
    maxWidth: 150,
  },
  peekLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  releaseText: {
    fontSize: 12,
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
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  messageTime: {
    fontSize: 10,
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
  },
  systemMessage: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  systemText: {
    fontSize: 12,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
  },
});
