// Contact Row - Contact item for new message screen

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useAppTheme } from '@/hooks/use-app-theme';
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
  const { colors, isDark } = useAppTheme();
  const roleLabel = getRoleLabel(user.role);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.background }, isSelected && (isDark ? { overflow: 'hidden' as const } : styles.containerSelected)]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isSelected && isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={0} style={StyleSheet.absoluteFillObject} />}
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
            <MaterialCommunityIcons
              name="check-decagram"
              size={14}
              color="#3897F0"
              style={styles.verifiedIcon}
            />
          )}
        </View>
        {roleLabel && <Text style={styles.role}>{roleLabel}</Text>}
      </View>

      {isSelected && (
        <View style={styles.checkmark}>
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
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
  },
  containerSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
