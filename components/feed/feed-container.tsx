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
import { analyticsApi } from '@/lib/api/analytics';
import type { FeedItem as FeedItemType } from '@/lib/types/feed.types';

// ── Infinite loop config ────────────────────────────────────────────────
// We repeat the real data many times so the user can scroll endlessly in
// both directions. With getItemLayout defined, only the visible window is
// ever rendered so the extra virtual slots cost nothing.
const LOOP_REPEATS = 200;

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
  const [containerHeight, setContainerHeight] = React.useState(0);
  const { colors } = useAppTheme();
  const hasScrolledRef = React.useRef(false);

  const realCount = items.length;
  const canLoop = realCount > 1;

  // ── Virtual data ────────────────────────────────────────────────────
  // Each entry is just an index into the virtual list. The real item is
  // resolved via `virtualIndex % realCount`.
  const virtualCount = canLoop ? realCount * LOOP_REPEATS : realCount;
  const midStart = canLoop ? Math.floor(LOOP_REPEATS / 2) * realCount : 0;

  const virtualData = React.useMemo(() => {
    const arr: number[] = new Array(virtualCount);
    for (let i = 0; i < virtualCount; i++) arr[i] = i;
    return arr;
  }, [virtualCount]);

  // Track the current virtual index so isActive works correctly
  const [activeVirtualIndex, setActiveVirtualIndex] = React.useState(midStart);

  // ── Layout ──────────────────────────────────────────────────────────
  const handleLayout = React.useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && h !== containerHeight) {
      setContainerHeight(h);
    }
  }, [containerHeight]);

  // ── Scroll to middle on mount ───────────────────────────────────────
  // We use initialScrollIndex for the initial render, but also ensure
  // subsequent data changes re-center if needed.
  React.useEffect(() => {
    if (containerHeight > 0 && canLoop && !hasScrolledRef.current) {
      hasScrolledRef.current = true;
    }
  }, [containerHeight, canLoop]);

  // ── Viewability ─────────────────────────────────────────────────────
  const viewabilityConfig = React.useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Track which eventIds have been viewed this session to avoid re-firing
  const viewedEventIds = React.useRef(new Set<number>());

  const onViewableItemsChanged = React.useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && realCount > 0) {
        const virtualIndex = viewableItems[0].index;
        if (virtualIndex !== null) {
          setActiveVirtualIndex(virtualIndex);
          const realIndex = virtualIndex % realCount;
          if (realIndex !== currentIndex) {
            onIndexChange(realIndex);
          }

          // Track event view when post becomes visible in feed
          const visibleItem = items[realIndex];
          if (visibleItem?.eventId && !viewedEventIds.current.has(visibleItem.eventId)) {
            viewedEventIds.current.add(visibleItem.eventId);
            analyticsApi.trackEventView(visibleItem.eventId, 'mobile').catch(() => {});
          }
        }
      }
    },
    [currentIndex, onIndexChange, realCount, items]
  );

  // ── Render item ─────────────────────────────────────────────────────
  const renderItem = React.useCallback(
    ({ item: virtualIndex, index }: { item: number; index: number }) => {
      const realIndex = realCount > 0 ? virtualIndex % realCount : 0;
      const realItem = items[realIndex];
      if (!realItem) return null;

      return (
        <FeedItem
          item={realItem}
          index={realIndex}
          itemHeight={containerHeight}
          isActive={index === activeVirtualIndex}
          isLiked={likedItems.has(realItem.id)}
          isRsvp={rsvpItems.get(realItem.id) ?? false}
          isPendingRsvp={pendingRsvpItems.get(realItem.id) ?? false}
          isPurchased={purchasedItems.has(realItem.id)}
          showDoubleTapHeart={showDoubleTapHeart === realItem.id}
          onDoubleTap={() => onDoubleTap(realItem.id)}
          onRsvp={() => onRsvp(realItem.id)}
          onPendingRsvp={() => onPendingRsvp(realItem.id)}
          onPurchase={() => onPurchase(realItem.id)}
          onRefer={() => onRefer(realItem.id)}
          onUserClick={() => onUserClick(realItem)}
          onEventPress={() => onEventPress(realItem)}
        />
      );
    },
    [
      activeVirtualIndex,
      containerHeight,
      realCount,
      items,
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
  // Each virtual slot gets a unique key based on its position.
  const keyExtractor = React.useCallback(
    (virtualIndex: number) => `v${virtualIndex}`,
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
        data={virtualData}
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
        initialScrollIndex={midStart}
        removeClippedSubviews
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={3}
        bounces={false}
        overScrollMode="never"
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
