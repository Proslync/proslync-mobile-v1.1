// Feed card — one item in the LATEST fan feed (athlete post-type cards).
// Type label colors: HIGHLIGHT=red, POST=slate (FEED_POST_TYPE_COLOR
// replaced the off-brand platinum purple per D3), ANNOUNCEMENT=copper,
// MILESTONE=amber. Extracted from components/fan/fan-view.tsx during
// fan-content-to-triad-2026-05-12 (Phase 2a).

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { getHeadshotUrl } from '@/lib/data/photo-urls';
import type { FeedItem } from '@/lib/data/mock-fan-data';
import {
  FAN_ACCENT,
  FAN_ACCENT_BORDER,
  FAN_ACCENT_SOFT,
  FEED_POST_TYPE_COLOR,
} from '@/constants/brand';
import { AthleteAvatar } from './athlete-avatar';

const ACCENT = '#EB621A';
const CARD_BG = 'rgba(255,255,255,0.05)';
const CARD_BORDER = 'rgba(255,255,255,0.09)';

interface FeedCardProps {
  item: FeedItem;
  delay?: number;
}

export function FeedCard({ item, delay = 0 }: FeedCardProps) {
  const [liked, setLiked] = React.useState(false);

  const typeLabel = {
    highlight: 'HIGHLIGHT',
    post: 'POST',
    announcement: 'ANNOUNCEMENT',
    milestone: 'MILESTONE',
  }[item.type];

  const typeColor = {
    highlight: '#FF4444',
    post: FEED_POST_TYPE_COLOR,
    announcement: ACCENT,
    milestone: '#F5B400',
  }[item.type];

  const likeCount = item.reactions.likes + (liked ? 1 : 0);

  const onShare = React.useCallback(() => {
    void Share.share({
      message: `${item.athleteName} on Proslync: ${item.content}`,
    });
  }, [item.athleteName, item.content]);

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(380)}
      style={styles.feedCard}
    >
      <View style={styles.feedHead}>
        <AthleteAvatar
          size={40}
          color={item.athleteColor}
          initials={item.athleteInitials}
          headshotUrl={
            item.athleteHeadshotUrl ?? getHeadshotUrl(item.athleteName)
          }
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.feedName}>{item.athleteName}</Text>
          <View style={styles.feedTypeRow}>
            <Text style={[styles.feedType, { color: typeColor }]}>{typeLabel}</Text>
            <Text style={styles.feedTime}>· {item.timeAgo}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.feedContent}>{item.content}</Text>
      <View style={styles.feedReactions}>
        <TouchableOpacity
          style={styles.reactBtn}
          activeOpacity={0.7}
          onPress={() => setLiked((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={liked ? 'Unlike post' : 'Like post'}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={15}
            color={liked ? '#FF4444' : 'rgba(255,255,255,0.7)'}
          />
          <Text style={[styles.reactText, liked && styles.reactTextActive]}>
            {likeCount.toLocaleString()}
          </Text>
        </TouchableOpacity>
        <View style={styles.reactBtn}>
          <Ionicons name="chatbubble-outline" size={14} color="rgba(255,255,255,0.7)" />
          <Text style={styles.reactText}>
            {item.reactions.comments.toLocaleString()}
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.shareBtn}
          activeOpacity={0.7}
          onPress={onShare}
          accessibilityRole="button"
          accessibilityLabel={`Share ${item.athleteName}'s post`}
        >
          <Ionicons name="share-outline" size={14} color={FAN_ACCENT} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  feedCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 14,
    backgroundColor: CARD_BG,
    marginBottom: 10,
  },
  feedHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  feedName: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  feedTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  feedType: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  feedTime: { color: 'rgba(255,255,255,0.45)', fontSize: 11 },
  feedContent: {
    color: '#FFFFFF',
    fontSize: 13.5,
    lineHeight: 19,
    marginBottom: 10,
  },
  feedReactions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  reactBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reactText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  reactTextActive: { color: '#FF4444', fontWeight: '700' },
  shareBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: FAN_ACCENT_SOFT,
    borderWidth: 1,
    borderColor: FAN_ACCENT_BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
