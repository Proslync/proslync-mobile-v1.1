import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '@/lib/api/auth';
import { followUser, unfollowUser } from '@/lib/api/follows';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useStableRouter } from '@/hooks/use-stable-router';
import { useAuth } from '@/lib/providers/auth-provider';

interface MiniUserCardProps {
  userId: number;
}

export function MiniUserCard({ userId }: MiniUserCardProps) {
  const { colors, isDark } = useAppTheme();
  const router = useStableRouter();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [followLoading, setFollowLoading] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => authApi.getUserById(userId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: followStatus } = useQuery({
    queryKey: ['user-follow-status', userId],
    queryFn: () => authApi.getFollowStatus(userId),
    staleTime: 2 * 60 * 1000,
    enabled: currentUser?.id !== userId,
  });

  const isFollowing = followStatus?.isFollowing ?? false;
  const isOwnProfile = currentUser?.id === userId;

  const handleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
      queryClient.invalidateQueries({ queryKey: ['user-follow-status', userId] });
    } catch {
      // silently fail
    } finally {
      setFollowLoading(false);
    }
  };

  const handlePress = () => {
    router.push({ pathname: '/user-profile/[userId]', params: { userId: String(userId) } });
  };

  if (isLoading) {
    return (
      <View style={[styles.card, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
        <ActivityIndicator size="small" color={colors.textSecondary} style={{ padding: 30 }} />
      </View>
    );
  }

  if (!profile) return null;

  const avatarUrl = profile.avatar?.url;
  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.userName || 'User';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {/* Avatar */}
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} resizeMode="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <Ionicons name="person-outline" size={22} color={colors.textTertiary} />
          </View>
        )}

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[styles.displayName, { color: colors.text }]} numberOfLines={1}>
              {displayName}
            </Text>
            {profile.isVerified && (
              <Ionicons name="checkmark-circle" size={14} color="#0095F6" style={{ marginLeft: 3 }} />
            )}
          </View>
          {profile.userName && (
            <Text style={[styles.username, { color: colors.textTertiary }]} numberOfLines={1}>
              @{profile.userName}
            </Text>
          )}

          {/* Follow Button (hidden for own profile) */}
          {!isOwnProfile && (
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing && styles.followButtonDone,
              ]}
              onPress={(e) => {
                e.stopPropagation?.();
                handleFollow();
              }}
              disabled={followLoading}
              activeOpacity={0.8}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[styles.followText, isFollowing && styles.followTextDone]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const CARD_WIDTH = 240;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 4,
  },
  content: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  displayName: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    lineHeight: 18,
    flexShrink: 1,
  },
  username: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  followButton: {
    backgroundColor: '#0095F6',
    borderRadius: 8,
    paddingVertical: 6,
    alignSelf: 'stretch',
    marginTop: 6,
    alignItems: 'center',
  },
  followButtonDone: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  followText: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  followTextDone: {
    color: 'rgba(255,255,255,0.5)',
  },
});
