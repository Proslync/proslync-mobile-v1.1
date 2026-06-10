// Following feed — horizontal athlete strip + LATEST `<FeedCard />` list.
// Powered by mock FAN_FOLLOWING + FAN_FEED. Universal (renders for every
// authenticated user via the Triad surface). Extracted from
// components/fan/fan-view.tsx during fan-content-to-triad-2026-05-12.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { FAN_FEED, FAN_FOLLOWING } from '@/lib/data/mock-fan-data';
import { FAN_ACCENT } from '@/constants/brand';

import { AthleteAvatar } from './athlete-avatar';
import { FeedCard } from './feed-card';

interface FollowingFeedProps {
  /** Bottom inset (safe-area) so the scroll content clears the tab bar. */
  bottomInset?: number;
  /** Top inset (safe-area) so the scroll content clears the status bar / notch. */
  topInset?: number;
}

export function FollowingFeed({ bottomInset = 0, topInset = 0 }: FollowingFeedProps) {
  // Local follow state — IDs of athletes the user has explicitly unfollowed
  // this session. Mock-only; real backend follow state lands with the
  // social-graph Slice (deferred).
  const [unfollowed, setUnfollowed] = React.useState<Set<string>>(new Set());

  const toggleFollow = React.useCallback((athleteId: string, athleteName: string) => {
    setUnfollowed((prev) => {
      const next = new Set(prev);
      const wasFollowing = !next.has(athleteId);
      if (wasFollowing) next.add(athleteId);
      else next.delete(athleteId);
      Alert.alert(
        wasFollowing ? 'Unfollowed' : 'Followed',
        `${wasFollowing ? 'Unfollowed' : 'Following'} ${athleteName}.`,
      );
      return next;
    });
  }, []);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: topInset + 4, paddingBottom: bottomInset + 40 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Athlete strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.athleteStrip}
      >
        {FAN_FOLLOWING.map((a) => {
          const following = !unfollowed.has(a.id);
          return (
            <TouchableOpacity
              key={a.id}
              activeOpacity={0.7}
              style={styles.athleteChip}
              onPress={() => toggleFollow(a.id, a.name)}
              accessibilityRole="button"
              accessibilityLabel={
                following ? `Unfollow ${a.name}` : `Follow ${a.name}`
              }
            >
              <View style={styles.athleteAvatarWrap}>
                <AthleteAvatar
                  size={54}
                  color={a.avatarColor}
                  initials={a.initials}
                  headshotUrl={a.headshotUrl}
                  isLive={a.isLive}
                  borderWidth={2}
                />
                {!following && (
                  <View style={styles.followBadge}>
                    <Ionicons name="add" size={11} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <Text style={styles.athleteChipName} numberOfLines={1}>
                {a.name.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.kicker}>LATEST · {FAN_FEED.length}</Text>
      {FAN_FEED.map((item, i) => (
        <FeedCard key={item.id} item={item} delay={i * 60} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 16 },
  kicker: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.8,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 14,
  },
  athleteStrip: {
    paddingHorizontal: 0,
    paddingBottom: 4,
    gap: 12,
  },
  athleteChip: { alignItems: 'center', width: 64, gap: 6 },
  athleteAvatarWrap: { position: 'relative' },
  followBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: FAN_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  athleteChipName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '600',
  },
});
