import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { eventsApi } from '@/lib/api/events';
import type { EventAttendee } from '@/lib/types/events.types';

export default function GuestListPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ eventId?: string; eventTitle?: string }>();

  const [attendees, setAttendees] = React.useState<EventAttendee[]>([]);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchAttendees() {
      if (!params.eventId) return;
      const numericId = parseInt(params.eventId, 10);
      if (isNaN(numericId)) return;

      setIsLoading(true);
      try {
        const response = await eventsApi.getEventAttendees(numericId);
        setAttendees(response.attendees);
        setTotal(response.total);
      } catch (error) {
        console.log('[GuestList] Could not fetch attendees:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAttendees();
  }, [params.eventId]);

  const navigateToProfile = (attendee: EventAttendee) => {
    router.push({
      pathname: '/user/[username]',
      params: {
        username: attendee.userName || String(attendee.userId),
        userId: String(attendee.userId),
      },
    });
  };

  const renderGuest = ({ item }: { item: EventAttendee }) => {
    const displayName = [item.firstName, item.lastName].filter(Boolean).join(' ') || item.userName || 'Guest';
    return (
      <TouchableOpacity
        style={styles.guestRow}
        activeOpacity={0.7}
        onPress={() => navigateToProfile(item)}
      >
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.guestAvatarImage} />
        ) : (
          <View style={styles.guestAvatar}>
            <Text style={styles.guestAvatarText}>{displayName[0].toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.guestInfo}>
          <Text style={styles.guestName}>{displayName}</Text>
          {item.userName && (
            <Text style={styles.guestUsername}>@{item.userName}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.viewProfileButton}
          activeOpacity={0.7}
          onPress={() => navigateToProfile(item)}
        >
          <Text style={styles.viewProfileText}>View Profile</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <DarkGradientBg />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Guest List</Text>
          {params.eventTitle && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {params.eventTitle}
            </Text>
          )}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Guest count */}
      <View style={styles.countRow}>
        <Ionicons name="people" size={16} color="rgba(255,255,255,0.5)" />
        <Text style={styles.countText}>
          {isLoading ? 'Loading...' : `${total} attending`}
        </Text>
      </View>

      {/* Loading state */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="rgba(255,255,255,0.5)" />
        </View>
      )}

      {/* Empty state */}
      {!isLoading && attendees.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color="rgba(255,255,255,0.15)" />
          <Text style={styles.emptyTitle}>No guests yet</Text>
          <Text style={styles.emptySubtitle}>Be the first to RSVP!</Text>
        </View>
      )}

      {/* Guest list */}
      {!isLoading && attendees.length > 0 && (
        <FlatList
          data={attendees}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderGuest}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  headerSpacer: {
    width: 36,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  countText: {
    fontSize: 14,
    fontFamily: 'Lato_600SemiBold',
    color: 'rgba(255,255,255,0.5)',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  guestAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  guestAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  guestAvatarText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  guestUsername: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  viewProfileButton: {
    backgroundColor: '#3897F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 151, 240, 0.3)',
  },
  viewProfileText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Lato_600SemiBold',
    color: 'rgba(255,255,255,0.4)',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.3)',
    marginTop: 8,
  },
});
