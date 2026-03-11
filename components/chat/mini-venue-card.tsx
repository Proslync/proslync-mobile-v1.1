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
import { venuesApi } from '@/lib/api/venues';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useStableRouter } from '@/hooks/use-stable-router';

interface MiniVenueCardProps {
  venueId: number;
}

export function MiniVenueCard({ venueId }: MiniVenueCardProps) {
  const { colors, isDark } = useAppTheme();
  const router = useStableRouter();
  const queryClient = useQueryClient();
  const [followLoading, setFollowLoading] = useState(false);

  const { data: venue, isLoading } = useQuery({
    queryKey: ['venue', venueId],
    queryFn: () => venuesApi.getVenue(venueId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: followStatus } = useQuery({
    queryKey: ['venue-follow-status', venueId],
    queryFn: () => venuesApi.getVenueFollowStatus(venueId),
    staleTime: 2 * 60 * 1000,
  });

  const isFollowing = followStatus?.isFollowing ?? false;

  const handleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await venuesApi.unfollowVenue(venueId);
      } else {
        await venuesApi.followVenue(venueId);
      }
      queryClient.invalidateQueries({ queryKey: ['venue-follow-status', venueId] });
    } catch {
      // silently fail
    } finally {
      setFollowLoading(false);
    }
  };

  const handlePress = () => {
    router.push({ pathname: '/venue/[id]', params: { id: String(venueId) } });
  };

  if (isLoading) {
    return (
      <View style={[styles.card, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
        <ActivityIndicator size="small" color={colors.textSecondary} style={{ padding: 30 }} />
      </View>
    );
  }

  if (!venue) return null;

  const logoUrl = venue.logo?.url;

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
        {/* Venue Logo */}
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="cover" />
        ) : (
          <View style={[styles.logo, styles.logoPlaceholder, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <Ionicons name="business-outline" size={24} color={colors.textTertiary} />
          </View>
        )}

        {/* Info */}
        <View style={styles.info}>
          <Text style={[styles.venueName, { color: colors.text }]} numberOfLines={1}>
            {venue.name}
          </Text>
          {venue.address && (
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={11} color={colors.textTertiary} />
              <Text style={[styles.address, { color: colors.textTertiary }]} numberOfLines={2}>
                {venue.address}
              </Text>
            </View>
          )}

          {/* Follow Button */}
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
  logo: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  logoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  venueName: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    lineHeight: 18,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 3,
    marginTop: 1,
  },
  address: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    flex: 1,
    lineHeight: 14,
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
