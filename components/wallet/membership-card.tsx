// Membership Card - Premium black/white status card
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WalletUser, TIER_PERKS } from '../../lib/types/wallet.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = CARD_WIDTH * 0.6;

interface MembershipCardProps {
  user: WalletUser;
  onPress?: () => void;
  enlarged?: boolean;
}

function formatMemberSince(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `Since ${month} ${year}`;
}

export function MembershipCard({ user, onPress, enlarged = false }: MembershipCardProps) {
  const cardWidth = enlarged ? SCREEN_WIDTH - 64 : CARD_WIDTH;
  const cardHeight = cardWidth * 0.6;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { width: cardWidth, height: cardHeight },
        enlarged && styles.cardEnlarged,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.9 : 1}
      disabled={!onPress}
    >
      {/* Logo area - top left */}
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>S</Text>
        </View>
      </View>

      {/* Tier badge - top right */}
      <View style={styles.tierBadge}>
        <Text style={styles.tierText}>{user.statusTier}</Text>
      </View>

      {/* Card content - bottom */}
      <View style={styles.cardContent}>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.sinceDate}>{formatMemberSince(user.memberSince)}</Text>
      </View>

      {/* Decorative elements */}
      <View style={styles.decorativeLines}>
        <View style={styles.line1} />
        <View style={styles.line2} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#000',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    position: 'relative',
  },
  cardEnlarged: {
    marginHorizontal: 0,
  },
  logoContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 22,
    fontFamily: 'Lato_900Black',
    color: '#000',
  },
  tierBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tierText: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  cardContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  userName: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  sinceDate: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  decorativeLines: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '50%',
    height: '60%',
  },
  line1: {
    position: 'absolute',
    right: 30,
    bottom: 20,
    width: 80,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ rotate: '-30deg' }],
  },
  line2: {
    position: 'absolute',
    right: 50,
    bottom: 40,
    width: 60,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    transform: [{ rotate: '-30deg' }],
  },
});
