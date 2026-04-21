// Membership Card - Social profile card with avatar
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { GlassView } from 'expo-glass-effect';
import { WalletUser } from '../../lib/types/wallet.types';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useAppTheme } from '@/hooks/use-app-theme';

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
  const { isDark } = useAppTheme();
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
          <GlassView
            {...liquidGlass.surface}
            borderRadius={20}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.content}>
            <Image
              source={StatusLogo}
              style={styles.logo}
              contentFit="contain"
            />

            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: isDark ? undefined : 'rgba(0,0,0,0.06)', overflow: 'hidden' }]}>
                {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={28} style={StyleSheet.absoluteFillObject} />}
                <Image
                  source={hasAvatar ? { uri: user.avatarUrl } : DefaultAvatarImage}
                  style={styles.avatarImage}
                />
              </View>
              <View style={styles.avatarRing} />
            </View>

            <Text style={styles.displayName} numberOfLines={1}>{user.name}</Text>

            {user.userName ? (
              <View style={styles.handleRow}>
                <Text style={styles.handle} numberOfLines={1}>@{user.userName}</Text>
                {user.isVerified && (
                  <MaterialCommunityIcons name="check-decagram" size={15} color="#FF6F3C" />
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

// Incomplete Membership Card - Shown when profile is missing firstName/lastName
interface IncompleteMembershipCardProps {
  onPress: () => void;
}

export function IncompleteMembershipCard({ onPress }: IncompleteMembershipCardProps) {
  return (
    <View style={[styles.cardWrapper, { width: CARD_WIDTH }]}>
      <View style={[styles.card, { width: CARD_WIDTH }]}>
        <GlassView
          {...liquidGlass.surface}
          borderRadius={20}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.content}>
          <Image
            source={StatusLogo}
            style={styles.logo}
            contentFit="contain"
          />

          <View style={incompleteStyles.iconContainer}>
            <GlassView
              {...liquidGlass.surface}
              borderRadius={28}
              style={StyleSheet.absoluteFillObject}
            />
            <Ionicons name="shield-checkmark-outline" size={48} color="#fff" />
          </View>

          <Text style={styles.displayName}>Activate Your Card</Text>

          <Text style={incompleteStyles.subtitle}>
            Complete your profile to unlock your membership card
          </Text>

          <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            style={incompleteStyles.button}
          >
            <GlassView
              {...liquidGlass.surface}
              borderRadius={12}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={incompleteStyles.buttonText}>Complete Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const incompleteStyles = StyleSheet.create({
  iconContainer: {
    marginBottom: 10,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.45)',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  button: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  buttonText: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
  },
});

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
    backgroundColor: '#000',
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
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
