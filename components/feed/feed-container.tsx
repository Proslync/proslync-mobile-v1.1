import * as React from 'react';
import {
  FlatList,
  View,
  ViewToken,
  StyleSheet,
  RefreshControlProps,
  LayoutChangeEvent,
} from 'react-native';
import { FeedItem } from './feed-item';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTabNavigation } from '@/lib/providers/tab-navigation-provider';
import { analyticsApi } from '@/lib/api/analytics';
import type { FeedItem as FeedItemType } from '@/lib/types/feed.types';

interface FeedContainerProps {
  items: FeedItemType[];
  currentIndex: number;
  likedItems: Set<string>;
  rsvpItems: Map<string, boolean>;
  pendingRsvpItems: Map<string, boolean>;
  purchasedItems: Set<string>;
  onIndexChange: (index: number) => void;
  onRsvp: (id: string) => void;
  onPendingRsvp: (id: string) => void;
  onPurchase: (id: string) => void;
  onRefer: (id: string) => void;
  onUserClick: (item: FeedItemType) => void;
  onEventPress: (item: FeedItemType) => void;
  showDoubleTapHeart?: string | null;
  onDoubleTap: (id: string) => void;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

export function FeedContainer({
  items,
  currentIndex,
  likedItems,
  rsvpItems,
  pendingRsvpItems,
  purchasedItems,
  onIndexChange,
  onRsvp,
  onPendingRsvp,
  onPurchase,
  onRefer,
  onUserClick,
  onEventPress,
  showDoubleTapHeart,
  onDoubleTap,
  refreshControl,
}: FeedContainerProps) {
  const flatListRef = React.useRef<FlatList>(null);
  const [containerHeight, setContainerHeight] = React.useState(0);
  const { colors } = useAppTheme();
  const { currentTab } = useTabNavigation();
  const isFeedTab = currentTab === 'index';

  const [activeIndex, setActiveIndex] = React.useState(0);

  // ── Layout ──────────────────────────────────────────────────────────
  const handleLayout = React.useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && h !== containerHeight) {
      setContainerHeight(h);
    }
  }, [containerHeight]);

  // ── Viewability ─────────────────────────────────────────────────────
  const viewabilityConfig = React.useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Track which eventIds have been viewed this session to avoid re-firing
  const viewedEventIds = React.useRef(new Set<number>());

  const onViewableItemsChanged = React.useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && items.length > 0) {
        const index = viewableItems[0].index;
        if (index !== null && index !== undefined) {
          setActiveIndex(index);
          if (index !== currentIndex) {
            onIndexChange(index);
          }

          // Track event view when post becomes visible in feed
          const visibleItem = items[index];
          if (visibleItem?.eventId && !viewedEventIds.current.has(visibleItem.eventId)) {
            viewedEventIds.current.add(visibleItem.eventId);
            analyticsApi.trackEventView(visibleItem.eventId, 'mobile').catch(() => {});
          }
        }
      }
    },
    [currentIndex, onIndexChange, items]
  );

  // ── Render item ─────────────────────────────────────────────────────
  const renderItem = React.useCallback(
    ({ item, index }: { item: FeedItemType; index: number }) => {
      return (
        <FeedItem
          item={item}
          index={index}
          itemHeight={containerHeight}
          isActive={index === activeIndex && isFeedTab}
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
      );
    },
    [
      activeIndex,
      isFeedTab,
      containerHeight,
      items,
      likedItems,
      rsvpItems,
      pendingRsvpItems,
      purchasedItems,
      onRsvp,
      onPendingRsvp,
      onPurchase,
      onRefer,
      onUserClick,
      onEventPress,
      showDoubleTapHeart,
      onDoubleTap,
    ]
  );

  // ── Item layout ─────────────────────────────────────────────────────
  const getItemLayout = React.useCallback(
    (_: any, index: number) => ({
      length: containerHeight,
      offset: containerHeight * index,
      index,
    }),
    [containerHeight]
  );

  // ── Key extractor ───────────────────────────────────────────────────
  const keyExtractor = React.useCallback(
    (item: FeedItemType) => item.id,
    []
  );

  // ── Waiting for layout measurement ──────────────────────────────────
  if (containerHeight === 0) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} onLayout={handleLayout} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} onLayout={handleLayout}>
      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        pagingEnabled
        snapToInterval={containerHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        getItemLayout={getItemLayout}
        removeClippedSubviews
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={3}
        bounces
        style={styles.list}
        refreshControl={refreshControl}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
});
