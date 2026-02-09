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
import { useAppTheme } from '@/hooks/use-app-theme';


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
  const { colors, isDark } = useAppTheme();
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
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
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
            <Text style={[styles.name, { color: colors.text }]}>{user.name}</Text>
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
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonSecondary }, styles.actionButtonDisabled]}>
            <Ionicons name="chatbubble" size={20} color={colors.buttonDisabledText} />
            <Text style={[styles.actionButtonText, { color: colors.buttonDisabledText }]}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Events (for venue/promoter) */}
        {showEvents && (
          <View style={[styles.section, { borderTopColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Recent Events</Text>
              <TouchableOpacity>
                <Text style={[styles.seeAllText, { color: colors.buttonPrimary }]}>See All</Text>
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
                  style={[styles.eventCard, { backgroundColor: colors.cardElevated }]}
                  onPress={() => router.push({
                    pathname: '/event/[id]',
                    params: { id: event.id },
                  })}
                >
                  <Image source={{ uri: event.imageUrl }} style={styles.eventImage} />
                  <View style={styles.eventInfo}>
                    <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
                    <Text style={[styles.eventDate, { color: colors.textTertiary }]}>{event.date}</Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
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
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
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
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  eventsScroll: {
    paddingRight: 16,
    gap: 12,
  },
  eventCard: {
    width: 140,
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
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
  },
});
