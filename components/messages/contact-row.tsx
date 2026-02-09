// Contact Row - Contact item for new message screen

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../lib/types/messages.types';

const DefaultAvatarImage = require('@/assets/images/default-avatar.png');

interface ContactRowProps {
  user: User;
  onPress: () => void;
  isSelected?: boolean;
}

function getRoleLabel(role: User['role']): string {
  switch (role) {
    case 'venue':
      return 'Venue';
    case 'promoter':
      return 'Promoter';
    case 'support':
      return 'Support';
    default:
      return '';
  }
}

export function ContactRow({ user, onPress, isSelected }: ContactRowProps) {
  const roleLabel = getRoleLabel(user.role);

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.containerSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Image
          source={user.avatarUrl ? { uri: user.avatarUrl } : DefaultAvatarImage}
          style={styles.avatar}
        />
        {user.isOnline && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {user.name}
          </Text>
          {user.isVerified && (
            <Ionicons
              name="checkmark-circle"
              size={14}
              color="#3b82f6"
              style={styles.verifiedIcon}
            />
          )}
        </View>
        {roleLabel && <Text style={styles.role}>{roleLabel}</Text>}
      </View>

      {isSelected && (
        <View style={styles.checkmark}>
          <Ionicons name="checkmark-circle" size={24} color="#0095f6" />
        </View>
      )}
    </TouchableOpacity>
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
  containerSelected: {
    backgroundColor: 'rgba(0, 149, 246, 0.1)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34c759',
    borderWidth: 2,
    borderColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
    flexShrink: 1,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  role: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  checkmark: {
    marginLeft: 8,
  },
});
