import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface NotificationItem {
  id: string;
  type: 'follow' | 'rsvp' | 'like' | 'comment' | 'event' | 'mention';
  title: string;
  body: string;
  time: string;
  read: boolean;
  avatar?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
}

const PLACEHOLDER_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    type: 'follow',
    title: 'Sarah Chen',
    body: 'started following you',
    time: '2m ago',
    read: false,
    icon: 'person-add',
    iconColor: '#3897F0',
    iconBg: 'rgba(56,151,240,0.1)',
  },
  {
    id: '2',
    type: 'rsvp',
    title: 'Friday Night Live',
    body: "You're confirmed! Event starts at 9 PM tonight",
    time: '15m ago',
    read: false,
    icon: 'checkmark-circle',
    iconColor: '#34C759',
    iconBg: 'rgba(52,199,89,0.1)',
  },
  {
    id: '3',
    type: 'like',
    title: 'Mike Torres',
    body: 'liked your event post',
    time: '1h ago',
    read: false,
    icon: 'heart',
    iconColor: '#FF3B30',
    iconBg: 'rgba(255,59,48,0.1)',
  },
  {
    id: '4',
    type: 'event',
    title: 'Rooftop Sessions',
    body: 'is happening tomorrow. Don\'t forget!',
    time: '2h ago',
    read: true,
    icon: 'calendar',
    iconColor: '#FF9500',
    iconBg: 'rgba(255,149,0,0.1)',
  },
  {
    id: '5',
    type: 'comment',
    title: 'Jess Kim',
    body: 'commented: "This is going to be amazing!"',
    time: '3h ago',
    read: true,
    icon: 'chatbubble',
    iconColor: '#3897F0',
    iconBg: 'rgba(56,151,240,0.1)',
  },
  {
    id: '6',
    type: 'follow',
    title: 'DJ Snake',
    body: 'started following you',
    time: '5h ago',
    read: true,
    icon: 'person-add',
    iconColor: '#3897F0',
    iconBg: 'rgba(56,151,240,0.1)',
  },
  {
    id: '7',
    type: 'event',
    title: 'Summer Music Festival',
    body: 'Early bird tickets are now available',
    time: '8h ago',
    read: true,
    icon: 'ticket',
    iconColor: '#AF52DE',
    iconBg: 'rgba(175,82,222,0.1)',
  },
  {
    id: '8',
    type: 'mention',
    title: 'Marcus J.',
    body: 'mentioned you in a comment',
    time: '12h ago',
    read: true,
    icon: 'at',
    iconColor: '#3897F0',
    iconBg: 'rgba(56,151,240,0.1)',
  },
  {
    id: '9',
    type: 'rsvp',
    title: 'Kaytranada Live',
    body: '5 of your friends are going',
    time: '1d ago',
    read: true,
    icon: 'people',
    iconColor: '#34C759',
    iconBg: 'rgba(52,199,89,0.1)',
  },
  {
    id: '10',
    type: 'like',
    title: 'Sophia R.',
    body: 'and 3 others liked your post',
    time: '1d ago',
    read: true,
    icon: 'heart',
    iconColor: '#FF3B30',
    iconBg: 'rgba(255,59,48,0.1)',
  },
];

function NotificationRow({ item }: { item: NotificationItem }) {
  return (
    <TouchableOpacity
      style={[styles.notificationRow, !item.read && styles.notificationUnread]}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon} size={18} color={item.iconColor} />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationText} numberOfLines={2}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          {'  '}
          {item.body}
        </Text>
        <Text style={styles.notificationTime}>{item.time}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const unreadCount = PLACEHOLDER_NOTIFICATIONS.filter(n => !n.read).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* New section */}
        {unreadCount > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>New</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            </View>
            {PLACEHOLDER_NOTIFICATIONS.filter(n => !n.read).map((item) => (
              <NotificationRow key={item.id} item={item} />
            ))}
          </>
        )}

        {/* Earlier section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Earlier</Text>
        </View>
        {PLACEHOLDER_NOTIFICATIONS.filter(n => n.read).map((item) => (
          <NotificationRow key={item.id} item={item} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
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
    color: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#1a1a1a',
  },
  badge: {
    backgroundColor: '#3897F0',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  notificationUnread: {
    backgroundColor: 'rgba(56,151,240,0.04)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.6)',
    lineHeight: 20,
  },
  notificationTitle: {
    fontFamily: 'Lato_700Bold',
    color: '#1a1a1a',
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.3)',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3897F0',
  },
});
