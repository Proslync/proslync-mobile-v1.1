import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FeedContainer, FeedHeader, FeedLoadingSkeleton } from '@/components/feed';
import { useFeed } from '@/hooks/use-feed';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useAuth } from '@/lib/providers/auth-provider';
import { eventsApi } from '@/lib/api/events';
import { useToast } from '@/components/shared/toast';
import { useAppTheme } from '@/hooks/use-app-theme';
import { PurchaseTicketSheet } from '@/components/tickets/purchase-ticket-sheet';
import type { FeedItem, FeedTab } from '@/lib/types/feed.types';

export default function FeedScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const { colors, isDark } = useAppTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rsvpItems, setRsvpItems] = useState<Map<string, boolean>>(new Map());
  const [pendingRsvpItems, setPendingRsvpItems] = useState<Map<string, boolean>>(new Map());
  const [purchasedItems, setPurchasedItems] = useState<Set<string>>(new Set());
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FeedTab>('foryou');
  const [purchaseItem, setPurchaseItem] = useState<FeedItem | null>(null);

  // Liked items still tracked for double-tap heart animation
  const likedItems = new Set<string>();

  // Fetch feed from API based on active tab
  const {
    items: feedItems,
    isLoading,
    isError,
    refetch,
  } = useFeed({
    feedType: activeTab,
    enabled: isAuthenticated,
  });

  // Pull-to-refresh with haptic feedback
  const { refreshControl } = useRefreshControl({
    onRefresh: refetch,
  });

  const handleDoubleTap = useCallback((id: string) => {
    // Show heart animation on double tap
    setShowDoubleTapHeart(id);
    setTimeout(() => setShowDoubleTapHeart(null), 1000);
  }, []);

  const toggleRsvp = useCallback(async (id: string) => {
    // Find the item to get the eventId
    const item = feedItems.find(i => i.id === id);
    if (!item?.eventId) {
      console.warn('[Feed] No eventId found for item:', id);
      return;
    }

    // Optimistically update UI
    setRsvpItems((prev) => {
      const newMap = new Map(prev);
      newMap.set(id, true);
      return newMap;
    });

    try {
      const response = await eventsApi.registerForEvent(item.eventId);
      if (response.success) {
        showSuccess(response.message || 'You have successfully RSVP\'d!');
      } else {
        // Revert on failure
        setRsvpItems((prev) => {
          const newMap = new Map(prev);
          newMap.set(id, false);
          return newMap;
        });
        showError(response.message || 'Could not complete RSVP');
      }
    } catch (error: any) {
      console.error('[Feed] RSVP error:', error);
      // Revert on error
      setRsvpItems((prev) => {
        const newMap = new Map(prev);
        newMap.set(id, false);
        return newMap;
      });
      showError(error?.message || 'Failed to RSVP. Please try again.');
    }
  }, [feedItems, showSuccess, showError]);

  const togglePendingRsvp = useCallback(async (id: string) => {
    // For private events, use the same register endpoint
    // Backend will handle the request/pending status
    const item = feedItems.find(i => i.id === id);
    if (!item?.eventId) {
      console.warn('[Feed] No eventId found for item:', id);
      return;
    }

    // Optimistically update UI
    setPendingRsvpItems((prev) => {
      const newMap = new Map(prev);
      newMap.set(id, true);
      return newMap;
    });

    try {
      const response = await eventsApi.registerForEvent(item.eventId);
      if (response.success) {
        showSuccess(response.message || 'Your request has been submitted for approval.');
      } else {
        setPendingRsvpItems((prev) => {
          const newMap = new Map(prev);
          newMap.set(id, false);
          return newMap;
        });
        showError(response.message || 'Could not submit request');
      }
    } catch (error: any) {
      console.error('[Feed] Pending RSVP error:', error);
      setPendingRsvpItems((prev) => {
        const newMap = new Map(prev);
        newMap.set(id, false);
        return newMap;
      });
      showError(error?.message || 'Failed to submit request. Please try again.');
    }
  }, [feedItems, showSuccess, showError]);

  const handlePurchase = useCallback((id: string) => {
    const item = feedItems.find(i => i.id === id);
    if (!item?.eventId) {
      console.warn('[Feed] No eventId found for item:', id);
      return;
    }

    setPurchaseItem(item);
  }, [feedItems]);

  const handlePurchaseSuccess = useCallback((ticketCount: number) => {
    if (purchaseItem) {
      setPurchasedItems(prev => {
        const newSet = new Set(prev);
        newSet.add(purchaseItem.id);
        return newSet;
      });
      showSuccess(`${ticketCount} ticket${ticketCount > 1 ? 's' : ''} purchased!`);
    }
  }, [purchaseItem, showSuccess]);

  const handleRefer = (id: string) => {
    // TODO: Open refer/earn drawer
    console.log('Earn/Refer:', id);
  };

  const handleUserClick = (item: FeedItem) => {
    if (item.userId) {
      router.push({
        pathname: '/user/[username]',
        params: {
          username: item.username || String(item.userId),
          userId: String(item.userId),
        },
      });
    } else if (item.username) {
      router.push({
        pathname: '/user/[username]',
        params: {
          username: item.username,
        },
      });
    }
  };

  const handleEventPress = useCallback((item: FeedItem) => {
    // Check if user has RSVP'd locally (optimistic update)
    const localRsvp = rsvpItems.get(item.id) || false;

    router.push({
      pathname: '/event/[id]',
      params: {
        id: item.eventId?.toString() || item.id,
        title: item.eventTitle || item.description,
        date: item.eventDate || '',
        imageUrl: item.imageUrl || item.thumbnail,
        venueName: item.venueName || '',
        username: item.username || '',
        userAvatar: item.userAvatar || '',
        userId: item.userId || '',
        isPaid: item.isPaid ? 'true' : 'false',
        price: item.price != null ? item.price.toString() : '',
        isUserRegistered: (item.isUserRegistered || localRsvp) ? 'true' : 'false',
      },
    });
  }, [router, rsvpItems]);

  if (isLoading && feedItems.length === 0) {
    return <FeedLoadingSkeleton />;
  }

  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Something went wrong</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Unable to load feed. Please try again.
          </Text>
        </View>
      </View>
    );
  }

  if (feedItems.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No content yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Check back later for new content!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FeedContainer
        items={feedItems}
        currentIndex={currentIndex}
        likedItems={likedItems}
        rsvpItems={rsvpItems}
        pendingRsvpItems={pendingRsvpItems}
        purchasedItems={purchasedItems}
        showDoubleTapHeart={showDoubleTapHeart}
        onIndexChange={setCurrentIndex}
        onDoubleTap={handleDoubleTap}
        onRsvp={toggleRsvp}
        onPendingRsvp={togglePendingRsvp}
        onPurchase={handlePurchase}
        onRefer={handleRefer}
        onUserClick={handleUserClick}
        onEventPress={handleEventPress}
        refreshControl={refreshControl}
      />
      <FeedHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <PurchaseTicketSheet
        visible={!!purchaseItem}
        onClose={() => setPurchaseItem(null)}
        onSuccess={handlePurchaseSuccess}
        eventId={purchaseItem?.eventId ?? 0}
        eventTitle={purchaseItem?.eventTitle || purchaseItem?.description || 'Event'}
        eventDate={purchaseItem?.eventDate}
        eventImage={purchaseItem?.imageUrl || purchaseItem?.thumbnail}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
