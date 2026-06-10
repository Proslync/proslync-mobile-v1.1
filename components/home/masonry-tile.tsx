/**
 * MasonryTile — generic masonry tile for the PRO home tab.
 * Renders AbstractArt with a seeded aspect ratio, a one-line caption row,
 * and an entrance animation stagger for the first screenful.
 */

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AbstractArt } from '@/components/fan/abstract-art';
import { seededAspect } from '@/lib/fan/seeded';

const TEXT_SECONDARY = 'rgba(255,255,255,0.55)';

export type Props = {
  id: string;
  caption: string;
  colWidth: number;
  index: number;
  onPress: () => void;
};

export const MasonryTile = React.memo(function MasonryTile({
  id,
  caption,
  colWidth,
  index,
  onPress,
}: Props): React.JSX.Element {
  const artHeight = Math.round(colWidth / seededAspect(id));
  const handlePress = React.useCallback(() => onPress(), [onPress]);

  const card = (
    <Pressable style={styles.card} onPress={handlePress}>
      <AbstractArt seed={id} width={colWidth} height={artHeight} />
      <View style={styles.metaRow}>
        <Text style={styles.caption} numberOfLines={1}>{caption}</Text>
        <Ionicons name="ellipsis-horizontal" size={16} color={TEXT_SECONDARY} />
      </View>
    </Pressable>
  );

  // Entrance stagger for first screenful only.
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  caption: { flex: 1, color: TEXT_SECONDARY, fontSize: 13 },
});
