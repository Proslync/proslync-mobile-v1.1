import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AbstractArt } from '@/components/fan/abstract-art';
import { seededAspect } from '@/lib/fan/seeded';
import type { FanPost } from '@/lib/types/fan.types';

const TEXT_SECONDARY = 'rgba(255,255,255,0.55)';

type Props = {
  post: FanPost;
  colWidth: number;
  index: number;
  onPress: (post: FanPost) => void;
};

export const MasonryPostCard = React.memo(function MasonryPostCard({
  post, colWidth, index, onPress,
}: Props): React.JSX.Element {
  const artHeight = Math.round(colWidth / seededAspect(post.id));
  const caption = post.body?.trim() || `@${post.author?.handle ?? 'unknown'}`;
  const handlePress = React.useCallback(() => onPress(post), [onPress, post]);
  const card = (
    <Pressable style={styles.card} onPress={handlePress}>
      <AbstractArt seed={post.id} width={colWidth} height={artHeight} />
      <View style={styles.metaRow}>
        <Text style={styles.caption} numberOfLines={1}>{caption}</Text>
        <Ionicons name="ellipsis-horizontal" size={16} color={TEXT_SECONDARY} />
      </View>
    </Pressable>
  );
  // Entrance stagger on the first screenful only.
  if (index < 12) {
    return (
      <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 60).duration(250)}>
        {card}
      </Animated.View>
    );
  }
  return card;
});

const styles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#1A1A1A' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8 },
  caption: { flex: 1, color: TEXT_SECONDARY, fontSize: 13 },
});
