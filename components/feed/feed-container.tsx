import * as React from 'react';
import {
  FlatList,
  Dimensions,
  ViewToken,
  StyleSheet,
  RefreshControlProps,
} from 'react-native';
import { FeedItem } from './feed-item';
import type { FeedItem as FeedItemType } from '@/lib/types/feed.types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FeedContainerProps {
  items: FeedItemType[];
  currentIndex: number;
  likedItems: Set<string>;
  rsvpItems: Map<string, boolean>;
  pendingRsvpItems: Map<string, boolean>;
  purchasedItems: Set<string>;
  showDoubleTapHeart: string | null;
  onIndexChange: (index: number) => void;
  onDoubleTap: (id: string) => void;
  onRsvp: (id: string) => void;
  onPendingRsvp: (id: string) => void;
  onPurchase: (id: string) => void;
  onRefer: (id: string) => void;
  onUserClick: (item: FeedItemType) => void;
  onEventPress: (item: FeedItemType) => void;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

export function FeedContainer({
  items,
  currentIndex,
  likedItems,
  rsvpItems,
  pendingRsvpItems,
  purchasedItems,
  showDoubleTapHeart,
  onIndexChange,
  onDoubleTap,
  onRsvp,
  onPendingRsvp,
  onPurchase,
  onRefer,
  onUserClick,
  onEventPress,
  refreshControl,
}: FeedContainerProps) {
  const flatListRef = React.useRef<FlatList>(null);

  const viewabilityConfig = React.useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = React.useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const visibleIndex = viewableItems[0].index;
        if (visibleIndex !== null && visibleIndex !== currentIndex) {
          onIndexChange(visibleIndex);
        }
      }
    },
    [currentIndex, onIndexChange]
  );

  const renderItem = React.useCallback(
    ({ item, index }: { item: FeedItemType; index: number }) => (
      <FeedItem
        item={item}
        index={index}
        isActive={index === currentIndex}
        isLiked={likedItems.has(item.id)}
        isRsvp={rsvpItems.get(item.id) ?? false}
        isPendingRsvp={pendingRsvpItems.get(item.id) ?? false}
        isPurchased={purchasedItems.has(item.id)}
        showDoubleTapHeart={showDoubleTapHeart === item.id}
        onDoubleTap={() => onDoubleTap(item.id)}
        onRsvp={() => onRsvp(item.id)}
        onPendingRsvp={() => onPendingRsvp(item.id)}
        onPurchase={() => onPurchase(item.id)}
        onRefer={() => onRefer(item.id)}
        onUserClick={() => onUserClick(item)}
        onEventPress={() => onEventPress(item)}
      />
    ),
    [
      currentIndex,
      likedItems,
      rsvpItems,
      pendingRsvpItems,
      purchasedItems,
      showDoubleTapHeart,
      onDoubleTap,
      onRsvp,
      onPendingRsvp,
      onPurchase,
      onRefer,
      onUserClick,
      onEventPress,
    ]
  );

  const getItemLayout = React.useCallback(
    (_: any, index: number) => ({
      length: SCREEN_HEIGHT,
      offset: SCREEN_HEIGHT * index,
      index,
    }),
    []
  );

  return (
    <FlatList
      ref={flatListRef}
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      snapToInterval={SCREEN_HEIGHT}
      snapToAlignment="start"
      decelerationRate="fast"
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      getItemLayout={getItemLayout}
      removeClippedSubviews
      maxToRenderPerBatch={3}
      windowSize={5}
      initialNumToRender={2}
      bounces={false}
      overScrollMode="never"
      style={styles.container}
      refreshControl={refreshControl}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
