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
import { liquidGlass, glassText, glassBorder } from '@/constants/glass/liquid-glass';
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
  const { isDark } = useAppTheme();
  const theme = isDark ? 'dark' : 'light';
  const t = glassText[theme];
  const border = glassBorder[theme];
  const roleLabel = getRoleLabel(user.role);

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && { overflow: 'hidden' as const }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isSelected && <GlassView {...liquidGlass.fillFaint} borderRadius={0} style={StyleSheet.absoluteFillObject} />}
      <View style={styles.avatarContainer}>
        <Image
          source={user.avatarUrl ? { uri: user.avatarUrl } : DefaultAvatarImage}
          style={[styles.avatar, { borderColor: border }]}
        />
        {user.isOnline && <View style={[styles.onlineIndicator, { borderColor: isDark ? '#000' : '#fff' }]} />}
      </View>

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: t.primary }]} numberOfLines={1}>
            {user.name}
          </Text>
          {user.isVerified && (
            <MaterialCommunityIcons
              name="check-decagram"
              size={14}
              color="#FF6F3C"
              style={styles.verifiedIcon}
            />
          )}
        </View>
        {roleLabel && <Text style={[styles.role, { color: t.muted }]}>{roleLabel}</Text>}
      </View>

      {isSelected && (
        <View style={styles.checkmark}>
          <Ionicons name="checkmark-circle" size={24} color={t.primary} />
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
    backgroundColor: 'transparent',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
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
    flexShrink: 1,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  role: {
    fontSize: 13,
    marginTop: 2,
  },
  checkmark: {
    marginLeft: 8,
  },
});
