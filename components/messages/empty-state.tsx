// Empty State - Placeholder when no messages/conversations exist

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';

interface EmptyStateProps {
  type: 'inbox' | 'requests' | 'events' | 'search' | 'chat';
  searchQuery?: string;
}

const EMPTY_STATES = {
  inbox: {
    icon: 'chatbubbles-outline',
    title: 'No Messages Yet',
    subtitle: 'Start a conversation with venues, promoters, or friends.',
  },
  requests: {
    icon: 'mail-unread-outline',
    title: 'No Message Requests',
    subtitle: 'Messages from people you don\'t follow will appear here.',
  },
  events: {
    icon: 'calendar-outline',
    title: 'No Event Chats',
    subtitle: 'Conversations tied to events will appear here.',
  },
  search: {
    icon: 'search-outline',
    title: 'No Results',
    subtitle: 'Try a different search term.',
  },
  chat: {
    icon: 'chatbubble-outline',
    title: 'No Messages',
    subtitle: 'Send a message to start the conversation.',
  },
};

export function EmptyState({ type, searchQuery }: EmptyStateProps) {
  const state = EMPTY_STATES[type];

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <GlassView {...liquidGlass.fillFaint} borderRadius={60} style={StyleSheet.absoluteFillObject} />
        <Ionicons
          name={state.icon as any}
          size={64}
          color="rgba(255, 255, 255, 0.3)"
        />
      </View>
      <Text style={styles.title}>{state.title}</Text>
      <Text style={styles.subtitle}>
        {type === 'search' && searchQuery
          ? `No results for "${searchQuery}"`
          : state.subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 22,
  },
});
