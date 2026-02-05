// User Profile Screen - View profile of a user from messages

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Mock recent events for venue/promoter profiles
const MOCK_RECENT_EVENTS = [
  {
    id: 'event-1',
    title: 'Neon Nights',
    date: 'Sat, Feb 8',
    imageUrl: 'https://picsum.photos/seed/profile-event1/300/400',
  },
  {
    id: 'event-2',
    title: 'Deep House Fridays',
    date: 'Fri, Feb 7',
    imageUrl: 'https://picsum.photos/seed/profile-event2/300/400',
  },
  {
    id: 'event-3',
    title: 'Sunday Brunch Party',
    date: 'Sun, Feb 9',
    imageUrl: 'https://picsum.photos/seed/profile-event3/300/400',
  },
];

function getRoleLabel(role: string): string | null {
  switch (role) {
    case 'venue':
      return 'Venue';
    case 'promoter':
      return 'Promoter';
    case 'support':
      return 'Support';
    default:
      return null; // Don't show label for regular users
  }
}

function getRoleColor(role: string): string {
  switch (role) {
    case 'venue':
      return '#8b5cf6';
    case 'promoter':
      return '#f59e0b';
    case 'support':
      return '#10b981';
    default:
      return 'rgba(255, 255, 255, 0.5)';
  }
}

export default function UserProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    userId: string;
    name: string;
    avatarUrl: string;
    role: string;
  }>();

  const user = {
    id: params.userId,
    name: params.name || 'User',
    avatarUrl: params.avatarUrl || 'https://picsum.photos/150',
    role: params.role || 'user',
  };

  const showEvents = user.role === 'venue' || user.role === 'promoter';
  const roleLabel = getRoleLabel(user.role);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color="#0095f6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          <View style={styles.nameRow}>
            <Text style={styles.name}>{user.name}</Text>
          </View>
          {roleLabel && (
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) + '20' }]}>
              <Text style={[styles.roleText, { color: getRoleColor(user.role) }]}>
                {roleLabel}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons - Only Message button */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionButton, styles.actionButtonDisabled]}>
            <Ionicons name="chatbubble" size={20} color="rgba(255, 255, 255, 0.3)" />
            <Text style={[styles.actionButtonText, styles.actionButtonTextDisabled]}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Events (for venue/promoter) */}
        {showEvents && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Events</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.eventsScroll}
            >
              {MOCK_RECENT_EVENTS.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventCard}
                  onPress={() => router.push({
                    pathname: '/event/[id]',
                    params: { id: event.id },
                  })}
                >
                  <Image source={{ uri: event.imageUrl }} style={styles.eventImage} />
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                    <Text style={styles.eventDate}>{event.date}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    maxWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#0095f6',
  },
  actionButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: '#0095f6',
  },
  eventsScroll: {
    paddingRight: 16,
    gap: 12,
  },
  eventCard: {
    width: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 100,
  },
  eventInfo: {
    padding: 10,
  },
  eventTitle: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
