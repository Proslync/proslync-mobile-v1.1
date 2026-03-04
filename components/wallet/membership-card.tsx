// Membership Card - Social profile card with avatar
import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { WalletUser } from '../../lib/types/wallet.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;
const DefaultAvatarImage = require('@/assets/images/default-avatar.png');
const StatusLogo = require('@/assets/images/status_logo.png');

interface MembershipCardProps {
  user: WalletUser;
  onPress?: () => void;
  enlarged?: boolean;
}

function formatMemberSince(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `Member since ${month} ${year}`;
}

export function MembershipCard({ user, onPress, enlarged = false }: MembershipCardProps) {
  const cardWidth = enlarged ? SCREEN_WIDTH - 64 : CARD_WIDTH;
  const hasAvatar = !!user.avatarUrl;

  return (
    <View style={[styles.cardWrapper, { width: cardWidth }]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.95}
        disabled={!onPress}
      >
        <View style={[styles.card, { width: cardWidth }, enlarged && styles.cardEnlarged]}>
          <View style={styles.content}>
            <Image
              source={StatusLogo}
              style={styles.logo}
              resizeMode="contain"
            />

            <View style={styles.avatarContainer}>
              <Image
                source={hasAvatar ? { uri: user.avatarUrl } : DefaultAvatarImage}
                style={styles.avatar}
              />
              <View style={styles.avatarRing} />
            </View>

            <Text style={styles.displayName} numberOfLines={1}>{user.name}</Text>

            {user.userName ? (
              <View style={styles.handleRow}>
                <Text style={styles.handle} numberOfLines={1}>@{user.userName}</Text>
                {user.isVerified && (
                  <MaterialCommunityIcons name="check-decagram" size={15} color="#3897F0" />
                )}
              </View>
            ) : null}

            <View style={styles.memberRow}>
              <Ionicons name="calendar-outline" size={11} color="rgba(255, 255, 255, 0.6)" />
              <Text style={styles.memberSince}>{formatMemberSince(user.memberSince)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: '#0c0c0c',
  },
  cardEnlarged: {
    marginHorizontal: 0,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
  },
  logo: {
    width: 90,
    height: 32,
    tintColor: '#fff',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  displayName: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 2,
  },
  handle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
    textAlign: 'center',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 4,
  },
  memberSince: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
