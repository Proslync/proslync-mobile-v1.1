// Info Sheet - Thread details modal

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Image,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Conversation, User } from '../../lib/types/messages.types';

const DefaultAvatarImage = require('@/assets/images/default-avatar.png');

interface InfoSheetProps {
  visible: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  onMuteToggle: () => void;
  onPinToggle: () => void;
  onBlock?: () => void;
  onReport?: () => void;
  onViewEvent?: (eventId: string) => void;
}

// Only show mock shared media in development
const MOCK_SHARED_MEDIA: string[] = __DEV__
  ? [
      'https://picsum.photos/seed/media1/200/200',
      'https://picsum.photos/seed/media2/200/200',
      'https://picsum.photos/seed/media3/200/200',
      'https://picsum.photos/seed/media4/200/200',
      'https://picsum.photos/seed/media5/200/200',
      'https://picsum.photos/seed/media6/200/200',
    ]
  : [];

export function InfoSheet({
  visible,
  onClose,
  conversation,
  onMuteToggle,
  onPinToggle,
  onBlock,
  onReport,
  onViewEvent,
}: InfoSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  if (!conversation) return null;

  const participant = conversation.participants[0];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.overlayTap} onPress={onClose} />
        <View style={[
          styles.container,
          {
            paddingBottom: insets.bottom + 16,
            backgroundColor: isDark ? '#1c1c1e' : colors.card,
          }
        ]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Details</Text>
            <View style={styles.closeButton} />
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Section */}
            <View style={[styles.profileSection, { borderBottomColor: colors.border }]}>
              <Image
                source={participant?.avatarUrl ? { uri: participant.avatarUrl } : DefaultAvatarImage}
                style={styles.avatar}
              />
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: colors.text }]}>{conversation.title}</Text>
                {participant?.isVerified && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color="#3b82f6"
                    style={styles.verifiedIcon}
                  />
                )}
              </View>
              <Text style={[styles.roleText, { color: colors.textSecondary }]}>
                {participant?.role === 'venue'
                  ? 'Venue'
                  : participant?.role === 'promoter'
                  ? 'Promoter'
                  : participant?.role === 'support'
                  ? 'Support'
                  : 'Guest'}
              </Text>
              {participant?.isOnline ? (
                <Text style={[styles.statusText, { color: colors.textTertiary }]}>Active now</Text>
              ) : (
                <Text style={[styles.statusText, { color: colors.textTertiary }]}>
                  Last seen {participant?.lastSeen ? 'recently' : 'a while ago'}
                </Text>
              )}
            </View>

            {/* Event Context Card */}
            {conversation.context && (
              <View style={[styles.section, { borderBottomColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Event</Text>
                <TouchableOpacity
                  style={[
                    styles.eventCard,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }
                  ]}
                  onPress={() => onViewEvent?.(conversation.context!.eventId)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: conversation.context.flyerUrl }}
                    style={styles.eventFlyer}
                  />
                  <View style={styles.eventInfo}>
                    <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
                      {conversation.context.eventTitle}
                    </Text>
                    <Text style={[styles.eventVenue, { color: colors.textSecondary }]}>
                      {conversation.context.venueName}
                    </Text>
                    {conversation.context.dateTimeLabel && (
                      <Text style={[styles.eventDate, { color: colors.textTertiary }]}>
                        {conversation.context.dateTimeLabel}
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Settings */}
            <View style={[styles.section, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Settings</Text>

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="pin"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <Text style={[styles.settingText, { color: colors.text }]}>Pin Conversation</Text>
                </View>
                <Switch
                  value={conversation.isPinned}
                  onValueChange={onPinToggle}
                  trackColor={{
                    false: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                    true: '#0095f6'
                  }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="notifications-off"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <Text style={[styles.settingText, { color: colors.text }]}>Mute Notifications</Text>
                </View>
                <Switch
                  value={conversation.isMuted}
                  onValueChange={onMuteToggle}
                  trackColor={{
                    false: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                    true: '#0095f6'
                  }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {/* Shared Media */}
            <View style={[styles.section, { borderBottomColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Shared Media</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.mediaGrid}>
                {MOCK_SHARED_MEDIA.map((uri, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.mediaItem}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri }} style={styles.mediaImage} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Danger Zone */}
            <View style={[styles.section, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={() => {
                  Alert.alert(
                    'Block User',
                    `Are you sure you want to block ${conversation.title}?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Block',
                        style: 'destructive',
                        onPress: onBlock,
                      },
                    ]
                  );
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="ban" size={20} color="#ff3b30" />
                <Text style={styles.dangerText}>Block</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dangerButton}
                onPress={() => {
                  Alert.alert(
                    'Report',
                    'Report this conversation for review?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Report',
                        style: 'destructive',
                        onPress: onReport,
                      },
                    ]
                  );
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="flag" size={20} color="#ff3b30" />
                <Text style={styles.dangerText}>Report</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTap: {
    flex: 1,
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
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
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
  },
  verifiedIcon: {
    marginLeft: 6,
  },
  roleText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    marginTop: 4,
  },
  statusText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 4,
  },
  section: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
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
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: '#0095f6',
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
  },
  eventFlyer: {
    width: 60,
    height: 80,
    borderRadius: 8,
  },
  eventInfo: {
    flex: 1,
    marginLeft: 12,
  },
  eventTitle: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    marginBottom: 4,
  },
  eventVenue: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  eventDate: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  mediaItem: {
    width: '32%',
    aspectRatio: 1,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  dangerText: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: '#ff3b30',
  },
});
